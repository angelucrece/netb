const Joi = require('joi');

const productSchema = Joi.object({
  name:           Joi.string().min(2).max(255).required(),
  brand:          Joi.string().max(100).optional().allow('', null),
  unit:           Joi.string().valid('piece','kg','litre','metre','boite','carton').default('piece'),
  description:    Joi.string().max(1000).optional().allow('', null),
  category_id:    Joi.number().integer().positive().optional().allow(null),
  barcode:        Joi.string().max(50).optional().allow('', null),
  purchase_price: Joi.number().min(0).default(0),
  sale_price:     Joi.number().min(0).default(0),
});

const variantsSchema = Joi.object({
  variants: Joi.array().items(Joi.object({
    type:       Joi.string().valid('taille','couleur','modele').required(),
    value:      Joi.string().max(100).required(),
    sku_suffix: Joi.string().max(50).optional().allow('', null),
  })).min(1).required(),
});

module.exports = { productSchema, variantsSchema };
