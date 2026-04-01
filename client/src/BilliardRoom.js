import React, { useEffect, useState } from "react";
import socket from "./socket";

function BilliardRoom({ username, leaveRoom }) {
  const levels = ["H-", "H", "H+", "G", "F", "E"];
  const bets = [0, 10, 20, 50, 100];

  const [level, setLevel] = useState("H-");
  const [bet, setBet] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [opponent, setOpponent] = useState(null);

  useEffect(() => {
    // 🎯 MATCH
    const handleMatched = (data) => {
      setWaiting(false);
      setOpponent(data.opponent);
    };

    // ❌ đối thủ thoát
    const handleLeave = () => {
      setOpponent(null);
      setWaiting(false);
    };

    socket.on("billiardMatched", handleMatched);
    socket.on("billiardLeave", handleLeave);

    return () => {
      socket.off("billiardMatched", handleMatched);
      socket.off("billiardLeave", handleLeave);
    };
  }, []);

  const findMatch = () => {
    socket.emit("findBilliard", {
      username,
      level,
      bet,
    });
    setWaiting(true);
  };

  // 🎯 UI LEVEL COLOR
  const levelColor = {
    "H-": "bg-gray-400",
    "H": "bg-green-500",
    "H+": "bg-blue-500",
    "G": "bg-purple-500",
    "F": "bg-yellow-500 text-black",
    "E": "bg-red-500",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-2xl text-black">

        <h1 className="text-3xl font-bold text-center mb-6">
          🎱 Billiards Room
        </h1>

        {/* 🟢 LOBBY */}
        {!waiting && !opponent && (
          <>
            {/* LEVEL */}
            <div className="mb-6">
              <p className="font-bold mb-2">🎯 Chọn trình:</p>
              <div className="flex gap-2 flex-wrap">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`px-4 py-2 rounded-lg text-white font-bold ${
                      level === lvl
                        ? levelColor[lvl]
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* BET */}
            <div className="mb-6">
              <p className="font-bold mb-2">💰 Chọn cược:</p>
              <div className="flex gap-2 flex-wrap">
                {bets.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBet(b)}
                    className={`px-4 py-2 rounded-lg font-bold ${
                      bet === b
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {b === 0 ? "Free" : `${b}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* BUTTON */}
            <button
              onClick={findMatch}
              className="w-full p-3 bg-black text-white rounded-xl font-bold hover:scale-105 transition"
            >
              🎯 Tìm đối thủ
            </button>
          </>
        )}

        {/* 🟡 WAITING */}
        {waiting && !opponent && (
          <div className="text-center mt-6">
            <p className="text-xl animate-pulse">🔍 Đang tìm đối thủ...</p>
            <p className="mt-2">
              🎯 {level} | 💰 {bet === 0 ? "Free" : `${bet}k`}
            </p>
          </div>
        )}

        {/* 🔴 MATCHED */}
        {opponent && (
          <div className="text-center mt-6">
            <h2 className="text-2xl mb-4">🔥 Match thành công!</h2>
            <p>👤 Bạn: {username}</p>
            <p>⚔️ Đối thủ: {opponent}</p>
            <p className="mt-2 text-yellow-500 font-bold">
              🎯 {level} | 💰 {bet === 0 ? "Free" : `${bet}k`}
            </p>
          </div>
        )}

        {/* BACK */}
        <button
          onClick={leaveRoom}
          className="mt-6 w-full p-2 bg-red-500 text-white rounded-lg"
        >
          ❌ Thoát
        </button>

      </div>
    </div>
  );
}

export default BilliardRoom;