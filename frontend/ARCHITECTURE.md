# Arquitetura Frontend — MedAI Pro (Fase 3)

## Visão Geral
Nesta fase, o monólito `MedAIPro.html` (~1740 linhas) foi completamente decomposto e substituído por uma arquitetura React profissional, escalável e de fácil manutenção, baseada em Vite.

### O que mudou?

1. **Eliminação do Monólito:**
   - Todo o código foi separado na nova pasta `/frontend` utilizando módulos ES e Vite.
   - Divisão clara de pastas: `/components`, `/pages`, `/layouts`, `/services`, `/store` e `/styles`.

2. **Lógica de IA 100% no Backend (Dumb Frontend):**
   - O Frontend não constrói mais *prompts*, não decide *intents* e não valida saídas de IA.
   - O arquivo `Chat.jsx` apenas captura o texto do usuário, envia para a API e renderiza a resposta retornada (incluindo o Disclaimer Legal adicionado na Fase 2).

3. **Design System Consistente (Premium UI):**
   - Criação de tokens CSS globais (`design-tokens.css`) e componentes modulares (`Button.jsx`, `Input.jsx`).
   - Visual inspirado em *Linear* e *Vercel*: paleta monocromática com detalhes em azul (`#0070F3`), espaços generosos, bordas suaves (`radius-md`) e sombras refinadas (`shadow-lg`).

4. **Estado Centralizado (Zustand):**
   - O gerenciamento de estado global foi implementado com `Zustand` (`useAuthStore.js`), substituindo dezenas de `let` e chamadas confusas no escopo global do HTML antigo.
   - O estado de autenticação é persistido automaticamente no `localStorage`.

5. **Camada de Serviços Dedicada:**
   - Criação de `src/services/api.js` para isolar lógica HTTP. Nenhum componente React faz `fetch()` direto com URLs e Headers *hardcoded*.

6. **Roteamento Protegido (React Router):**
   - `App.jsx` gerencia as rotas com `react-router-dom`.
   - Implementação de um `<ProtectedRoute>` que redireciona automaticamente para o `/login` se o token da *Store* não for encontrado.

### Estrutura de Diretórios Atual

```text
/frontend
 ├── index.html
 ├── package.json
 ├── vite.config.js
 └── src
      ├── App.jsx             (Roteamento e Proteção de Rotas)
      ├── main.jsx            (Entrypoint e injeção do CSS)
      ├── components/ui/      (Botões, Inputs, Cards - Design System)
      ├── layouts/            (AuthLayout e MainLayout)
      ├── pages/              (Login, Dashboard, Chat)
      ├── services/           (api.js)
      ├── store/              (Zustand: useAuthStore.js)
      └── styles/             (global.css, design-tokens.css)
```

## Benefícios Imediatos
- **Sem dívida técnica estrutural:** É possível adicionar páginas e componentes sem risco de colisão de classes ou funções globais.
- **Escalabilidade:** O time de desenvolvimento pode trabalhar em páginas/componentes separados de forma concorrente.
- **Performance:** Componentização no React com Vite reduz tempos de pintura de UI e re-renders desnecessários.
