const Joi = require('joi');

const startSessionSchema = Joi.object({
  site_id: Joi.number().integer().positive().required(),
  mode:    Joi.string().valid('complet','tournant').required(),
});

const itemSchema = Joi.object({
  product_id:  Joi.number().integer().positive().required(),
  counted_qty: Joi.number().integer().min(0).required(),
});

const updateItemSchema = Joi.object({
  counted_qty: Joi.number().integer().min(0).required(),
});

module.exports = { startSessionSchema, itemSchema, updateItemSchema };
