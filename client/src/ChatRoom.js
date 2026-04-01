import React, { useState, useEffect, useRef } from "react";
import socket from "./socket";

function ChatRoom({ room, username, users }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("message", {
      room: room,
      user: username,
      message: message
    });

    setMessage("");
  };

  const leaveRoom = () => {
    const confirmLeave = window.confirm("Hai bạn đang trò chuyện vui vẻ mà, bạn vẫn muốn rời đi sao? ❤️");
    if (!confirmLeave) return;
    socket.emit("leaveRoom", { room, user: username });
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-400 via-slate-900 to-black text-white px-4 font-sans">
      
      {/* TRANG TRÍ PHỤ (Đốm sáng lãng mạn) */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full"></div>

      {/* CHAT CARD */}
      <div className="w-full max-w-xl h-[700px] flex flex-col rounded-[2.5rem] overflow-hidden backdrop-blur-2xl bg-white/5 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <span className="text-xl">👩‍❤️‍👨</span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-400">Đang trò chuyện cùng</h2>
              <p className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-rose-200">
                {users.filter(u => u !== username).join("") || "Người ấy"}
              </p>
            </div>
          </div>

          <button
            onClick={leaveRoom}
            className="p-2 hover:bg-red-500/20 rounded-full transition-all group"
            title="Rời phòng"
          >
            <span className="text-gray-400 group-hover:text-red-400 text-xl">✕</span>
          </button>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 italic">
              <span className="text-4xl opacity-20">💖</span>
              <p className="text-sm">Hãy bắt đầu câu chuyện ngọt ngào...</p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isMe = msg.user === username;

            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? "items-end" : "items-start animate-fade-in"}`}
              >
                {!isMe && <span className="text-[10px] text-gray-500 ml-2 mb-1 uppercase tracking-wider">{msg.user}</span>}
                
                <div
                  className={`
                    relative max-w-[85%] px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm
                    ${isMe 
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-tr-none" 
                      : "bg-white/10 border border-white/10 text-rose-50 rounded-tl-none"}
                  `}
                >
                  {msg.message}
                </div>
                <span className="text-[9px] text-gray-600 mt-1 px-2">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        {/* INPUT AREA */}
        <div className="p-5 bg-white/5 border-t border-white/10">
          <div className="relative flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-white/10 focus-within:border-pink-500/50 transition-all">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Gửi lời yêu thương..."
              className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2 placeholder:text-gray-600"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            
            <button
              onClick={sendMessage}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/30"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* CSS TRONG JS (Bạn có thể cho vào file index.css) */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default ChatRoom;