jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const AuditLogService = require('../../src/modules/auditLogs/AuditLogService');

const mockLog = {
  id: 1,
  user_id: 1,
  action: 'CREATE_PRODUCT',
  entity_type: 'product',
  entity_id: 42,
  old_value: null,
  new_value: { name: 'Câble HDMI' },
  ip_address: '127.0.0.1',
  created_at: new Date().toISOString(),
  user_name: 'Naelle Admin',
  user_email: 'naelle@nethastock.com',
};

beforeEach(() => jest.clearAllMocks());

describe('AuditLogService.getLogs', () => {
  test('retourne les logs paginés', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockLog] })   // findAll
      .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count

    const { logs, pagination } = await AuditLogService.getLogs({ page: 1, limit: 50 });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('CREATE_PRODUCT');
    expect(pagination.total).toBe(1);
  });

  test('filtre par action → résultat filtré', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockLog] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const { logs } = await AuditLogService.getLogs({ action: 'PRODUCT' });
    expect(logs[0].action).toContain('PRODUCT');
  });
});

describe('AuditLogService.getById', () => {
  test('log existant → retourné avec détails', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockLog] });
    const log = await AuditLogService.getById(1);
    expect(log.entity_type).toBe('product');
    expect(log.user_name).toBe('Naelle Admin');
  });

  test('log inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(AuditLogService.getById(999)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('AuditLogService.getSummary', () => {
  test('retourne le résumé des actions', async () => {
    db.query.mockResolvedValueOnce({ rows: [
      { action: 'CREATE_PRODUCT', entity_type: 'product', count: 12 },
      { action: 'VALIDATE_MOVEMENT', entity_type: 'movement', count: 8 },
    ]});

    const summary = await AuditLogService.getSummary({});
    expect(summary).toHaveLength(2);
    expect(summary[0].count).toBe(12);
  });
});
