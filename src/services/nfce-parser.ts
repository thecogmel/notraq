import type { NfceItem, NfceReceipt } from '@/types';

/**
 * JavaScript injetado no WebView para extrair dados da NFC-e.
 * Funciona com tabelas estruturadas (SEFAZ/RN) e layouts variados.
 */
export const EXTRACTION_SCRIPT = `
(function() {
  try {
    var body = document.body.innerHTML;
    var text = document.body.textContent || '';

    // ===== DADOS DA LOJA =====
    var storeName = '';
    var storeCnpj = '';
    var storeAddress = '';

    // CNPJ
    var cnpjMatch = body.match(/CNPJ[:\\s]*([\\d.\\/-]+)/i);
    if (cnpjMatch) storeCnpj = cnpjMatch[1].trim();

    // Razão social / nome
    var razaoMatch = text.match(/(?:Raz[aã]o\\s*Social|Empresa|Emitente)[:\\s]*([^\\n]+)/i);
    if (razaoMatch) storeName = razaoMatch[1].trim();

    if (!storeName) {
      // Fallback: buscar texto bold no topo
      var bolds = document.querySelectorAll('b, strong, h3, h4, .txtTopo');
      for (var b = 0; b < bolds.length; b++) {
        var bt = bolds[b].textContent.trim();
        if (bt.length > 3 && bt.length < 80 && !bt.match(/DANFE|NFC-e|GOVERNO|NOTA FISCAL|SECRETARIA|N.MERO|SERIE/i)) {
          storeName = bt;
          break;
        }
      }
    }

    // Endereço
    var addrMatch = text.match(/(?:Endere[cç]o|Logradouro)[:\\s]*([^\\n]+)/i);
    if (addrMatch) storeAddress = addrMatch[1].trim();

    // ===== ITENS =====
    var items = [];
    var tables = document.querySelectorAll('table');

    for (var ti = 0; ti < tables.length; ti++) {
      var trows = tables[ti].querySelectorAll('tr');
      if (trows.length < 2) continue;

      // Checar se é tabela de itens pelo header
      var headerText = trows[0].textContent.toLowerCase();
      var isItemTable = (headerText.match(/descri|produto/) && headerText.match(/qtd|quant|unit|valor/));
      if (!isItemTable) continue;

      // Mapear colunas
      var hCells = trows[0].querySelectorAll('th, td');
      var col = { code:-1, name:-1, qty:-1, unit:-1, unitPrice:-1, total:-1 };

      for (var ci = 0; ci < hCells.length; ci++) {
        var h = hCells[ci].textContent.toLowerCase().trim();
        if (h.match(/^c[oó]d/)) col.code = ci;
        else if (h.match(/descri|produto/)) col.name = ci;
        else if (h.match(/qtd|quant/)) col.qty = ci;
        else if (h.match(/^un$|^unid/)) col.unit = ci;
        else if (h.match(/unit|vl\\.?\\s*unit|v\\.?\\s*unit/)) col.unitPrice = ci;
        else if (h.match(/total|v\\.?\\s*total|subtotal/)) col.total = ci;
      }

      // Fallback posicional se não achou por nome
      if (col.name === -1 && hCells.length >= 5) {
        col.code = 0; col.name = 1; col.qty = 2; col.unit = 3; col.unitPrice = 4;
        col.total = hCells.length >= 7 ? 6 : 5;
      }
      if (col.name === -1) continue;

      // Extrair linhas
      for (var ri = 1; ri < trows.length; ri++) {
        var cells = trows[ri].querySelectorAll('td');
        if (cells.length < 3) continue;

        var name = col.name >= 0 && cells[col.name] ? cells[col.name].textContent.trim() : '';
        if (!name || name.length < 2) continue;

        var pn = function(s) { return parseFloat((s||'0').replace(/[^\\d.,]/g,'').replace(/\\./g,'').replace(',','.')) || 0; };

        var qty = col.qty >= 0 && cells[col.qty] ? pn(cells[col.qty].textContent) : 1;
        var unit = col.unit >= 0 && cells[col.unit] ? cells[col.unit].textContent.trim().toUpperCase() : 'UN';
        var unitPrice = col.unitPrice >= 0 && cells[col.unitPrice] ? pn(cells[col.unitPrice].textContent) : 0;
        var totalPrice = col.total >= 0 && cells[col.total] ? pn(cells[col.total].textContent) : 0;

        if (!unitPrice && totalPrice) unitPrice = totalPrice / (qty || 1);
        if (!totalPrice && unitPrice) totalPrice = unitPrice * qty;

        if (unitPrice > 0 || totalPrice > 0) {
          items.push({
            code: col.code >= 0 && cells[col.code] ? cells[col.code].textContent.trim().replace(/\\D/g,'') : '',
            name: name,
            unit: unit || 'UN',
            quantity: qty || 1,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
          });
        }
      }

      if (items.length > 0) break;
    }

    // ===== TOTAIS =====
    var totalMatch = text.match(/Valor\\s*Total\\s*(?:dos\\s*Produtos|R\\$)?[^\\d]*([\\d.,]+)/i);
    var totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/\\./g,'').replace(',','.')) : 0;
    if (!totalAmount) {
      var pagoMatch = text.match(/Valor\\s*Pago[^\\d]*([\\d.,]+)/i);
      if (pagoMatch) totalAmount = parseFloat(pagoMatch[1].replace(/\\./g,'').replace(',','.'));
    }
    if (!totalAmount && items.length > 0) {
      totalAmount = items.reduce(function(s,i){ return s + i.totalPrice; }, 0);
    }

    var discMatch = text.match(/Desconto[^\\d]*([\\d.,]+)/i);
    var discountAmount = discMatch ? parseFloat(discMatch[1].replace(/\\./g,'').replace(',','.')) : 0;

    // ===== DATA =====
    var dateMatch = text.match(/(\\d{2}\\/\\d{2}\\/\\d{4})\\s*(\\d{2}:\\d{2}(?::\\d{2})?)/);
    var purchaseDate = dateMatch ? dateMatch[1] + ' ' + dateMatch[2] : '';

    // ===== RESULTADO =====
    if (items.length === 0) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        success: false,
        error: 'Nenhum item encontrado. Verifique se a nota carregou completamente.'
      }));
      return;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      success: true,
      data: {
        storeName: storeName,
        storeCnpj: storeCnpj,
        storeAddress: storeAddress,
        items: items,
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        purchaseDate: purchaseDate,
      }
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      success: false,
      error: 'Erro ao extrair: ' + e.message
    }));
  }
})();
`;

/**
 * Converte o resultado raw do WebView em NfceReceipt tipado.
 */
export function parseWebViewResult(
  raw: { storeName: string; storeCnpj: string; storeAddress: string; items: NfceItem[]; totalAmount: number; discountAmount: number; purchaseDate: string },
  qrcodeUrl: string,
  accessKey: string
): NfceReceipt {
  const purchaseDate = parseBrDate(raw.purchaseDate);

  return {
    storeName: cleanText(raw.storeName),
    storeCnpj: raw.storeCnpj,
    storeAddress: cleanText(raw.storeAddress),
    items: raw.items.map((item) => ({
      ...item,
      name: cleanText(item.name),
    })),
    totalAmount: raw.totalAmount,
    discountAmount: raw.discountAmount,
    purchaseDate,
    qrcodeUrl,
    accessKey,
  };
}

/**
 * Cria um NfceReceipt a partir de entrada manual (fallback).
 */
export function createManualReceipt(input: {
  storeName: string;
  items: { name: string; unit: string; quantity: number; unitPrice: number }[];
}): NfceReceipt {
  const items: NfceItem[] = input.items.map((item) => ({
    code: '',
    name: item.name.trim(),
    unit: item.unit || 'UN',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.unitPrice * item.quantity,
  }));

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return {
    storeName: input.storeName || 'Entrada Manual',
    storeCnpj: '',
    storeAddress: '',
    items,
    totalAmount,
    discountAmount: 0,
    purchaseDate: new Date(),
    qrcodeUrl: '',
    accessKey: '',
  };
}

// === Helpers ===

function parseBrDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return new Date();

  const [, day, month, year, hour, min, sec] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec || '00'}`);
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
