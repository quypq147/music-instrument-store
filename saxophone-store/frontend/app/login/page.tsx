export default function Login() {
  return (
    <div className="form">
      <h1>Đăng Nhập</h1>

      <input
        type="email"
        placeholder="Email"
      />

      <input
        type="password"
        placeholder="Mật khẩu"
      />

      <button>
        Đăng Nhập
      </button>
    </div>
  );
}