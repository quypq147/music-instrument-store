"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import MusicLoading from "../../components/common/MusicLoading";
import { Megaphone, Send } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  message: string;
  channel: "EMAIL" | "SMS" | "BOTH";
  segment: string;
  status: string;
  createdAt: string;
}

export default function AdminCampaignsPage() {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "BOTH">("EMAIL");

  const getToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  const fetchCampaigns = async () => {
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }
      const res = await fetch("/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch campaigns (status ${res.status})`);
      }
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      const detail = error instanceof Error ? error.message : "";
      showToast(
        detail ? `Không thể tải danh sách chiến dịch: ${detail}` : "Không thể tải danh sách chiến dịch.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchCampaigns();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast("Vui lòng nhập đầy đủ tiêu đề và nội dung.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, channel, segment: "ALL" }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Đã gửi chiến dịch vào hàng đợi xử lý!", "success");
        setTitle("");
        setMessage("");
        setLoading(true);
        fetchCampaigns();
      } else {
        const detail = data.error ? `: ${data.error}` : "";
        showToast(`Tạo chiến dịch thất bại${detail}`, "error");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      showToast("Lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Chiến Dịch Marketing</h2>
        <p className="text-sm text-slate-500 mt-1">
          Gửi thông báo ưu đãi hàng loạt tới khách hàng qua Email/SMS.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ưu đãi cuối tuần - Giảm 20% guitar acoustic"
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Nội dung
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Nội dung khuyến mãi gửi tới khách hàng..."
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Kênh gửi
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as "EMAIL" | "SMS" | "BOTH")}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] cursor-pointer"
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="BOTH">Cả Email và SMS</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex items-center gap-2 bg-[#002B1F] text-white font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#054030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {isSubmitting ? "Đang gửi..." : "Gửi Chiến Dịch"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-serif text-lg text-[#002B1F] mb-4">Lịch Sử Chiến Dịch</h3>

        {loading ? (
          <MusicLoading />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 bg-[#F3EFEA] rounded-xl text-sm text-slate-500">
            <Megaphone className="mx-auto mb-2" size={28} />
            Chưa có chiến dịch nào được gửi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F3EFEA] border-b border-gray-200 text-[#002B1F] font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-4">Tiêu đề</th>
                  <th className="p-4">Kênh</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[#002B1F]">{c.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-96 truncate">{c.message}</div>
                    </td>
                    <td className="p-4 text-slate-600">{c.channel}</td>
                    <td className="p-4 text-slate-600">{formatDate(c.createdAt)}</td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
