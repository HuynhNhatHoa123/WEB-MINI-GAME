import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "./socket";
import ChatRoom from "./ChatRoom";
import BilliardRoom from "./BilliardRoom";
import WerewolfRoom from "./WerewolfRoom";
import GlobalChat from "./GlobalChat";

function HomePage() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [mode, setMode] = useState(null);
  const [menuPage, setMenuPage] = useState(0); // 0: Home, 1,2,3: Menu pages
  const navigate = useNavigate();

  // Danh sách ảnh menu của bạn
  const menuImages = ["/menu1.jpg", "/menu2.jpg", "/menu3.jpg"];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let name = storedUser?.username || localStorage.getItem("username");

    if (!name) {
      const animals = [" Panda"," Fox"," Tiger"," Frog"," Bear"," Wolf"," Cat"," Dog"];
      name = animals[Math.floor(Math.random() * animals.length)];
      localStorage.setItem("username", name);
    }

    setUsername(name);
    socket.emit("join", name);

    const handleMatched = (data) => {
      setWaiting(false);
      setRoom(data.room);
      setUsers(data.users);
    };

    socket.on("matched", handleMatched);
    return () => { socket.off("matched", handleMatched); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    socket.emit("leaveGlobal");
    navigate("/login");
  };

  // --- LOGIC HIỂN THỊ MENU ---
  if (mode === "menu") {
    return (
      <div className="rainbow-bg min-h-screen flex flex-col items-center justify-center text-white px-4">
        <div className="glass max-w-2xl w-full p-6 rounded-3xl border border-white/30 flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">📜 VPT MENU ({menuPage + 1}/3)</h2>
          
          <div className="relative w-full aspect-[3/4] mb-6 overflow-hidden rounded-xl shadow-2xl bg-black/20">
            <img 
              src={menuImages[menuPage]} 
              alt={`Menu page ${menuPage + 1}`} 
              className="w-full h-full object-contain transition-all duration-500"
            />
          </div>

          <div className="flex gap-4 w-full">
            <button 
              disabled={menuPage === 0}
              onClick={() => setMenuPage(menuPage - 1)}
              className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-30 font-bold"
            >
              ⬅️ TRƯỚC
            </button>
            <button 
              disabled={menuPage === menuImages.length - 1}
              onClick={() => setMenuPage(menuPage + 1)}
              className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-30 font-bold"
            >
              TIẾP ➡️
            </button>
          </div>

          <button 
            onClick={() => { setMode(null); setMenuPage(0); }}
            className="mt-8 px-10 py-3 bg-red-500/80 hover:bg-red-600 rounded-full font-bold shadow-lg transition-all"
          >
            🏠 QUAY LẠI TRANG CHỦ
          </button>
        </div>
      </div>
    );
  }

  // --- GIỮ NGUYÊN CÁC MODE KHÁC ---
  if (room) return <ChatRoom room={room} username={username} users={users} leaveRoom={() => { socket.emit("leaveRoom", room); setRoom(null); setUsers([]); }} />;
  if (mode === "billiards") return <BilliardRoom username={username} leaveRoom={() => setMode(null)} />;
  if (mode === "werewolf") return <WerewolfRoom username={username} leaveRoom={() => setMode(null)} />;
  if (mode === "global") return <GlobalChat username={username} leaveRoom={() => setMode(null)} />;

  return (
    <div className="rainbow-bg min-h-screen flex items-center justify-center text-white px-4 relative">
      <button onClick={handleLogout} className="absolute top-6 right-6 px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-red-500/50 hover:border-red-500 transition-all text-xs font-bold uppercase tracking-widest">
        Logout 🚪
      </button>

      <div className="glass w-full max-w-4xl border border-white/30 rounded-3xl shadow-2xl p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <img src="/logo.png" alt="VPT Club" className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl" />
          </div>
          <h1 className="text-5xl font-extrabold mt-6 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wide">VPT Club</h1>
          <p className="text-white/60 text-sm mt-1 tracking-widest">🍺 CONNECT • DRINK • PLAY</p>
          <div className="mt-4 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>👤 {username}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => { if (!waiting && !room) { socket.emit("joinRandom"); setWaiting(true); }}} disabled={waiting} className="glow-btn p-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-lg font-bold hover:scale-105 transition">
            🎲 {waiting ? "Đang tìm..." : "Random Chat"}
          </button>

          <button onClick={() => setMode("billiards")} className="glow-btn p-6 rounded-xl bg-pink-500 text-lg font-bold hover:scale-105 transition">
            🎱 Billiards Player
          </button>

          <button onClick={() => setMode("werewolf")} className="glow-btn p-6 rounded-xl bg-green-500 text-lg font-bold hover:scale-105 transition">
            🐺 Werewolf Room
          </button>

          <button onClick={() => setMode("global")} className="glow-btn p-6 rounded-xl bg-yellow-400 text-lg font-bold text-black hover:scale-105 transition">
            🌍 Global Chat
          </button>

          {/* NÚT XEM MENU MỚI THÊM - CHIẾM 2 CỘT NẾU MUỐN NỔI BẬT */}
          <button 
            onClick={() => setMode("menu")}
            className="glow-btn p-6 rounded-xl bg-blue-500 text-lg font-bold hover:scale-105 transition md:col-span-2 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            📜 XEM MENU / ĐỒ UỐNG
          </button>
        </div>

        {waiting && <div className="mt-10 text-center text-yellow-200 text-xl animate-pulse">🔍 Đang tìm người phù hợp...</div>}
      </div>
    </div>
  );
}

export default HomePage;