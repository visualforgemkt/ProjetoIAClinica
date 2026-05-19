# [LEGADO] MedAIPro.html — Documento de Depreciação

Este documento cataloga o arquivo `MedAIPro.html` localizado na raiz do projeto como **LEGADO (DEPRECADO)** e formaliza a transição total para a arquitetura moderna baseada em **React / Vite** dentro do diretório `frontend/`.

---

## ⚠️ Status do Arquivo
* **Status**: Deprecado (Legacy)
* **Finalidade**: Serve estritamente como modelo visual de alta fidelidade para transição de design, HSL color tokens, micro-animações CSS e estratégias UX.
* **Proibição**: Nenhuma nova funcionalidade ou lógica de backend deve ser acoplada ao `MedAIPro.html`. Toda manutenção e evolução do frontend do MedAI Pro ocorrerá de forma definitiva em `frontend/src/`.

---

## 🎨 Especificações de UX a serem Preservadas na Migração

Ao migrar e transformar as telas do monolito em componentes React reutilizáveis, os seguintes elementos de excelência visual devem ser rigorosamente preservados:

1. **Tokens de Design (HSL & Cores Premium)**:
   * Dark Mode profundo de alta qualidade: `background: #07090F;`
   * Tons de azul com efeito brilhante: HSL personalizados e gradientes com blur (`backdrop-filter`).
   * Gradientes dourados de destaque para planos corporativos/Premium.

2. **Jornada de Onboarding Wizard**:
   * O fluxo estruturado de 6 etapas interativas com transições e animações de entrada para cada etapa.
   * A experiência do "Wow Moment" acionada no Passo 6, disparando imediatamente a primeira campanha gerada sem exigir cliques manuais adicionais.

3. **Campaign Document Strategizer (Renderizador de Campanhas)**:
   * Interface tabular horizontal contendo as abas: 📋 Estratégia, ✍️ Copy, 📱 Posts, 📲 Stories, 🎨 Visual, 🔀 Versões, 📊 Métricas.
   * Botões de cópia rápida (`cpText`) com feedback de transição instantâneo ("✓ Copiado").
   * Briefing visual contendo ganchos acoplados para geração dinâmica de imagens utilizando IA.

4. **Satisfação de Pilotos (Feedback 👍 👎)**:
   * Sistema minimalista de botões de feedback rápido de utilidade ao final de cada campanha ou chat.
   * Coleta ativa de comentários construtivos ("O que faltou?") para os 3-5 pilotos monitorados no go-live.
