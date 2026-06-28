import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = `${apiGatewayUrl}/products${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

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
    console.error("Proxy GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const body = await req.json();

    const res = await fetch(`${apiGatewayUrl}/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Proxy POST /api/products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
