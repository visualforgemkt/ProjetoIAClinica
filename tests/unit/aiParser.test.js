const AIParser = require('../../src/ai/parser');
const { CampaignSchema, ImageSchema } = require('../../src/ai/schemas');

describe('AIParser - Output Validation', () => {
  it('deve extrair e parsear JSON válido corretamente', () => {
    const raw = `
      Aqui está a campanha gerada:
      \`\`\`json
      {
        "nome": "Campanha Teste",
        "estrategia": {
          "objetivo": "Vender",
          "publicoAlvo": "Pacientes",
          "abordagem": "Direta",
          "ctaPrincipal": "Agende já"
        },
        "copyPrincipal": "Texto principal."
      }
      \`\`\`
      Fim da mensagem.
    `;
    const result = AIParser.parse(raw, 'campaign');
    expect(result.nome).toBe('Campanha Teste');
    expect(result.estrategia.objetivo).toBe('Vender');
    expect(result.confidenceScore).toBe(90); // default fallback
  });

  it('deve realizar auto-fix em JSON quebrado com colchetes não fechados', () => {
    const raw = `{
      "nome": "Quebrado",
      "estrategia": { "objetivo": "A", "publicoAlvo": "B", "abordagem": "C", "ctaPrincipal": "D" },
      "copyPrincipal": "Copy",
      "posts": [
        { "num": 1, "tipo": "Feed", "titulo": "A", "legenda": "B" }
    `; // faltando ] e }
    
    const result = AIParser.parse(raw, 'campaign');
    expect(result.nome).toBe('Quebrado');
    expect(result.posts.length).toBe(1);
  });

  it('deve retornar default em campos ausentes devido a validação Schema Contract', () => {
    const raw = `{ "subject": "Foto de clínica", "contentPrompt": "Clinic photo", "style": "realistic_photo" }`;
    const result = AIParser.parse(raw, 'image');
    expect(result.subject).toBe('Foto de clínica');
    expect(result.userSpecifiedStyle).toBe(false); // default value set by Joi
  });

  it('deve manter _schemaWarnings se houver falha de contrato e retornar partial result', () => {
    const raw = `{ "nome": "Inválido" }`; // Faltando estratégia e copyPrincipal
    const result = AIParser.parse(raw, 'campaign');
    expect(result._schemaWarnings).toBeDefined();
    expect(result._schemaWarnings.length).toBeGreaterThan(0);
  });
});
