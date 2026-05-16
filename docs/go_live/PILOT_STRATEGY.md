# Estratégia de Piloto com Clientes Reais (Pre Go-Live)
**Data:** Maio de 2026

## 1. Resumo Executivo
A fase "Pre Go-Live" da MedAI Pro pausa momentaneamente o avanço tecnológico para lapidar a camada de produto e a percepção de valor humano. O objetivo central é converter visitantes em *Heavy Users* nos primeiros 2 minutos de interação, estabelecer uma estrutura mínima de faturamento sustentável e preparar um canal de suporte oficial para acolher os clientes pioneiros (Piloto).

---

## 2. P0 — Onboarding Real ("The WOW Moment")
A jornada do usuário inicial foi redesenhada em `onboardingController.js` para ser interativa e imediatamente recompensadora.

### O Fluxo:
- **Passo 1 a 5:** Coleta ativa (Nome, Especialidade, Público, Tom, Instagram). Esta etapa preenche as tabelas de contexto (`onboarding_profiles` e `clinics`), eliminando para sempre a necessidade do usuário precisar "aprender a fazer prompts".
- **Passo 6 (Mágica):** O clique final "Concluir" **NÃO** leva a uma dashboard vazia. O Backend roda um processamento síncrono da IA, e o usuário "cai" direto em sua **Primeira Campanha Gerada**, totalmente baseada nos dados do passo anterior. 
- *Métrica de Sucesso (KPI):* Tempo até a 1ª Campanha < 2 minutos.

---

## 3. P0 — Dashboard Executivo e UX
O Frontend será atualizado com um Dashboard simplificado e acionável. Nada de botões complexos.
* **Header:** Resumo do "Health Score" e Métrica de engajamento (Insights).
* **Smart Action Center:** "Notamos que o Novembro Azul se aproxima. Clique para gerar sua pauta." (Alimentado pela tabela `smart_triggers` feita na Fase 7).
* **Histórico Recente:** As últimas 3 campanhas criadas para acesso rápido.

---

## 4. P0 — Billing (Estrutura Comercial)
Criado o schema base de planos na tabela `subscription_plans` (`sql/006_pre_go_live.sql`).
* **Plano TRIAL:** 7 dias grátis, focado em mostrar o "Wow Moment". (Limitado a 3 campanhas).
* **Plano PRO (Piloto):** Assinatura recorrente padrão.
* Todo evento de limite e uso consumirá a arquitetura da tabela `usage_logs` implementada na Fase 5. Se os tokens excederem o plano, o acesso restringe automaticamente ao final do faturamento.

---

## 5. P0 — Feedback Nativo
* A estrutura do Feedback Loop construída na Fase 7 (`ai_feedback`) será exposta na UI com `👍` ou `👎` ao final de cada campanha gerada.
* Se clicar em "👎", um modal perguntará "O que faltou?", populando o campo `feedback_notes` para enriquecermos os prompts (Fine-Tuning) manualmente ao fim do Piloto.

---

## 6. P1 — Suporte Técnico (Helpdesk)
Para o piloto, clientes enfrentarão dúvidas.
* Criada tabela `support_tickets` para abertura formal de chamados.
* Centralização dos pedidos para que eventuais falhas (bugs do sistema) sejam mapeados rapidamente e atrelados ao ID da Clínica, garantindo um "White-Glove Service" aos early-adopters.

---

## 7. P1 — Métricas de Acompanhamento (Piloto)
Nossa missão no Go-Live é validar hipóteses usando a tabela `user_journeys` e `product_events`:
1. **Activation Rate:** % de usuários que terminam o Onboarding e visualizam a primeira campanha automática (Wow Moment).
2. **Time to First Value:** Tempo gasto desde a criação da conta até a visualização da primeira peça útil.
3. **Week 1 Retention:** Quantas clínicas voltaram após 7 dias para usar de forma recorrente (Atingiram o status `RECURRENT`).
4. **AI Acceptance Rate:** Razão entre interações 👍 e interações totais.

---

## 8. Relatório de Riscos (Go-Live)
* **Demora no Onboarding:** A IA (Claude/GPT) demora entre 4 e 10 segundos para gerar a campanha mágica. Se não houver uma animação rica ("Criando sua equipe de marketing...", "Buscando referências médicas...") o usuário fechará a aba achando que travou.
* **Custo do Trial:** O modelo "Trial Automático" sem cartão de crédito exigido pode atrair usuários curiosos que esgotem a cota da OpenAI e não convertam. É preciso travar rigorosamente os limites da camada Trial.

**Conclusão:** A MedAI Pro atingiu a maturidade em sua versão Mínima Viável Comercial (MVP-C). O produto não é mais um experimento de código; é um Software pronto para faturamento, suporte e crescimento.
