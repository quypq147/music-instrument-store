export default function Register() {
  return (
    <div className="form">
      <h1>Đăng Ký</h1>

      <input
        placeholder="Họ và tên"
      />

      <input
        type="email"
        placeholder="Email"
      />

      <input
        type="password"
        placeholder="Mật khẩu"
      />

      <button>
        Đăng Ký
      </button>
    </div>
  );
}