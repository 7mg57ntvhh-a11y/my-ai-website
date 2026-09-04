require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("."));

let conversationHistory = [];

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

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
  conversationHistory = [];
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});