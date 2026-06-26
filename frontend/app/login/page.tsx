"use client";

import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu!");
      return;
    }

    if (!savedUser) {
      alert("Bạn chưa có tài khoản. Vui lòng đăng ký trước!");
      window.location.href = "/register";
      return;
    }

    if (savedUser.email !== email || savedUser.password !== password) {
      alert("Email hoặc mật khẩu không đúng!");
      return;
    }

    localStorage.setItem("isLogin", "true");
    localStorage.setItem("currentUser", JSON.stringify(savedUser));

    alert("Đăng nhập thành công!");
    window.location.href = "/";
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-icon">🎷</div>

        <h1>Đăng Nhập</h1>
        <p className="login-desc">
          Đăng nhập để mua hàng và theo dõi đơn của bạn
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Đăng Nhập</button>

        <p className="login-register">
          Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </main>
  );
}