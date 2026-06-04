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

    if (!claudeKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "De Claude API Key is niet ingesteld in Netlify. Voeg de omgevingsvariabele CLAUDE_API_KEY of ANTHROPIC_API_KEY toe in je Netlify Site Settings."
        }),
      };
    }

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

    // Request Anthropic Claude Messages API
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
      const errJson = await response.json().catch(() => ({}));
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ 
          error: errJson?.error?.message || `Anthropic API error status: ${response.status}` 
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
