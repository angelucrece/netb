const Joi = require('joi');

const loginSchema = Joi.object({
  email:    Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min':   'Mot de passe minimum 6 caractères',
    'any.required': 'Mot de passe requis',
  }),
  site_id:  Joi.number().integer().positive().optional(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'refreshToken requis',
  }),
});

module.exports = { loginSchema, refreshSchema };
