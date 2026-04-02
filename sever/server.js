console.log("FILE SERVER STARTED");

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);

// ================== MONGODB ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB error:", err);
  });

// ================== STATIC CLIENT ==================
app.use(express.static(path.join(__dirname, "..", "client", "build")));

app.get("/:path*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

// ================== SOCKET.IO ==================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ================== DATA ==================
let waitingUsers = [];
let waitingBilliard = [];
let werewolfRooms = {};

// Hàm lấy danh sách user trong room
const getRoomUsersData = (roomName) => {
  const clients = io.sockets.adapter.rooms.get(roomName) || new Set();

  return Array.from(clients).map((id) => {
    const s = io.sockets.sockets.get(id);
    return {
      id,
      username: s?.username || "Unknown",
    };
  });
};

// ================== SOCKET EVENTS ==================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ===== JOIN =====
  socket.on("join", (username) => {
    socket.username = username;
    console.log("User name:", username);
  });

  // ===== RANDOM CHAT =====
  socket.on("joinRandom", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.pop();
      const room = "room_" + Date.now();

      socket.join(room);
      partner.join(room);

      console.log("Matched Chat:", socket.username, partner.username);

      io.to(room).emit("matched", {
        room,
        users: [socket.username, partner.username],
      });
    } else {
      waitingUsers.push(socket);
      console.log(socket.username + " waiting for chat");
    }
  });

  socket.on("message", ({ room, user, message }) => {
    io.to(room).emit("message", { user, message });
  });

  // ===== BILLIARD =====
  socket.on("findBilliard", (player) => {
    console.log("🎱 Tìm billiard:", player);

    const match = waitingBilliard.find(
      (p) => p.level === player.level && p.bet === player.bet
    );

    if (match) {
      console.log("🎱 MATCH:", player.username, match.username);

      const room = "billiard_" + Date.now();

      socket.join(room);
      io.sockets.sockets.get(match.id)?.join(room);

      io.to(match.id).emit("billiardMatched", {
        opponent: player.username,
        room,
      });

      socket.emit("billiardMatched", {
        opponent: match.username,
        room,
      });

      waitingBilliard = waitingBilliard.filter((p) => p.id !== match.id);
    } else {
      waitingBilliard.push({
        id: socket.id,
        username: player.username,
        level: player.level,
        bet: player.bet,
      });

      console.log("🎱 Đang chờ:", player.username);
    }
  });

  // ===== GLOBAL CHAT =====
  socket.on("joinGlobal", (username) => {
    socket.username = username;
    socket.join("global_room");

    const users = getRoomUsersData("global_room");

    io.to("global_room").emit("globalUsers", users);

    io.to("global_room").emit("globalMessage", {
      user: "System",
      message: `${username} đã tham gia Global Chat`,
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

  // ===== WEREWOLF =====
  socket.on("joinWerewolfRoom", ({ username }) => {
    socket.username = username;

    let targetRoom = Object.keys(werewolfRooms).find(
      (id) => werewolfRooms[id].users.length < 10
    );

    if (!targetRoom) {
      targetRoom = "werewolf_" + Date.now();
      werewolfRooms[targetRoom] = { users: [] };
    }

    socket.join(targetRoom);

    werewolfRooms[targetRoom].users.push({
      id: socket.id,
      username,
    });

    const usersInRoom = getRoomUsersData(targetRoom);
    const usernamesOnly = usersInRoom.map((u) => u.username);

    socket.emit("roomJoined", {
      roomID: targetRoom,
      currentCount: usernamesOnly.length,
      users: usernamesOnly,
    });

    io.to(targetRoom).emit("updateRoomStatus", {
      roomID: targetRoom,
      currentCount: usernamesOnly.length,
      users: usernamesOnly,
    });

    io.to(targetRoom).emit("groupMessage", {
      user: "System",
      message: `${username} đã vào bàn.`,
    });
  });

  socket.on("sendGroupMessage", ({ roomID, user, message }) => {
    io.to(roomID).emit("groupMessage", { user, message });
  });

  socket.on("leaveWerewolfRoom", ({ roomID }) => {
    if (!roomID) return;

    socket.leave(roomID);

    if (werewolfRooms[roomID]) {
      werewolfRooms[roomID].users = werewolfRooms[roomID].users.filter(
        (u) => u.id !== socket.id
      );

      const usersInRoom = getRoomUsersData(roomID);
      const usernamesOnly = usersInRoom.map((u) => u.username);

      io.to(roomID).emit("updateRoomStatus", {
        roomID,
        currentCount: usernamesOnly.length,
        users: usernamesOnly,
      });

      if (usernamesOnly.length === 0) {
        delete werewolfRooms[roomID];
      }
    }
  });

  // ===== LEAVE ROOM =====
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    io.to(room).emit("billiardLeave");
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Werewolf cleanup
    Object.keys(werewolfRooms).forEach((roomID) => {
      werewolfRooms[roomID].users = werewolfRooms[roomID].users.filter(
        (u) => u.id !== socket.id
      );

      const usersInRoom = getRoomUsersData(roomID);

      io.to(roomID).emit("updateRoomStatus", {
        roomID,
        currentCount: usersInRoom.length,
        users: usersInRoom.map((u) => u.username),
      });

      if (usersInRoom.length === 0) {
        delete werewolfRooms[roomID];
      }
    });

    // Global cleanup
    const globalUsers = getRoomUsersData("global_room");
    io.to("global_room").emit("globalUsers", globalUsers);

    // Random cleanup
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);

    // Billiard cleanup
    waitingBilliard = waitingBilliard.filter((p) => p.id !== socket.id);
  });
});

// ================== RUN SERVER ==================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});