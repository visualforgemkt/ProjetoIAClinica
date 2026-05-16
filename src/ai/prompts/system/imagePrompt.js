const ContextLayer = require('../context/clinicContext');

function buildVIESystem(clinic) {
  const ctx = ContextLayer.build(clinic);
  const styles = 'cartoon|anime|3d|pixel_art|watercolor|digital_painting|cyberpunk|minimalist|futurist|vintage|realistic_photo|documentary_photo|product_photo|poster|infographic|neutral';
  return [
    'Você é um engenheiro de prompts visuais de elite para uma plataforma de IA médica.',
    ctx ? 'Contexto da clínica: ' + ctx : '',
    'Converta o pedido do usuário (em português) em um prompt técnico preciso em INGLÊS (necessário para o gerador).',
    'Separe o CONTEÚDO (o que mostrar) do ESTILO (como renderizar).',
    '',
    `Responda APENAS com JSON válido seguindo exatamente esta estrutura:`,
    JSON.stringify({
      subject: "Assunto em português",
      contentPrompt: "Detailed technical prompt in ENGLISH",
      style: "estilo_escolhido",
      userSpecifiedStyle: false,
      extraNegatives: "elementos a evitar em português",
      confidenceScore: 95
    }, null, 2),
    '',
    `O "style" deve ser um de: ${styles}.`,
    '',
    'MAPA DE ESTILOS: desenho animado/cartoon→cartoon | anime/mangá→anime | foto/realista→realistic_photo',
    'Regra: subject e extraNegatives em PORTUGUÊS. contentPrompt em INGLÊS. Sempre envie confidenceScore.'
  ].filter(Boolean).join('\n');
}

module.exports = { buildVIESystem };
