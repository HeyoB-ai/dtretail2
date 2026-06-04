/**
 * Resilient AI Client Helper for Let's Twin.
 * Supports dual-mode execution:
 * 1. Server-side proxy mode (/api/claude/analyze) for maximum security (AI Studio container).
 * 2. Client-side fallback mode (direct browser fetch) for static-only hosting environments like Netlify,
 *    loading the Claude/Anthropic key dynamically from VITE_CLAUDE_API_KEY or VITE_ANTHROPIC_API_KEY.
 */

export interface TelemetryPayload {
  [key: string]: any;
}

export interface AnalyzeParams {
  message: string;
  activeTwin: string;
  telemetry: TelemetryPayload;
  systemInstruction?: string;
}

export async function resilientAnalyze({
  message,
  activeTwin,
  telemetry,
  systemInstruction = "Je bent Leta, de slimme AI Co-pilot van 'Let's Twin'. Reageer in het Nederlands."
}: AnalyzeParams): Promise<string> {
  // Mode 1: Try the server-side proxy
  try {
    const response = await fetch("/api/claude/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        activeTwin,
        telemetry
      })
    });

    const textResult = await response.text();

    // If the response is index.html due to SPA static fallback (indicated by <!DOCTYPE)
    if (response.ok && textResult.trim().startsWith("<!DOCTYPE")) {
      throw new Error("Spa fallback returned instead of API endpoint.");
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404_API_NOT_FOUND");
      }
      const errData = JSON.parse(textResult);
      throw new Error(errData.error || `Server returned error status ${response.status}`);
    }

    const data = JSON.parse(textResult);
    return data.text || "Excuus, ik kon geen analyse genereren.";
  } catch (err: any) {
    // If it's a routine API 404 or network failure, trigger the Client-Side Fallback!
    console.warn("Express Claude API niet beschikbaar of gaf fout. Schakelen naar client-side fallback...", err.message);

    // Mode 2: Client-side direct access using Vite env variable
    const clientKey = (import.meta as any).env?.VITE_CLAUDE_API_KEY || (import.meta as any).env?.VITE_ANTHROPIC_API_KEY;
    if (!clientKey) {
      if (err.message === "404_API_NOT_FOUND") {
        throw new Error(
          "Netlify API endpoint (/api/claude/analyze) is niet gevonden (404). " +
          "Omdat Netlify standaard een statische hoster is, kunt u dit oplossen door een omgevingsvariabele genaamd " +
          "'VITE_CLAUDE_API_KEY' of 'VITE_ANTHROPIC_API_KEY' toe te voegen aan uw Netlify Site Settings zodat de browser de AI rechtstreeks kan aanspreken."
        );
      }
      throw new Error(
        err.message || 
        "Kon gegevens niet verwerken. Zorg ervoor dat de Claude API Key is geconfigureerd."
      );
    }

    // Direct fetch to Anthropic Claude messages API from browser
    try {
      const telemetryContext = JSON.stringify(telemetry, null, 2);
      const userPrompt = `Context: De gebruiker bekijkt momenteel de Digital Twin: "${activeTwin}".\n` +
                          `Hier is de actuele live IoT telemetry van deze Digital Twin:\n${telemetryContext}\n\n` +
                          `Gebruikersboodschap: ${message}`;

      const claudeUrl = "https://api.anthropic.com/v1/messages";
      
      const directResponse = await fetch(claudeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": clientKey,
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true" // Permitted for direct client fetches
        } as any,
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1540,
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

      if (!directResponse.ok) {
        const errJson = await directResponse.json();
        throw new Error(errJson?.error?.message || `Claude API direct error: ${directResponse.status}`);
      }

      const resJson = await directResponse.json();
      const textResponse = resJson?.content?.[0]?.text;
      return textResponse || "Excuus, ik kon geen directe analyse genereren.";
    } catch (directErr: any) {
      console.error("Directe browser Claude call mislukt:", directErr);
      throw new Error(
        `Directe verbinding met Claude via de browser is mislukt: ${directErr.message}. ` +
        "Dit komt vaak door CORS-restricties van de browser bij rechtstreekse API-aanroepen. " +
        "Het is aanbevolen om een Netlify Serverless Function op `/api/claude/analyze` in te richten voor een veilige proxy."
      );
    }
  }
}
