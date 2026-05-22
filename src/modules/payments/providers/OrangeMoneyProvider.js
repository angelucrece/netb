const ApiError = require('../../../utils/ApiError');

class OrangeMoneyProvider {
  constructor(env = process.env) {
    this.baseUrl = env.ORANGE_MONEY_BASE_URL;
    this.paymentPath = env.ORANGE_MONEY_PAYMENT_PATH || '/orange-money-webpay/dev/v1/webpayment';
    this.tokenUrl = env.ORANGE_MONEY_TOKEN_URL;
    this.accessToken = env.ORANGE_MONEY_ACCESS_TOKEN || null;
    this.clientId = env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = env.ORANGE_MONEY_CLIENT_SECRET;
    this.merchantKey = env.ORANGE_MONEY_MERCHANT_KEY;
    this.notifUrl = env.ORANGE_MONEY_NOTIF_URL;
  }

  // Cette fonction obtient un token Orange Money ou utilise un token fourni en variable d'environnement.
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    if (!this.tokenUrl || !this.clientId || !this.clientSecret) {
      throw ApiError.internal('Configuration Orange Money incomplete');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const data = await response.json();
    if (!response.ok) throw ApiError.badRequest('Impossible de recuperer le token Orange Money', data);
    return data.access_token || data.token;
  }

  // Cette fonction appelle l'API Orange Money configuree pour initialiser un paiement.
  async initiate({ transaction, invoice, payload }) {
    if (!this.baseUrl || !this.merchantKey) throw ApiError.internal('Configuration Orange Money incomplete');
    const token = await this.getAccessToken();

    const body = {
      merchant_key: this.merchantKey,
      currency: payload.currency || 'XAF',
      order_id: String(transaction.id),
      amount: Number(payload.amount),
      return_url: payload.return_url,
      cancel_url: payload.cancel_url,
      notif_url: this.notifUrl,
      lang: 'fr',
      reference: invoice.reference,
    };

    const response = await fetch(`${this.baseUrl}${this.paymentPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw ApiError.badRequest('Erreur API Orange Money', data);

    return {
      provider_reference: data.pay_token || data.payment_token || data.id || String(transaction.id),
      status: 'pending',
      checkout_url: data.payment_url || data.checkout_url || null,
      raw_response: data,
    };
  }

  // Cette fonction donne un statut generique si l'API de statut Orange n'est pas configuree.
  async fetchStatus() {
    throw ApiError.badRequest('Verification Orange Money non configuree: utilisez le webhook du fournisseur');
  }
}

module.exports = OrangeMoneyProvider;
