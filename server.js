const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // later: restrict to your Netlify URL
    methods: ["GET", "POST"]
  }
});

// store allowed users in lowercase for easier comparison
const ALLOWED_USERS = ["mohith", "dimple"];
const ROOM_ID = "private-room";

app.get("/", (req, res) => {
  res.send("Socket server running");
});

io.on("connection", (socket) => {
  console.log("connected", socket.id);

  socket.on("join", (username, cb) => {
    const clean = (username || "").trim().toLowerCase();
    console.log("join request:", clean);

    if (!ALLOWED_USERS.includes(clean)) {
      cb && cb({ ok: false, error: "Not allowed" });
      return;
    }

    socket.data.username = clean; // store lowercase username
    socket.join(ROOM_ID);
    cb && cb({ ok: true });
  });

  socket.on("chat-message", (text) => {
    if (!socket.data.username) return;

    const payload = {
      from: socket.data.username, // "mohith" or "dimple"
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
  console.log("Server running on port " + PORT);
});
