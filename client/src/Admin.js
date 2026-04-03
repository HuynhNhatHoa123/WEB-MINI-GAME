import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // ĐỊA CHỈ API ĐỘNG
  const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://vpt-xi4h.onrender.com";

  // Hàm lấy danh sách user (Sử dụng useCallback để tránh lỗi dependency)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  }, [API_URL]);

  // useEffect gọi dữ liệu khi component load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // HÀM XÓA USER
  const deleteUser = async (id, name) => {
    if (window.confirm(`⚠️ Ngài có chắc muốn TRỤC XUẤT "${name}" khỏi hệ thống không?`)) {
      try {
        await axios.delete(`${API_URL}/api/users/${id}`);
        fetchUsers(); // Tải lại danh sách sau khi xóa thành công
      } catch (err) {
        alert("❌ Lỗi: Không thể xóa người này!");
      }
    }
  };

  // HÀM ĐỔI MẬT KHẨU NHANH
  const resetPassword = async (id, name) => {
    const newPass = window.prompt(`🔑 Nhập mật khẩu mới cho quản viên: ${name}`);
    if (newPass && newPass.trim() !== "") {
      try {
        await axios.put(`${API_URL}/api/users/${id}`, { password: newPass });
        alert("✅ Đã đổi mật khẩu thành công!");
      } catch (err) {
        alert("❌ Lỗi: Không thể đổi mật khẩu!");
      }
    }
  };

  // HÀM ĐỔI QUYỀN HẠN (ADMIN <-> USER)
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (window.confirm(`Thay đổi quyền của thành viên này thành: ${newRole.toUpperCase()}?`)) {
      try {
        await axios.put(`${API_URL}/api/users/${id}`, { role: newRole });
        fetchUsers();
      } catch (err) {
        alert("❌ Lỗi: Không thể thay đổi quyền hạn!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); 
    navigate("/login"); 
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER QUẢN TRỊ */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/10 mb-8 backdrop-blur-xl shadow-2xl">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent uppercase tracking-tight">
            ⚡ Tổng Cục Quản Trị
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">VPT Club Control Panel • Presidential Mode</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="mt-4 md:mt-0 px-8 py-3 bg-rose-500/10 border border-rose-500/50 text-rose-500 rounded-2xl font-black hover:bg-rose-500 hover:text-white transition-all duration-300 text-xs shadow-lg shadow-rose-500/10"
        >
          🚪 RỜI GHẾ CHỦ TỊCH
        </button>
      </div>

      {/* THỐNG KÊ NHANH */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:border-cyan-500/50 transition-colors">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Tổng dân số</p>
          <p className="text-4xl font-black text-cyan-400">{users.length} <span className="text-sm font-normal text-white/20">👤</span></p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:border-yellow-500/50 transition-colors">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Quản trị viên</p>
          <p className="text-4xl font-black text-yellow-500">{users.filter(u => u.role === 'admin').length} <span className="text-sm font-normal text-white/20">👑</span></p>
        </div>
        <div className="hidden md:block bg-white/5 border border-white/10 p-6 rounded-[2rem]">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Hệ thống</p>
          <p className="text-2xl font-black text-emerald-400 uppercase italic">Ổn định</p>
        </div>
      </div>

      {/* BẢNG DANH SÁCH USER */}
      <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-3xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">
                <th className="p-6">Hồ sơ thành viên</th>
                <th className="p-6">Cấp bậc</th>
                <th className="p-6 text-center">Hành động bảo mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length > 0 ? users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center font-black text-lg group-hover:from-cyan-500 group-hover:to-blue-600 transition-all duration-500">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-xl tracking-tight">{u.username}</p>
                        <p className="text-[9px] text-white/20 font-mono uppercase tracking-tighter">{u._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => toggleRole(u._id, u.role)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        u.role === 'admin' 
                        ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black' 
                        : 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black'
                      }`}
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => resetPassword(u._id, u.username)}
                        className="p-4 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-2xl transition-all duration-300 text-lg border border-white/5 shadow-inner"
                        title="Đổi mật khẩu"
                      >
                        🔑
                      </button>
                      <button 
                        onClick={() => deleteUser(u._id, u.username)}
                        className="p-4 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all duration-300 text-lg border border-rose-500/10 shadow-inner"
                        title="Xóa vĩnh viễn"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-20 text-center text-white/20 font-bold uppercase tracking-widest animate-pulse">
                    Đang triệu tập danh sách thành viên...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/10 text-[9px] font-bold uppercase tracking-[0.5em]">VPT Club Administration System v2.0</p>
      </div>
    </div>
  );
};

export default Admin;