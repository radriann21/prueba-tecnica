export type CampaingStatus = 'ok' | 'warning' | 'critical';

export interface CampaingReport {
  id: string;
  name: string;
  metric: number;
  status: CampaingStatus;
  evaluatedAt: Date;
}

export interface RawData {
  id: string;
  name: string;
  price_change_percentage_24h: number;
}

export type LLMSummary = {
  generatedAt: Date;
  model: string;
  summary: string;
  rawResponse?: unknown;
};

export interface WebhookPayload {
  reports: CampaingReport[];
  llmSummary: LLMSummary;
}