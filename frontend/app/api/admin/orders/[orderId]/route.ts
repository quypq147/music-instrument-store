import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { orderId } = await params;
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${apiGatewayUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: "PUT",
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy PUT /api/admin/orders/[orderId] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
