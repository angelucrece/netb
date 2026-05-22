jest.mock('../../src/modules/receipts/ReceiptRepository', () => ({
  findAll: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  findByPaymentId: jest.fn(),
  buildPayloadByPaymentId: jest.fn(),
  create: jest.fn(),
}));

const ReceiptRepository = require('../../src/modules/receipts/ReceiptRepository');
const ReceiptService = require('../../src/modules/receipts/ReceiptService');

const source = {
  payment: {
    id: 44,
    invoice_id: 3,
    sale_order_id: 9,
    amount: 8000,
    amount_received: 10000,
    amount_refunded: 2000,
    mode: 'cash',
    type: 'invoice',
    reference: 'PAY-44',
    notes: 'Paiement comptoir',
    paid_at: '2026-05-22T10:00:00.000Z',
  },
  invoice: {
    id: 3,
    reference: 'INV-3',
    subtotal: 8000,
    discount_amount: 0,
    delivery_fee: 0,
    total_amount: 8000,
    paid_amount: 8000,
  },
  sale_order: {
    id: 9,
    reference: 'SO-9',
    client_name: 'Client Test',
    total_amount: 8000,
    created_at: '2026-05-22T09:00:00.000Z',
  },
  site: {
    id: 1,
    name: 'Magasin Akwa',
    address: 'Rue 1',
    city: 'Douala',
    country: 'Cameroun',
  },
  client: {
    id: 12,
    name: 'Client Test',
    phone: '+237600000000',
    address: 'Bonapriso',
    city: 'Douala',
  },
  cashier: {
    id: 7,
    name: 'Claude Caisse',
    email: 'cashier@nethastock.com',
  },
  items: [
    {
      product_id: 2,
      sku: 'HDMI-2M',
      name: 'Cable HDMI',
      quantity: 2,
      unit_price: 4000,
      discount_amount: 0,
      line_total: 8000,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReceiptService.generateForPayment', () => {
  test('cree un snapshot complet du paiement pour le recu', async () => {
    const client = { query: jest.fn() };
    ReceiptRepository.buildPayloadByPaymentId.mockResolvedValue(source);
    ReceiptRepository.create.mockImplementation(async (payload) => ({ id: 1, ...payload }));

    const receipt = await ReceiptService.generateForPayment(44, {
      client_signature: 'Client Test',
      cashier_signature: 'Claude Caisse',
    }, client);

    expect(ReceiptRepository.buildPayloadByPaymentId).toHaveBeenCalledWith(44, client);
    expect(ReceiptRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_id: 44,
        invoice_id: 3,
        sale_order_id: 9,
        site_id: 1,
        client_name: 'Client Test',
        cashier_name: 'Claude Caisse',
        total_amount: 8000,
        amount_paid: 8000,
        amount_received: 10000,
        amount_refunded: 2000,
      }),
      client
    );
    expect(receipt.payload.items[0].name).toBe('Cable HDMI');
    expect(receipt.payload.signatures.client_signature).toBe('Client Test');
  });

  test('paiement introuvable -> erreur 404', async () => {
    ReceiptRepository.buildPayloadByPaymentId.mockResolvedValue(null);

    await expect(ReceiptService.generateForPayment(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ReceiptService.exportPdf', () => {
  test('retourne un buffer PDF valide', async () => {
    ReceiptRepository.findById.mockResolvedValue({
      id: 1,
      reference: 'RCPT-44',
      cashier_name: 'Claude Caisse',
      payment_mode: 'cash',
      total_amount: 8000,
      amount_paid: 8000,
      amount_received: 10000,
      amount_refunded: 2000,
      issued_at: '2026-05-22T10:00:00.000Z',
      payload: ReceiptService.buildReceiptData(source, {
        reference: 'RCPT-44',
        client_signature: 'Client Test',
      }).payload,
    });

    const buffer = await ReceiptService.exportPdf(1);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });
});
