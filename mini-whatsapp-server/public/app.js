// Connect to remote Socket.IO backend (Render)
const socket = io("https://ourchat-background.onrender.com", {
  transports: ["websocket", "polling"],
});

// Simple username selection (only "Mohith" or "Dimple" allowed on server)
let username = localStorage.getItem("miniwhatsapp-username");
if (!username) {
  username = prompt("Enter username (Mohith / Dimple)");
  localStorage.setItem("miniwhatsapp-username", username);
}

// Storage key for this device
const STORAGE_KEY = "miniwhatsapp-messages";

// DOM references
const chatBody = document.querySelector(".chat-body");
const input = document.querySelector(".chat-input");
const sendBtn = document.querySelector(".send-btn");

// In-memory message list
let messages = [];

// Load messages from localStorage on startup
function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    messages = parsed;
    messages.forEach((msg) => appendMessage(msg, false));
  } catch (e) {
    console.error("Failed to load messages", e);
  }
}

// Save messages to localStorage
function saveMessages() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save messages", e);
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Append a message bubble
function appendMessage({ from, text, ts }, pushToArray = true) {
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

  if (pushToArray) {
    messages.push({ from, text, ts });
    saveMessages();
  }
}

// Join the private room
socket.emit("join", username, (res) => {
  if (!res.ok) {
    alert("Access denied: " + res.error);
  }
});

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
  appendMessage(msg, true);
});

// Initial load of history
loadMessages();

// Register service worker for PWA install / offline shell
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("SW registration failed", err));
  });
}
socket.emit("join", username, (res) => {
  if (!res.ok) {
    alert("Access denied: " + res.error);
    localStorage.removeItem("miniwhatsapp-username");
    location.reload();
  }
});
  
function renderTicks(status) {
  if (status === "sent") return "✓";
  if (status === "delivered") return "✓✓";
  if (status === "read") return "✓✓";
  return "";
}
bubble.innerHTML = `
  ${text}
  <span class="msg-time">
    ${formatTime(ts)} <span class="ticks ticks-${status}">${renderTicks(status)}</span>
  </span>
`;
socket.on("chat-message", (msg) => {
  msg.status = msg.from === username ? "sent" : "delivered";
  appendMessage(msg, true);
});

socket.on("message-delivered", ({ id }) => {
  updateMessageStatus(id, "delivered");
});

socket.on("message-read", ({ id }) => {
  updateMessageStatus(id, "read");
});
