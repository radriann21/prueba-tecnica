import { Worker, Job } from "bullmq";
import { MetricsService } from "@/services/metrics.service";
import { connection } from "./queue";
import { LlmService } from "@/services/llm.service";

const metricsService = new MetricsService();
const llmService = new LlmService();

export const pollingWorker = new Worker('polling', async (job: Job) => {
  console.log(`\n[Polling Worker] 🔄 Evaluando métricas periódicamente (Job: ${job.id})...`);
  
  try {
    const data = await metricsService.getCampaingData();
    const campañasCriticas = data.filter(report => report.status === 'warning' || report.status === 'critical');

    if (campañasCriticas.length > 0) {
      console.log(`[Polling Worker] Se encontraron ${campañasCriticas.length} métricas fuera de umbral. Generando resumen con LLM...`);
      
      const llmSummary = await llmService.generateCampaignSummary(campañasCriticas);
      console.log(`[Polling Worker] Resumen generado. Enviando payload unificado a N8N...`);

      await metricsService.sendToN8N({ reports: campañasCriticas, llmSummary });
    } else {
      console.log(`[Polling Worker] ✅ Todas las métricas están bajo los umbrales normales.`);
    }

    return { evaluated: data.length, alerted: campañasCriticas.length };
  } catch (error) {
    console.error(`[Polling Worker] Error extrayendo datos:`, error);
    throw error;
  }
}, { connection });

pollingWorker.on('failed', (job, err) => console.log(`[Polling Event] Falló: ${err.message}`));