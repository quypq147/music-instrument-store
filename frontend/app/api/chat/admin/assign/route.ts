import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, staffId, staffName } = await req.json();

    if (!sessionId || !staffId || !staffName) {
      return NextResponse.json(
        { error: "Thiếu sessionId, staffId hoặc staffName" },
        { status: 400 }
      );
    }

    const sessionKey = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: "METADATA",
    };

    const now = new Date().toISOString();

    // 1. Cập nhật session sang HUMAN_CONNECTED và gán nhân viên hỗ trợ
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
        UpdateExpression:
          "SET #s = :status, GSI1PK = :gsi1pk, assignedStaffId = :staffId, assignedStaffName = :staffName, updatedAt = :now, GSI1SK = :now",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":status": "HUMAN_CONNECTED",
          ":gsi1pk": "CHAT#STATUS#HUMAN_CONNECTED",
          ":staffId": staffId,
          ":staffName": staffName,
          ":now": now,
        },
      })
    );

    // 2. Thêm tin nhắn hệ thống thông báo nhân viên tiếp nhận
    const timestamp = Date.now();
    const systemMsgId = `msg-${timestamp}-${Math.random().toString(36).substring(5)}`;
    const systemMsgText = `Nhân viên "${staffName}" đã kết nối và tham gia hỗ trợ bạn.`;
    
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CHAT#SESSION#${sessionId}`,
          SK: `MSG#${timestamp}#${systemMsgId}`,
          sender: "STAFF",
          senderId: staffId,
          senderName: staffName,
          text: systemMsgText,
          createdAt: now,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API /api/chat/admin/assign error:", error);
    return NextResponse.json(
      { error: "Không thể nhận tiếp nhận phiên hỗ trợ." },
      { status: 500 }
    );
  }
}
