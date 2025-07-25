import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import "../App.css";

const staticUsers = [
  {
    username: "user1",
    password: "user1",
    role: "USER",
    full_name: "Người dùng 1",
    email: "user1@gmail.com",
  },
  {
    username: "admin1",
    password: "admin1",
    role: "ADMIN",
    full_name: "Quản trị viên 1",
    email: "admin1@gmail.com",
  },
];

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser(); // từ context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Kiểm tra dữ liệu tĩnh trước
    const found = staticUsers.find(
      (u) => u.username === form.username && u.password === form.password
    );
    if (found) {
      // Tạo token giả (có thể là chuỗi bất kỳ)
      const fakeToken = "static-token-" + found.username;
      localStorage.setItem("token", fakeToken);
      localStorage.setItem("user", JSON.stringify(found));
      login(found);

      if (found.role === "ADMIN") {
        navigate("/admin/dashboard");
        setLoading(false);
        return;
      }
      navigate("/home");
      setLoading(false);
      return;
    }

    // Nếu không phải tài khoản tĩnh thì gọi API như cũ
    try {
      const res = await axios.post("http://localhost:8000/auth/login", form);
      const { access_token, token_type, user } = res.data;
      if (access_token && user) {
        localStorage.setItem("token", access_token);
        login(user);

        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
          return;
        }
        navigate("/home");
      } else {
        setError("Phản hồi từ server không hợp lệ.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background Carousel */}
      <div
        id="bgCarousel"
        className="carousel slide position-absolute top-0 start-0 w-100 h-100"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner h-100 w-100">
          {[1, 2, 3].map((n, i) => (
            <div
              key={n}
              className={`carousel-item h-100 w-100 ${i === 0 ? "active" : ""}`}
            >
              <img
                src={`/images/bg${n}.jpg`}
                className="d-block w-100 h-100"
                alt={`Slide ${n}`}
                style={{ objectFit: "cover", filter: "brightness(60%)" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Form Login */}
      <div className="container d-flex align-items-center justify-content-center min-vh-100 position-relative">
        <div
          className="card shadow-lg p-4 bg-opacity-75"
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "1rem",
            backgroundColor: "rgba(145, 145, 145, 0.73)",
            backdropFilter: "blur(0px)",
          }}
        >
          <h3 className="text-center text-warning fw-bold mb-3">
            Đăng nhập hệ thống
          </h3>

          {error && (
            <div className="alert alert-danger text-center py-2">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="Tên đăng nhập"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
              />
              <label htmlFor="username">Tài khoản</label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              <label htmlFor="password">Mật khẩu</label>
            </div>

            <button
              type="submit"
              className="btn btn-warning w-100 py-2 fs-5 fw-semibold d-flex align-items-center justify-content-center"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p
            className="text-center text-white mt-4 mb-0"
            style={{ fontSize: "0.9rem" }}
          >
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-warning text-decoration-none">
              Đăng ký
            </a>
          </p>
          <p
            className="text-center text-white mt-2 mb-0"
            style={{ fontSize: "0.9rem" }}
          >
            © {new Date().getFullYear()} Nhà Trọ Bảo Bảo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
