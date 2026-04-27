const Joi = require('joi');

const createUserSchema = Joi.object({
  email:      Joi.string().email().required(),
  password:   Joi.string().min(6).required(),
  first_name: Joi.string().min(2).max(100).required(),
  last_name:  Joi.string().min(2).max(100).required(),
  role_id:    Joi.number().integer().positive().required(),
  site_id:    Joi.number().integer().positive().optional().allow(null),
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name:  Joi.string().min(2).max(100).required(),
  role_id:    Joi.number().integer().positive().required(),
  site_id:    Joi.number().integer().positive().optional().allow(null),
  active:     Joi.boolean().optional(),
});

const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
});

const toggleSchema = Joi.object({
  active: Joi.boolean().required(),
});

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema, toggleSchema };
