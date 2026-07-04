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

    // 1. Cập nhật session về trạng thái BOT để trò chuyện với AI
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
        UpdateExpression: "SET #s = :status, GSI1PK = :gsi1pk, updatedAt = :now, GSI1SK = :now REMOVE assignedStaffId, assignedStaffName",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":status": "BOT",
          ":gsi1pk": "CHAT#STATUS#BOT",
          ":now": now,
        },
      })
    );

    // 2. Thêm tin nhắn hệ thống thông báo chuyển tiếp về AI
    const timestamp = Date.now();
    const systemMsgId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
    const systemMsgText = "Bạn đã kết nối lại với Trợ lý ảo AI của Music Store.";

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CHAT#SESSION#${sessionId}`,
          SK: `MSG#${timestamp}#${systemMsgId}`,
          sender: "SYSTEM",
          senderId: "system",
          senderName: "Hệ thống",
          text: systemMsgText,
          createdAt: now,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/chat/reset error:", error);
    return NextResponse.json(
      { error: "Không thể kết nối lại với trợ lý ảo AI." },
      { status: 500 }
    );
  }
}
