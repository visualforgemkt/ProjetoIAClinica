# Monitoramento de Custos de IA e Billing

## 1. Arquitetura de Faturamento (Billing)
Implementamos na Fase 5 as estruturas SQL (`subscriptions`, `usage_logs` estendido) para separar as clínicas por Planos Financeiros:
- **Starter:** (Free-tier / Lead Gen)
- **Professional:** R$ 99/mês (500 tokens).
- **Enterprise:** R$ 299/mês (2000 tokens).

Os pagamentos serão orquestrados através de uma futura integração com **Stripe**, que atualizará a tabela `subscriptions` via Webhooks.

## 2. Visibilidade de Custos de IA
Na tabela `usage_logs`, passamos a calcular e armazenar:
- `tokens_input` e `tokens_output` (Cobrados separadamente pelos provedores).
- `latency_ms` para cruzar experiência do usuário vs modelo usado.
- `fallback_triggered` para auditar quanto estamos gastando em modelos de redundância.

### Estimativa e Limites
Atualmente 1 mensagem média do sistema MedAI consome:
- ~800 tokens de contexto e sistema.
- ~250 tokens de retorno (campanhas longas).
Custo médio na Anthropic (Sonnet): ~$0.003 por mensagem.

**Alerta:** Caso o tráfego da clínica no mês gere uma conta superior a $5.00 na camada de IA, a coluna `status` alertará para possível abuso de IA (necessário review).
