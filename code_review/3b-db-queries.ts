// PARTE 3A: Refactorización y Code Review

/*
ESQUEMA:
model Operator {
  id String @id @default(cuid())
  name String
  campaigns Campaign[]
  }

model Campaign {
  id String @id @default(cuid())
  name String
  operatorId String
  operator Operator @relation(fields: [operatorId], references: [id])
  metrics CampaignMetric[]
}

model CampaignMetric {
  id String @id @default(cuid())
  campaignId String
  campaign Campaign @relation(fields: [campaignId], references: [id])
  roas Float
  recordedAt DateTime
}
*/

// QUERIES:
import { PrismaClient } from "./client/client";

const prisma = new PrismaClient({accelerateUrl:''});

interface CampaignRoasEntry {
  campaignId: string;
  campaignName: string;
  averageRoas: number | null;
}

type WorseRoasByOperator = Record<string, CampaignRoasEntry[]>;

async function getWorseROASByOperator(): Promise<WorseRoasByOperator> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const metricsAggregated = await prisma.campaignMetric.groupBy({
    by: ['campaignId'],
    where: {
      recordedAt: {
        gte: sevenDaysAgo
      }
    },
    _avg: {
      roas: true
    },
    orderBy: {
      _avg: {
        roas: 'asc'
      }
    }
  })

  const campaignIds = metricsAggregated.map((m => m.campaignId));
  const campaignsInfo = await prisma.campaign.findMany({
    where: { id: { in: campaignIds } },
    include: { operator: true }
  })

const groupedByOperator = metricsAggregated.reduce((acc, metric) => {
    const info = campaignsInfo.find(c => c.id === metric.campaignId);
    if (!info) return acc;
    
    const operatorName = info.operator.name;
    
    if (!acc[operatorName]) {
      acc[operatorName] = [];
    }
    
    acc[operatorName].push({
      campaignId: metric.campaignId,
      campaignName: info.name,
      averageRoas: metric._avg.roas
    });
    return acc;
  }, {} as WorseRoasByOperator);
  return groupedByOperator;
} 


