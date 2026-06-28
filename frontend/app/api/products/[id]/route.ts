import { NextRequest, NextResponse } from "next/server";

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
    const targetUrl = `${apiGatewayUrl}/products/${encodeURIComponent(id)}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const targetUrl = `${apiGatewayUrl}/products/${encodeURIComponent(id)}`;

    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(targetUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_GATEWAY_URL is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const targetUrl = `${apiGatewayUrl}/products/${encodeURIComponent(id)}`;

    const authHeader = req.headers.get("Authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(targetUrl, {
      method: "DELETE",
      headers,
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `API Gateway returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
