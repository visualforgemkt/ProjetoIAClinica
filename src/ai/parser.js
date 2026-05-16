const logger = require('../utils/logger');
const { CampaignSchema, ImageSchema } = require('./schemas');

class AIParser {
  /**
   * Extrai blocos JSON de textos misturados com Markdown
   */
  static extractJson(text) {
    if (!text) return '';
    const raw = text.trim();
    // Tenta capturar o bloco entre ```json ... ```
    const markdownMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1];
    }
    // Tenta capturar o primeiro bloco com chaves
    const bracketMatch = raw.match(/\{[\s\S]*\}/);
    if (bracketMatch) {
      return bracketMatch[0];
    }
    return raw;
  }

  /**
   * Conserta erros comuns de formatação JSON gerados pela IA
   */
  static autoFixJson(jsonStr) {
    let fixed = jsonStr.replace(/,\s*([\]}])/g, '$1'); // Remove vírgulas extras no final de arrays/objetos
    // Se faltarem chaves ou colchetes, tenta adicionar (algoritmo ingênuo para truncamentos leves)
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    // Auto-completar aspas não fechadas no fim do arquivo se cortado
    const quotes = (fixed.match(/(?<!\\)"/g) || []).length;
    if (quotes % 2 !== 0) fixed += '"';

    for (let i = 0; i < (openBrackets - closeBrackets); i++) fixed += ']';
    for (let i = 0; i < (openBraces - closeBraces); i++) fixed += '}';

    return fixed;
  }

  /**
   * Parseia e valida usando Schema Contracts (Joi)
   */
  static parse(text, type) {
    const jsonStr = this.extractJson(text);
    let data = null;

    try {
      data = JSON.parse(jsonStr);
    } catch (err) {
      logger.warn('JSON quebrado, tentando autofix...', { error: err.message });
      const fixed = this.autoFixJson(jsonStr);
      try {
        data = JSON.parse(fixed);
      } catch (fixErr) {
        logger.error('Parser falhou mesmo com autofix', { error: fixErr.message });
        throw new Error('PARSING_FAILURE');
      }
    }

    // Validação com Schema Contract
    let schema = null;
    if (type === 'campaign') schema = CampaignSchema;
    if (type === 'image') schema = ImageSchema;

    if (schema) {
      const { error, value } = schema.validate(data, { stripUnknown: true, abortEarly: false });
      if (error) {
        logger.error('AI Output Validation Failed', { 
          details: error.details.map(d => d.message).join(', '),
          type
        });
        // Retornamos o valor parseado até o momento, mas marcamos como fallback
        // Para não quebrar a tela do usuário se apenas um campo secundário falhar
        value._schemaWarnings = error.details;
        return value;
      }
      return value;
    }

    return data;
  }
}

module.exports = AIParser;
