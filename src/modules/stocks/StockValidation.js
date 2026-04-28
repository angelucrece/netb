const Joi = require('joi');

const transferSchema = Joi.object({
  product_id:   Joi.number().integer().positive().required(),
  from_site_id: Joi.number().integer().positive().required(),
  to_site_id:   Joi.number().integer().positive().required(),
  quantity:     Joi.number().integer().min(1).required(),
});

module.exports = { transferSchema };
