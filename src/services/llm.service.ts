import { CampaingReport, LLMSummary } from "@/shared/interfaces/interfaces";
import { OpenRouter } from "@openrouter/sdk";

const MODEL = "google/gemini-2.5-flash";

export class LlmService {
  private readonly apiKey = process.env.OPENROUTER_API_KEY || "";
  private readonly openRouter = new OpenRouter({
    apiKey: this.apiKey,
  });

  async generateCampaignSummary(reports: CampaingReport[]): Promise<LLMSummary> {
    if (!this.apiKey) {
      console.warn("[LLM Service] API KEY no definida. Devolviendo resumen simulado.");
      return {
        generatedAt: new Date(),
        model: MODEL,
        summary: "Resumen automatizado (Simulado): Se han detectado métricas fuera de los umbrales normales que requieren atención inmediata del equipo operativo.",
      };
    }

    const topAnomalies = reports
      .sort((a, b) => a.metric - b.metric)
      .slice(0, 10);

    try {
      const completion = await this.openRouter.chat.send({
        chatRequest: {
          model: MODEL,
          maxTokens: 500,
          messages: [
            {
              role: "system",
              content: "Eres un asistente experto en análisis de datos. Tu tarea es generar un resumen ejecutivo directo, profesional y de máximo dos párrafos indicando la urgencia.",
            },
            {
              role: "user",
              content: `Se detectaron ${reports.length} métricas fuera de umbral en total. Aquí están las 10 más críticas:\n${JSON.stringify(topAnomalies, null, 2)}\n\nGenera un resumen ejecutivo breve.`,
            },
          ],
          temperature: 0.7,
        }
      });

      let summaryText = "No se generó ningún resumen válido.";
      if ('choices' in completion && completion.choices?.length > 0) {
        summaryText = completion.choices[0].message.content || summaryText;
      }

      return {
        generatedAt: new Date(),
        model: MODEL,
        summary: summaryText,
        rawResponse: completion,
      };
    } catch (error) {
      console.error("[LLM Service] Error contactando al LLM:", error);
      return {
        generatedAt: new Date(),
        model: MODEL,
        summary: "Hubo un problema al generar el resumen ejecutivo de la IA.",
      };
    }
  }
}
