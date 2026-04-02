import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // 1. Lấy danh sách user từ Server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Không lấy được danh sách user");
      }
    };
    fetchUsers();
  }, []);

  // 2. HÀM ĐĂNG XUẤT (QUAN TRỌNG)
  const handleLogout = () => {
    // Xóa thông tin user khỏi bộ nhớ trình duyệt
    localStorage.removeItem("user"); 
    // Chuyển hướng về trang đăng nhập
    navigate("/login"); 
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER: CHỨA NÚT ĐĂNG XUẤT */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 shadow-2xl backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent uppercase tracking-tighter">
            💎 Khu Vực Tổng Thống
          </h1>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-[0.3em]">
            Hệ thống quản trị VPT Club • Admin Mode
          </p>
        </div>
        
        {/* NÚT ĐĂNG XUẤT "NHÍ NHẢNH" */}
        <button 
          onClick={handleLogout}
          className="mt-4 md:mt-0 px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all duration-300 font-black uppercase text-xs tracking-widest flex items-center gap-2"
        >
          <span>🚪</span> Rời Ghế Chủ Tịch
        </button>
      </div>

      {/* PHẦN THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Thành viên</p>
          <h3 className="text-4xl font-black mt-1">{users.length}</h3>
        </div>
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl">
          <p className="text-green-400 text-[10px] font-black uppercase tracking-widest">Trạng thái</p>
          <h3 className="text-4xl font-black mt-1 text-green-400 animate-pulse">Online</h3>
        </div>
        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-3xl">
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Server</p>
          <h3 className="text-4xl font-black mt-1">Ổn định</h3>
        </div>
      </div>

      {/* BẢNG DANH SÁCH NGHIÊM TÚC */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="p-5 text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Biệt danh</th>
              <th className="p-5 text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Cấp bậc</th>
              <th className="p-5 text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">ID Hệ Thống</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-white/5 transition-colors">
                <td className="p-5 font-bold flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-[10px]">
                    {u.username.substring(0,2).toUpperCase()}
                  </div>
                  {u.username}
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-blue-500/20 text-blue-500 border border-blue-500/50'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-5 font-mono text-[10px] text-white/20 uppercase">{u._id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Admin;