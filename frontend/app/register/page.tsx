"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const router = useRouter();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.name || !user.email || !user.password || !user.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (user.password !== user.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));

    alert("Đăng ký thành công!");
    router.push("/login");
  };

  return (
    <main className="register-page">
      <form className="register-card" onSubmit={handleRegister}>
        <div className="register-icon">🎷</div>

        <h1>Đăng Ký</h1>
        <p className="register-desc">
          Tạo tài khoản để mua hàng và theo dõi đơn hàng
        </p>

        <input
          type="text"
          placeholder="Họ và tên"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
        />

        <input
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={user.confirmPassword}
          onChange={(e) =>
            setUser({ ...user, confirmPassword: e.target.value })
          }
        />

        <button type="submit">Đăng Ký</button>

        <p className="register-login">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}