# Diseño conceptual de un Agente

Para diseñar un agente autonomo que permita manejo de tareas dinamicas, implementaría un arquitectura basa en el patrón "Re-Act", es decir, "Razonamiento - Actuar", haciendo que el modelo primero sea capaz de inferir cuestiones antes de realizar aciones concretas.

Para ello, permitiría el uso de ciertas herramientas y componentes esenciales:

1. Integración a Slack
2. Consultas a BD
3. Ejecutar llamado a APIs

El ciclo de decisión que el agente podría realizar:

- El agente primero hace una petición a la BD para obtener los datos necesarios para su toma de decisiones, leerá las metricas necesarias. Si detecta elementos criticos, pausará la campaña y enviará una alerta. Si detecta metricas aceptables pero, que no entran en el umbral de "ok", esperará validación humana para decidir si pausar o ignorar.

Para permitir auditabilidad, se podrían usar herramientas de observabilidad o, hacer que el agente, luego de cada acción, inserte un datos en una tabla donde se muestre hora, razonamiento explicito, payload y las herramientas usadas para auditar sus decisiones.

---

### Arquitectura Propuesta en ASCII

[ Cron / Trigger ]
│
▼
[ LLM Orquestador ] ◄──────► [ Tool Calling ]
│ ├─► 1. query_metrics (PostgreSQL)
│ ├─► 2. pause_campaign (Ads API)
▼ └─► 3. send_alert (Slack)
[ Middleware de Auditoría ]
│
▼
( Tabla: AgentAuditLog )
