import { NextRequest, NextResponse } from "next/server";
import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { awsRegion, awsCredentials } from "@/lib/aws-credentials";
import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Khởi tạo Client cho Lex V2
const lexClient = new LexRuntimeV2Client({
  region: awsRegion,
  credentials: awsCredentials,
});

export async function POST(req: NextRequest) {
  try {
    const { text, sessionId, userEmail, userName, sender, senderName } = await req.json();

    if (!text || !sessionId) {
      return NextResponse.json({ error: "Thiếu text hoặc sessionId" }, { status: 400 });
    }

    // Chuẩn hóa và làm sạch dữ liệu đầu vào tránh giá trị "undefined" hoặc "null"
    let clientName = userName;
    if (!clientName || clientName === "undefined" || clientName === "null" || clientName === "") {
      clientName = "Khách";
    }

    let clientEmail = userEmail;
    if (!clientEmail || clientEmail === "undefined" || clientEmail === "null" || clientEmail === "") {
      clientEmail = "guest";
    }

    if (sender === "STAFF") {
      const timestamp = Date.now();
      const staffMessageId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
      const nowStr = new Date().toISOString();
      const staffMessage = {
        PK: `CHAT#SESSION#${sessionId}`,
        SK: `MSG#${timestamp}#${staffMessageId}`,
        sender: "STAFF",
        senderId: userEmail || "staff",
        senderName: senderName || "Nhân viên hỗ trợ",
        text: text,
        createdAt: nowStr,
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: staffMessage,
        })
      );

      // Cập nhật updatedAt của session
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHAT#SESSION#${sessionId}`,
            SK: "METADATA",
          },
          UpdateExpression: "SET updatedAt = :now, GSI1SK = :now",
          ExpressionAttributeValues: {
            ":now": nowStr,
          },
        })
      );

      return NextResponse.json({ messages: [] });
    }

    const sessionKey = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: "METADATA",
    };

    // 1. Kiểm tra trạng thái Session hiện tại trong DynamoDB
    const getSession = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
      })
    );

    let session = getSession.Item;
    const now = new Date().toISOString();

    if (!session) {
      // Nếu chưa có session, tạo mới với trạng thái mặc định là BOT
      session = {
        ...sessionKey,
        userId: clientEmail,
        userName: clientName,
        status: "BOT",
        createdAt: now,
        updatedAt: now,
        GSI1PK: "CHAT#STATUS#BOT",
        GSI1SK: now,
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: session,
        })
      );
    }

    // 2. Lưu tin nhắn của User vào DynamoDB
    const timestamp = Date.now();
    const userMessageId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
    const userMessage = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: `MSG#${timestamp}#${userMessageId}`,
      sender: "USER",
      senderId: clientEmail,
      senderName: clientName,
      text: text,
      createdAt: now,
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: userMessage,
      })
    );

    // Cập nhật updatedAt của session
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
        UpdateExpression: "SET updatedAt = :now, GSI1SK = :now",
        ExpressionAttributeValues: {
          ":now": now,
        },
      })
    );

    // 3. Xử lý dựa trên trạng thái (status)
    const isTransferRequest = /gặp nhân viên|nhân viên|tư vấn viên|chat với người|gặp người|hỗ trợ viên/i.test(text);

    if (isTransferRequest || session.status === "HUMAN_WAITING" || session.status === "HUMAN_CONNECTED") {
      // Nếu là yêu cầu chuyển giao sang người hỗ trợ
      if (session.status === "BOT") {
        const transferMsgText = "Đã nhận yêu cầu kết nối với nhân viên hỗ trợ. Vui lòng chờ trong giây lát, nhân viên sẽ phản hồi bạn trực tiếp tại đây...";
        
        // Cập nhật session sang trạng thái HUMAN_WAITING
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: sessionKey,
            UpdateExpression: "SET #s = :status, GSI1PK = :gsi1pk, updatedAt = :now, GSI1SK = :now",
            ExpressionAttributeNames: {
              "#s": "status",
            },
            ExpressionAttributeValues: {
              ":status": "HUMAN_WAITING",
              ":gsi1pk": "CHAT#STATUS#HUMAN_WAITING",
              ":now": now,
            },
          })
        );

        // Lưu tin nhắn phản hồi của Bot thông báo chuyển tiếp
        const botTimestamp = Date.now() + 1;
        const botMsgId = `msg-${botTimestamp}-${Math.random().toString(36).substring(5)}`;
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `CHAT#SESSION#${sessionId}`,
              SK: `MSG#${botTimestamp}#${botMsgId}`,
              sender: "BOT",
              senderId: "bot",
              senderName: "Trợ lý Music Store",
              text: transferMsgText,
              createdAt: new Date(botTimestamp).toISOString(),
            },
          })
        );

        return NextResponse.json({ messages: [transferMsgText] });
      }

      // Nếu đang trong hàng chờ hoặc đang chat với nhân viên, chỉ ghi nhận tin nhắn và không gọi Lex
      return NextResponse.json({ messages: [] });
    }

    // 4. Nếu ở chế độ BOT, gọi Amazon Lex V2
    // Bot chỉ build locale "en_US" (dù toàn bộ utterance/response đều là tiếng Việt —
    // "locale" ở đây chỉ là tên bucket cấu hình trên Lex, không phải ngôn ngữ thật sự
    // của nội dung). Gọi thẳng "vi_VN" từng khiến MỌI tin nhắn tốn 1 lần gọi lỗi
    // (ResourceNotFoundException) trước khi rơi về "en_US" — đã xác nhận qua AWS CLI.
    const params = {
      botId: process.env.LEX_BOT_ID || "EDGDWWRZNM",
      botAliasId: process.env.LEX_BOT_ALIAS_ID || "TSTALIASID",
      localeId: "en_US",
      sessionId: sessionId,
      text: text,
      sessionState: {
        sessionAttributes: {
          userName: clientName,
          userEmail: clientEmail === "guest" ? "" : clientEmail,
        }
      }
    };

    const command = new RecognizeTextCommand(params);
    const lexResponse = await lexClient.send(command);

    let messages = lexResponse.messages?.map((msg) => msg.content).filter(Boolean) as string[] || [];

    // 5. Fulfillment Hook tại Next.js API (Nâng cấp hệ thống AI)
    const matchedIntent = lexResponse.sessionState?.intent?.name;

    if (matchedIntent === "CheckOrderIntent" && clientEmail !== "guest") {
      // Tự động kiểm tra đơn hàng gần nhất của User trong DynamoDB
      try {
        const orderQuery = await ddbDocClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :orderPrefix)",
            ExpressionAttributeValues: {
              ":gsi1pk": `USER#${clientEmail}`,
              ":orderPrefix": "ORDER#",
            },
            ScanIndexForward: false, // Lấy đơn hàng mới nhất trước
            Limit: 1,
          })
        );

        const latestOrder = orderQuery.Items?.[0];
        if (latestOrder) {
          const orderDate = latestOrder.createdAt ? new Date(latestOrder.createdAt).toLocaleDateString("vi-VN") : "gần đây";
          const orderStatus = latestOrder.status || "Đang xử lý";
          const orderPrice = (latestOrder.totalPrice || 0).toLocaleString("vi-VN");
          
          messages.push(`Tôi tìm thấy đơn hàng mới nhất của bạn (Mã: ${latestOrder.id || latestOrder.SK.replace("ORDER#", "")}) trị giá ${orderPrice}đ đặt vào ngày ${orderDate}. Trạng thái hiện tại của đơn hàng là: "${orderStatus}".`);
        } else {
          messages.push("Tôi đã kiểm tra hệ thống nhưng chưa tìm thấy đơn hàng nào được đặt dưới email của bạn.");
        }
      } catch (dbErr) {
        console.error("Fulfillment TrackOrder DB Error:", dbErr);
      }
    } else if (matchedIntent === "CheckProductsIntent") {
      // Hỗ trợ tìm kiếm sản phẩm cơ bản (nếu người dùng hỏi về sản phẩm)
      const productSlot = lexResponse.sessionState?.intent?.slots?.productName?.value?.interpretedValue || "";
      if (productSlot) {
        messages.push(`Bạn đang quan tâm đến kèn/phụ kiện "${productSlot}". Để xem đầy đủ danh sách nhạc cụ này, bạn có thể truy cập trang [Sản Phẩm](/products) để lựa chọn và đặt mua nhé!`);
      }
    }

    if (messages.length === 0) {
      const fallbackReplies = [
        "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có muốn gặp nhân viên hỗ trợ trực tiếp không? (Gõ 'nhân viên' để kết nối)",
        "Tôi chưa nắm được câu hỏi này. Bạn có thể hỏi về sản phẩm, đơn hàng, đổi trả, bảo hành, vận chuyển hoặc thanh toán — hoặc gõ 'nhân viên' để được hỗ trợ trực tiếp.",
        "Câu này hơi khó với tôi. Bạn thử diễn đạt lại, hoặc gõ 'nhân viên' để kết nối với người hỗ trợ nhé!",
      ];
      messages = [fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]];
    }

    // 6. Lưu phản hồi của Bot vào DynamoDB
    for (let i = 0; i < messages.length; i++) {
      const botTimestamp = Date.now() + i + 1;
      const botMsgId = `msg-${botTimestamp}-${Math.random().toString(36).substring(5)}`;
      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `CHAT#SESSION#${sessionId}`,
            SK: `MSG#${botTimestamp}#${botMsgId}`,
            sender: "BOT",
            senderId: "bot",
            senderName: "Trợ lý Music Store",
            text: messages[i],
            createdAt: new Date(botTimestamp).toISOString(),
          },
        })
      );
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý tin nhắn." },
      { status: 500 }
    );
  }
}