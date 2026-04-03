import React, { useEffect, useState } from "react";
import socket from "./socket";

function BilliardRoom({ username, leaveRoom }) {
  const levels = ["H-", "H", "H+", "G", "F", "E"];
  const bets = [0, 10, 20, 50, 100];

  const [level, setLevel] = useState("H-");
  const [bet, setBet] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [matchData, setMatchData] = useState(null); 
  
  const [tablesStatus, setTablesStatus] = useState({
    1: { busy: false, players: [] },
    2: { busy: false, players: [] }
  });

  useEffect(() => {
    socket.on("updateTables", (status) => setTablesStatus(status));
    socket.on("billiardMatched", (data) => {
      setWaiting(false);
      setMatchData(data);
    });
    socket.on("billiardLeave", () => {
      setMatchData(null);
      setWaiting(false);
    });

    return () => {
      socket.off("updateTables");
      socket.off("billiardMatched");
      socket.off("billiardLeave");
    };
  }, []);

  const findMatch = () => {
    socket.emit("findBilliard", { username, level, bet });
    setWaiting(true);
  };

  const finishGame = () => {
    if (!matchData) return;
    socket.emit("finishBilliard", { table: matchData.table, room: matchData.room });
    setMatchData(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#5D4037] font-sans p-4 flex flex-col items-center relative overflow-hidden">
      
      {/* Sticker trang trí bay lơ lửng xung quanh màn hình */}
      <div className="absolute top-10 left-10 text-4xl animate-bounce">🐱</div>
      <div className="absolute top-20 right-10 text-4xl animate-pulse">🌸</div>
      <div className="absolute bottom-20 left-5 text-4xl animate-spin-slow">🌟</div>
      <div className="absolute bottom-10 right-20 text-5xl animate-bounce">🎈</div>

      {/* --- PHẦN 1: LIVE TABLE MONITOR (Cute Style) --- */}
      <div className="w-full max-w-2xl mt-6 mb-8 z-10">
        <h2 className="text-center text-lg font-bold text-[#FF8FB1] mb-6 flex items-center justify-center gap-2">
          ✨ <span className="bg-[#FFB4C2] text-white px-4 py-1 rounded-full shadow-sm">Bàn Bi-da Đang Hoạt Động</span> ✨
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((num) => (
            <div key={num} className={`relative p-6 rounded-[2.5rem] border-4 transition-all duration-500 shadow-lg ${
              tablesStatus[num].busy 
              ? "border-[#FFB4C2] bg-white" 
              : "border-dashed border-[#B2E2F2] bg-white/50"
            }`}>
              <div className="absolute -top-4 -right-2 text-2xl">
                {tablesStatus[num].busy ? "🎮" : "💤"}
              </div>
              
              <div className="flex flex-col items-center">
                <span className={`px-4 py-1 rounded-full text-xs font-black mb-3 ${tablesStatus[num].busy ? "bg-[#FFB4C2] text-white" : "bg-[#B2E2F2] text-[#007EA7]"}`}>
                  BÀN SỐ {num}
                </span>
                
                <p className="text-xl font-black mb-2 tracking-tight">
                  {tablesStatus[num].busy ? "Đang Vui Vẻ~" : "Đang Đợi Bạn"}
                </p>
                
                {tablesStatus[num].busy ? (
                  <div className="flex items-center gap-2 text-sm bg-[#FFF0F3] px-3 py-1 rounded-full">
                    <span className="font-bold text-[#FF8FB1]">{tablesStatus[num].players[0]}</span>
                    <span className="text-xs opacity-50">🐾</span>
                    <span className="font-bold text-[#FF8FB1]">{tablesStatus[num].players[1]}</span>
                  </div>
                ) : (
                  <p className="text-xs text-blue-300">Đến chơi với mình đi! 🍬</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PHẦN 2: KHU VỰC ĐIỀU KHIỂN --- */}
      <div className="w-full max-w-xl z-10">
        {matchData ? (
          /* KHI ĐÃ CÓ TRẬN */
          <div className="bg-white border-4 border-[#FFB4C2] p-8 rounded-[3.5rem] text-center shadow-[0_15px_0_#FFB4C2] animate-in zoom-in duration-500 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl">🥳</div>
            
            <p className="text-[#FF8FB1] font-black text-sm uppercase mb-2">Tìm thấy bạn chơi rồi!</p>
            <h1 className="text-gray-400 text-xs mb-4 uppercase font-bold">Mời bạn di chuyển đến</h1>
            
            <div className="bg-[#FFF0F3] inline-block px-10 py-4 rounded-[3rem] mb-6 border-2 border-[#FFB4C2]">
                <span className="text-xs block text-[#FF8FB1] font-bold">BÀN</span>
                <span className="text-8xl font-black text-[#FF8FB1] leading-none">{matchData.table}</span>
            </div>

            <div className="flex justify-center items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl shadow-inner">🧸</div>
                <p className="text-xl font-black">Vs. {matchData.opponent}</p>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-inner">🐰</div>
            </div>

            <button
              onClick={finishGame}
              className="w-full py-5 bg-[#FF8FB1] text-white rounded-[2rem] font-black text-xl hover:bg-[#FFB4C2] transition-all shadow-[0_8px_0_#F06292] active:translate-y-1 active:shadow-none"
            >
              CHƠI XONG RỒI 🧸
            </button>
          </div>
        ) : (
          /* KHI CHƯA CÓ TRẬN */
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-[#E0E0E0] relative">
            {!waiting ? (
              <div className="space-y-8">
                <div className="text-center relative">
                  <span className="absolute -top-12 -left-4 text-4xl rotate-12">🍭</span>
                  <h3 className="text-2xl font-black text-[#FF8FB1]">Cùng Chơi Nhé!</h3>
                  <p className="text-gray-400 text-xs">Chọn cấp độ để tìm bạn bè nào~</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {levels.map(lvl => (
                    <button key={lvl} onClick={() => setLevel(lvl)} className={`py-3 rounded-2xl font-black transition-all border-2 ${level === lvl ? "bg-[#FFB4C2] border-[#FF8FB1] text-white scale-105" : "bg-white border-pink-50 text-pink-200 hover:border-pink-200"}`}>
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {bets.map(b => (
                    <button key={b} onClick={() => setBet(b)} className={`px-6 py-3 rounded-full font-black whitespace-nowrap transition-all border-2 ${bet === b ? "bg-[#B2E2F2] border-[#4FC3F7] text-[#007EA7]" : "bg-white border-blue-50 text-blue-200"}`}>
                      {b === 0 ? "🍓 Miễn phí" : `💎 ${b}k`}
                    </button>
                  ))}
                </div>

                <button onClick={findMatch} className="w-full py-6 bg-[#FFB4C2] text-white rounded-[2rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_0_#FF8FB1]">
                  GẶP BẠN MỚI 💖
                </button>
              </div>
            ) : (
              /* TRẠNG THÁI CHỜ */
              <div className="text-center py-12 space-y-6">
                <div className="relative inline-block animate-bounce-slow">
                   <div className="w-32 h-32 bg-pink-100 rounded-full flex items-center justify-center text-6xl">🍩</div>
                   <div className="absolute -top-2 -right-2 animate-spin-slow text-3xl">⭐</div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#FF8FB1]">Đang tìm bạn...</h2>
                  <p className="text-gray-400 text-sm mt-2 px-6 font-medium italic">"Chờ một xíu là có bàn ngay thui mà~"</p>
                </div>
                <button onClick={() => setWaiting(false)} className="px-8 py-3 bg-gray-100 rounded-full text-sm font-bold text-gray-400 hover:bg-gray-200 transition-all">
                  Thôi hổng chơi nữa 🍰
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={leaveRoom} className="mt-12 text-[#FFB4C2] font-black hover:text-[#FF8FB1] transition-all flex items-center gap-2">
        🏠 Về nhà thôi
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}

export default BilliardRoom;