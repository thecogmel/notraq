/** Item extraído de uma NFC-e */
export interface NfceItem {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

/** Nota fiscal completa extraída */
export interface NfceReceipt {
  storeName: string;
  storeCnpj: string;
  storeAddress: string;
  items: NfceItem[];
  totalAmount: number;
  discountAmount: number;
  purchaseDate: Date;
  qrcodeUrl: string;
  accessKey: string;
}

/** Variação de preço de um produto */
export interface PriceChange {
  productId: number;
  productName: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

/** Resultado do parse da URL do QR code */
export interface NfceUrlInfo {
  /** URL completa do QR code */
  url: string;
  /** Chave de acesso (44 dígitos) */
  accessKey: string;
  /** UF de origem (2 dígitos) */
  uf: string;
  /** URL base da SEFAZ do estado */
  sefazUrl: string;
}

/** Fonte dos dados importados */
export type ImportSource = 'qrcode-webview' | 'manual' | 'ocr';

/** Resultado da extração (sucesso ou erro) */
export type ParseResult =
  | { success: true; receipt: NfceReceipt; source: ImportSource }
  | { success: false; error: string; source: ImportSource };
