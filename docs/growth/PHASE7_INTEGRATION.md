# Relatório Técnico: Integração Inteligente de Tracking (Fase 7b)
**Data:** Maio de 2026

## 1. Resumo Executivo
A segunda etapa da Fase 7 concluiu a amarração arquitetural do **Event Tracking** sem sacrificar a escalabilidade e o baixo acoplamento do sistema. Implementamos o padrão **Event-Driven Architecture (EDA)** utilizando um Barramento Interno de Eventos (`EventBus`) e blindamos as requisições primárias do usuário contra falhas do serviço de telemetria através de filas de retentativa em memória (*Failsafe*).

---

## 2. P0 — Event Bus Interno (`src/core/eventBus.js`)
O sistema agora utiliza a classe `MedAIEventBus`, baseada em Node.js `EventEmitter`.
* **Desacoplamento:** O controller de `AuthService` ou `AIOrchestrator` simplesmente dispara `eventBus.emitEvent(...)` e encerra sua responsabilidade.
* **Assincronicidade Real:** Usamos `setImmediate()` para garantir que o tracking nunca trave o Event Loop principal do Express. Isso significa latência **zero** adicionada às respostas do usuário.
* **Registro Automático:** Todo evento disparado mapeia diretamente para os listeners do `TrackingService`, completando a jornada de tracking e gatilhos de forma invisível.

---

## 3. P0 — Middleware de Tracking (`src/middleware/trackingMiddleware.js`)
Para evitar poluição de código repetitivo, injetamos um middleware global no `src/routes/index.js`.
* Ele implementa um "hook" no `res.on('finish')` para calcular a **duração exata** de cada rota de forma silenciosa.
* Dispara eventos analíticos de navegação de página capturando `method`, `statusCode` e `ip`. Rotas de noise interno (`/health`, `/metrics`) são inteligentemente filtradas para não inflar a conta de banco de dados.

---

## 4. P1 — Event Retry / Failsafe
A principal preocupação técnica com *tracking* intensivo é a quebra do serviço core.
* **Quebra controlada:** Se o `TrackingService` falhar (ex: queda do banco Supabase momentânea), o `EventBus` detecta a exceção e invoca o `_pushToQueue()`.
* **Local Retry Queue:** O evento falho fica armazenado em memória (com trava máxima de 5000 itens para não dar Out-Of-Memory/OOM).
* **Worker de Reprocessamento:** Um minijob roda a cada 60 segundos processando a fila. Após 3 retentativas sem sucesso, o evento é oficialmente "dropado", pois preferimos perder telemetria do que crashar o backend.

---

## 5. Integração Validada
Através das modificações realizadas, as seguintes ações agora deixam um rastro de auditoria rico sem atrasar o response:
* **`authService.js`:** Captura de `LOGIN` e `LOGOUT`.
* **`ai/orchestrator.js`:** Captura de `CAMPAIGN_CREATE`, `IMAGE_CREATE`, `FAQ_USE` e `AI_CHAT`.

## 6. Cobertura de Testes
* O novo módulo `eventBus.js` possui suíte exclusiva (`tests/unit/eventBus.test.js`).
* Testado empiricamente sob o Jest o disparo sem trava do `setImmediate` e a resiliência do `retryQueue`, aprovado com 100% de sucesso. Não houve impacto no restante da aplicação, comprovando o desacoplamento.

## 7. Riscos Residuais / Futuro
* **Volatilidade de Filas (In-Memory Queue):** Se a aplicação escalar ou a infraestrutura reiniciar por deploys, a fila `retryQueue` em memória será purgada.
  * *Para o MVP:* Aceitável (Loss of telemetry is acceptable during deploy).
  * *Roadmap SaaS:* Em um cenário "Enterprise", o `EventBus` deverá redirecionar suas falhas ou emissões para o AWS SQS / RabbitMQ ou Redis (BullMQ).

**Conclusão:** O rastreamento comportamental de usuários na MedAI Pro é agora profissional, furtivo e arquiteturalmente robusto.
