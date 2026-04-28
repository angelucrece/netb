const Joi = require('joi');

const categorySchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow('', null),
  site_id:     Joi.number().integer().positive().optional().allow(null),
});

module.exports = { categorySchema };
