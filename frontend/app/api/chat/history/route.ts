import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
    }

    const sessionKey = {
      PK: `CHAT#SESSION#${sessionId}`,
      SK: "METADATA",
    };

    // 1. Lấy thông tin Metadata của Session
    const getSession = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: sessionKey,
      })
    );

    const session = getSession.Item || null;

    // 2. Lấy danh sách tin nhắn
    const getMessages = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :msgPrefix)",
        ExpressionAttributeValues: {
          ":pk": `CHAT#SESSION#${sessionId}`,
          ":msgPrefix": "MSG#",
        },
        ScanIndexForward: true, // Lấy theo thứ tự thời gian tăng dần
      })
    );

    const messages = (getMessages.Items || []).map((item) => ({
      sender: item.sender,
      senderId: item.senderId,
      senderName: item.senderName,
      text: item.text,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      session: session
        ? {
            sessionId,
            userId: session.userId,
            userName: session.userName,
            status: session.status,
            assignedStaffId: session.assignedStaffId,
            assignedStaffName: session.assignedStaffName,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          }
        : null,
      messages,
    });
  } catch (error) {
    console.error("API /api/chat/history error:", error);
    return NextResponse.json(
      { error: "Không thể lấy lịch sử tin nhắn." },
      { status: 500 }
    );
  }
}
