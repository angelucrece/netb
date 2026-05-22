const Joi = require('joi');

const purchaseSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().optional().allow(null),
  site_id: Joi.number().integer().positive().required(),
  reference: Joi.string().max(100).optional().allow('', null),
  expected_at: Joi.date().optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).default(0),
  })).min(1).required(),
});

const receiveSchema = Joi.object({
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(Joi.object({
    item_id: Joi.number().integer().positive().optional(),
    product_id: Joi.number().integer().positive().optional(),
    quantity: Joi.number().integer().min(1).required(),
  }).or('item_id', 'product_id')).optional(),
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional().allow('', null),
});

module.exports = { purchaseSchema, receiveSchema, cancelSchema };
