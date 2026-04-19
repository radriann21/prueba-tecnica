import { apiClient } from "@/shared/api/apiClient";
import { coinGeckoAdapter } from "@/adapters/coinGeckoAdapter";
import { CampaingReport, RawData, WebhookPayload } from "@/shared/interfaces/interfaces";

export class MetricsService {
  private readonly API_URL = process.env.API_URL || "";
  private readonly API_KEY = process.env.API_KEY || "";
  private readonly WEBHOOK_URL = process.env.WEBHOOK_URL || "";

  async getCampaingData(): Promise<CampaingReport[]> {
    const options = {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": this.API_KEY,
      },
    };

    const rawData: RawData[] = await apiClient({ url: this.API_URL, options });
    return coinGeckoAdapter(rawData);
  }

  async sendToN8N(payload: WebhookPayload) {
    try {
      const webhookResponse = await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (webhookResponse.ok) {
        console.log("Datos enviado correctamente.");
      } else {
        console.error(
          `Ocurrió un error al enviar a n8n: ${webhookResponse.statusText}`,
        );
      }
    } catch (error) {
      console.error(`Falla en la red al intentar contactar a N8N: ${error}`);
      throw error;
    }
  }
}
