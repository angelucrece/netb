const crypto = require('node:crypto');
const ApiError = require('../../../utils/ApiError');

class MtnMomoProvider {
  constructor(env = process.env) {
    this.baseUrl = env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.subscriptionKey = env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.apiUser = env.MTN_MOMO_API_USER;
    this.apiKey = env.MTN_MOMO_API_KEY;
    this.targetEnvironment = env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox';
    this.accessToken = env.MTN_MOMO_ACCESS_TOKEN || null;
  }

  // Cette fonction recupere un token OAuth MTN MoMo si aucun token statique n'est fourni.
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    if (!this.subscriptionKey || !this.apiUser || !this.apiKey) {
      throw ApiError.internal('Configuration MTN MoMo incomplete');
    }

    const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });
    const data = await response.json();
    if (!response.ok) throw ApiError.badRequest('Impossible de recuperer le token MTN MoMo', data);
    return data.access_token;
  }

  // Cette fonction appelle la vraie API MTN MoMo RequestToPay.
  async initiate({ transaction, invoice, payload }) {
    if (!payload.payer_phone) throw ApiError.badRequest('payer_phone requis pour MTN MoMo');
    const token = await this.getAccessToken();
    const referenceId = crypto.randomUUID();

    const body = {
      amount: String(payload.amount),
      currency: payload.currency || 'XAF',
      externalId: String(transaction.id),
      payer: { partyIdType: 'MSISDN', partyId: payload.payer_phone },
      payerMessage: `Paiement facture ${invoice.reference}`,
      payeeNote: `Invoice ${invoice.id}`,
    };

    const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': this.targetEnvironment,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    if (!response.ok && response.status !== 202) {
      throw ApiError.badRequest('Erreur API MTN MoMo RequestToPay', { status: response.status, raw });
    }

    return {
      provider_reference: referenceId,
      status: 'pending',
      raw_response: { status: response.status, body: raw },
    };
  }

  // Cette fonction relit MTN MoMo pour connaitre le statut reel de la transaction.
  async fetchStatus(providerReference) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${providerReference}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': this.targetEnvironment,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });
    const data = await response.json();
    if (!response.ok) throw ApiError.badRequest('Erreur statut MTN MoMo', data);

    return {
      status: data.status === 'SUCCESSFUL' ? 'succeeded' : data.status === 'FAILED' ? 'failed' : 'pending',
      raw_response: data,
    };
  }
}

module.exports = MtnMomoProvider;
