import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";

function GlobalChat({ username, leaveRoom }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.emit("joinGlobal", username);

    const handleGlobalMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleGlobalUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("globalMessage", handleGlobalMessage);
    socket.on("globalUsers", handleGlobalUsers);

    return () => {
      socket.emit("leaveGlobal");
      socket.off("globalMessage", handleGlobalMessage);
      socket.off("globalUsers", handleGlobalUsers);
    };
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("globalMessage", {
      user: username,
      message: message.trim()
    });
    setMessage("");
  };

  const handleLeave = () => {
    socket.emit("leaveGlobal");
    leaveRoom();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4 font-sans selection:bg-pink-500/30">
      {/* Background Orbs - Tạo chiều sâu cho nền */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl h-[85vh] grid md:grid-cols-[300px_1fr] gap-6 relative z-10">
        
        {/* SIDEBAR: USERS BENTO BOX */}
        <div className="hidden md:flex flex-col rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              TRỰC TUYẾN
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {onlineUsers.map((user, index) => (
              <div
                key={user.id || index}
                className={`group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${
                  user.username === username
                    ? "bg-gradient-to-r from-pink-500/10 to-transparent border-pink-500/20"
                    : "bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/[0.05]"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transition-transform group-hover:scale-110 ${
                   user.username === username ? "bg-pink-500 text-white" : "bg-white/10 text-white/70"
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className={`text-sm font-bold truncate ${user.username === username ? "text-pink-400" : "text-white/80"}`}>
                    {user.username} {user.username === username && "(Tôi)"}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono tracking-tighter italic">Online Now</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLeave}
            className="mt-6 w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-500 shadow-lg shadow-rose-500/5"
          >
            Rời khỏi sảnh
          </button>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex flex-col rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden relative">
          
          {/* Chat Header */}
          <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
            <div>
              <h3 className="text-2xl font-black tracking-tighter">SẢNH CHUNG</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">VPT Community Hub</p>
            </div>
            <div className="md:hidden">
                <button onClick={handleLeave} className="p-2 text-rose-500">Thoát</button>
            </div>
          </div>

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
            {messages.map((msg, index) => {
              const isMe = msg.user === username;
              const isSystem = msg.user === "System";

              if (isSystem) {
                return (
                  <div key={index} className="flex justify-center animate-fadeIn">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400/60 bg-cyan-400/5 border border-cyan-400/10 rounded-full py-2 px-6 backdrop-blur-md">
                      — {msg.message} —
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-messageIn`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar nhỏ cho tin nhắn */}
                    <div className={`w-8 h-8 rounded-lg hidden sm:flex items-center justify-center text-[10px] font-black shadow-lg ${isMe ? "bg-pink-500" : "bg-white/10 text-white/50"}`}>
                        {msg.user.charAt(0).toUpperCase()}
                    </div>

                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] font-bold text-white/30 mb-1 px-1 uppercase tracking-tighter">
                            {isMe ? "Bạn" : msg.user}
                        </span>
                        <div className={`px-5 py-3 rounded-[1.5rem] relative group transition-all duration-300 ${
                            isMe 
                            ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-[0_10px_20px_rgba(236,72,153,0.2)] rounded-tr-none hover:shadow-pink-500/40" 
                            : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none hover:bg-white/[0.08]"
                        }`}>
                            <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/[0.02] border-t border-white/10">
            <div className="max-w-4xl mx-auto flex items-center gap-4 bg-white/[0.05] p-2 rounded-[2rem] border border-white/10 focus-within:border-pink-500/50 focus-within:bg-white/[0.08] transition-all duration-500 shadow-inner">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Nhập nội dung trò chuyện..."
                className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-sm placeholder:text-white/20 font-medium"
              />
              <button
                onClick={sendMessage}
                className="group p-3 rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-pink-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thêm CSS cho Animation */}
      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-messageIn { animation: messageIn 0.3s ease-out forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(236,72,153,0.3); }
      `}</style>
    </div>
  );
}

export default GlobalChat;