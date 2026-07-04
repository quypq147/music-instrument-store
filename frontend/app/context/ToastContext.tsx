"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

// Toast Icon Components
function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return <CheckCircle2 style={{ width: "22px", height: "22px", color: "#10B981" }} />;
    case "error":
      return <XCircle style={{ width: "22px", height: "22px", color: "#EF4444" }} />;
    case "warning":
      return <AlertTriangle style={{ width: "22px", height: "22px", color: "#F59E0B" }} />;
    case "info":
    default:
      return <Info style={{ width: "22px", height: "22px", color: "#3B82F6" }} />;
  }
}

// Individual Toast Item Component (handles countdown, progress bar, and hover state)
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { id, message, type, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startTime = React.useRef(0);
  const remainingTime = React.useRef(duration);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    startTime.current = Date.now();
    
    timerRef.current = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => {
        onRemove(id);
      }, 250); // Match animation exit duration
    }, remainingTime.current);

    const updateInterval = 20; // ms
    progressIntervalRef.current = setInterval(() => {
      remainingTime.current -= updateInterval;
      const pct = Math.max(0, (remainingTime.current / duration) * 100);
      setProgress(pct);
      
      if (remainingTime.current <= 0) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, updateInterval);
  }, [duration, id, onRemove]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    const elapsed = Date.now() - startTime.current;
    remainingTime.current = Math.max(0, remainingTime.current - elapsed);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    pauseTimer();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimer();
  };

  const handleManualRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(id);
    }, 250);
  };

  // Color theme helpers based on toast type
  const getProgressColor = () => {
    switch (type) {
      case "success": return "#10B981";
      case "error": return "#EF4444";
      case "warning": return "#F59E0B";
      case "info":
      default: return "#DF9E47"; // Aureate Gold matching boutique branding
    }
  };

  return (
    <div
      className={`toast-item ${isRemoving ? "removing" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderLeft: `4px solid ${getProgressColor()}`
      }}
    >
      <ToastIcon type={type} />
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={handleManualRemove}>
        <X style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
      </button>

      {/* Animated progress indicator */}
      <div 
        className="toast-progress" 
        style={{
          width: `${progress}%`,
          backgroundColor: getProgressColor()
        }}
      />
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .toast-container {
          position: fixed;
          top: 88px; /* Safe distance below the stick header */
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
          max-width: 380px;
          width: calc(100vw - 48px);
        }
        
        .toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px 18px 18px; /* Extra padding at bottom for progress bar */
          border-radius: 12px;
          background: rgba(10, 22, 18, 0.95); /* Deep luxury dark green/black background matching Aureate Forest */
          backdrop-filter: blur(8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(223, 158, 71, 0.25); /* Gold border */
          position: relative;
          overflow: hidden;
          animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: transform 0.2s, opacity 0.2s;
        }

        .toast-item:hover {
          transform: translateY(-2px);
          border-color: rgba(223, 158, 71, 0.5);
        }
        
        .toast-item.removing {
          animation: toast-fade-out 0.25s ease forwards;
        }
        
        .toast-content {
          flex: 1;
        }
        
        .toast-message {
          font-family: var(--font-sans), sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: #F8F5F0; /* Cream text */
          line-height: 1.5;
          margin: 0;
        }
        
        .toast-close {
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, transform 0.2s;
        }
        
        .toast-close:hover {
          color: #DF9E47; /* Gold */
          transform: scale(1.1);
        }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          transition: width 20ms linear;
        }
        
        @keyframes toast-slide-in {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes toast-fade-out {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.9);
            opacity: 0;
          }
        }
      `}} />
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}
