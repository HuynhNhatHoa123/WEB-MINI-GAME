import React, { useEffect, useRef, useState } from "react";
import socket from "./socket";

function WerewolfChat({ username, leaveRoom }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState({ id: null, count: 0 });
  const [roomUsers, setRoomUsers] = useState([]);
  const [isWaiting, setIsWaiting] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    // 1. Gửi yêu cầu tham gia
    socket.emit("joinWerewolfRoom", { username });

    // 2. Lắng nghe khi vào phòng thành công
    const handleRoomJoined = (data) => {
      setRoomInfo({ id: data.roomID, count: data.currentCount });
      setRoomUsers(data.users);
      setIsWaiting(false);
    };

    // 3. Cập nhật trạng thái phòng (có người vào/ra)
    const handleUpdateStatus = (data) => {
      setRoomInfo({ id: data.roomID, count: data.currentCount });
      setRoomUsers(data.users);
    };

    // 4. Nhận tin nhắn
    const handleGroupMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("roomJoined", handleRoomJoined);
    socket.on("updateRoomStatus", handleUpdateStatus);
    socket.on("groupMessage", handleGroupMessage);

    return () => {
      // Khi thoát component, báo cho server biết
      // Lưu ý: Sử dụng tham chiếu trực tiếp vì roomInfo.id có thể bị cũ trong closure này
      socket.emit("leaveWerewolfRoom", { roomID: socket.currentRoomID }); 
      socket.off("roomJoined", handleRoomJoined);
      socket.off("updateRoomStatus", handleUpdateStatus);
      socket.off("groupMessage", handleGroupMessage);
    };
  }, [username]);

  // Lưu roomID vào một biến tạm để cleanup dùng đúng
  useEffect(() => {
    if (roomInfo.id) {
      socket.currentRoomID = roomInfo.id;
    }
  }, [roomInfo.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !roomInfo.id) return;

    socket.emit("sendGroupMessage", {
      roomID: roomInfo.id,
      user: username,
      message: message.trim()
    });

    setMessage("");
  };

  const handleBack = () => {
    socket.emit("leaveWerewolfRoom", { roomID: roomInfo.id });
    leaveRoom();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-black text-white px-4">
      <div className="w-full max-w-6xl h-[750px] grid md:grid-cols-[300px_1fr] gap-4">
        
        {/* USERS LIST */}
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-red-500 italic uppercase tracking-tighter">🐺 Werewolf Table</h2>
            <p className="text-[10px] text-gray-500 font-mono truncate">ID: {roomInfo.id}</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">
              Thành viên ({roomInfo.count}/10)
            </div>
            {roomUsers.map((user, index) => {
              // Xử lý cả trường hợp user là string hoặc object {username}
              const name = typeof user === 'string' ? user : user.username;
              const isMe = name === username;
              
              return (
                <div 
                  key={index} 
                  className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                    isMe ? "bg-red-500/20 border-red-500/50" : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isMe ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></div>
                  <span className="truncate text-sm font-medium">{name} {isMe && "(Bạn)"}</span>
                </div>
              );
            })}
            
            {/* Slot trống */}
            {Array.from({ length: Math.max(0, 10 - roomUsers.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 rounded-xl border border-dashed border-white/5 text-gray-600 text-xs text-center">
                Ghế trống...
              </div>
            ))}
          </div>

          <button
            onClick={handleBack}
            className="mt-4 w-full py-3 rounded-xl bg-red-600/10 hover:bg-red-600 text-white transition font-bold text-sm border border-red-600/20"
          >
            Rời bàn
          </button>
        </div>

        {/* CHAT BOX */}
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
          {isWaiting ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-red-600/20 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-500 animate-pulse">Đang tìm bàn trống...</p>
                <p className="text-sm text-gray-400 mt-2">Vui lòng đợi trong giây lát</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, index) => {
                  const isMe = msg.user === username;
                  const isSystem = msg.user === "System";

                  if (isSystem) {
                    return (
                      <div key={index} className="flex justify-center my-2">
                        <span className="bg-red-500/10 border border-red-500/20 px-4 py-1 rounded-full text-[10px] text-red-300 italic">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <span className="text-[10px] text-gray-500 mb-1 px-2">{msg.user}</span>
                        <div className={`px-4 py-2 rounded-2xl shadow-lg ${
                          isMe ? "bg-red-600 rounded-tr-none shadow-red-900/20" : "bg-white/10 border border-white/10 rounded-tl-none shadow-black/40"
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Nhập tin nhắn giao lưu..."
                  className="flex-1 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-red-500 focus:bg-white/10 transition"
                />
                <button
                  onClick={sendMessage}
                  className="px-8 py-3 rounded-2xl bg-red-600 font-bold hover:bg-red-500 active:scale-95 transition shadow-lg shadow-red-900/20"
                >
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WerewolfChat;