import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    code: string;
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

    const { code } = await params;
    const targetUrl = `${apiGatewayUrl}/coupons/${encodeURIComponent(code)}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.error("Proxy GET /api/coupons/[code] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
