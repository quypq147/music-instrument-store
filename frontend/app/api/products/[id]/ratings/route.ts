import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const targetUrl = `${apiGatewayUrl}/products/${encodeURIComponent(id)}/ratings`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy GET /api/products/[id]/ratings error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const targetUrl = `${apiGatewayUrl}/products/${encodeURIComponent(id)}/ratings`;
    const body = await req.json();

    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    // Đánh giá vừa ghi làm thay đổi averageRating/ratingCount trên sản phẩm — xoá cache ISR
    // ngay lập tức thay vì chờ hết 5 phút revalidate, để trang chi tiết và danh sách/filter
    // sản phẩm phản ánh đúng số liệu mới ngay khi F5.
    revalidateTag(`product-${id}`, "max");
    revalidateTag("products", "max");

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Proxy POST /api/products/[id]/ratings error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
