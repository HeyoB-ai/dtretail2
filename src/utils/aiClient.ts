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
    const trimmed = textResult.trim();

    // If the response is HTML (starts with '<'), it is a SPA fallback or Netlify error page
    if (trimmed.startsWith("<")) {
      throw new Error(
        `De server retourneerde een HTML-pagina (SPA fallback) in plaats van JSON.\n\n` +
        `Dit betekent dat de routering of Netlify Serverless Function op /api/claude/analyze op dit moment niet actief of bereikbaar is op jouw live website.\n\n` +
        `Oorzaak & Oplossing op Netlify:\n` +
        `1. Log in op je Netlify Dashboard en ga naar Site Deploys.\n` +
        `2. Controleer of de meest recente build succesvol is voltooid (clean build).\n` +
        `3. Ga naar de tab 'Functions' in Netlify om te zien of de functie 'analyze' correct is gedetecteerd en actief is.\n` +
        `4. Als er een fout was tijdens de build of de functie niet gevonden is, trigger dan een handmatige 'Clear cache and deploy site' op Netlify.`
      );
    }

    if (!response.ok) {
      let friendlyError = `Fout bij AI-verwerking (Status ${response.status}).`;
      try {
        const errData = JSON.parse(trimmed);
        if (errData.error) {
          friendlyError = errData.error;
          if (errData.status) {
            friendlyError += ` (Status: ${errData.status})`;
          }
        }
      } catch (e) {
        friendlyError += ` Antwoord van server: ${trimmed.substring(0, 100)}...`;
      }
      throw new Error(friendlyError);
    }

    const data = JSON.parse(trimmed);
    return data.text || "Excuus, ik kon geen analyse genereren.";
  } catch (err: any) {
    console.error("Fout bij ophalen van AI-reactie:", err);

    const baseMessage = err.message || "";
    if (
      baseMessage.includes("Failed to fetch") ||
      baseMessage.includes("Spa fallback") ||
      baseMessage.includes("fallback") ||
      baseMessage.includes("HTML-pagina") ||
      baseMessage.includes("Failed to load resource")
    ) {
      throw new Error(
        `De AI Co-pilot (/api/claude/analyze) kon niet bereikt worden.\n\n` +
        `Mogelijke oorzaken:\n` +
        `- De Netlify Serverless Function is nog niet volledig gebouwd of geactiveerd.\n` +
        `- De API Key (ANTHROPIC_API_KEY of CLAUDE_API_KEY) is niet goed ingesteld in je Netlify Site Settings.\n\n` +
        `Stappen om dit op te lossen op Netlify:\n` +
        `1. Open Netlify Dashboard -> Site Configuration -> Environment variables.\n` +
        `2. Zorg dat je een variabele genaamd ANTHROPIC_API_KEY of CLAUDE_API_KEY hebt toegevoegd met jouw geldige Claude API-sleutel.\n` +
        `3. Ga naar Deploys -> Trigger deploy -> kies 'Clear cache and deploy site' om je netlify.toml en functions volledig opnieuw te bouwen!\n` +
        `4. Zodra de deploy klaar is, controleer je of de functie 'analyze' verschijnt onder de tab 'Functions'.`
      );
    }
    throw err;
  }
}
