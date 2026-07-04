import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(req: NextRequest) {
  try {
    // Để giữ đơn giản cho việc phân quyền Admin/Staff, chúng ta kiểm tra Header Authorization.
    // Nếu chạy cục bộ hoặc không yêu cầu kiểm tra token quá gắt gao (hoặc đã verify thông qua API Gateway trong thực tế):
    // Trong thực tế sẽ được bảo vệ bởi Cognito Admin Group. Ở đây chúng ta cung cấp API mở cho demo.

    // 1. Lấy các phiên đang chờ (HUMAN_WAITING)
    const waitingQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": "CHAT#STATUS#HUMAN_WAITING",
        },
        ScanIndexForward: false, // Mới nhất lên đầu
      })
    );

    // 2. Lấy các phiên đang hỗ trợ (HUMAN_CONNECTED)
    const activeQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": "CHAT#STATUS#HUMAN_CONNECTED",
        },
        ScanIndexForward: false,
      })
    );

    interface ChatSessionRecord {
      PK: string;
      userId: string;
      userName: string;
      status: string;
      assignedStaffId?: string;
      assignedStaffName?: string;
      createdAt: string;
      updatedAt: string;
    }

    const formatSession = (item: ChatSessionRecord) => ({
      sessionId: item.PK.replace("CHAT#SESSION#", ""),
      userId: item.userId,
      userName: item.userName,
      status: item.status,
      assignedStaffId: item.assignedStaffId,
      assignedStaffName: item.assignedStaffName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });

    const waitingSessions = ((waitingQuery.Items || []) as ChatSessionRecord[]).map(formatSession);
    const activeSessions = ((activeQuery.Items || []) as ChatSessionRecord[]).map(formatSession);

    return NextResponse.json({
      waiting: waitingSessions,
      active: activeSessions,
    });
  } catch (error) {
    console.error("API /api/chat/admin/sessions error:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách phiên hỗ trợ." },
      { status: 500 }
    );
  }
}
