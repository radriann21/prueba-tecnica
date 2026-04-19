import { RawData, CampaingReport, CampaingStatus } from "@/shared/interfaces/interfaces"

export const coinGeckoAdapter = (data: RawData[]): CampaingReport[] => {
  return data.map((coin) => {
    const metricValue = coin.price_change_percentage_24h;
    let actualStatus: CampaingStatus = 'ok';

    if (metricValue < 1.0) actualStatus = 'critical'
    else if (metricValue < 2.5) actualStatus = 'warning'
    else actualStatus = 'ok';

    return {
      id: coin.id,
      name: coin.name,
      metric: metricValue,
      status: actualStatus,
      evaluatedAt: new Date()
    }
  })
}