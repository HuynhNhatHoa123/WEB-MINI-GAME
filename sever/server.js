
console.log("FILE SERVER STARTED");

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors"); // THÊM DÒNG NÀY

const app = express();
const server = http.createServer(app);

// MIDDLEWARE (PHẢI CÓ)
app.use(cors()); 
app.use(express.json()); 

// ================== MONGODB ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// ================== USER MODEL (PHẢI ĐẶT TRÊN API) ==================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});

const User = mongoose.model("User", userSchema); // DI CHUYỂN LÊN ĐÂY

// ================== API ROUTES ==================


// API Xóa người dùng
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.json({ message: "Đã xóa người dùng thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa người dùng" });
  }
});

// API Cập nhật (Đổi mật khẩu / Đổi quyền)
app.put("/api/users/:id", async (req, res) => {
  try {
    const { password, role } = req.body;
    const updateData = {};
    
    // Nếu có gửi role mới thì cập nhật role
    if (role) updateData.role = role;
    
    // Nếu có gửi mật khẩu mới thì mã hóa rồi mới cập nhật
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await User.findByIdAndUpdate(req.params.id, updateData);
    res.json({ message: "Cập nhật thông tin thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi cập nhật người dùng" });
  }
});

// --- KẾT THÚC PHẦN THÊM ---




// API Đăng ký
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Thiếu thông tin!" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.json({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(400).json({ error: "Tên đăng nhập đã tồn tại hoặc lỗi hệ thống!" });
  }
});

// API Đăng nhập
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    }
    res.json({ username: user.username, role: user.role, message: "Đăng nhập thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi đăng nhập!" });
  }
});

// API Lấy danh sách user (Admin)
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách user" });
    }
});




// ================== STATIC CLIENT ==================
app.use(express.static(path.join(__dirname, "..", "client", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, ".", "client", "build", "index.html"));
});




// ================== SOCKET.IO ==================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ================== DATA ==================
let waitingUsers = [];
let werewolfRooms = {};
let waitingBilliard = []; 
let billiardTables = {
  1: { busy: false, players: [], room: null },
  2: { busy: false, players: [], room: null }
};



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
    socket.username = player.username; // Đảm bảo socket có tên
    
    // 1. Gửi trạng thái bàn hiện tại cho người mới vào để họ thấy "Live"
    socket.emit("updateTables", billiardTables);

    // 2. Tìm người có cùng trình độ và tiền cược trong hàng đợi
    const match = waitingBilliard.find(
      (p) => p.level === player.level && p.bet === player.bet
    );

    if (match) {
      // 3. Kiểm tra xem còn bàn nào trống không (Ưu tiên bàn 1)
      let assignedTable = null;
      if (!billiardTables[1].busy) assignedTable = 1;
      else if (!billiardTables[2].busy) assignedTable = 2;

      if (assignedTable) {
        const room = "billiard_" + Date.now();
        
        // Cập nhật trạng thái bàn bận
        billiardTables[assignedTable] = {
          busy: true,
          players: [match.username, player.username],
          room: room
        };

        socket.join(room);
        const partnerSocket = io.sockets.sockets.get(match.id);
        if (partnerSocket) partnerSocket.join(room);

        // Gửi thông báo match kèm SỐ BÀN cho 2 người
        io.to(match.id).emit("billiardMatched", {
          opponent: player.username,
          table: assignedTable,
          room,
        });

        socket.emit("billiardMatched", {
          opponent: match.username,
          table: assignedTable,
          room,
        });

        // Cập nhật trạng thái bàn cho TẤT CẢ mọi người (Live Status)
        io.emit("updateTables", billiardTables);

        // Xóa người chờ khỏi hàng đợi
        waitingBilliard = waitingBilliard.filter((p) => p.id !== match.id);
      } else {
        // Nếu không còn bàn trống, thông báo cho người dùng (tùy chọn)
        socket.emit("message", { user: "System", message: "Hiện tại 2 bàn đều bận, vui lòng đợi đối thủ trước đó kết thúc." });
      }
    } else {
      // Đưa vào hàng đợi nếu chưa có ai khớp
      waitingBilliard.push({
        id: socket.id,
        username: player.username,
        level: player.level,
        bet: player.bet,
      });
      // Gửi trạng thái bàn cho người đang chờ để họ nhìn thấy live
      io.emit("updateTables", billiardTables);
    }
  });

  // MỚI: Xử lý khi người chơi ấn nút "KẾT THÚC"
  socket.on("finishBilliard", ({ table }) => {
    if (billiardTables[table]) {
      const room = billiardTables[table].room;
      
      // Giải phóng bàn
      billiardTables[table] = { busy: false, players: [], room: null };
      
      // Thông báo cho người trong room đó thoát ra
      io.to(room).emit("billiardLeave");
      
      // Cập nhật trạng thái "Bàn Trống" cho toàn server thấy
      io.emit("updateTables", billiardTables);
      
      console.log(`Bàn ${table} đã được giải phóng.`);
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
  // ===== DISCONNECT (FULL CLEANUP) =====
  socket.on("disconnect", () => {
    const disconnectedUser = socket.username || "Unknown";
    console.log(`🔴 User disconnected: ${disconnectedUser} (${socket.id})`);

    // 1. BILLIARD CLEANUP (Quan trọng nhất cho yêu cầu của bạn)
    // Kiểm tra xem người vừa thoát có đang ngồi ở bàn 1 hay bàn 2 không
    Object.keys(billiardTables).forEach((tableNum) => {
      const table = billiardTables[tableNum];
      if (table.players.includes(disconnectedUser)) {
        console.log(`🎱 Giải phóng Bàn ${tableNum} do ${disconnectedUser} thoát.`);
        
        // Thông báo cho người còn lại trong bàn (nếu có) rằng đối thủ đã thoát
        if (table.room) {
          io.to(table.room).emit("billiardLeave");
        }

        // Đặt trạng thái bàn về trống
        billiardTables[tableNum] = { busy: false, players: [], room: null };
        
        // Cập nhật Live Status cho tất cả người khác thấy bàn đã trống
        io.emit("updateTables", billiardTables);
      }
    });

    // Xóa khỏi hàng đợi tìm trận Billiard (nếu đang chờ)
    waitingBilliard = waitingBilliard.filter((p) => p.id !== socket.id);


    // 2. WEREWOLF CLEANUP
    Object.keys(werewolfRooms).forEach((roomID) => {
      // Xóa user khỏi danh sách trong bộ nhớ
      werewolfRooms[roomID].users = werewolfRooms[roomID].users.filter(
        (u) => u.id !== socket.id
      );

      const usersInRoom = getRoomUsersData(roomID);
      const usernamesOnly = usersInRoom.map((u) => u.username);

      // Cập nhật trạng thái phòng Ma Sói cho những người còn lại
      io.to(roomID).emit("updateRoomStatus", {
        roomID,
        currentCount: usernamesOnly.length,
        users: usernamesOnly,
      });

      // Nếu phòng không còn ai, xóa phòng để tiết kiệm RAM
      if (usernamesOnly.length === 0) {
        delete werewolfRooms[roomID];
      }
    });


    // 3. GLOBAL CHAT CLEANUP
    // Cập nhật danh sách online ở sảnh chung
    const globalUsers = getRoomUsersData("global_room");
    io.to("global_room").emit("globalUsers", globalUsers);


    // 4. RANDOM CHAT CLEANUP
    // Xóa khỏi danh sách chờ Chat người lạ
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
  });

});
// ================== RUN SERVER ==================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
//hi toi da fix mot so thu 