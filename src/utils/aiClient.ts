/**
 * Resilient AI Client Helper for Let's Twin.
 * Supports dual-mode execution:
 * 1. Server-side proxy mode (/api/claude/analyze) for maximum security (AI Studio container).
 * 2. Netlify serverless mode (routed automatically via redirects from /api/claude/analyze to the netlify serverless function).
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
  telemetry
}: AnalyzeParams): Promise<string> {
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
    if (textResult.trim().startsWith("<!DOCTYPE")) {
      throw new Error("Spa fallback returned instead of API endpoint.");
    }

    if (!response.ok) {
      let friendlyError = `Fout bij AI-verwerking (Status ${response.status}).`;
      try {
        const errData = JSON.parse(textResult);
        if (errData.error) {
          friendlyError = errData.error;
        }
      } catch (e) {
        // Not a JSON response
      }
      throw new Error(friendlyError);
    }

    const data = JSON.parse(textResult);
    return data.text || "Excuus, ik kon geen analyse genereren.";
  } catch (err: any) {
    console.error("Fout bij ophalen van AI-reactie:", err);

    const baseMessage = err.message || "";
    if (baseMessage.includes("Failed to fetch") || baseMessage.includes("Spa fallback") || baseMessage.includes("Failed to load resource")) {
      throw new Error(
        "De AI Co-pilot /api/claude/analyze kon niet worden bereikt op jouw hostingomgeving.\n\n" +
        "Actie vereist op Netlify:\n" +
        "1. Ga naar je Netlify Dashboard -> Site Configuration -> Environment variables.\n" +
        "2. Voeg een nieuwe variabele toe met de naam: CLAUDE_API_KEY (of ANTHROPIC_API_KEY) en vul daar jouw Claude API Key in.\n" +
        "3. Trigger een hernieuwde deploy op Netlify (onder Deploys -> Trigger deploy -> Clear cache and deploy site) zodat de netlify.toml redirect en de serverless function correct meegenomen en geactiveerd worden!"
      );
    }
    throw err;
  }
}
