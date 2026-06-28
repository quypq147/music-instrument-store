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
      const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/";
      const API_GATEWAY_URL = baseUrl.replace(/\/$/, "") + "/chat";
      
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
    <>
      {isOpen ? (
        <div className="chat-box">
          {/* Header */}
          <div className="chat-header">
            <strong>Trợ lý Music Store</strong>
            <button type="button" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          {/* Chat Body */}
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={msg.sender === "user" ? "user-msg" : "bot-msg"}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bot-msg" style={{ fontStyle: "italic", opacity: 0.7 }}>
                Bot đang gõ...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập yêu cầu..."
            />
            <button 
              type="button"
              onClick={sendMessage} 
              disabled={isLoading}
            >
              Gửi
            </button>
          </div>
        </div>
      ) : (
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="chat-floating-btn"
        >
          💬
        </button>
      )}
    </>
  );
}