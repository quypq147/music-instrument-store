"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 text-slate-600 hover:border-[#DF9E47] hover:text-[#A36B2B] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        ←
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
            currentPage === page
              ? "bg-[#002B1F] text-[#DF9E47] border border-[#002B1F]"
              : "border border-gray-200 text-slate-600 hover:border-[#DF9E47] hover:text-[#A36B2B]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 text-slate-600 hover:border-[#DF9E47] hover:text-[#A36B2B] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        →
      </button>
    </div>
  );
}
