# Recuperação de Desastres (Disaster Recovery)

Este documento define os parâmetros de proteção de dados e SLA de restauração da MedAI Pro.

## 1. Métricas de Resiliência
- **RPO (Recovery Point Objective):** 5 minutos. Significa que, no pior cenário de corrupção total do banco, a clínica perderá no máximo 5 minutos do que conversou com a IA.
- **RTO (Recovery Time Objective):** 30 minutos. Tempo máximo aceitável para restaurarmos os backups e voltarmos o sistema ao ar.

## 2. Política de Backup (Supabase/PostgreSQL)
A plataforma MedAI Pro utiliza PITR (Point-in-Time Recovery) através do plano Pro do Supabase.
- **Frequência de Backup Contínuo:** WAL logs arquivados a cada 2 minutos.
- **Backup Diário (Full):** Toda madrugada às 03:00 (BRT).
- **Retenção de Backups:** 30 dias (de acordo com nossa Política de Retenção e LGPD).

## 3. Procedimento de Rollback de Código
Se o Deploy via GitHub Actions para `Production` injetar um bug crítico:
1. O desenvolvedor on-call ou SRE localiza a notificação de erro no Sentry/Datadog.
2. Vai até a plataforma de deploy (Vercel / AWS).
3. Clica em **"Promote to Production"** no penúltimo *Build* funcional (Rollback Instantâneo).
4. Aciona a flag de manutenção (se necessário) alterando a variável `MAINTENANCE_MODE=true`.

## 4. Redundância de Inteligência Artificial
Se a Anthropic sair do ar (Downtime Externo):
- Nosso `AIOrchestrator` intercepta o erro 5xx.
- Ele realiza fallback imediato para OpenAI (GPT-4o mini) preservando o histórico da conversa (`fallback_triggered = true` na tabela `usage_logs`).
