# Política de Retenção de Dados - MedAI Pro

**Objetivo:** Estabelecer diretrizes claras para o armazenamento e descarte de dados pessoais e operacionais, em conformidade com a LGPD e boas práticas de segurança.

## 1. Períodos de Retenção

| Categoria de Dado | Período de Retenção | Gatilho para Exclusão / Anonimização |
| :--- | :--- | :--- |
| **Dados Cadastrais (Conta Ativa)** | Indeterminado | Enquanto o contrato/assinatura estiver vigente. |
| **Histórico de Conversas (IA)** | Durante a vida da conta | Pode ser excluído manualmente pelo usuário ou ao cancelar a conta. |
| **Logs de Acesso e IPs** | 6 meses | Retenção obrigatória segundo o Marco Civil da Internet (Art. 15). |
| **Dados após Cancelamento** | 30 dias | Após o pedido de exclusão de conta, os dados permanecem por 30 dias para backup/recuperação e, após isso, são removidos. |

## 2. Processo de Exclusão (Data Deletion)

Quando uma clínica solicita exclusão via painel (ou API `/api/user/delete-account`):
1. A conta é marcada para exclusão.
2. O registro principal na tabela `users` é deletado (o sistema de cascata do PostgreSQL se encarrega de deletar sessões, conversas, campanhas e logs associados).
3. Backups do banco de dados expiram ciclicamente a cada 30 dias, eliminando qualquer rastro residual após esse período.

## 3. Anonimização
Logs de uso não contêm dados sensíveis ou informações pessoais diretas. Se necessário para métricas históricas de billing após o cancelamento, o `clinic_id` será desconectado de identificadores reais, tornando a informação estatística anônima.
