import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  // ĐỊA CHỈ API THÔNG MINH
  // Nếu đang chạy ở máy (localhost) thì dùng :5000, nếu trên Render thì dùng link Render
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://vpt-xi4h.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? "/api/register" : "/api/login";
    
    try {
      // Gọi đến API_URL động thay vì để cứng localhost
      const res = await axios.post(`${API_URL}${url}`, form);
      
      if (isRegister) {
        alert("🎉 Đăng ký thành công! Hãy đăng nhập ngay sếp ơi.");
        setIsRegister(false);
      } else {
        // Lưu thông tin vào bộ nhớ trình duyệt
        localStorage.setItem("user", JSON.stringify(res.data));
        
        // Phân quyền điều hướng
        if (res.data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      }
    } catch (err) {
      // Hiện lỗi chi tiết từ server trả về (nếu có)
      const errorMsg = err.response?.data?.error || "Lỗi kết nối Server - Kiểm tra lại mạng sếp ơi!";
      alert(errorMsg);
      console.error("Lỗi:", err);
    }
  };

  return (
    <div className="rainbow-bg min-h-screen flex items-center justify-center px-4 font-sans">
      <div className="glass w-full max-w-md p-10 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-lg">
        
        {/* LOGO & TITLE */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 shadow-lg mb-4 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
            {isRegister ? "Gia Nhập" : "Đăng Nhập"}
          </h2>
          <p className="text-white/50 text-[10px] mt-2 tracking-[0.3em] uppercase italic">VPT Club • VIP AREA ONLY</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-white/40 uppercase ml-1 tracking-widest">Tên tài khoản</label>
            <input
              type="text"
              placeholder="Nhập tên tài khoản..."
              className="w-full mt-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 focus:bg-white/10 transition-all placeholder:text-white/20"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-white/40 uppercase ml-1 tracking-widest">Mật mã</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full mt-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-pink-500 focus:bg-white/10 transition-all placeholder:text-white/20"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black rounded-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_30px_rgba(219,39,119,0.4)] uppercase tracking-[0.2em] text-sm mt-4"
          >
            {isRegister ? "Tạo tài khoản VIP" : "Bắt đầu quẩy 🚀"}
          </button>
        </form>

        {/* SWITCH MODE */}
        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsRegister(!isRegister)} 
            className="text-white/60 text-xs font-bold cursor-pointer hover:text-pink-400 transition-all uppercase tracking-widest"
          >
            {isRegister ? "← Đã có vé vào cổng? Đăng nhập" : "Chưa có vé? Đăng ký tại đây →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;