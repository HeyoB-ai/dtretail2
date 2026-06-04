/**
 * Netlify Serverless Function: analyze
 * Handled under /.netlify/functions/analyze
 * Redirected from /api/claude/analyze via netlify.toml
 */

export async function handler(event, context) {
  // Allow OPTIONS method for preflight and CORS troubleshooting if any, although same-domain rewrite avoids this.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method is niet toegestaan. Gebruik POST." }),
    };
  }

  try {
    const { message, activeTwin, telemetry } = JSON.parse(event.body || "{}");

    // Retrieve Claude key from Netlify environment settings
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    const hasClaudeKey = claudeKey && claudeKey.trim() !== "" && !claudeKey.startsWith("YOUR_");

    const systemInstruction = 
      "Je bent Leta, de slimme en geavanceerde AI Co-pilot van 'Let's Twin'. " +
      "Jouw rol is om de gebruiker te helpen bij de monitoring, controle, preventieve onderhoud-voorspellingen en optimalisatie van hun Digital Twins. " +
      "Wees beknopt, to-the-point, deskundig en vriendelijk in het Nederlands. " +
      "Wanneer je reageert, baseer je antwoord specifiek op de live-telemety-bestanden en de geselecteerde Digital Twin die de gebruiker opstort. " +
      "Als er waarden buiten de veilige marge liggen (bijvoorbeeld: temperatuur robotarm > 75°C, trillingen windturbine > 8Hz), geef dan actieve aanbevelingen voor inspectie.";

    const telemetryContext = JSON.stringify(telemetry, null, 2);
    const userPrompt = `Context: De gebruiker bekijkt momenteel de Digital Twin: "${activeTwin}".\n` +
                       `Hier is de actuele live IoT telemetry van deze Digital Twin:\n${telemetryContext}\n\n` +
                       `Gebruikersboodschap: ${message}`;

    // Request Anthropic Claude Messages API with adaptive model fallbacks
    const candidateModels = [
      "claude-4.5-haiku",
      "claude-4-5-haiku",
      "claude-3-5-haiku-20241022",
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620"
    ];

    let response = null;
    const modelErrors = {};
    let usedModel = "";

    if (hasClaudeKey) {
      for (const model of candidateModels) {
        try {
          console.log(`Proberen Claude model op Netlify: ${model}...`);
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
            break;
          } else {
            const errJson = await tempResponse.json().catch(() => ({}));
            const errMsg = errJson?.error?.message || `Status: ${tempResponse.status}`;
            modelErrors[model] = errMsg;
            console.warn(`Model ${model} mislukt op Netlify: ${errMsg}`);
          }
        } catch (err) {
          const errMsg = err.message || "Onbekende fout";
          modelErrors[model] = errMsg;
          console.warn(`Fout tijdens verbinding met model ${model} op Netlify: ${errMsg}`);
        }
      }
    } else {
      modelErrors["claude-config"] = "Geen geldige Claude API-sleutel ingesteld op Netlify.";
    }

    const detailedErrors = Object.entries(modelErrors)
      .map(([m, err]) => `• **${m}**: ${err}`)
      .join("\n");

    let resultText = "";

    if (response) {
      const resJson = await response.json();
      resultText = resJson?.content?.[0]?.text || "Mijn excuses, ik kon geen reactie genereren van Claude.";
    } else {
      // Automatic fallback to zero-dependency Gemini REST API inside Netlify func
      console.log(`Claude is mislukt op Netlify. Schakelen naar Gemini...`);
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: `De Claude API verbinding is mislukt. De volgende modellen zijn geprobeerd:\n\n${detailedErrors}\n\nEr is geen back-up GEMINI_API_KEY geconfigureerd in de Netlify Site Settings om dit automatisch op te vangen.`
          }),
        };
      }

      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500
            }
          })
        });

        if (!geminiResponse.ok) {
          const geminiErrJson = await geminiResponse.json().catch(() => ({}));
          throw new Error(geminiErrJson?.error?.message || `Gemini API Status: ${geminiResponse.status}`);
        }

        const geminiResJson = await geminiResponse.json();
        const geminiText = geminiResJson.candidates?.[0]?.content?.parts?.[0]?.text || "Kon geen reactie genereren van de Gemini Co-pilot.";

        resultText = 
          `⚠️ **Leta AI Co-pilot status update**: Je Claude API Key of model gaf een foutmelding. De volgende modellen zijn geprobeerd:\n\n${detailedErrors}\n\n` +
          `Om onderbreking te voorkomen, ben ik automatisch overgeschakeld naar het stabiele back-up model: **Gemini 2.5 Flash**.\n\n` +
          `***\n\n` +
          geminiText;

      } catch (geminiErr) {
        return {
          statusCode: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: `Zowel alle Claude-modellen als de Gemini-backup zijn mislukt op Netlify.\n\nDetails Claude model pogingen:\n${detailedErrors}\n\nGemini back-up foutmelding: ${geminiErr.message || geminiErr}`
          }),
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ text: resultText }),
    };

  } catch (error) {
    console.error("Netlify serverless error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message || "Interne fout bij verwerking van Claude aanvraag." }),
    };
  }
}
