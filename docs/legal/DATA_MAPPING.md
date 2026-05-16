# Mapeamento de Dados Sensíveis - MedAI Pro

Este documento descreve a classificação e o fluxo dos dados dentro da plataforma.

## 1. Fluxo de Entrada de Dados

| Ponto de Coleta | Dados Coletados | Classificação | Destino de Armazenamento | Passa pela IA? |
| :--- | :--- | :--- | :--- | :--- |
| **Cadastro** | Nome, E-mail, Senha | Interno / Confidencial | `users` (DB) | Não |
| **Configuração de Clínica** | Nome da clínica, Especialidade, Contato, Cores, Tom de Voz | Público / Interno | `clinics` (DB) | Sim (como contexto) |
| **Chat IA (Prompts)** | Textos enviados pelo usuário solicitando campanhas, imagens, etc. | Confidencial | `messages` (DB) e API OpenAI/Anthropic | Sim |
| **Login** | IP, User-Agent | Interno / Técnico | `sessions` e Logs | Não |

## 2. Riscos de Dados Sensíveis Médicos

A plataforma **NÃO** é desenhada para receber:
- Prontuários médicos
- Dados de saúde de pacientes (identificáveis)
- Exames laboratoriais
- Receitas ou histórico clínico

**Mitigação:**
O sistema fornece disclaimers e Termos de Uso explícitos proibindo o envio dessas informações. O usuário é o controlador desses dados e concorda em não trafegar dados sensíveis de terceiros na plataforma de marketing.

## 3. Classificação de Risco
- **Público:** Dados básicos da clínica (nome, redes sociais).
- **Interno:** Metadados, logs de sistema (sem PII), tokens de API (mascarados).
- **Sensível:** Senhas (armazenadas em hash bcrypt), E-mails.
- **Crítico:** Prompts de IA contendo informações inadvertidas. Não controlamos o input em texto livre, dependemos das políticas de uso aceitável e disclaimers.
