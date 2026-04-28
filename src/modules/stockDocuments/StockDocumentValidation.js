const Joi = require('joi');

const documentSchema = Joi.object({
  type:                Joi.string().valid('reception','sortie','transfert').required(),
  site_id:             Joi.number().integer().positive().required(),
  destination_site_id: Joi.number().integer().positive().optional().allow(null),
  reference:           Joi.string().max(100).optional().allow('', null),
  notes:               Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(Joi.object({
    product_id:  Joi.number().integer().positive().required(),
    quantity:    Joi.number().integer().min(1).required(),
    unit_price:  Joi.number().min(0).optional().default(0),
  })).min(1).required(),
});

module.exports = { documentSchema };
