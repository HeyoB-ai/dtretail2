import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Proxy endpoint for Claude (Anthropic API)
app.post("/api/claude/analyze", async (req, res) => {
  try {
    const { message, activeTwin, telemetry } = req.body;

    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!claudeKey) {
      return res.status(500).json({ 
        error: "Claude API Key (CLAUDE_API_KEY of ANTHROPIC_API_KEY) is niet gevonden in de omgevingsvariabelen." 
      });
    }

    const systemInstruction = 
      "Je bent Leta, de slimme en geavanceerde AI Co-pilot van 'Let's Twin'. " +
      "Jouw rol is om de gebruiker te helpen bij de monitoring, controle, preventieve onderhoud-voorspellingen en optimalisatie van hun Digital Twins. " +
      "Je bent professioneel, technisch onderlegd, to-the-point en behulpzaam. " +
      "Je communiceert ALTIJD in het Nederlands. Gebruik geen overbodige technische jargon die niet relevant is, leg concepten drempelvrij uit. " +
      "Wanneer je reageert, baseer je antwoord specifiek op de live-telemety-bestanden en de geselecteerde Digital Twin die de gebruiker opstort. " +
      "Als er waarden buiten de veilige marge liggen (bijvoorbeeld: temperatuur robotarm > 75°C, trillingen windturbine > 8Hz), geef dan actieve aanbevelingen voor inspectie.";

    const telemetryContext = JSON.stringify(telemetry, null, 2);
    const userPrompt = `Context: De gebruiker bekijkt momenteel de Digital Twin: "${activeTwin}".\n` +
                       `Hier is de actuele live IoT telemetry van deze Digital Twin:\n${telemetryContext}\n\n` +
                       `Gebruikersboodschap: ${message}`;

    // Standard Claude API /v1/messages call via global fetch with adaptive model fallbacks
    const candidateModels = [
      "claude-4-5-haiku",
      "claude-3-5-haiku-20241022",
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620"
    ];

    let response: any = null;
    let lastErrorMsg = "";
    let usedModel = "";

    if (claudeKey && claudeKey.trim() !== "" && !claudeKey.startsWith("YOUR_")) {
      for (const model of candidateModels) {
        try {
          console.log(`Proberen Claude model: ${model}...`);
          const tempResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": claudeKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: model,
              max_tokens: 1500,
              system: systemInstruction,
              messages: [
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.7
            })
          });

          if (tempResponse.ok) {
            response = tempResponse;
            usedModel = model;
            console.log(`Succesvolle verbinding via model: ${usedModel}`);
            break;
          } else {
            const errJson = await tempResponse.json().catch(() => ({}));
            lastErrorMsg = errJson?.error?.message || `Status: ${tempResponse.status}`;
            console.warn(`Model ${model} mislukt: ${lastErrorMsg}`);
          }
        } catch (err: any) {
          lastErrorMsg = err.message || "Onbekende fout";
          console.warn(`Fout tijdens verbinding met model ${model}: ${lastErrorMsg}`);
        }
      }
    } else {
      lastErrorMsg = "Geen geldige Claude API-sleutel (CLAUDE_API_KEY of ANTHROPIC_API_KEY) gedefinieerd in je omgevingsvariabelen.";
    }

    let resultText = "";

    if (response) {
      const resJson = await response.json();
      resultText = resJson?.content?.[0]?.text || "Mijn excuses, ik kon geen reactie genereren van Claude.";
    } else {
      // Automatic fallback to Gemini so the app NEVER fails for the end user!
      console.log(`Claude is mislukt (${lastErrorMsg}). Schakelen naar Gemini Co-pilot...`);
      try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          throw new Error("Geen actieve GEMINI_API_KEY geconfigureerd in de backend.");
        }
        
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const geminiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
          contents: [userPrompt],
        });

        const geminiText = geminiRes.text || "Kon geen reactie genereren via de Gemini Co-pilot.";
        resultText = 
          `⚠️ **Leta AI Co-pilot status update**: Je Claude API Key of model gaf een foutmelding (*"${lastErrorMsg}"*).\n\n` +
          `Om onderbreking te voorkomen, ben ik automatisch overgeschakeld naar het stabiele back-up model: **Gemini 2.5 Flash**.\n\n` +
          `***\n\n` +
          geminiText;
      } catch (geminiErr: any) {
        throw new Error(
          `Zowel Claude als de Gemini back-up zijn mislukt.\n` +
          `Laatste Claude Fout: ${lastErrorMsg}\n` +
          `Gemini Fallback Fout: ${geminiErr.message}`
        );
      }
    }

    res.json({ text: resultText });
  } catch (error: any) {
    console.error("Fout bij aanroepen Claude API:", error);
    res.status(500).json({ error: error.message || "Interne fout bij AI-analyse via Claude." });
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
