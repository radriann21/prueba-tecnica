import { MetricsService } from "@/services/metrics.service";
import { LlmService } from "@/services/llm.service";
import fs from "fs/promises";
import path from "path";
import { pollingQueue } from "@/jobs/queue";
import "@/jobs/worker"; 

async function main() {
  console.log("Iniciando obtención de datos de la campaña...");
  const service = new MetricsService();
  const llmService = new LlmService();

  try {
    const data = await service.getCampaingData();
    console.log("✅ Datos obtenidos exitosamente:");
    console.log(JSON.stringify(data, null, 2));

    const llmSummary = await llmService.generateCampaignSummary(data);
    console.log("📝 Resumen ejecutivo generado.");

    await service.sendToN8N({ reports: data, llmSummary });

    const targetPath = path.join(process.cwd(), "n8n", "latest_campaigns.json");
    await fs.writeFile(targetPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`💽 Datos guardados exitosamente como JSON en: ${targetPath}`);

    await pollingQueue.add('evaluar-metricas-inmediato', {});
    await pollingQueue.add('evaluar-metricas-periodico', {}, {
      repeat: {
        every: 1000 * 60 * 5, 
      }
    });

    console.log("✅ Job recurrente de evaluación de umbrales programado cada 5 minutos.");

  } catch (error) {
    console.error("❌ Error durante la ejecución:", error);
  }
}

main();
