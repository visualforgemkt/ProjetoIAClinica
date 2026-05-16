# Relatório Técnico: AI Reliability Sprint (Fase 5 - MedAI Pro)
**Data:** Maio de 2026

## 1. Resumo Executivo
Este sprint teve como objetivo reestruturar a arquitetura de inteligência artificial da plataforma MedAI Pro, substituindo o parsing genérico por **Output Contracts** estritos e estabilizando as respostas do modelo. O resultado principal é a eliminação do risco de "falhas silenciosas", vazamento de contexto ou quebras na interface por retornos mal formatados da IA. A cobertura de testes automatizados da camada de IA saltou de ~6% para **65.5%**.

---

## 2. P0 — Output Contracts & Schema Validation
Criados contratos formais (`src/ai/schemas.js`) utilizando a biblioteca **Joi**.
- **`CampaignSchema`:** Garante as chaves obrigatórias como `nome`, `estrategia`, `copyPrincipal`, `posts` (arrays definidos) e `calendario`.
- **`ImageSchema`:** Define rigorosamente `subject`, `contentPrompt` e valida o `style` de uma lista fechada (enum) aceita pela engine (VIE).
- **Fallback Tolerante:** Se o contrato principal for quebrado, o sistema agora devolve parciais funcionais com a flag `_schemaWarnings` anexada, mitigando quebra no frontend ao mesmo tempo em que notifica o backend de comportamentos anômalos.

---

## 3. P0 — Parser Resiliente (`AIParser`)
A orquestração agora transita pela nova subcamada de parsing (`src/ai/parser.js`):
- **Desencapsulamento Markdown:** Capaz de extrair chaves `{}` caso o modelo responda com blocos ` ```json `.
- **JSON Auto-fixer:** Adicionado algoritmo capaz de reconstruir arrays e objetos truncados (adicionando aspas, colchetes e chaves faltantes) quando a resposta extrapola o limite de tokens.
- **Isolamento de Erros:** Erros graves no parser disparam throws padronizados (capturados e monitorados pelo Winston/Datadog sem expor lógicas internas no log).

---

## 4. P0 — System Prompt Consolidation
A base monolítica do Orchestrator foi estilhaçada em módulos coerentes (`src/ai/prompts/`):
- `/context/clinicContext.js`: Garante blindagem de isolamento multi-tenant montando uma string padronizada com o perfil, local e cores exclusivas da clínica solicitante.
- `/templates/campaign.js`: Template estruturado e parametrizável focando em copywriting médico seguro.
- `/system/imagePrompt.js`: Diretrizes otimizadas com o "Mapa de Estilos" da geradora visual.

---

## 5. P1 — Proteção contra Alucinações
- **Prompting:** Inserção de diretivas agressivas nos base-prompts: *"Nunca gere informações clínicas falsas ou perigosas (Halucinação de risco). Baseie-se apenas em ciência médica consolidada."*
- **Telemetria (Autoscritica da IA):** Forçamos a IA a retornar o seu próprio `confidenceScore` (nível de confiança estatística de adequação) e um `riskScore` (grau de sensibilidade médica do tema) embutidos no Output Contract para filtragem automatizada de Risco P1 no futuro.

---

## 6. Evolução da Cobertura de Testes (Coverage Report)

| Módulo Core          | Coverage Anterior | Coverage Atual |
|----------------------|------------------|---------------|
| `ai/orchestrator.js` | 4.16%            | **91.30%**    |
| `ai/parser.js`       | N/A              | **90.90%**    |
| `ai/schemas.js`      | N/A              | **100.00%**   |
| `ai/prompts/*`       | N/A              | **100.00%**   |
| **Total da Camada AI** | ~6.00%           | **65.51%**    |

---

## 7. Riscos Residuais (Roadmap)
* **API Gateway AI (`gateway.js`):** Ainda apresenta baixa cobertura de testes (10.71%) porque depende da requisição direta aos provedores (OpenAI/Anthropic). Os mocks do Axios na suíte E2E devem cobrir esse gap futuramente.
* **Telemetria de Custo (AI Observability):** A injeção dos dados de token no banco e no datadog ainda precisa de testes de integração, para validar a tabela `usage_logs`.

## 8. Conclusão Técnica
O motor generativo da MedAI Pro deixou de ser uma "caixa preta" frágil e tornou-se um **Módulo Resiliente com Forte Contrato de Interface**. Respostas imprevisíveis são normalizadas e corrigidas, falhas no fornecimento de atributos acionam fallbacks de schema, e tudo foi envelopado em um fluxo determinístico testável, qualificando a plataforma para a Operação Estável.
