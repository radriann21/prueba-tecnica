// PARTE 3A: Refactorización y Code Review

/*
CODIGO ORIGINAL:

import axios from 'axios';
  async function fetchCampaignData(campaignId: string) {
  const response = await axios.get(`https://api.example.com/campaigns/${campaignId}`);
  const data = response.data;
  return {
    id: data.id,
    clicks: data.clicks,
    impressions: data.impressions,
    ctr: data.clicks / data.impressions
  };
}

  async function processCampaigns(ids: string[]) {
    const results = [];
    for (const id of ids) {
    const campaign = await fetchCampaignData(id);
    results.push(campaign);
  }
    return results;
  }

  ERRORES DETECTADOS:

  1. Sin uso de try/catch
  2. Mal manejo de multiples peticiones en processCampaigns
  3. Riesgo de división por 0
*/

// CODIGO CORREGIDO:
interface dataResult {
  id: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

import axios from 'axios'; 

async function fetchCampaignData(campaignId: string) {
  try {
    const response = await axios.get<dataResult>(`https://api.example.com/campaigns/${campaignId}`)
    const { data } = response
    return {
      id: data.id,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: data.impressions > 0 ? data.clicks / data.impressions : 0
    }

  } catch (error) {
    console.error(`Hubo un error al obtener los datos: ${error}`)
    return null
  }
}

async function processCampaigns(ids: string[]) {
  const results = [];
  const CONCURRENCY_LIMIT = 3;

  for (let i = 0; i < ids.length; i += CONCURRENCY_LIMIT) {
    const chunk = ids.slice(i, i + CONCURRENCY_LIMIT);

    const promises = chunk.map((id) => fetchCampaignData(id))
    const chunkResults = await Promise.all(promises)

    const validResults = chunkResults.filter((campaign) => campaign !== null)
    results.push(...validResults)
  }
  return results
}

function filteredCampaigns(arr:dataResult[]) {
  return arr.filter((campaign) => campaign.ctr < 0.02).sort((a, b) => a.ctr - b.ctr)
}