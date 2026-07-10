import { apiFetch } from "./client";

export type ChatSessionStatus = "BOT" | "HUMAN_WAITING" | "HUMAN_CONNECTED" | "CLOSED";

export type ChatSession = {
  sessionId: string;
  userId: string;
  userName: string;
  status: ChatSessionStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  sender: string;
  senderId?: string;
  senderName?: string;
  text: string;
  createdAt?: string;
};

export function getChatHistory(sessionId: string) {
  return apiFetch<{ session?: ChatSession; messages?: ChatMessage[] }>(
    `/chat/history?sessionId=${encodeURIComponent(sessionId)}`
  );
}

export function sendChatMessage(payload: {
  text: string;
  sessionId: string;
  userEmail?: string;
  userName?: string;
  sender?: string;
  senderName?: string;
}) {
  return apiFetch<{ messages?: string[] }>("/chat", {
    method: "POST",
    body: payload,
  });
}

export function requestHumanSupport(sessionId: string) {
  return apiFetch<unknown>("/chat/switch", {
    method: "POST",
    body: { sessionId },
  });
}

export function resetToBot(sessionId: string) {
  return apiFetch<unknown>("/chat/reset", {
    method: "POST",
    body: { sessionId },
  });
}

export function uploadChatFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ url: string; fileName: string; fileType: string; fileSize: number; error?: string }>(
    "/chat/upload",
    { method: "POST", body: formData }
  );
}

export function listAdminChatSessions() {
  return apiFetch<{ waiting?: ChatSession[]; active?: ChatSession[] }>("/chat/admin/sessions");
}

export function assignAdminChatSession(sessionId: string, staffId: string, staffName: string) {
  return apiFetch<unknown>("/chat/admin/assign", {
    method: "POST",
    body: { sessionId, staffId, staffName },
  });
}

export function closeAdminChatSession(sessionId: string) {
  return apiFetch<unknown>("/chat/admin/close", {
    method: "POST",
    body: { sessionId },
  });
}
