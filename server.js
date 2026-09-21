require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");

const app = express();
const PORT = 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use(express.json({ limit: "10kb" }));
app.use(express.static("."));
app.use("/api/chat", chatLimiter);
const conversationHistories = new Map();

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;
const conversationId = req.headers["x-conversation-id"];

    if (!conversationId) {
  return res.status(400).json({
    error: "Missing conversation ID."
  });
}

if (!conversationHistories.has(conversationId)) {
  conversationHistories.set(conversationId, []);
}

const conversationHistory = conversationHistories.get(conversationId);

conversationHistory.push({
  role: "user",
  content: message
});
    const stream = await client.responses.create({
  model: "gpt-5-mini",
  instructions: "You are a helpful, friendly AI assistant. Give clear, accurate, and useful answers. Keep responses easy to understand.",
  input: conversationHistory,
  stream: true
});

let fullReply = "";

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    fullReply += event.delta;
  }
}

const reply = fullReply;
    conversationHistory.push({
  role: "assistant",
  content: reply
});

res.json({
  reply: reply
});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong."
    });
  }
});
app.post("/api/clear", (req, res) => {
  const conversationId = req.headers["x-conversation-id"];

  if (conversationId) {
    conversationHistories.delete(conversationId);
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});