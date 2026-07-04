import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const DEFAULT_CATEGORIES = [
  { id: "alto-saxophone", name: "Alto Saxophone", description: "Dòng kèn Alto Saxophone chất lượng cao cho người học và biểu diễn" },
  { id: "tenor-saxophone", name: "Tenor Saxophone", description: "Dòng kèn Tenor Saxophone âm trầm ấm áp" },
  { id: "soprano-saxophone", name: "Soprano Saxophone", description: "Dòng kèn Soprano Saxophone âm cao thanh thoát" },
  { id: "baritone-saxophone", name: "Baritone Saxophone", description: "Dòng kèn Baritone Saxophone âm cực trầm mạnh mẽ" },
  { id: "accessories", name: "Accessories", description: "Phụ kiện đi kèm như dăm kèn, dây đeo, dầu lau, búp kèn" }
];

export async function GET() {
  try {
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :skValue",
        ExpressionAttributeValues: {
          ":pkPrefix": "CATEGORY#",
          ":skValue": "METADATA",
        },
      })
    );

    let categories = (result.Items || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Seed default categories if empty
    if (categories.length === 0) {
      const now = new Date().toISOString();
      for (const cat of DEFAULT_CATEGORIES) {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `CATEGORY#${cat.id}`,
              SK: "METADATA",
              id: cat.id,
              name: cat.name,
              description: cat.description,
              createdAt: now,
              updatedAt: now,
            },
          })
        );
      }
      categories = DEFAULT_CATEGORIES.map(c => ({ ...c, createdAt: now, updatedAt: now }));
    }

    // Sort alphabetically by name
    categories.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách danh mục." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên danh mục là bắt buộc." }, { status: 400 });
    }

    // Generate id slug from name
    const id = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-");

    if (!id) {
      return NextResponse.json({ error: "Tên danh mục không hợp lệ." }, { status: 400 });
    }

    const now = new Date().toISOString();
    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CATEGORY#${id}`,
          SK: "METADATA",
          id,
          name,
          description: description || "",
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    return NextResponse.json({ id, name, description, createdAt: now, updatedAt: now }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Không thể tạo danh mục mới." },
      { status: 500 }
    );
  }
}
