import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parser with generous limit for photos (up to 25MB)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString()
    });
  });

  // ChatWork API Proxy Endpoints (enables mobile Safari without CORS issues)

  // 1. GET /api/chatwork/rooms
  app.get("/api/chatwork/rooms", async (req, res) => {
    const token = (req.headers["x-chatworktoken"] as string) || (req.headers["x-chatwork-token"] as string);
    if (!token) {
      return res.status(401).json({ errors: ["ChatWork APIトークンが指定されていません"] });
    }

    try {
      const cwRes = await fetch("https://api.chatwork.com/v2/rooms", {
        headers: {
          "X-ChatWorkToken": token
        }
      });
      const data = await cwRes.json();
      return res.status(cwRes.status).json(data);
    } catch (err: any) {
      console.error("ChatWork rooms proxy error:", err);
      return res.status(502).json({ errors: [`ChatWork API通信エラー: ${err.message}`] });
    }
  });

  // 2. POST /api/chatwork/messages
  app.post("/api/chatwork/messages", async (req, res) => {
    const token = (req.headers["x-chatworktoken"] as string) || (req.headers["x-chatwork-token"] as string);
    if (!token) {
      return res.status(401).json({ errors: ["ChatWork APIトークンが指定されていません"] });
    }

    const { roomId, message } = req.body;
    if (!roomId) {
      return res.status(400).json({ errors: ["送信先ルームIDが指定されていません"] });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ errors: ["メッセージ本文を入力してください"] });
    }

    try {
      const params = new URLSearchParams();
      params.append("body", message.trim());

      const cwRes = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "X-ChatWorkToken": token,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const data = await cwRes.json();
      return res.status(cwRes.status).json(data);
    } catch (err: any) {
      console.error("ChatWork message proxy error:", err);
      return res.status(502).json({ errors: [`ChatWork API通信エラー: ${err.message}`] });
    }
  });

  // 3. POST /api/chatwork/files (for iPhone camera photos and attachments)
  app.post("/api/chatwork/files", async (req, res) => {
    const token = (req.headers["x-chatworktoken"] as string) || (req.headers["x-chatwork-token"] as string);
    if (!token) {
      return res.status(401).json({ errors: ["ChatWork APIトークンが指定されていません"] });
    }

    const { roomId, fileName, fileType, fileBase64, message } = req.body;
    if (!roomId) {
      return res.status(400).json({ errors: ["送信先ルームIDが指定されていません"] });
    }
    if (!fileBase64) {
      return res.status(400).json({ errors: ["添付ファイルデータが存在しません"] });
    }

    try {
      // Decode base64 to binary buffer
      const buffer = Buffer.from(fileBase64, "base64");
      const blob = new Blob([buffer], { type: fileType || "image/jpeg" });

      const formData = new FormData();
      formData.append("file", blob, fileName || "photo.jpg");
      if (message && message.trim()) {
        formData.append("message", message.trim());
      }

      const cwRes = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/files`, {
        method: "POST",
        headers: {
          "X-ChatWorkToken": token
        },
        body: formData
      });
      const data = await cwRes.json();
      return res.status(cwRes.status).json(data);
    } catch (err: any) {
      console.error("ChatWork files proxy error:", err);
      return res.status(502).json({ errors: [`ChatWork APIファイル送信エラー: ${err.message}`] });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
