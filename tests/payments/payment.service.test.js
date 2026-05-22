jest.mock('../../src/config/database', () => ({
  transaction: jest.fn(),
}));
jest.mock('../../src/modules/payments/PaymentRepository', () => ({
  addPayment: jest.fn(),
  invoicePaidTotal: jest.fn(),
  updateSalePayment: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  findTransactionById: jest.fn(),
}));
jest.mock('../../src/modules/invoices/InvoiceRepository', () => ({
  findById: jest.fn(),
  updatePayment: jest.fn(),
}));
jest.mock('../../src/modules/cash/CashRepository', () => ({
  findOpen: jest.fn(),
}));
jest.mock('../../src/modules/receipts/ReceiptService', () => ({
  generateForPayment: jest.fn(),
  getByPaymentId: jest.fn(),
}));
jest.mock('../../src/modules/payments/providers/PaymentProviderFactory', () => ({
  getProvider: jest.fn(),
}));
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');
const PaymentRepository = require('../../src/modules/payments/PaymentRepository');
const InvoiceRepository = require('../../src/modules/invoices/InvoiceRepository');
const CashRepository = require('../../src/modules/cash/CashRepository');
const ReceiptService = require('../../src/modules/receipts/ReceiptService');
const { getProvider } = require('../../src/modules/payments/providers/PaymentProviderFactory');
const PaymentService = require('../../src/modules/payments/PaymentService');

const invoice = {
  id: 3,
  sale_order_id: 9,
  site_id: 1,
  status: 'issued',
  sale_status: 'invoiced',
  total_amount: 8000,
  paid_amount: 0,
};

const txClient = { query: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  db.transaction.mockImplementation(async (callback) => callback(txClient));
  PaymentRepository.addPayment.mockResolvedValue(44);
  PaymentRepository.invoicePaidTotal.mockResolvedValue(8000);
  PaymentRepository.updateSalePayment.mockResolvedValue(undefined);
  InvoiceRepository.updatePayment.mockResolvedValue(undefined);
  ReceiptService.generateForPayment.mockResolvedValue({ id: 5, reference: 'RCPT-44' });
  ReceiptService.getByPaymentId.mockResolvedValue({ id: 5, reference: 'RCPT-44' });
});

describe('PaymentService.normalizeTenderedAmounts', () => {
  test('calcule automatiquement le montant rendu', () => {
    const result = PaymentService.normalizeTenderedAmounts({
      amount: 8000,
      amount_received: 10000,
    });

    expect(result).toEqual({
      amount: 8000,
      amount_received: 10000,
      amount_refunded: 2000,
    });
  });

  test('refuse un montant recu inferieur au montant facture', () => {
    expect(() => PaymentService.normalizeTenderedAmounts({
      amount: 8000,
      amount_received: 7000,
    })).toThrow('Le montant recu ne peut pas etre inferieur au montant a payer');
  });
});

describe('PaymentService.registerManual', () => {
  test('encaisse, met a jour la facture et genere le recu', async () => {
    InvoiceRepository.findById
      .mockResolvedValueOnce(invoice)
      .mockResolvedValueOnce({ ...invoice, status: 'paid', paid_amount: 8000 });
    CashRepository.findOpen.mockResolvedValue({ id: 12 });

    const result = await PaymentService.registerManual(
      3,
      {
        amount: 8000,
        amount_received: 10000,
        mode: 'cash',
        type: 'invoice',
        reference: 'PAY-44',
        client_signature: 'Client Test',
      },
      { id: 7 },
      '127.0.0.1'
    );

    expect(CashRepository.findOpen).toHaveBeenCalledWith(7, 1);
    expect(PaymentRepository.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_id: 3,
        sale_order_id: 9,
        cash_session_id: 12,
        amount: 8000,
        amount_received: 10000,
        amount_refunded: 2000,
        mode: 'cash',
        received_by: 7,
      }),
      txClient
    );
    expect(InvoiceRepository.updatePayment).toHaveBeenCalledWith(3, 8000, 'paid', txClient);
    expect(PaymentRepository.updateSalePayment).toHaveBeenCalledWith(9, 'paid', 'closed', txClient);
    expect(ReceiptService.generateForPayment).toHaveBeenCalledWith(
      44,
      expect.objectContaining({ client_signature: 'Client Test' }),
      txClient
    );
    expect(result.receipt.reference).toBe('RCPT-44');
  });
});

describe('PaymentService.refreshExternalStatus', () => {
  test('provider succeeded -> applique le paiement et attache le recu', async () => {
    const transaction = {
      id: 88,
      invoice_id: 3,
      sale_order_id: 9,
      provider: 'orange_money',
      provider_reference: 'OM-123',
      amount: 8000,
      mode: 'orange_money',
      type: 'invoice',
    };
    const provider = {
      fetchStatus: jest.fn().mockResolvedValue({ status: 'succeeded', raw_response: { ok: true } }),
    };
    getProvider.mockReturnValue(provider);
    PaymentRepository.findTransactionById.mockResolvedValue(transaction);
    PaymentRepository.updateTransaction.mockResolvedValue({ ...transaction, status: 'succeeded' });
    InvoiceRepository.findById.mockResolvedValue(invoice);

    const updated = await PaymentService.refreshExternalStatus(88, { id: 7 }, '127.0.0.1');

    expect(provider.fetchStatus).toHaveBeenCalledWith('OM-123');
    expect(PaymentRepository.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 8000,
        amount_received: 8000,
        amount_refunded: 0,
        mode: 'orange_money',
        reference: 'OM-123',
      }),
      txClient
    );
    expect(updated.receipt.reference).toBe('RCPT-44');
  });
});
