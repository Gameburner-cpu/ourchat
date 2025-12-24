// Connect to remote Socket.IO backend (Render)
const socket = io("https://ourchat-background.onrender.com", {
  transports: ["websocket", "polling"],
});

// Simple username selection (only "you" or "friend" allowed on server)
let username = localStorage.getItem("miniwhatsapp-username");
if (!username) {
  username = prompt("Enter username (you / friend)");
  localStorage.setItem("miniwhatsapp-username", username);
}

// Join the private room
socket.emit("join", username, (res) => {
  if (!res.ok) {
    alert("Access denied: " + res.error);
  }
});

// DOM references
const chatBody = document.querySelector(".chat-body");
const input = document.querySelector(".chat-input");
const sendBtn = document.querySelector(".send-btn");

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Append a message bubble
function appendMessage({ from, text, ts }) {
  const isMe = from === username;

  const wrapper = document.createElement("div");
  wrapper.className = "msg " + (isMe ? "msg-right" : "msg-left");

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  bubble.innerHTML = `
    ${text}
    <span class="msg-time">${formatTime(ts)}</span>
  `;

  wrapper.appendChild(bubble);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Send message to server
function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  socket.emit("chat-message", text);
  input.value = "";
}

// UI events
sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Receive messages from server
socket.on("chat-message", (msg) => {
  appendMessage(msg);
});
