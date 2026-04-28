const Joi = require('joi');

const entrySchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  site_id:    Joi.number().integer().positive().required(),
  quantity:   Joi.number().integer().min(1).required(),
  motif:      Joi.string().max(500).optional().allow('', null),
  supplier:   Joi.string().max(255).optional().allow('', null),
});

const exitSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  site_id:    Joi.number().integer().positive().required(),
  quantity:   Joi.number().integer().min(1).required(),
  motif:      Joi.string().max(500).optional().allow('', null),
});

const transferSchema = Joi.object({
  from_site_id: Joi.number().integer().positive().required(),
  to_site_id:   Joi.number().integer().positive().required(),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity:   Joi.number().integer().min(1).required(),
  })).min(1).required(),
  motif: Joi.string().max(500).optional().allow('', null),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().min(3).max(500).required(),
});

module.exports = { entrySchema, exitSchema, transferSchema, rejectSchema };
