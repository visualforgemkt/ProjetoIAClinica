const Joi = require('joi');

const CampaignSchema = Joi.object({
  nome: Joi.string().required().default('Campanha Gerada'),
  slogan: Joi.string().allow('').optional(),
  estrategia: Joi.object({
    objetivo: Joi.string().required(),
    publicoAlvo: Joi.string().required(),
    abordagem: Joi.string().required(),
    ctaPrincipal: Joi.string().required(),
    posicionamento: Joi.string().allow('').optional()
  }).required(),
  copyPrincipal: Joi.string().required(),
  posts: Joi.array().items(
    Joi.object({
      num: Joi.number().required(),
      tipo: Joi.string().required(),
      titulo: Joi.string().required(),
      legenda: Joi.string().required(),
      slides: Joi.array().items(Joi.string()).optional()
    })
  ).default([]),
  stories: Joi.array().items(
    Joi.object({
      num: Joi.number().required(),
      tipo: Joi.string().required(),
      conteudo: Joi.string().required()
    })
  ).default([]),
  whatsapp: Joi.string().allow('').optional(),
  hashtags: Joi.array().items(Joi.string()).default([]),
  calendario: Joi.array().items(
    Joi.object({
      dia: Joi.string().required(),
      acao: Joi.string().required(),
      horario: Joi.string().allow('').optional(),
      obs: Joi.string().allow('').optional()
    })
  ).default([]),
  briefingVisual: Joi.object({
    conceito: Joi.string().required(),
    composicao: Joi.string().required(),
    estilo: Joi.string().required(),
    emocao: Joi.string().required(),
    cores: Joi.string().required(),
    promptImagem: Joi.string().required()
  }).optional(),
  versoes: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      tag: Joi.string().required(),
      copy: Joi.string().required()
    })
  ).optional(),
  metricas: Joi.array().items(
    Joi.object({
      icone: Joi.string().optional(),
      titulo: Joi.string().required(),
      desc: Joi.string().required()
    })
  ).optional(),
  confidenceScore: Joi.number().min(0).max(100).default(90),
  riskScore: Joi.number().min(0).max(100).default(10)
});

const ImageSchema = Joi.object({
  subject: Joi.string().required(),
  contentPrompt: Joi.string().required(),
  style: Joi.string().required(),
  userSpecifiedStyle: Joi.boolean().default(false),
  extraNegatives: Joi.string().allow('').optional(),
  confidenceScore: Joi.number().min(0).max(100).default(90)
});

module.exports = {
  CampaignSchema,
  ImageSchema
};
