"use client";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#F3EFEA] flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
        <p className="font-serif text-2xl text-[#002B1F] truncate">{value}</p>
      </div>
    </div>
  );
}
