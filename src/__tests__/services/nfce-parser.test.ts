import { parseWebViewResult, createManualReceipt } from '@/services/nfce-parser';

describe('parseWebViewResult', () => {
  it('converts raw WebView data to NfceReceipt', () => {
    const raw = {
      storeName: 'RAZÃO SOCIAL: Supermercado Teste',
      storeCnpj: '12.345.678/0001-90',
      storeAddress: 'Rua Teste, 123',
      items: [
        { code: '001', name: 'ARROZ 5KG', unit: 'UN', quantity: 1, unitPrice: 22.9, totalPrice: 22.9 },
        { code: '002', name: 'FEIJAO 1KG', unit: 'KG', quantity: 2, unitPrice: 8.5, totalPrice: 17 },
      ],
      totalAmount: 39.9,
      discountAmount: 0,
      purchaseDate: '10/07/2026 17:56:28',
    };

    const result = parseWebViewResult(raw, 'http://qr.url', '44digits');

    expect(result.storeName).toBe('Supermercado Teste');
    expect(result.storeCnpj).toBe('12.345.678/0001-90');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('ARROZ 5KG');
    expect(result.totalAmount).toBe(39.9);
    expect(result.purchaseDate).toBeInstanceOf(Date);
    expect(result.purchaseDate.getFullYear()).toBe(2026);
    expect(result.accessKey).toBe('44digits');
  });

  it('handles empty purchase date', () => {
    const raw = {
      storeName: 'Loja',
      storeCnpj: '',
      storeAddress: '',
      items: [{ code: '', name: 'Item', unit: 'UN', quantity: 1, unitPrice: 10, totalPrice: 10 }],
      totalAmount: 10,
      discountAmount: 0,
      purchaseDate: '',
    };

    const result = parseWebViewResult(raw, '', '');
    expect(result.purchaseDate).toBeInstanceOf(Date);
  });
});

describe('createManualReceipt', () => {
  it('creates receipt from manual input', () => {
    const result = createManualReceipt({
      storeName: 'Mercado X',
      items: [
        { name: 'Arroz', unit: 'UN', quantity: 2, unitPrice: 25 },
        { name: 'Feijão', unit: 'KG', quantity: 1, unitPrice: 9.5 },
      ],
    });

    expect(result.storeName).toBe('Mercado X');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].totalPrice).toBe(50);
    expect(result.items[1].totalPrice).toBe(9.5);
    expect(result.totalAmount).toBe(59.5);
    expect(result.accessKey).toBe('');
  });

  it('defaults store name to Entrada Manual', () => {
    const result = createManualReceipt({
      storeName: '',
      items: [{ name: 'Item', unit: 'UN', quantity: 1, unitPrice: 5 }],
    });
    expect(result.storeName).toBe('Entrada Manual');
  });

  it('sets current date', () => {
    const before = Date.now();
    const result = createManualReceipt({
      storeName: 'Test',
      items: [{ name: 'X', unit: 'UN', quantity: 1, unitPrice: 1 }],
    });
    const after = Date.now();
    expect(result.purchaseDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.purchaseDate.getTime()).toBeLessThanOrEqual(after);
  });
});
