/**
 * Resilient Gemini Client Helper for Let's Twin.
 * Supports dual-mode execution:
 * 1. Server-side proxy mode (/api/gemini/analyze) for maximum security (AI Studio container).
 * 2. Client-side fallback mode (direct browser fetch) for static-only hosting environments like Netlify,
 *    loading the key dynamically from VITE_GEMINI_API_KEY.
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
  systemInstruction = "Je bent Leta, de slimme AI Co-pilot van Let's Twin. Reageer in het Nederlands."
}: AnalyzeParams): Promise<string> {
  // Mode 1: Try the server-side proxy
  try {
    const response = await fetch("/api/gemini/analyze", {
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
      // If it returned 404, we intentionally fail over to client fallback
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
    console.warn("Express API niet beschikbaar of gaf fout. Schakelen naar client-side fallback...", err.message);

    // Mode 2: Client-side direct access using Vite env variable
    const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!clientKey) {
      if (err.message === "404_API_NOT_FOUND") {
        throw new Error(
          "API endpoint (404) is niet gevonden op Netlify. " +
          "Omdat Netlify een statische hoster is, kunt u dit oplossen door uw Gemini API Key toe te voegen " +
          "aan uw Netlify Site Settings als 'VITE_GEMINI_API_KEY'."
        );
      }
      throw new Error(
        err.message || 
        "Kon gegevens niet verwerken. Zorg ervoor dat de Gemini API Key is geconfigureerd."
      );
    }

    // Direct fetch to Gemini API from browser
    try {
      const telemetryContext = JSON.stringify(telemetry, null, 2);
      const fullPrompt = `System Instruction:\n${systemInstruction}\n\n` +
                          `Context: De gebruiker bekijkt momenteel de Digital Twin: "${activeTwin}".\n` +
                          `Hier is de actuele live IoT telemetry van deze Digital Twin:\n${telemetryContext}\n\n` +
                          `Gebruikersboodschap: ${message}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`;
      
      const directResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (!directResponse.ok) {
        const errJson = await directResponse.json();
        throw new Error(errJson?.error?.message || `Gemini API direct error: ${directResponse.status}`);
      }

      const resJson = await directResponse.json();
      const textResponse = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      return textResponse || "Excuus, ik kon geen directe analyse genereren.";
    } catch (directErr: any) {
      console.error("Directe browser Gemini call mislukt:", directErr);
      throw new Error(`Directe AI verbinding mislukt: ${directErr.message}`);
    }
  }
}
