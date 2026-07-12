import { extractAccessKey, parseNfceUrl, isNfceUrl, buildConsultaUrl, getUfName } from '@/services/nfce-url';

describe('extractAccessKey', () => {
  it('extracts from ?p= format', () => {
    const url = 'https://nfce.set.rn.gov.br/consultarNFCe.aspx?p=24260705248755000395651080000362871324393145|2|1|1|hash';
    expect(extractAccessKey(url)).toBe('24260705248755000395651080000362871324393145');
  });

  it('extracts from ?chNFe= format', () => {
    const url = 'https://nfce.sefaz.rn.gov.br/portalDFE/NFCe/ConsultaNFCe.aspx?chNFe=24260705248755000395651080000362871324393145&nVersao=100';
    expect(extractAccessKey(url)).toBe('24260705248755000395651080000362871324393145');
  });

  it('extracts raw 44-digit key', () => {
    expect(extractAccessKey('24260705248755000395651080000362871324393145')).toBe('24260705248755000395651080000362871324393145');
  });

  it('returns null for invalid input', () => {
    expect(extractAccessKey('not a key')).toBeNull();
    expect(extractAccessKey('12345')).toBeNull();
  });
});

describe('parseNfceUrl', () => {
  it('parses QR URL and identifies UF as RN', () => {
    const url = 'https://nfce.set.rn.gov.br/consultarNFCe.aspx?p=24260705248755000395651080000362871324393145|2|1|1|hash';
    const info = parseNfceUrl(url);
    expect(info).not.toBeNull();
    expect(info!.uf).toBe('24');
    expect(info!.accessKey).toBe('24260705248755000395651080000362871324393145');
    expect(info!.sefazUrl).toBe('https://nfce.sefaz.rn.gov.br');
  });

  it('returns null for non-NFC-e data', () => {
    expect(parseNfceUrl('https://google.com')).toBeNull();
  });
});

describe('isNfceUrl', () => {
  it('returns true for URLs with 44-digit key', () => {
    expect(isNfceUrl('24260705248755000395651080000362871324393145')).toBe(true);
  });

  it('returns true for sefaz domains', () => {
    expect(isNfceUrl('https://nfce.sefaz.rn.gov.br/something')).toBe(true);
  });

  it('returns false for empty', () => {
    expect(isNfceUrl('')).toBe(false);
  });

  it('returns false for unrelated URLs', () => {
    expect(isNfceUrl('https://google.com')).toBe(false);
  });
});

describe('buildConsultaUrl', () => {
  it('builds consultation URL for RN', () => {
    const info = { url: 'original', accessKey: '24260705248755000395651080000362871324393145', uf: '24', sefazUrl: 'https://nfce.sefaz.rn.gov.br' };
    expect(buildConsultaUrl(info)).toBe('https://nfce.sefaz.rn.gov.br/portalDFE/NFCe/ConsultaNFCe.aspx?p=24260705248755000395651080000362871324393145');
  });

  it('falls back to original URL if no sefazUrl', () => {
    const info = { url: 'https://original.com', accessKey: '12345678901234567890123456789012345678901234', uf: '99', sefazUrl: '' };
    expect(buildConsultaUrl(info)).toBe('https://original.com');
  });
});

describe('getUfName', () => {
  it('returns RN for 24', () => {
    expect(getUfName('24')).toBe('RN');
  });

  it('returns SP for 35', () => {
    expect(getUfName('35')).toBe('SP');
  });

  it('returns Desconhecido for unknown', () => {
    expect(getUfName('99')).toBe('Desconhecido');
  });
});
