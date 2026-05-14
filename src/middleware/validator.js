const Joi = require('joi');
const { error } = require('../utils/response');

const validate = (schema, target = 'body') => (req, res, next) => {
  const { error: err, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
  if (err) {
    const messages = err.details.map(d => d.message).join('; ');
    return error(res, messages, 422, 'VALIDATION_ERROR');
  }
  req[target] = value;
  next();
};

// Schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({ 'string.email': 'E-mail inválido', 'any.required': 'E-mail obrigatório' }),
    password: Joi.string().min(8).required().messages({ 'string.min': 'Senha deve ter mínimo 8 caracteres', 'any.required': 'Senha obrigatória' })
  }),

  verifyCode: Joi.object({
    emailKey: Joi.string().email().required(),
    accessCode: Joi.string().min(4).max(20).required().messages({ 'any.required': 'Código de acesso obrigatório' })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  chat: Joi.object({
    message: Joi.string().min(1).max(4000).required().messages({ 'string.max': 'Mensagem muito longa (máx 4000 caracteres)', 'any.required': 'Mensagem obrigatória' }),
    conversationId: Joi.string().uuid().optional(),
    intent: Joi.string().valid('campaign', 'social', 'image', 'faq', 'health', 'auto').default('auto')
  }),

  image: Joi.object({
    description: Joi.string().min(3).max(1000).required(),
    style: Joi.string().optional()
  }),

  clinicUpdate: Joi.object({
    name: Joi.string().max(200).optional(),
    specialty: Joi.string().max(100).optional(),
    city: Joi.string().max(100).optional(),
    target_public: Joi.string().max(500).optional(),
    services: Joi.string().max(1000).optional(),
    differentials: Joi.string().max(500).optional(),
    instagram: Joi.string().max(100).optional(),
    contact: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional().allow(''),
    tone: Joi.string().max(100).optional(),
    visual_style: Joi.string().max(100).optional(),
    brand_color1: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    brand_color2: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
  })
};

module.exports = { validate, schemas };
