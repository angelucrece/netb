const Joi = require('joi');

const saleSchema = Joi.object({
  client_id: Joi.number().integer().positive().optional().allow(null),
  site_id: Joi.number().integer().positive().required(),
  reference: Joi.string().max(100).optional().allow('', null),
  channel: Joi.string().valid('company', 'occasional', 'store').default('store'),
  client_name: Joi.string().max(255).optional().allow('', null),
  client_phone: Joi.string().max(40).optional().allow('', null),
  delivery_required: Joi.boolean().default(false),
  delivery_address: Joi.string().max(255).optional().allow('', null),
  delivery_fee: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().min(0).required(),
    discount_amount: Joi.number().min(0).default(0),
  })).min(1).required(),
});

const deliverySchema = Joi.object({
  reference: Joi.string().max(100).optional().allow('', null),
  delivery_address: Joi.string().max(255).optional().allow('', null),
  delivery_fee: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const paymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  mode: Joi.string().valid('cash', 'orange_money', 'mtn_money', 'card', 'bank_transfer', 'cheque', 'credit').required(),
  type: Joi.string().valid('deposit', 'balance', 'full', 'invoice').default('invoice'),
  reference: Joi.string().max(100).optional().allow('', null),
  cash_session_id: Joi.number().integer().positive().optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional().allow('', null),
});

module.exports = { saleSchema, deliverySchema, paymentSchema, cancelSchema };
