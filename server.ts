import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

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
      "claude-haiku-4-5",
      "claude-3-5-haiku-20241022"
    ];

    let response: any = null;
    let usedModel = "";
    let anthropicErrorStatus: number | null = null;
    let anthropicErrorMessage = "";
    let anthropicErrorBody: any = null;

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
            anthropicErrorStatus = tempResponse.status;
            const errJson = await tempResponse.json().catch(() => null);
            anthropicErrorBody = errJson;
            anthropicErrorMessage = errJson?.error?.message || `Status Code: ${tempResponse.status}`;
            console.warn(`Model ${model} mislukt met status ${tempResponse.status}: ${anthropicErrorMessage}`);
          }
        } catch (err: any) {
          anthropicErrorStatus = anthropicErrorStatus || 500;
          anthropicErrorMessage = err.message || "Onbekende netwerk/verbindingsfout";
          console.warn(`Fout tijdens verbinding met model ${model}: ${anthropicErrorMessage}`);
        }
      }
    } else {
      anthropicErrorStatus = 401;
      anthropicErrorMessage = "Geen geldige Claude API-sleutel (CLAUDE_API_KEY of ANTHROPIC_API_KEY) gedefinieerd in je omgevingsvariabelen.";
    }

    if (!response) {
      console.error(`Alle Anthropic AI-modellen zijn mislukt. Status: ${anthropicErrorStatus}. Foutmelding: ${anthropicErrorMessage}`);
      return res.status(anthropicErrorStatus || 500).json({
        error: anthropicErrorMessage || "Alle AI-modellen zijn mislukt.",
        status: anthropicErrorStatus,
        raw: anthropicErrorBody
      });
    }

    const resJson = await response.json();
    const resultText = resJson?.content?.[0]?.text || "Mijn excuses, ik kon geen reactie genereren van Claude.";
    res.json({ text: resultText });
  } catch (error: any) {
    console.error("Fout bij aanroepen Claude API:", error);
    res.status(500).json({ error: error.message || "Interne fout bij AI-analyse via Claude." });
  }
});

// Endpoint for sending generated proposals as e-mails via SMTP or Ethereal/logged simulation
app.post("/api/send-email", async (req, res) => {
  try {
    const { contactEmail, companyName, proposalSector, challengeText, proposalResult } = req.body;

    if (!contactEmail) {
      return res.status(400).json({ error: "E-mailadres is verplicht." });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM_EMAIL || "no-reply@letstwin.nl";

    const mailOptions = {
      from: `"Let's-Twin AI-CoPilot" <${smtpFrom}>`,
      to: contactEmail,
      subject: `📋 Jouw Digital Twin Pilot Voorstel: ${companyName}`,
      text: `Beste ${companyName} team,\n\nHier is het op maat gemaakte Digital Twin Pilot projectvoorstel dat door onze AI Co-pilot Leta is voorbereid.\n\n` + 
            `Bedrijfsnaam: ${companyName}\nSector: ${proposalSector}\n\nUitdaging:\n${challengeText || "Niet gespecificeerd"}\n\n` +
            `--- DOCUMENT ---\n\n${proposalResult}\n\n---\n\nMet vriendelijke groet,\nLet's-Twin Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Let's-Twin Digital Twin Blueprint</h2>
          <p>Beste team van <strong>${companyName}</strong>,</p>
          <p>Dank u voor uw interesse in een Digital Twin & realtime SCADA dashboard pilot project! Onze AI Co-pilot <strong>Leta</strong> heeft op basis van uw ingevulde gegevens een op maat gemaakte blauwdruk gegenereerd.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Bedrijf:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Sector / Branche:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${proposalSector}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Ingediende Uitdaging:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${challengeText || "Algemene digitalisering en optimalisatie."}</td>
            </tr>
          </table>

          <div style="background: #1e293b; color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 14px; white-space: pre-wrap; margin-top: 20px;">
            ${proposalResult.replace(/\n/g, '<br />')}
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Heeft u vragen of wilt u een live demo boeken? Neem direct contact op met Let's-Twin Agency.
          </p>
        </div>
      `
    };

    if (smtpHost && smtpUser && smtpPass) {
      console.log(`E-mail verzenden naar ${contactEmail} via SMTP: ${smtpHost}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail(mailOptions);
      console.log(`E-mail succesvol verzonden via SMTP.`);
      return res.json({ success: true, mode: "real" });
    } else {
      console.log(`[SMTP SIMULATIE] Geen SMTP-gegevens geconfigureerd in de omgevingsvariabelen.`);
      console.log(`[SMTP SIMULATIE] Er zou een e-mail worden verzonden van ${smtpFrom} naar ${contactEmail}`);
      console.log(`[SMTP SIMULATIE] Mail onderwerp: ${mailOptions.subject}`);
      
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        const info = await transporter.sendMail(mailOptions);
        const testUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[SMTP SIMULATIE] Ethereal test-e-mail link: ${testUrl}`);
        return res.json({ 
          success: true, 
          mode: "simulated", 
          testUrl: testUrl,
          message: "De SMTP criteria zijn niet ingesteld. We hebben het e-mailbericht gesimuleerd verzonden via een beveiligde testomgeving." 
        });
      } catch (errTest) {
        console.log(`[SMTP SIMULATIE] Kon geen Ethereal account aanmaken, we loggen alleen in console.`);
        return res.json({ 
          success: true, 
          mode: "logged", 
          message: "U heeft geen live SMTP-credentials geconfigureerd (SMTP_HOST, SMTP_USER, etc.). De e-mail is succesvol gesimuleerd!" 
        });
      }
    }
  } catch (error: any) {
    console.error("Fout bij verzenden van e-mail:", error);
    res.status(500).json({ error: error.message || "Fout bij verzenden van e-mail." });
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
