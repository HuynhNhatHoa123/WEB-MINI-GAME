console.log("FILE SERVER STARTED");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ================== DATA ==================
let waitingUsers = [];       // chat random (Giữ nguyên)
let waitingBilliard = [];    // billiard (Giữ nguyên)
let werewolfRooms = {};      // DATA MỚI: Quản lý các phòng Ma Sói 10 người

// Hàm tiện ích hỗ trợ lấy danh sách User (Dùng cho cả Global và Werewolf)
const getRoomUsersData = (roomName) => {
  const clients = io.sockets.adapter.rooms.get(roomName) || new Set();
  return Array.from(clients).map(id => {
    const s = io.sockets.sockets.get(id);
    return { id, username: s?.username || "Unknown" };
  });
};

// ================== SOCKET ==================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ================== JOIN (Giữ nguyên) ==================
  socket.on("join", (username) => {
    socket.username = username;
    console.log("User name:", username);
  });

  // ================== RANDOM CHAT (Giữ nguyên) ==================
  socket.on("joinRandom", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.pop();
      const room = "room_" + Date.now();
      socket.join(room);
      partner.join(room);
      console.log("Matched Chat:", socket.username, partner.username);
      io.to(room).emit("matched", {
        room: room,
        users: [socket.username, partner.username]
      });
    } else {
      waitingUsers.push(socket);
      console.log(socket.username + " waiting for chat");
    }
  });

  // ================== CHAT MESSAGE (Giữ nguyên) ==================
  socket.on("message", ({ room, user, message }) => {
    io.to(room).emit("message", { user, message });
  });

  // ================== 🎱 BILLIARD (Giữ nguyên) ==================
  socket.on("findBilliard", (player) => {
    console.log("🎱 Tìm billiard:", player);
    const match = waitingBilliard.find((p) => p.level === player.level && p.bet === player.bet);
    if (match) {
      console.log("🎱 MATCH:", player.username, match.username);
      const room = "billiard_" + Date.now();
      socket.join(room);
      io.sockets.sockets.get(match.id)?.join(room);
      io.to(match.id).emit("billiardMatched", { opponent: player.username, room });
      socket.emit("billiardMatched", { opponent: match.username, room });
      waitingBilliard = waitingBilliard.filter((p) => p.id !== match.id);
    } else {
      waitingBilliard.push({ id: socket.id, username: player.username, level: player.level, bet: player.bet });
      console.log("🎱 Đang chờ:", player.username);
    }
  });

  // ================== 🌍 GLOBAL CHAT (Bổ sung mới) ==================
  socket.on("joinGlobal", (username) => {
    socket.username = username;
    socket.join("global_room");

    const users = getRoomUsersData("global_room");
    io.to("global_room").emit("globalUsers", users);
    io.to("global_room").emit("globalMessage", {
      user: "System",
      message: `${username} đã tham gia Global Chat`
    });
  });

  socket.on("globalMessage", ({ user, message }) => {
    io.to("global_room").emit("globalMessage", { user, message });
  });

  socket.on("leaveGlobal", () => {
    socket.leave("global_room");
    const users = getRoomUsersData("global_room");
    io.to("global_room").emit("globalUsers", users);
  });

  // ================== 🐺 WEREWOLF ROOM - 10 NGƯỜI (Bổ sung mới) ==================
  socket.on("joinWerewolfRoom", ({ username }) => {
    socket.username = username;

    // Tìm phòng chưa đủ 10 người
    let targetRoom = Object.keys(werewolfRooms).find(
      (id) => werewolfRooms[id].users.length < 10
    );

    // Nếu không có phòng nào trống, tạo phòng mới
    if (!targetRoom) {
      targetRoom = "werewolf_" + Date.now();
      werewolfRooms[targetRoom] = { users: [] };
    }

    socket.join(targetRoom);
    werewolfRooms[targetRoom].users.push({ id: socket.id, username });

    const usersInRoom = getRoomUsersData(targetRoom);
    const usernamesOnly = usersInRoom.map(u => u.username);

    // Gửi cho người mới vào
    socket.emit("roomJoined", {
      roomID: targetRoom,
      currentCount: usernamesOnly.length,
      users: usernamesOnly
    });

    // Cập nhật cho cả phòng
    io.to(targetRoom).emit("updateRoomStatus", {
      roomID: targetRoom,
      currentCount: usernamesOnly.length,
      users: usernamesOnly
    });

    io.to(targetRoom).emit("groupMessage", {
      user: "System",
      message: `${username} đã vào bàn.`
    });
  });

  socket.on("sendGroupMessage", ({ roomID, user, message }) => {
    io.to(roomID).emit("groupMessage", { user, message });
  });

  socket.on("leaveWerewolfRoom", ({ roomID }) => {
    if (!roomID) return;
    socket.leave(roomID);
    
    if (werewolfRooms[roomID]) {
      werewolfRooms[roomID].users = werewolfRooms[roomID].users.filter(u => u.id !== socket.id);
      const usersInRoom = getRoomUsersData(roomID);
      const usernamesOnly = usersInRoom.map(u => u.username);

      io.to(roomID).emit("updateRoomStatus", {
        roomID,
        currentCount: usernamesOnly.length,
        users: usernamesOnly
      });

      if (usernamesOnly.length === 0) delete werewolfRooms[roomID];
    }
  });

  // ================== LEAVE ROOM (Giữ nguyên) ==================
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    io.to(room).emit("billiardLeave");
  });

  // ================== DISCONNECT (Cập nhật để dọn dẹp thêm Ma Sói & Global) ==================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // 1. Dọn dẹp Ma Sói
    Object.keys(werewolfRooms).forEach(roomID => {
      werewolfRooms[roomID].users = werewolfRooms[roomID].users.filter(u => u.id !== socket.id);
      const usersInRoom = getRoomUsersData(roomID);
      io.to(roomID).emit("updateRoomStatus", {
        roomID,
        currentCount: usersInRoom.length,
        users: usersInRoom.map(u => u.username)
      });
      if (usersInRoom.length === 0) delete werewolfRooms[roomID];
    });

    // 2. Dọn dẹp Global
    const globalUsers = getRoomUsersData("global_room");
    io.to("global_room").emit("globalUsers", globalUsers);

    // 3. Dọn dẹp Random Chat (Giữ nguyên)
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);

    // 4. Dọn dẹp Billiard (Giữ nguyên)
    waitingBilliard = waitingBilliard.filter(p => p.id !== socket.id);
  });

});

// ================== RUN (Giữ nguyên) ==================
server.listen(5000, () => {
  console.log("Server running on 5000");
});