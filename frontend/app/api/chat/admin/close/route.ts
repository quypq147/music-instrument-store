import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
    }

    const sessionKey = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: "METADATA",
    };

    const now = new Date().toISOString();

    // 1. Cập nhật session về CLOSED (hoặc bạn có thể chuyển về BOT)
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
        UpdateExpression: "SET #s = :status, GSI1PK = :gsi1pk, updatedAt = :now, GSI1SK = :now",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":status": "CLOSED",
          ":gsi1pk": "CHAT#STATUS#CLOSED",
          ":now": now,
        },
      })
    );

    // 2. Thêm tin nhắn hệ thống thông báo kết thúc trò chuyện
    const timestamp = Date.now();
    const systemMsgId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
    const systemMsgText = "Phiên hỗ trợ trực tiếp đã kết thúc. Cảm ơn bạn! Nếu có câu hỏi khác, trợ lý ảo AI sẽ tiếp tục hỗ trợ bạn.";

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CHAT#SESSION#${sessionId}`,
          SK: `MSG#${timestamp}#${systemMsgId}`,
          sender: "BOT",
          senderId: "bot",
          senderName: "Trợ lý Music Store",
          text: systemMsgText,
          createdAt: now,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/chat/admin/close error:", error);
    return NextResponse.json(
      { error: "Không thể kết thúc phiên trò chuyện." },
      { status: 500 }
    );
  }
}
