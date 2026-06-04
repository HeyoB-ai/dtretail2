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
      "claude-haiku-4-5",
      "claude-3-5-haiku-20241022"
    ];

    let response = null;
    let usedModel = "";
    let anthropicErrorStatus = null;
    let anthropicErrorMessage = "";
    let anthropicErrorBody = null;

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
              max_tokens: 4000,
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
            anthropicErrorStatus = tempResponse.status;
            const errJson = await tempResponse.json().catch(() => null);
            anthropicErrorBody = errJson;
            anthropicErrorMessage = errJson?.error?.message || `Status Code: ${tempResponse.status}`;
            console.warn(`Model ${model} mislukt op Netlify met status ${tempResponse.status}: ${anthropicErrorMessage}`);
          }
        } catch (err) {
          anthropicErrorStatus = anthropicErrorStatus || 500;
          anthropicErrorMessage = err.message || "Onbekende netwerk/verbindingsfout";
          console.warn(`Fout tijdens verbinding met model ${model} op Netlify: ${anthropicErrorMessage}`);
        }
      }
    } else {
      anthropicErrorStatus = 401;
      anthropicErrorMessage = "Geen geldige Claude API-sleutel ingesteld op Netlify.";
    }

    if (!response) {
      console.error(`Alle Anthropic AI-modellen zijn mislukt op Netlify. Status: ${anthropicErrorStatus}. Foutmelding: ${anthropicErrorMessage}`);
      return {
        statusCode: anthropicErrorStatus || 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: anthropicErrorMessage || "Alle AI-modellen zijn mislukt.",
          status: anthropicErrorStatus,
          raw: anthropicErrorBody,
          candidateModels
        }),
      };
    }

    const resJson = await response.json();
    const resultText = resJson?.content?.[0]?.text || "Mijn excuses, ik kon geen reactie genereren van Claude.";

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
