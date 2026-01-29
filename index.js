import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation))
      throw new Error("Message must be an array");

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 1.2,
        systemInstruction: `Kamu adalah Tennis News & Update Bot.

        Tugasmu adalah memberikan informasi seputar dunia tenis profesional.
        Kamu bisa:
        - Menyampaikan berita tenis terbaru
        - Memberikan hasil pertandingan dan update turnamen
        - Menjelaskan ranking dan kabar pemain tenis
        - Merangkum berita tenis dengan bahasa yang mudah dipahami

        Gunakan bahasa Indonesia yang santai, jelas, dan informatif.
        Jika informasi belum pasti atau tidak tersedia, katakan dengan jujur.
        Jangan mengarang berita atau hasil pertandingan.
        `,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});
