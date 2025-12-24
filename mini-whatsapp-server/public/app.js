// Connect to remote Socket.IO backend (Render)
const socket = io("https://ourchat-background.onrender.com", {
  transports: ["websocket", "polling"],
});

// STRICT username selection - NO lowercase conversion until validated
let username = localStorage.getItem("miniwhatsapp-username");
if (!username) {
  while (true) {
    username = prompt("Enter EXACTLY: Mohith OR Dimple");
    if (!username) continue;
    username = username.trim();
    if (
      username.toLowerCase() === "mohith" ||
      username.toLowerCase() === "dimple"
    ) {
      break;
    }
    alert("ONLY Mohith or Dimple allowed!");
  }
  localStorage.setItem("miniwhatsapp-username", username);
}

// NOW normalize to match server ("mohith" / "dimple")
username = username.toLowerCase();
console.log("FINAL username:", username); // DEBUG

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
// msg: { from, text, ts }
function appendMessage({ from, text, ts }, pushToArray = true) {
  const isMe = from === username;
  console.log("appendMessage DEBUG => from:", from, "username:", username, "isMe:", isMe); // DEBUG

  const wrapper = document.createElement("div");
  wrapper.className = "msg " + (isMe ? "msg-right" : "msg-left");

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  // include debug info inside the bubble so you can see it on phone
  bubble.innerHTML = `
    <div style="font-size:10px;color:#888;">
      from: ${from} | username: ${username} | ${isMe ? "ME" : "OTHER"}
    </div>
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
    // clear invalid username and force re-prompt
    localStorage.removeItem("miniwhatsapp-username");
    location.reload();
  }
  console.log("Joined as:", username); // DEBUG
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
  console.log("Received msg:", msg); // DEBUG: See from value
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
