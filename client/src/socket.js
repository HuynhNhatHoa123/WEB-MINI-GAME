import { io } from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === "production"
    ? undefined
    : "http://localhost:5000"
);

export default socket;
//ten nguoi dung mongodb huynhnhathoa22   pass : KIkOEJjUnw7qnq9i


//IP Access List


// Description


// 58.187.191.72/32


// Created as part of the Auto Setup process
