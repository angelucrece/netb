const Joi = require('joi');

const manualPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  mode: Joi.string().valid('cash', 'orange_money', 'mtn_money', 'card', 'bank_transfer', 'cheque', 'credit').required(),
  type: Joi.string().valid('deposit', 'balance', 'full', 'invoice').default('invoice'),
  reference: Joi.string().max(100).optional().allow('', null),
  cash_session_id: Joi.number().integer().positive().optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const externalPaymentSchema = Joi.object({
  provider: Joi.string().valid('stripe', 'mtn_momo', 'orange_money').required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default('XAF'),
  type: Joi.string().valid('deposit', 'balance', 'full', 'invoice').default('invoice'),
  payer_phone: Joi.string().max(40).optional().allow('', null),
  return_url: Joi.string().uri().optional().allow('', null),
  cancel_url: Joi.string().uri().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

module.exports = { manualPaymentSchema, externalPaymentSchema };
