import { NextRequest, NextResponse } from "next/server";
import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";

// Khởi tạo Client cho Lex V2
const lexClient = new LexRuntimeV2Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { text, sessionId } = await req.json();

    // Tham số gửi lên Amazon Lex
    const params = {
      botId: process.env.LEX_BOT_ID!,
      botAliasId: process.env.LEX_BOT_ALIAS_ID!,
      localeId: "en_US", // Nếu bạn cấu hình bot Tiếng Anh
      sessionId: sessionId || `session-${Date.now()}`, // SessionId định danh cuộc hội thoại
      text: text,
    };

    const command = new RecognizeTextCommand(params);
    const response = await lexClient.send(command);

    // Bóc tách text trả về từ Lex Bot
    const messages = response.messages?.map((msg) => msg.content) || [];
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Lex Error:", error);
    return NextResponse.json(
      { error: "Không thể kết nối đến Bot trợ lý lúc này." }, 
      { status: 500 }
    );
  }
}