import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

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

    // Standard Claude API /v1/messages call via global fetch
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": claudeKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
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

    if (!response.ok) {
      const errJson = await response.json();
      throw new Error(errJson?.error?.message || `Anthropic API error status: ${response.status}`);
    }

    const resJson = await response.json();
    const resultText = resJson?.content?.[0]?.text || "Mijn excuses, ik kon geen reactie genereren van Claude.";

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
