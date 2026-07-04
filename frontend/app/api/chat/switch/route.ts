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

    // 1. Cập nhật trạng thái session sang HUMAN_WAITING
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

    // 2. Thêm tin nhắn hệ thống báo cho người dùng
    const timestamp = Date.now();
    const systemMsgId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
    const systemMsg = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: `MSG#${timestamp}#${systemMsgId}`,
      sender: "BOT",
      senderId: "bot",
      senderName: "Trợ lý Music Store",
      text: "Đã chuyển tiếp yêu cầu đến nhân viên hỗ trợ. Vui lòng đợi trong giây lát, nhân viên sẽ phản hồi bạn trực tiếp tại đây...",
      createdAt: now,
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: systemMsg,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/chat/switch error:", error);
    return NextResponse.json(
      { error: "Không thể kết nối với người hỗ trợ lúc này." },
      { status: 500 }
    );
  }
}
