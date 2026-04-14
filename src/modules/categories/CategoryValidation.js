// Description : Middleware de validation des catégories

const Joi = require('joi');

const validateCategory = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow('', null).max(255),
    site_id: Joi.number().integer()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  next();
};

const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID invalide' });
  next();
};

module.exports = { validateCategory, validateId };