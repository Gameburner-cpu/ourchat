const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// adjust this line so it points to mini-whatsapp-server/public
app.use(express.static("mini-whatsapp-server/public"));

const ALLOWED_USERS = ["you", "friend"];
const ROOM_ID = "private-room";

io.on("connection", (socket) => {
  console.log("connected", socket.id);

  socket.on("join", (username, cb) => {
    if (!ALLOWED_USERS.includes(username)) {
      cb && cb({ ok: false, error: "Not allowed" });
      return;
    }
    socket.data.username = username;
    socket.join(ROOM_ID);
    cb && cb({ ok: true });
  });

  socket.on("chat-message", (text) => {
    if (!socket.data.username) return;
    const payload = {
      from: socket.data.username,
      text,
      ts: Date.now()
    };
    io.to(ROOM_ID).emit("chat-message", payload);
  });

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
