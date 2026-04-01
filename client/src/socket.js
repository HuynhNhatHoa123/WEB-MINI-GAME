import { io } from "socket.io-client";

// Khi để trống hoặc dùng window.location.origin, 
// Socket sẽ tự tìm đến địa chỉ của trang web hiện tại
const socket = io(); 

export default socket;