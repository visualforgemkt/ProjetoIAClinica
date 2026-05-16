# Relatório Técnico: Event Tracking, User Journey & Feedback Loop (Fase 7)
**Data:** Maio de 2026

## 1. Resumo Executivo
A **Fase 7** consolida a MedAI Pro como uma plataforma viva ("Feedback-Driven"). Não somos mais dependentes exclusivamente da ação humana. O sistema agora acompanha cada respiração do usuário através de um **Dicionário Global de Eventos**, desenha dinamicamente a sua **Jornada no Funil de Conversão** (Visitor ➔ Activated ➔ Recurrent) e engatilha comunicações personalizadas usando a IA quando detecta abandono de fluxo ou inatividade.

---

## 2. P0 — Dicionário de Eventos (`TrackingService`)
Foi criado o padrão global oficial (Taxonomia) para evitar eventos "sujos" ou sem padronização no banco:
* **Fluxo Core:** `USER_LOGIN`, `ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`
* **Valor Percebido:** `CAMPAIGN_CREATED`, `CAMPAIGN_VIEWED`, `IMAGE_GENERATED`, `IG_CONTENT_CREATED`, `FAQ_UTILIZED`, `AI_TRIGGERED`
* **Interação:** `SUGGESTION_ACCEPTED`, `SUGGESTION_IGNORED`, `FLOW_ABANDONED`

Todos os eventos gravam o `clinic_id`, `user_id`, `module`, `screen` e um payload JSON flexível em `metadata`.

---

## 3. P0 — User Journey & Funil de Conversão (`user_journeys`)
A tabela `user_journeys` funciona como um "Raio-X" financeiro/produto de cada clínica. O `TrackingService` processa os eventos passivamente em background e move o *Current Stage* da clínica no funil:
1. **REGISTERED:** Fez cadastro/login.
2. **ONBOARDED:** Terminou o quiz inicial (Liberou o contexto).
3. **ACTIVATED:** (AHA Moment!) Gerou a primeira campanha mágica.
4. **RECURRENT:** Voltou e usou a IA várias vezes (Clínica blindada contra churn).
5. **CHURN_RISK:** Identificada por ausência.

Isso viabiliza que analistas (ou sistemas automáticos) saibam exatamente *onde* no funil as clínicas estão desistindo do sistema.

---

## 4. P1 — AI Feedback Loop (`ai_feedback`)
Foi incluída a estrutura de aprendizagem de máquina "Reinforcement Learning from Human Feedback (RLHF)" em nível de negócio. 
Toda vez que a plataforma sugere um Post e a clínica:
* Aceita e publica ➔ `interaction_type = RECOMMENDATION`, `action = ACCEPTED`
* Edita e corrige a IA ➔ `action = MODIFIED`, guarda o log de `feedback_notes`.
* Ignora e fecha a tela ➔ `action = REJECTED`.

Esse repositório será usado futuramente para afinar (Fine-Tuning) ou enriquecer o prompt (`SystemPrompt`) no Orchestrator, fazendo com que a IA pare de cometer os mesmos erros de estilo ou tom repetidamente para aquela mesma clínica.

---

## 5. P1 — Gatilhos e Smart Action Center (`TriggerService`)
Criada a engine de proatividade da MedAI Pro: `TriggerService`.
* **Motor Baseado em Tempo/Ação:** Analisa o estágio de vida da clínica (`user_journeys`) e a data do último login (`clinic_metrics`).
* **Ação:** Se detecta inatividade de 7 dias após o Onboarding, não manda um e-mail estático. Ele **aciona o AI Orchestrator internamente** ("Escreva uma notificação push baseada no histórico desta clínica recomendando prevenção") e injeta na tabela `smart_triggers`.
* **Smart Action Center:** O frontend consumirá `getActiveTriggers()` para popular um Hub Central de Oportunidades na Home. Em vez de "Criar nova campanha" (vazio), a tela exibirá cartões ricos: *"Notamos ausência sua. Criamos este rascunho rápido sobre prevenção de gripes. Quer postar?"*.

---

## 6. Arquitetura de Dados Entregue
Script `sql/005_event_tracking.sql` aplicado com sucesso:
1. `ai_feedback`: Armazena o Loop de feedback orgânico do usuário com a IA.
2. `user_journeys`: O pipeline materializado do funil de conversão.
3. `smart_triggers`: Fila de notificações proativas e inteligentes aguardando visualização no painel.

---

## 7. Conclusão Final (Resultados Alcançados)
O fluxo proposto **Usuário → Evento → Análise → Insight → Ação → Aprendizado** está codificado.
A infraestrutura está pronta para fazer a MedAI Pro "cuidar" ativamente de seus usuários. Todo clique é mapeado, toda estagnação no funil engatilha uma ação de salvamento inteligente, e todo sim/não dado à IA agora serve de base de treinamento. A plataforma atingiu seu ápice como **Plataforma Analítica e Preditiva de Geração de Valor.**
