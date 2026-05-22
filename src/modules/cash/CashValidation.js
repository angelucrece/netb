const Joi = require('joi');

const openSchema = Joi.object({
  site_id: Joi.number().integer().positive().optional(),
  opening_balance: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const closeSchema = Joi.object({
  closing_balance: Joi.number().min(0).required(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

module.exports = { openSchema, closeSchema };
