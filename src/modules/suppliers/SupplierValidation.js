const Joi = require('joi');

const supplierSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  contact_name: Joi.string().max(150).optional().allow('', null),
  email: Joi.string().email().max(255).optional().allow('', null),
  phone: Joi.string().max(40).optional().allow('', null),
  address: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  tax_number: Joi.string().max(100).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const toggleSchema = Joi.object({
  active: Joi.boolean().required(),
});

module.exports = { supplierSchema, toggleSchema };
