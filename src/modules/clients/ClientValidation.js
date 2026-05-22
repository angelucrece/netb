const Joi = require('joi');

const clientSchema = Joi.object({
  type: Joi.string().valid('company', 'occasional').default('occasional'),
  name: Joi.string().min(2).max(255).required(),
  contact_name: Joi.string().max(150).optional().allow('', null),
  email: Joi.string().email().max(255).optional().allow('', null),
  phone: Joi.string().max(40).optional().allow('', null),
  address: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  tax_number: Joi.string().max(100).optional().allow('', null),
  payment_terms_days: Joi.number().integer().min(0).default(0),
  discount_rate: Joi.number().min(0).max(100).default(0),
  credit_limit: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const toggleSchema = Joi.object({
  active: Joi.boolean().required(),
});

module.exports = { clientSchema, toggleSchema };
