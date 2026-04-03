import React, { useState, useEffect, useRef } from "react";
import socket from "./socket";

function ChatRoom({ room, username, users, onLeave }) {
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

  const handleBackHome = () => {
    socket.emit("leaveRoom", { room, user: username });
    // Nếu bạn dùng React Router, hãy dùng history.push('/')
    // Ở đây tôi dùng window.location.reload() theo logic cũ của bạn nhưng bỏ confirm
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white px-4 font-sans relative overflow-hidden">
      
      {/* NỀN ĐỘNG (Blurry Blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>

      {/* CHAT CARD */}
      <div className="w-full max-w-2xl h-[85vh] flex flex-col rounded-[2rem] overflow-hidden backdrop-blur-3xl bg-white/[0.03] border border-white/10 shadow-2xl z-10">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Nút Back */}
            <button 
              onClick={handleBackHome}
              className="p-2 hover:bg-white/10 rounded-full transition-colors group"
              title="Quay lại"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <span className="text-xl">✨</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-rose-300/60 uppercase tracking-widest">Đang trò chuyện cùng</p>
                <h2 className="text-lg font-semibold text-white/90">
                   {users.find(u => u !== username) || "Người ấy"}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <span className="hidden sm:block text-[10px] bg-white/10 px-3 py-1 rounded-full text-gray-400">
               {room}
             </span>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-4xl">💌</span>
              </div>
              <p className="text-gray-500 text-sm font-light italic">
                Căn phòng này đang đợi những lời nhắn <br/> đầu tiên từ bạn...
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user === username;
              return (
                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-message-in`}>
                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[10px] text-gray-500 mb-1 ml-2 font-medium">{msg.user}</span>
                    )}
                    <div className={`
                      px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed
                      ${isMe 
                        ? "bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/10 rounded-tr-none" 
                        : "bg-white/10 text-white/90 border border-white/5 rounded-tl-none backdrop-blur-md"}
                    `}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-600 mt-1.5 opacity-50">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* INPUT AREA */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 p-1.5 pl-5 rounded-2xl border border-white/10 focus-within:border-rose-500/40 focus-within:bg-white/[0.07] transition-all group">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-3 text-white placeholder:text-gray-600"
            />
            
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className={`
                w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300
                ${message.trim() 
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95" 
                  : "bg-white/5 text-gray-600 cursor-not-allowed"}
              `}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-45 mr-1">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        @keyframes message-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-message-in {
          animation: message-in 0.25s ease-out forwards;
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default ChatRoom;