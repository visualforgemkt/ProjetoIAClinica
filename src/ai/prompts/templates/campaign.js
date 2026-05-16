const ContextLayer = require('../context/clinicContext');

function buildCampaignSystem(clinic, topic) {
  const ctx    = ContextLayer.build(clinic);
  const nome   = clinic?.name || 'a clínica';
  const esp    = clinic?.specialty || 'médica';
  const seed   = Math.floor(Math.random() * 9000) + 1000;
  const angulos = [
    'EMOCIONAL: histórias reais, amor familiar como motor da ação preventiva',
    'EDUCATIVO: dados, fatos científicos, mitos vs verdades, autoridade médica',
    'PREVENTIVO: antecipação, checklist prático, empoderamento do paciente',
    'AUTORIDADE: posicionamento da clínica, diferenciais, expertise',
    'SAZONAL: urgência do momento atual, por que agir agora'
  ];
  const angulo = angulos[seed % angulos.length];

  const extra  = [
    clinic?.differentials ? `Diferenciais: ${clinic.differentials}.` : '',
    clinic?.instagram     ? `Instagram: ${clinic.instagram}.`         : '',
    clinic?.contact       ? `Contato: ${clinic.contact}.`             : ''
  ].filter(Boolean).join(' ');

  return [
    'Você é uma equipe completa de marketing médico da MedAI Pro: estrategista, copywriter sênior, social media specialist e diretor criativo.',
    'Nunca gere informações clínicas falsas ou perigosas (Halucinação de risco). Baseie-se apenas em ciência médica consolidada.',
    ctx,
    '',
    `MISSÃO: Campanha profissional completa sobre "${topic}" para ${nome} (${esp}). ${extra}`,
    '',
    `ÂNGULO CRIATIVO (seed ${seed}): ${angulo}`,
    'Use este ângulo em todo o conteúdo. Garanta variação.',
    '',
    'REGRA: Responda APENAS com JSON válido conforme o exemplo abaixo:',
    JSON.stringify({
      nome: "Nome da Campanha",
      slogan: "Slogan Curto",
      estrategia: {
        objetivo: "...",
        publicoAlvo: "...",
        abordagem: "...",
        ctaPrincipal: "...",
        posicionamento: "..."
      },
      copyPrincipal: "Texto longo do post...",
      hashtags: ["tag1", "tag2"],
      calendario: [{ dia: "Dia 1", acao: "Postar X", horario: "09:00", obs: "..." }],
      briefingVisual: { conceito: "...", promptImagem: "Prompt em inglês para gerador de imagem" },
      metricas: [{ titulo: "Engajamento", desc: "...", icone: "📈" }]
    }, null, 2),
    '',
    'Lembre-se: use camelCase exatamente como mostrado acima (ex: publicoAlvo, ctaPrincipal).',
    'Lembre-se de sempre gerar o campo confidenceScore e riskScore (de 0 a 100).',
  ].join('\n');
}

module.exports = { buildCampaignSystem };
