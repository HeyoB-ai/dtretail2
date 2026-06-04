import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini SDK to prevent crashes on startup if GEMINI_API_KEY is missing.
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is niet ingesteld. Voeg deze toe in de Secrets van AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Cache or mock database for simple persistence of active setups if needed, 
// but direct payload state passed from client is perfect for a living simulation dashboard.
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { message, activeTwin, telemetry, chatHistory } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is niet ingesteld. Voeg deze toe in de Secrets van AI Studio." 
      });
    }

    const ai = getAiClient();

    const systemInstruction = 
      "Je bent Leta, de slimme en geavanceerde AI Co-pilot van 'Let's Twin'. " +
      "Jouw rol is om de gebruiker te helpen bij de monitoring, controle, preventieve onderhoud-voorspellingen en optimalisatie van hun Digital Twins. " +
      "Je bent professioneel, technisch onderlegd, to-the-point en behulpzaam. " +
      "Je communiceert ALTIJD in het Nederlands. Gebruik geen overbodige technische jargon die niet relevant is, leg concepten drempelvrij uit. " +
      "Wanneer je reageert, baseer je antwoord specifiek op de live-telemety-bestanden en de geselecteerde Digital Twin die de gebruiker opstort. " +
      "Als er waarden buiten de veilige marge liggen (bijvoorbeeld: temperatuur robotarm > 75°C, trillingen windturbine > 8Hz), geef dan actieve aanbevelingen voor inspectie.";

    // Format telemetry state clearly
    const telemetryContext = JSON.stringify(telemetry, null, 2);
    
    // Construct standard history if present
    const contents = [
      {
        role: "user" as const,
        parts: [{
          text: `Context: De gebruiker bekijkt momenteel de Digital Twin: "${activeTwin}".\n` +
                `Hier is de actuele live IoT telemetry van deze Digital Twin:\n${telemetryContext}\n\n` +
                `Gebruikersboodschap: ${message}`
        }]
      }
    ];

    // Call Gemini using the modern @google/genai SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Fout bij aanroepen Gemini API:", error);
    res.status(500).json({ error: error.message || "Interne fout bij AI-analyse." });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production build from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Let's Twin - Server draait op http://localhost:${PORT}`);
  });
}

startServer();
