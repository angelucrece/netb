const Joi = require('joi');

const siteSchema = Joi.object({
  name:               Joi.string().min(2).max(255).required(),
  type:               Joi.string().valid('entrepot','magasin','depot','agence').required(),
  address:            Joi.string().max(255).optional().allow('', null),
  city:               Joi.string().max(100).optional().allow('', null),
  postal_code:        Joi.string().max(20).optional().allow('', null),
  country:            Joi.string().max(100).optional().allow('', null),
  responsible_name:   Joi.string().max(150).optional().allow('', null),
  responsible_email:  Joi.string().email().optional().allow('', null),
  responsible_phone:  Joi.string().max(30).optional().allow('', null),
});

const toggleSchema = Joi.object({
  active: Joi.boolean().required(),
});

module.exports = { siteSchema, toggleSchema };
