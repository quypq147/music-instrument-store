"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsVisible(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setIsVisible(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
    setTimeout(() => setOptions(null), 200);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div
          className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => handleClose(false)}
        >
          <div
            className={`w-full max-w-sm bg-white rounded-2xl p-6 md:p-7 text-center transition-all duration-200 ${
              isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                options.danger ? "bg-rose-50 text-rose-600" : "bg-[#F3EFEA] text-[#A36B2B]"
              }`}
            >
              {options.danger ? (
                <AlertTriangle width="26" height="26" />
              ) : (
                <HelpCircle width="26" height="26" />
              )}
            </div>

            <h3 className="font-serif text-lg text-[#002B1F] mb-2">
              {options.title || (options.danger ? "Xác nhận xóa" : "Xác nhận")}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{options.message}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="flex-1 border border-gray-200 text-slate-600 font-bold text-sm uppercase tracking-widest py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {options.cancelText || "Hủy"}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`flex-1 font-bold text-sm uppercase tracking-widest py-3 rounded-xl text-white transition-colors ${
                  options.danger
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#002B1F] hover:bg-[#054030]"
                }`}
              >
                {options.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  }
  return context.confirm;
}
