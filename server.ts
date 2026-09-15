import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Fallback demo response for overseas shipping fulfillment
function getOverseasShippingMockResponse(scenarioHint?: string, additionalNotes?: string) {
  const isAddress = scenarioHint?.includes("住所") || scenarioHint?.includes("要確認");
  const isDelay = scenarioHint?.includes("遅延") || scenarioHint?.includes("追跡");
  const isCustoms = scenarioHint?.includes("関税") || scenarioHint?.includes("インボイス");
  
  if (isAddress) {
    return {
      summary: "【ECクライアントからの相談】アメリカ宛て海外配送注文の受取人住所・電話番号に不備の疑いがあり、出荷可否の確認依頼",
      clientName: "ECストアご担当者様",
      urgency: "至急",
      keyPoints: [
        "海外配送キャリア（FedEx/DHL/EMS）は私書箱（P.O.Box）への配送不可、現地受取人電話番号が必須",
        "英字表記の番地（Street Number / Apt / Suite）の欠落があると現地税関で返送リスクが発生",
        "住所修正完了まで一時出荷保留（Hold）とし、返送費用発生を防止"
      ],
      candidates: [
        {
          id: "cand-address-1",
          label: "① 丁寧・標準案（保留理由と不足箇所の明確化）",
          tone: "丁寧・詳細",
          message: `[info][title]【要確認】お届け先住所（海外）の不備・出荷保留のご連絡[/title]いつも大変お世話になっております。発送代行の出荷管理担当です。

ご依頼いただきました海外発送分につきまして、お届け先住所を確認いたしましたところ、番地および受取人様電話番号の記載が不足している可能性がございます。

【対象注文】: [注文番号 / お客様名]
【配送先国】: アメリカ合衆国 (USA)
【確認事項】:
1. 建物名・部屋番号（Apt / Suite No.）の有無
2. 現地受取人様のお電話番号（キャリア通関時に必須）

海外配送（FedEx/DHL/EMS）では住所不備による現地返送（往復送料・返送料はお客様負担）が発生しやすいため、万全を期して一時【出荷保留】とさせていただいております。
修正後の英語住所が分かり次第ご返信いただけましたら、本日便にて優先出荷いたします。[/info]`,
          explanation: "海外発送で最も多い住所不備トラブルに対し、返送コストリスクを回避しつつ迅速に修正情報を引き出す標準返信です。"
        },
        {
          id: "cand-address-2",
          label: "② 迅速了解案（取り急ぎ保留完了と連絡待ち）",
          tone: "迅速・簡潔",
          message: `ご確認ありがとうございます。承知いたしました。
海外宛先住所の確認が必要なため、対象のお荷物は一時出荷保留（Hold）として保管棚にて安全に確保しております。
修正後の英字住所および受取人様TELをいただき次第、直ちに出荷手続きを再開いたします。よろしくお願いいたします。`,
          explanation: "まずは作業着手と誤発送ストップを相手に知らせるための即時了解メッセージです。"
        },
        {
          id: "cand-address-3",
          label: "③ 選択肢提示案（キャリア変更・補正依頼）",
          tone: "提案・フォロー",
          message: `[info][title]お届け先住所の確認および配送キャリアのご相談[/title]お疲れ様です。発送代行窓口です。
先ほど確認いたしました配送先住所についてですが、番地表記の一部が抜けているため、配送キャリアの自動通関チェックでエラーが出ております。

つきましては、下記いずれかの対応をご指示いただけますでしょうか。
A: エンドユーザー様に英語住所の再確認を行い、分かり次第ご連絡
B: ご登録情報のまま出荷強行（※現地返送料発生リスクあり）

可能な限り本日便に間に合わせますので、ご指示のほど何卒よろしくお願いいたします。[/info]`,
          explanation: "クライアントの判断を仰ぎつつ、代行業者としての免責とリスクヘッジを丁寧に行う返信案です。"
        }
      ]
    };
  }

  // Default general overseas shipping fulfillment response
  return {
    summary: `【ECクライアントからの相談】${scenarioHint || "海外発送・出荷進捗および梱包に関するお問い合わせ"} (${additionalNotes || "至急確認・発送希望"})`,
    clientName: "ECストアご担当者様",
    urgency: "通常",
    keyPoints: [
      "海外輸送に耐えうる多層緩衝材（気泡緩衝材＋厚手ダンボール）での安全梱包を実施",
      "インボイス（Commercial Invoice）とHSコードの適正申告により現地通関トラブルを防止",
      "集荷完了後に追跡番号（Tracking No.）を速やかに共有"
    ],
    candidates: [
      {
        id: "cand-general-1",
        label: "① 丁寧・標準案（インボイス・追跡番号・梱包完了報告）",
        tone: "丁寧・安心感",
        message: `[info][title]海外発送手配・出荷作業完了のご報告[/title]いつも大変お世話になっております。海外発送代行の出荷オペレーション担当です。

ご指示いただきました商品につきまして、本日無事に出荷手配が完了いたしましたのでご報告申し上げます。

【出荷詳細】
・配送キャリア: FedEx Priority（国際優先便）
・追跡番号: [追跡番号: 7890-XXXX-XXXX]
・荷姿: 二重カートン補強梱包（エアパッキン多層巻き）
・インボイス申告額: [申告金額: $XXX.XX]

海外輸送時の衝撃や通関審査を考慮し、規定どおり丁寧に厳重梱包を施して発送いたしました。
現地キャリアの集荷スキャンが完了次第、追跡画面にて配送ステータスがご確認いただけます。
引き続きよろしくお願いいたします。[/info]`,
        explanation: "海外発送代行業のプロとして、梱包品質やインボイス申告、追跡番号まで網羅した完璧な業務報告フォーマットです。"
      },
      {
        id: "cand-general-2",
        label: "② 迅速・了解案（即時着手・進行連絡）",
        tone: "迅速・スピーディ",
        message: `ご連絡ありがとうございます！内容確認いたしました。
担当ピッキングスタッフへ共有し、至急梱包および海外インボイス作成に着手しております。
本日夕方の集荷便に間に合うよう手配を進め、追跡番号が発行され次第改めてご案内いたします。`,
        explanation: "依頼が到着した直後に「確認済み・本日便で動いている」ことを伝え、ECクライアントを即座に安心させる返信です。"
      },
      {
        id: "cand-general-3",
        label: "③ 詳細ヒアリング・確認依頼案（通関・品名確認）",
        tone: "確認・相談",
        message: `[info][title]【ご確認】インボイス記載品名および海外通関申告について[/title]お世話になっております。海外発送担当です。

出荷指示をいただきました商品につきまして、現地税関での関税審査および没収リスクを回避するため、念のため下記2点をご確認させていただけますでしょうか。

1. 英語品名・材質表記: [商品名] の詳細表記
2. リチウムイオン電池内蔵の有無（航空危険物申告区分）

確認が取れ次第、速やかにインボイスを発行し本日集荷便に乗せられるよう準備してお待ちしております。お手数をおかけしますがよろしくお願いいたします。[/info]`,
        explanation: "越境ECで頻発する税関差し止めや航空危険物規制を未然に防ぐための確認依頼メッセージです。"
      }
    ]
  };
}

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
      timestamp: new Date().toISOString(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // 4. POST /api/ai/analyze-screenshot-and-reply
  // Gemini 3.8 Flash Multimodal OCR + Overseas Shipping Fulfillment Reply Generator
  app.post("/api/ai/analyze-screenshot-and-reply", async (req, res) => {
    const { imageBase64, imageType, scenarioHint, additionalNotes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "スクリーンショット画像データが送信されていません" });
    }

    const ai = getGeminiClient();

    // If Gemini API key is not configured or in case of demo mode, return domain-rich mock
    if (!ai) {
      console.log("GEMINI_API_KEY not set, using specialized overseas shipping fulfillment response.");
      const mockResult = getOverseasShippingMockResponse(scenarioHint, additionalNotes);
      return res.json({
        ...mockResult,
        isAIGenerated: false,
        notice: "※ GEMINI_API_KEY未設定のため、海外発送代行シミュレーション応答を表示しています。"
      });
    }

    try {
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const prompt = `この画像はお客様（当社に海外発送代行・越境ECフルフィルメントを委託しているEC事業者様・セラー様）からChatWork等の連絡ツールで届いたメッセージや注文相談のスクリーンショットです。
画像を読み取り、内容を分析した上で、海外発送代行業者としての最適な返信文案を作成してください。
${scenarioHint ? `【選択されたシーン】: ${scenarioHint}` : ''}
${additionalNotes ? `【担当者メモ・指示】: ${additionalNotes}` : ''}`;

      // Candidate models for graceful fallback if one model experiences high demand (503 / 429)
      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite"
      ];

      let parsedData: any = null;
      let usedModel = candidateModels[0];
      let lastErr: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: imageType || "image/jpeg",
                      data: cleanBase64
                    }
                  },
                  {
                    text: prompt
                  }
                ]
              }
            ],
            config: {
              systemInstruction: `あなたは海外発送（越境EC物流・国際配送フルフィルメント）を専門に行う発送代行会社のカスタマーサクセス・出荷オペレーション責任者です。
クライアントは自社ECサイト、Shopify、eBay、Amazon、BASE等で物販を行い、商品の入庫・検品・梱包・海外発送（EMS、FedEx、DHL、UPS、国際eパケット等）を当社に委託している事業者（ショップ運営者様・セラー様）です。

チャットワーク等の画面スクリーンショットを読み取り、相手のメッセージや要望を正確に把握した上で、最適な返信文案を3パターン（①丁寧・標準案内案、②迅速・了解案、③確認依頼・ヒアリング案）作成してください。

【当社の提供業務・専門知識】
- 海外発送・越境ECフルフィルメント（入庫検品、保管、ピッキング、国際梱包、インボイス作成・HSコード付与・申告価格、国際配送キャリア手配、追跡番号共有、通関トラブル対応、配送遅延調査、航空危険物リチウム電池確認、容積重量計算など）。

【返信文作成の必須ルール】
1. ChatWorkに適した書式（適宜 [info][title]...[/title]...[/info] や箇条書き）を活用し、視認性を高めてください。
2. 越境EC特有の用語（インボイス、HSコード、容積重量、追跡番号、現地関税、受取人様英語表記・TEL等）を適切に用い、安心感を与えるプロフェッショナルな表現にしてください。
3. 穴埋めが必要な箇所（追跡番号や日付等）は [追跡番号: XXXXX] [◯月◯日] のようにわかりやすい表記にしてください。
4. 相手の未読状態を維持したまま送信する前提のため、要点がひと目で伝わる構成にしてください。`,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: {
                    type: Type.STRING,
                    description: "スクショに写っているお客様の問い合わせ・相談・要望の要約"
                  },
                  clientName: {
                    type: Type.STRING,
                    description: "判明したお客様の氏名またはショップ名（不明な場合は空文字列）"
                  },
                  urgency: {
                    type: Type.STRING,
                    description: "緊急度：'至急' | '通常' | '要確認'"
                  },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "海外発送代行業者として押さえるべきポイントや確認事項（2〜3点）"
                  },
                  candidates: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING, description: "案の名称（例: 標準・丁寧な案内案, 迅速・了解案, 詳細確認・ヒアリング案）" },
                        tone: { type: Type.STRING, description: "トーン（丁寧・詳細, 迅速・スピーディ, 確認依頼 など）" },
                        message: { type: Type.STRING, description: "ChatWork送信用の本文（[info]タグ等を含む）" },
                        explanation: { type: Type.STRING, description: "この返信案の意図や使い分けのアドバイス" }
                      },
                      required: ["id", "label", "tone", "message", "explanation"]
                    },
                    description: "返信文案の候補リスト（3パターン）"
                  }
                },
                required: ["summary", "urgency", "keyPoints", "candidates"]
              }
            }
          });

          const responseText = response.text?.trim() || "{}";
          const data = JSON.parse(responseText);
          if (data && data.candidates && data.candidates.length > 0) {
            parsedData = data;
            usedModel = modelName;
            break; // Successfully generated!
          }
        } catch (mErr: any) {
          lastErr = mErr;
          console.warn(`[Gemini API] Model ${modelName} temporary issue (${mErr?.status || mErr?.code || mErr?.message}). Trying fallback model...`);
          // Brief pause before trying fallback model to mitigate transient spike
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (parsedData) {
        return res.json({
          ...parsedData,
          isAIGenerated: true,
          model: usedModel
        });
      }

      // If all models encountered temporary high demand spikes (503 / 429)
      console.warn("[Gemini API] All models busy, returning domain expert fallback proposal.");
      const mockResult = getOverseasShippingMockResponse(scenarioHint, additionalNotes);
      return res.json({
        ...mockResult,
        isAIGenerated: false,
        notice: "※ Google AIサーバーが一時的に混雑（503高負荷）しているため、海外発送代行のエキスパート推奨返信案を表示しています。「再試行」ボタンで再解析が可能です。"
      });
    } catch (err: any) {
      console.warn("[Gemini API] Fallback triggered due to error:", err?.message || err);
      // Fallback to rich shipping response if an unexpected exception occurs
      const mockResult = getOverseasShippingMockResponse(scenarioHint, additionalNotes);
      return res.json({
        ...mockResult,
        isAIGenerated: false,
        notice: "※ AI一時混雑のため、海外発送代行のエキスパート推奨返信案を表示しています。"
      });
    }
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
