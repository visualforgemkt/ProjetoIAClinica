# Governança de Inteligência Artificial - MedAI Pro

Este documento estabelece as diretrizes de governança interna para o uso de IA Generativa no MedAI Pro.

## 1. Limites de Uso
A IA na MedAI Pro tem os seguintes limites arquitetônicos e conceituais:
- **Proibição Clínica:** O sistema está instruído no nível do sistema (System Prompt) a nunca fornecer diagnóstico, prescrição ou conselho médico para casos reais específicos.
- **Limites de Tokens/Requisições:** Aplicados para evitar abusos e custos descontrolados.

## 2. Tratamento de Erros e Fallback
- Requisições falhas ou com recusas de segurança por parte da Anthropic/OpenAI são registradas nos logs (sem dados sensíveis) para revisão.
- A plataforma apresenta uma mensagem genérica de erro ao usuário ("Erro ao processar. Tente novamente.") e não exibe stack traces detalhados.

## 3. Revisão Humana Obrigatória (Human-in-the-Loop)
- **Princípio Central:** Todo output gerado pela IA da MedAI Pro (textos, imagens, campanhas) é considerado um **Rascunho** ou **Proposta**.
- A plataforma exige que o profissional responsável aprove e/ou edite o conteúdo antes de sua utilização externa. Esse fato está presente nos Termos de Uso e no Disclaimer de Interface.

## 4. Tratamento de Conteúdo Proibido
A MedAI Pro depende das APIs de moderação embutidas nos provedores subjacentes (OpenAI, Anthropic). Casos onde a moderação barra o conteúdo são tratados como erro pelo backend, protegendo o sistema.

## 5. Responsabilidades
- **A MedAI Pro (Provedora da plataforma):** Responsável pela estabilidade, disponibilidade, segurança da infraestrutura de IA e aplicação correta de prompts de contexto e segurança.
- **O Profissional / Clínica (Usuário):** Responsável por verificar a precisão do conteúdo gerado, conformidade com regras locais de publicidade médica (CFM no Brasil) e não inserir dados de pacientes.
