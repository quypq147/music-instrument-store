"use client";

import React from "react";

interface MusicLoadingProps {
  message?: string;
  height?: string;
  theme?: "dark" | "light";
}

export default function MusicLoading({
  message = "Đang tải âm thanh...",
  height = "250px",
  theme = "light"
}: MusicLoadingProps) {
  const isDark = theme === "dark";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .music-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }

        .soundwave-loader {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 6px;
          height: 36px;
          width: 60px;
        }

        .soundwave-bar {
          width: 4px;
          height: 100%;
          background: linear-gradient(to top, #C58A3E, #DF9E47);
          border-radius: 4px;
          animation: bounce-bar 1.1s ease-in-out infinite;
          transform-origin: bottom;
        }

        .soundwave-bar:nth-child(1) { animation-delay: -0.9s; }
        .soundwave-bar:nth-child(2) { animation-delay: -0.7s; }
        .soundwave-bar:nth-child(3) { animation-delay: -0.5s; }
        .soundwave-bar:nth-child(4) { animation-delay: -0.3s; }
        .soundwave-bar:nth-child(5) { animation-delay: -0.1s; }

        @keyframes bounce-bar {
          0%, 100% {
            transform: scaleY(0.2);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .music-loader-text {
          font-family: var(--font-sans), sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.05em;
          animation: pulse-text 1.5s ease-in-out infinite;
        }

        @keyframes pulse-text {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}} />

      <div className="music-loader-container" style={{ height }}>
        <div className="soundwave-loader">
          <div className="soundwave-bar"></div>
          <div className="soundwave-bar"></div>
          <div className="soundwave-bar"></div>
          <div className="soundwave-bar"></div>
          <div className="soundwave-bar"></div>
        </div>
        <p 
          className="music-loader-text"
          style={{ 
            color: isDark ? "#E8E5E1" : "#054030" 
          }}
        >
          {message}
        </p>
      </div>
    </>
  );
}
