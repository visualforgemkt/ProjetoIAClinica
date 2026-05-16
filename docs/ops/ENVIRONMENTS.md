# Ambientes (Environments) - MedAI Pro

A operação agora trabalha com a separação formal de 3 ambientes, garantindo estabilidade e escalabilidade de desenvolvimento.

## 1. Development (Dev)
- **Propósito:** Criação de features e testes rápidos na máquina do engenheiro.
- **Banco de Dados:** Instância local do Supabase ou schema `public_dev`.
- **IA:** Utiliza provedores gratuitos/locais (Ollama) ou contas "Sandbox" da OpenAI.
- **Log Level:** `debug` impresso direto no Console.

## 2. Staging (Homologação)
- **Propósito:** Último passo antes da produção. Teste da pipeline de CI/CD (Github Actions). Homologação com dados mascarados.
- **Banco de Dados:** Projeto Supabase separado (`medai-staging`).
- **Deploy:** URL fixa (ex: `staging.medai.pro`).
- **Billing:** Cartões de teste do Stripe ativos. Stripe Webhooks rodando no servidor.
- **Feature Flags:** Permite ligar features "Beta" que ainda não irão para prod.

## 3. Production (Produção)
- **Propósito:** Sistema voltado para o cliente final pagante.
- **Banco de Dados:** `medai-production` (com Backups Point-in-Time Recovery ativos).
- **IA:** Acesso irrestrito a Anthropic Claude 3.5 Sonnet com *Fallback* estruturado.
- **Observabilidade:** Logs não saem em console. São enviados via agente para o **Datadog** ou **Sentry**.
- **Deploy:** Apenas via `main` após aprovação de Pull Request e sucesso em *todas* as rotinas do CI/CD (Testes + Lint).
