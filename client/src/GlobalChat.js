import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";

function GlobalChat({ username, leaveRoom }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Gửi tên người dùng khi tham gia
    socket.emit("joinGlobal", username);

    const handleGlobalMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleGlobalUsers = (users) => {
      // CẬP NHẬT: Server trả về mảng object [{id, username}]
      setOnlineUsers(users);
    };

    socket.on("globalMessage", handleGlobalMessage);
    socket.on("globalUsers", handleGlobalUsers);

    return () => {
      socket.emit("leaveGlobal"); // Server xử lý leave không cần truyền username nữa vì đã có socket.id
      socket.off("globalMessage", handleGlobalMessage);
      socket.off("globalUsers", handleGlobalUsers);
    };
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    // Gửi tin nhắn lên server
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-black text-white px-4">
      <div className="w-full max-w-5xl h-[700px] grid md:grid-cols-[280px_1fr] gap-4">

        {/* USERS */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-5 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🌍 Global Chat</h2>
            <button
              onClick={handleLeave}
              className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm transition"
            >
              Thoát
            </button>
          </div>

          <div className="mb-4 text-sm text-green-300 font-medium">
            🟢 {onlineUsers.length} người đang online
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {onlineUsers.map((user, index) => (
              <div
                key={user.id || index}
                className={`p-3 rounded-xl border transition ${
                  user.username === username
                    ? "bg-pink-500/20 border-pink-400/50"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {user.username === username
                  ? `👤 ${user.username} (Bạn)`
                  : `🟢 ${user.username}`}
              </div>
            ))}
          </div>
        </div>

        {/* CHAT */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h3 className="text-lg font-bold">💬 Trò chuyện toàn server</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((msg, index) => {
              const isMe = msg.user === username;
              const isSystem = msg.user === "System";

              if (isSystem) {
                return (
                  <div key={index} className="flex justify-center my-2">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-200/60 bg-yellow-500/10 border border-yellow-500/20 rounded-full py-1 px-4">
                      {msg.message}
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <span className="text-[10px] opacity-50 mb-1 px-2">{msg.user}</span>
                    <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 rounded-tr-none"
                          : "bg-white/10 border border-white/10 rounded-tl-none"
                      }`}
                    >
                      <div className="text-sm leading-relaxed">{msg.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-black/20 border-t border-white/10 flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none focus:border-pink-500/50 transition"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:opacity-90 active:scale-95 transition shadow-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalChat;