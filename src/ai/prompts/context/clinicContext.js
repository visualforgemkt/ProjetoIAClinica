class ContextLayer {
  static build(clinic) {
    if (!clinic) return '';
    const parts = [];
    if (clinic.name)          parts.push(`Clínica: ${clinic.name}`);
    if (clinic.specialty)     parts.push(`Especialidade: ${clinic.specialty}`);
    if (clinic.city)          parts.push(`Localização: ${clinic.city}`);
    if (clinic.target_public) parts.push(`Público-alvo: ${clinic.target_public}`);
    if (clinic.services)      parts.push(`Serviços: ${clinic.services}`);
    if (clinic.differentials) parts.push(`Diferenciais: ${clinic.differentials}`);
    if (clinic.tone)          parts.push(`Tom de comunicação: ${clinic.tone}`);
    if (clinic.visual_style)  parts.push(`Estilo visual: ${clinic.visual_style}`);
    if (clinic.instagram)     parts.push(`Instagram: ${clinic.instagram}`);
    if (clinic.contact)       parts.push(`Contato: ${clinic.contact}`);
    if (clinic.brand_color1)  parts.push(`Cor principal: ${clinic.brand_color1}`);
    return parts.length > 0
      ? `\n\n[CONTEXTO DA CLÍNICA — use sempre]\n${parts.join('\n')}`
      : '';
  }
}

module.exports = ContextLayer;
