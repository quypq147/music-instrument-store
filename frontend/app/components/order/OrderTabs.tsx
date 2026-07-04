"use client";

interface OrderTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OrderTabs({ tabs, activeTab, onTabChange }: OrderTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === tab
              ? "bg-[#002B1F] text-white"
              : "bg-[#F3EFEA] text-slate-600 hover:bg-[#e9e2d8]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
