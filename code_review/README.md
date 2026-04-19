# Parte 3 — Code Review y Queries con Prisma

## 3A — Refactor del código recibido

Archivo: [`3a-core-review.ts`](./3a-core-review.ts)

### Problemas identificados en el código original

1. **Sin manejo de errores.** `fetchCampaignData` no envuelve la llamada HTTP en `try/catch`; cualquier fallo de red propaga una excepción no controlada que rompe todo el `processCampaigns`.
2. **Procesamiento estrictamente secuencial.** El `for...of` con `await` fuerza que cada petición espere a la anterior, desperdiciando paralelismo y aumentando latencia lineal con el número de campañas.
3. **Riesgo de división por cero.** `ctr = data.clicks / data.impressions` produce `NaN`/`Infinity` cuando `impressions = 0`, contaminando el resultado aguas abajo.
4. **Ausencia de tipado en la respuesta.** `response.data` es implícitamente `any`, lo que anula las ventajas de TypeScript.

### Cambios aplicados (refactor quirúrgico)

- Se añade la interfaz `dataResult` y se tipa `axios.get<dataResult>` para eliminar el `any`.
- `try/catch` en `fetchCampaignData`: devuelve `null` ante error para que el consumidor lo filtre sin romper todo el batch.
- Guarda defensiva `data.impressions > 0` antes de calcular el CTR.
- **Concurrencia controlada por chunks:** en `processCampaigns` se procesan máximo `CONCURRENCY_LIMIT = 3` peticiones simultáneas con `Promise.all` sobre cada chunk, cumpliendo el diferencial opcional.
- Nueva función `filteredCampaigns`: filtra CTR < 0.02 y ordena ascendentemente.

## 3B — Query Prisma: peor ROAS promedio por operador

Archivo: [`3b-db-queries.ts`](./3b-db-queries.ts)

### Qué hace la query

Retorna, por cada operador, sus campañas con **ROAS promedio más bajo de los últimos 7 días**, ordenadas de menor a mayor. El resultado sirve para detectar qué operadores tienen campañas con peor rendimiento reciente.

En cuento a la estructura, Prisma no permite hacer en una sola operación un `groupBy` por `campaign.operatorId` con un `_avg` sobre una tabla relacionada (`CampaignMetric`). Resolverlo con `raw SQL` estaba explícitamente prohibido. La solución se parte en dos pasos seguidos de una agrupación en memoria:

1. **`prisma.campaignMetric.groupBy`** por `campaignId` filtrando `recordedAt >= hace7Días`, con `_avg: { roas: true }` y `orderBy` ascendente. Así se obtiene el promedio real por campaña, tipado nativamente por Prisma.

2. **`prisma.campaign.findMany`** con `where: { id: { in: campaignIds } }` e `include: { operator: true }` para enriquecer cada agregado con el nombre de la campaña y el operador dueño. Se hace en una sola query adicional (no N+1).

3. **Agrupación con `reduce`** en JavaScript: se reagrupan los registros ya ordenados bajo cada `operator.name`. Como el array fuente viene ordenado ascendentemente por ROAS, el array resultante por operador preserva ese orden.

El resultado final tiene el shape:

```ts
Record<string, Array<{
  campaignId: string;
  campaignName: string;
  averageRoas: number | null;
}>>
```

No se usa `raw SQL` y el tipado del paso 1 y 2 lo provee Prisma; el reduce final se tipa explícitamente.
