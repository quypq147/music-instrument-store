import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { PutCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên danh mục là bắt buộc." }, { status: 400 });
    }

    // Get existing item to keep createdAt
    const getResult = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      })
    );

    if (!getResult.Item) {
      return NextResponse.json({ error: "Không tìm thấy danh mục." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedItem = {
      ...getResult.Item,
      name,
      description: description || "",
      updatedAt: now,
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedItem,
      })
    );

    return NextResponse.json({
      id,
      name,
      description: description || "",
      createdAt: getResult.Item.createdAt,
      updatedAt: now,
    });
  } catch (error) {
    console.error(`PUT /api/categories/[id] error:`, error);
    return NextResponse.json(
      { error: "Không thể cập nhật danh mục." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Delete category
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/categories/[id] error:`, error);
    return NextResponse.json(
      { error: "Không thể xóa danh mục." },
      { status: 500 }
    );
  }
}
