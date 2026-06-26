"use client";

import { useState, useRef, useEffect } from "react";
// Import thư viện Amplify để lấy token của User đang đăng nhập
import { fetchAuthSession } from "@aws-amplify/auth";

interface Message {
  text: string;
  sender: "user" | "bot";
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Chào bạn! Tôi là trợ lý ảo của Music Store. Tôi có thể giúp gì cho bạn hôm nay?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tạo SessionId định danh cuộc hội thoại của khách hàng
  const [sessionId] = useState(() => `user-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Lấy JWT Token từ phiên đăng nhập hiện tại bằng Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        setMessages((prev) => [...prev, { text: "Vui lòng đăng nhập để sử dụng tính năng Chatbot nhé!", sender: "bot" }]);
        setIsLoading(false);
        return;
      }

      // 2. Gửi request trực tiếp đến API Gateway Endpoint (Thay URL này bằng API ID thực tế của bạn)
      const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/chat";
      
      const res = await fetch(API_GATEWAY_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Cognito Authorizer sẽ verify token này
        },
        body: JSON.stringify({ text: userMessage.text, sessionId }),
      });

      if (!res.ok) throw new Error("API Request Failed");

      const data = await res.json();
      
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: string) => {
          setMessages((prev) => [...prev, { text: msg, sender: "bot" }]);
        });
      } else {
        setMessages((prev) => [...prev, { text: "Xin lỗi, tôi chưa hiểu ý bạn.", sender: "bot" }]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [...prev, { text: "Lỗi kết nối đến máy chủ AWS.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold text-sm">Trợ lý Music Store</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
              ✕
            </button>
          </div>
          
          {/* Chat Body */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-[80%] p-2.5 rounded-lg text-sm ${
                  msg.sender === "user" 
                    ? "bg-slate-900 self-end text-white rounded-br-none" 
                    : "bg-white border self-start text-gray-800 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="text-gray-400 text-xs self-start italic">Bot đang gõ...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white rounded-b-lg flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập yêu cầu..."
              className="flex-1 border rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-900 text-black"
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading}
              className="bg-slate-900 text-white px-4 py-1.5 rounded-md hover:bg-slate-800 transition disabled:opacity-50 text-sm font-medium"
            >
              Gửi
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition transform hover:scale-105"
        >
          <span className="text-2xl">💬</span>
        </button>
      )}
    </div>
  );
}