const ApiError = require('../../../utils/ApiError');

const ZERO_DECIMAL_CURRENCIES = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

const toMinorAmount = (amount, currency) => {
  const value = Number(amount);
  return ZERO_DECIMAL_CURRENCIES.has(String(currency).toUpperCase())
    ? Math.round(value)
    : Math.round(value * 100);
};

class StripeProvider {
  constructor(env = process.env) {
    this.secretKey = env.STRIPE_SECRET_KEY;
  }

  // Cette fonction appelle la vraie API Stripe pour creer un PaymentIntent.
  async initiate({ transaction, invoice, payload }) {
    if (!this.secretKey) throw ApiError.internal('STRIPE_SECRET_KEY manquant');
    if (!globalThis.fetch) throw ApiError.internal('fetch indisponible dans cette version de Node.js');

    const currency = payload.currency || 'XAF';
    const body = new URLSearchParams();
    body.set('amount', String(toMinorAmount(payload.amount, currency)));
    body.set('currency', currency.toLowerCase());
    body.set('automatic_payment_methods[enabled]', 'true');
    body.set('metadata[invoice_id]', String(invoice.id));
    body.set('metadata[transaction_id]', String(transaction.id));

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const data = await response.json();
    if (!response.ok) {
      throw ApiError.badRequest(data.error?.message || 'Erreur API Stripe', data);
    }

    return {
      provider_reference: data.id,
      status: data.status === 'succeeded' ? 'succeeded' : 'pending',
      client_secret: data.client_secret,
      raw_response: data,
    };
  }

  // Cette fonction relit Stripe pour verifier le statut reel du PaymentIntent.
  async fetchStatus(providerReference) {
    if (!this.secretKey) throw ApiError.internal('STRIPE_SECRET_KEY manquant');
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${providerReference}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const data = await response.json();
    if (!response.ok) throw ApiError.badRequest(data.error?.message || 'Erreur API Stripe', data);

    return {
      status: data.status === 'succeeded' ? 'succeeded' : data.status === 'canceled' ? 'cancelled' : 'pending',
      raw_response: data,
    };
  }
}

module.exports = StripeProvider;
