const ApiError = require('../../../utils/ApiError');
const StripeProvider = require('./StripeProvider');
const MtnMomoProvider = require('./MtnMomoProvider');
const OrangeMoneyProvider = require('./OrangeMoneyProvider');

// Cette fonction fabrique le provider demande sans melanger les details API dans le service paiement.
const getProvider = (name) => {
  if (name === 'stripe') return new StripeProvider();
  if (name === 'mtn_momo') return new MtnMomoProvider();
  if (name === 'orange_money') return new OrangeMoneyProvider();
  throw ApiError.badRequest('Provider de paiement non supporte');
};

module.exports = { getProvider };
