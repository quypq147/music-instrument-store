"use client";

import "../common/AmplifyConfig";
import { useState, useRef, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { MessageSquare, Send, X, ArrowUpRight, Paperclip } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { getProfile } from "../../../lib/api/profile";
import {
  getChatHistory,
  sendChatMessage,
  requestHumanSupport,
  resetToBot,
  uploadChatFile,
  type ChatMessage as RawChatMessage,
} from "../../../lib/api/chat";

interface Message {
  text: string;
  sender: "user" | "bot" | "staff" | "system";
  senderName?: string;
  createdAt?: string;
}

const EMOJIS = ["😊", "👍", "❤️", "🎷", "👋", "🙏", "😮", "🎉"];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ChatWidget() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Chào bạn! Tôi là trợ lý ảo AI của Music Store. Tôi có thể giúp gì cho bạn hôm nay?", sender: "bot", senderName: "Trợ lý ảo" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"BOT" | "HUMAN_WAITING" | "HUMAN_CONNECTED" | "CLOSED">("BOT");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo SessionId định danh cuộc hội thoại của khách hàng (lưu ở sessionStorage để giữ phiên khi F5)
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = sessionStorage.getItem("chat_session_id");
      if (!id) {
        id = `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
        sessionStorage.setItem("chat_session_id", id);
      }
      return id;
    }
    return `session-temp-${Date.now()}`;
  });

  // Lấy thông tin tài khoản nếu đã đăng nhập
  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          const { fetchUserAttributes } = await import("aws-amplify/auth");
          const attrs = await fetchUserAttributes();
          
          let profileName = attrs.name || attrs.given_name || attrs.family_name || attrs.email;
          try {
            const profileResult = await getProfile(token);
            if (profileResult.ok) {
              const { profile } = profileResult.data;
              if (profile?.name) {
                profileName = profile.name;
              }
            }
          } catch (profileError) {
            console.warn("Could not fetch user profile for chat widget:", profileError);
          }

          setUserProfile({
            email: attrs.email,
            name: profileName,
          });
        }
      } catch (err) {
        console.log("Chat user checking: guest mode active", err);
      }
    };
    checkUser();
  }, []);

  // Lấy lịch sử hội thoại khi mở khung chat
  const fetchHistory = async () => {
    try {
      const result = await getChatHistory(sessionId);
      if (result.ok) {
        const data = result.data;
        if (data.session) {
          setSessionStatus(data.session.status);
          setAssignedStaff(data.session.assignedStaffName || "");
        }
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: RawChatMessage) => ({
              text: m.text,
              sender: m.sender.toLowerCase() as Message["sender"],
              senderName: m.senderName,
              createdAt: m.createdAt,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      (async () => {
        await fetchHistory();
      })();
    }
    // Dispatch event to notify FloatingContacts to hide/show itself
    window.dispatchEvent(new CustomEvent("chat-widget-toggle", { detail: { isOpen } }));
  }, [isOpen]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling liên tục khi đang ở chế độ kết nối con người để cập nhật tin nhắn của nhân viên
  useEffect(() => {
    if (!isOpen || (sessionStatus !== "HUMAN_WAITING" && sessionStatus !== "HUMAN_CONNECTED")) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const result = await getChatHistory(sessionId);
        if (result.ok) {
          const data = result.data;
          if (data.session) {
            // Hiển thị thông báo khi nhân viên đóng phiên
            if (sessionStatus === "HUMAN_CONNECTED" && data.session.status === "CLOSED") {
              showToast("Nhân viên hỗ trợ đã kết thúc cuộc trò chuyện này.", "warning");
            }
            setSessionStatus(data.session.status);
            setAssignedStaff(data.session.assignedStaffName || "");
          }
          const newMessages = data.messages;
          if (newMessages && newMessages.length > 0) {
            setMessages((prev) => {
              if (newMessages.length > prev.length) {
                return newMessages.map((m: RawChatMessage) => ({
                  text: m.text,
                  sender: m.sender.toLowerCase() as Message["sender"],
                  senderName: m.senderName,
                  createdAt: m.createdAt,
                }));
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Polling chat messages error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, sessionStatus, sessionId]);

  // Yêu cầu kết nối nhân viên tư vấn
  const handleRequestHuman = async () => {
    setIsLoading(true);
    try {
      const result = await requestHumanSupport(sessionId);
      if (result.ok) {
        showToast("Đã gửi yêu cầu kết nối với nhân viên hỗ trợ.", "info");
        setSessionStatus("HUMAN_WAITING");
        await fetchHistory();
      } else {
        showToast("Gửi yêu cầu hỗ trợ thất bại. Vui lòng thử lại sau.", "error");
      }
    } catch (err) {
      console.error("Request human connection error:", err);
      showToast("Mất kết nối máy chủ.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Trở lại chế độ chat với AI khi đóng phiên
  const handleRestartAI = async () => {
    setIsLoading(true);
    try {
      const result = await resetToBot(sessionId);
      if (result.ok) {
        showToast("Đã kết nối lại với trợ lý ảo AI.", "success");
        setSessionStatus("BOT");
        await fetchHistory();
      } else {
        showToast("Không thể kết nối với AI lúc này.", "error");
      }
    } catch (err) {
      console.error("Restart AI error:", err);
      showToast("Mất kết nối máy chủ.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi tin nhắn mới
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsgText = input.trim();
    setInput("");

    const tempUserMessage: Message = {
      text: userMsgText,
      sender: "user",
      senderName: userProfile?.name || "Khách",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const result = await sendChatMessage({
        text: userMsgText,
        sessionId,
        userEmail: userProfile?.email || "",
        userName: userProfile?.name || "Khách",
      });

      if (!result.ok) throw new Error("Gửi tin nhắn thất bại");

      const data = result.data;

      // Nếu là chế độ BOT, cập nhật phản hồi tự động ngay lập tức
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: string) => {
          setMessages((prev) => [
            ...prev,
            { text: msg, sender: "bot", senderName: "Trợ lý ảo", createdAt: new Date().toISOString() }
          ]);
        });
      }
      
      // Tải lại lịch sử để đồng bộ trạng thái mới (nếu có chuyển đổi)
      await fetchHistory();
    } catch (error) {
      console.error("Send message error:", error);
      showToast("Mất kết nối mạng, vui lòng thử lại.", "error");
      setMessages((prev) => [
        ...prev,
        { text: "Đang mất kết nối Internet, vui lòng thử lại.", sender: "system" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải file đính kèm lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước file tối đa cho phép là 5MB.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      const uploadResult = await uploadChatFile(file);

      if (!uploadResult.ok) {
        const errorData = uploadResult.data as { error?: string } | undefined;
        throw new Error(errorData?.error || "Tải file lên thất bại");
      }

      const uploadData = uploadResult.data;

      // Định dạng tin nhắn đặc biệt chứa thông tin file
      const fileMsgText = `[FILE:${uploadData.url}|${uploadData.fileName}|${uploadData.fileType}|${uploadData.fileSize}]`;

      const tempUserMessage: Message = {
        text: fileMsgText,
        sender: "user",
        senderName: userProfile?.name || "Khách",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage]);

      const result = await sendChatMessage({
        text: fileMsgText,
        sessionId,
        userEmail: userProfile?.email || "",
        userName: userProfile?.name || "Khách",
      });

      if (!result.ok) throw new Error("Gửi tin nhắn chứa file thất bại");

      const data = result.data;

      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: string) => {
          setMessages((prev) => [
            ...prev,
            { text: msg, sender: "bot", senderName: "Trợ lý ảo", createdAt: new Date().toISOString() }
          ]);
        });
      }
      
      showToast(`Đã gửi đính kèm file ${file.name} thành công!`, "success");
      await fetchHistory();
    } catch (err) {
      console.error("File upload sending error:", err);
      const message = err instanceof Error ? err.message : undefined;
      showToast(message || "Không thể gửi file đính kèm.", "error");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith("[FILE:") && text.endsWith("]")) {
      const content = text.slice(6, -1);
      const [url, filename, mimeType, sizeStr] = content.split("|");
      const size = parseInt(sizeStr || "0", 10);
      const isImage = mimeType?.startsWith("image/");

      if (isImage) {
        return (
          <div className="space-y-1.5 max-w-full">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200/50 bg-white">
              <img src={url} alt={filename} className="max-w-full max-h-[160px] object-cover hover:scale-[1.02] transition-transform duration-200" />
            </a>
            <span className="text-[9px] opacity-75 truncate block">{filename} ({formatSize(size)})</span>
          </div>
        );
      }

      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={filename}
          className="flex items-center gap-2.5 p-2.5 bg-slate-100 dark:bg-[#031d16] hover:bg-slate-200 dark:hover:bg-[#053c2f] text-slate-800 dark:text-emerald-50 rounded-xl transition-colors border border-slate-200/30 max-w-[240px] group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#06261d] flex items-center justify-center text-base shadow-sm shrink-0">
            {mimeType === "application/pdf" ? "📕" : "📄"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate group-hover:underline">{filename}</p>
            <p className="text-[9px] text-slate-500 dark:text-emerald-100/50 mt-0.5">{formatSize(size)}</p>
          </div>
        </a>
      );
    }

    return <span>{text}</span>;
  };

  return (
    <div className={`fixed ${isOpen ? "max-sm:inset-0 max-sm:z-55" : "bottom-6 right-6"} sm:bottom-6 sm:right-6 z-55 font-sans`}>
      {isOpen ? (
        <div className="w-full h-full sm:w-[380px] sm:h-[520px] bg-white dark:bg-[#06261d] sm:rounded-2xl border border-slate-100 dark:border-primary-container/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#003527] to-[#064e3b] dark:from-[#002117] dark:to-[#031d16] text-white flex justify-between items-center shadow-sm">
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-sm font-bold tracking-wide">Trợ Lý Music Store</span>
              <span className="text-[10px] text-emerald-350 dark:text-emerald-400 mt-0.5 truncate flex items-center gap-1.5 font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${sessionStatus === "HUMAN_CONNECTED" ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                {sessionStatus === "BOT" && "🤖 Trợ lý ảo tự động (AI)"}
                {sessionStatus === "HUMAN_WAITING" && "⏳ Đang kết nối nhân viên..."}
                {sessionStatus === "HUMAN_CONNECTED" && `💬 Nhân viên ${assignedStaff} đang hỗ trợ`}
                {sessionStatus === "CLOSED" && "🔒 Phiên hỗ trợ kết thúc"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sessionStatus === "BOT" && (
                <button
                  type="button"
                  onClick={handleRequestHuman}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-[10px] font-bold bg-[#fe932c] hover:bg-[#d97706] dark:bg-secondary text-primary dark:text-[#002B1F] px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                  title="Gặp nhân viên hỗ trợ"
                >
                  Nhân viên <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#02140f] transition-colors duration-300">
            {messages.map((msg, index) => {
              if (msg.sender === "system") {
                return (
                  <div key={index} className="text-center text-[11px] text-slate-500 dark:text-emerald-100/40 italic py-1 px-4 leading-relaxed bg-slate-100/50 dark:bg-[#031d16]/30 rounded-lg max-w-xs mx-auto">
                    {msg.text}
                  </div>
                );
              }

              const isUser = msg.sender === "user";
              return (
                <div key={index} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-slate-400 dark:text-emerald-100/40 mb-1 px-1">
                    {isUser ? msg.senderName || "Bạn" : msg.senderName || (msg.sender === "staff" ? "Nhân viên" : "Trợ lý")}
                  </span>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-[#003527] text-white rounded-tr-none dark:bg-[#fe932c] dark:text-[#002B1F]"
                        : "bg-white dark:bg-[#06261d] text-slate-800 dark:text-emerald-50 rounded-tl-none border border-slate-100 dark:border-primary-container/20"
                    }`}
                  >
                    {renderMessageContent(msg.text)}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-400 dark:text-emerald-100/40 mb-1 px-1">
                  Đang xử lý
                </span>
                <div className="bg-white dark:bg-[#06261d] text-slate-400 dark:text-emerald-100/40 italic rounded-2xl rounded-tl-none px-4 py-2.5 text-sm border border-slate-100 dark:border-primary-container/20 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Shortcuts & File upload selector (Ẩn khi CLOSED để tránh bấm nhầm) */}
          {sessionStatus !== "CLOSED" && (
            <div className="px-3 pt-2 bg-white dark:bg-[#06261d] border-t border-slate-100 dark:border-primary-container/10 flex items-center justify-between gap-2 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto py-0.5">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInput((prev) => prev + emoji)}
                    className="text-sm hover:scale-125 transition-transform cursor-pointer p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Chat Options Area when CLOSED, or normal Input box when ACTIVE */}
          {sessionStatus === "CLOSED" ? (
            <div className="p-4 bg-white dark:bg-[#06261d] border-t border-slate-100 dark:border-primary-container/20 flex flex-col gap-2 shrink-0 transition-colors duration-300">
              <p className="text-[11px] text-center text-slate-500 dark:text-emerald-100/40 mb-1 font-medium">Phiên hỗ trợ đã đóng. Bạn muốn tiếp tục?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRestartAI}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#031d16] dark:hover:bg-[#053c2f] text-slate-700 dark:text-emerald-55 text-xs font-bold rounded-xl border border-slate-200/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  🤖 Chat tiếp với AI
                </button>
                <button
                  type="button"
                  onClick={handleRequestHuman}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-[#003527] hover:bg-[#064e3b] dark:bg-[#fe932c] dark:hover:bg-[#d97706] text-white dark:text-[#002B1F] text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  📞 Gặp nhân viên
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white dark:bg-[#06261d] border-t border-slate-100 dark:border-primary-container/20 flex items-center gap-2 transition-colors duration-300">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-10 h-10 shrink-0 bg-slate-100 dark:bg-[#031d16] hover:bg-slate-200 dark:hover:bg-[#053c2f] text-slate-500 dark:text-emerald-100/75 flex items-center justify-center rounded-xl transition-all active:scale-[0.93] disabled:opacity-40 cursor-pointer border border-slate-200/20"
                title="Đính kèm file (Tối đa 5MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Nhập yêu cầu..."
                className="flex-1 bg-slate-50 dark:bg-[#031d16] border border-slate-100 dark:border-primary-container/20 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-emerald-50 placeholder-slate-400 outline-none focus:border-[#003527] dark:focus:border-[#fe932c] transition-all disabled:opacity-55 disabled:cursor-not-allowed"
              />
              
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 shrink-0 bg-[#003527] dark:bg-[#fe932c] hover:bg-[#064e3b] dark:hover:bg-[#d97706] text-white dark:text-[#002B1F] flex items-center justify-center rounded-xl transition-all active:scale-[0.93] disabled:opacity-40 disabled:scale-100 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-[#003527] to-[#064e3b] dark:from-[#fe932c] dark:to-[#d97706] hover:from-[#064e3b] hover:to-[#003527] dark:hover:from-[#d97706] dark:hover:to-[#fe932c] text-white dark:text-[#002B1F] flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-95 group border-none"
        >
          <MessageSquare className="w-6 h-6 transition-transform duration-300 group-hover:rotate-6" />
        </button>
      )}
    </div>
  );
}