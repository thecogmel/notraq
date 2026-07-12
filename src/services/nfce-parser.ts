import type { NfceItem, NfceReceipt } from '@/types';

/**
 * JavaScript a ser injetado no WebView após o usuário resolver o captcha.
 * Extrai os dados da página da NFC-e e retorna via window.ReactNativeWebView.postMessage().
 *
 * Compatível com o layout padrão da consulta pública da SEFAZ (maioria dos estados).
 */
export const EXTRACTION_SCRIPT = `
(function() {
  try {
    // Verifica se a página tem dados de NFC-e carregados
    var tables = document.querySelectorAll('table, .NFCDetalhe, #tabResult, .txtTit');
    if (tables.length === 0 && !document.querySelector('[class*="nfce"], [class*="NFCe"], [id*="nfce"]')) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        success: false,
        error: 'Página não contém dados de NFC-e. Resolva o captcha e aguarde carregar.'
      }));
      return;
    }

    // ===== DADOS DA LOJA =====
    var storeName = '';
    var storeCnpj = '';
    var storeAddress = '';

    // Tenta diferentes seletores (varia por estado)
    var nameEl = document.querySelector('.txtTopo, .NFCCabecalho_Nome, #u20');
    if (nameEl) storeName = nameEl.textContent.trim();

    var cnpjEl = document.body.innerHTML.match(/CNPJ[:\\s]*([\\d.\\/-]+)/);
    if (cnpjEl) storeCnpj = cnpjEl[1].trim();

    var addrEl = document.querySelector('.txtEndereco, .NFCCabecalho_Endereco');
    if (addrEl) storeAddress = addrEl.textContent.trim();

    // ===== ITENS =====
    var items = [];

    // Padrão 1: Tabela com linhas de produto (mais comum)
    var rows = document.querySelectorAll('tr[id*="Item"], .NFCDetalhe_Item, table.toggable tr');
    
    if (rows.length > 0) {
      rows.forEach(function(row) {
        var cells = row.querySelectorAll('td, span');
        var text = row.textContent;
        
        var nameMatch = text.match(/(?:^|\\d{5,})\\s*(.+?)(?:\\s+\\d)/);
        var codeMatch = text.match(/(\\d{3,7})/);
        var qtyMatch = text.match(/(?:Qtde|Qt)[.:]?\\s*([\\d.,]+)/i);
        var unitMatch = text.match(/(?:UN|KG|LT|ML|MT|PC|CX|DZ|GR)/i);
        var unitPriceMatch = text.match(/(?:Vl\\.?\\s*Unit|V\\.Unit)[.:]?\\s*R?\\$?\\s*([\\d.,]+)/i);
        var totalMatch = text.match(/(?:Vl\\.?\\s*Total|V\\.Total)[.:]?\\s*R?\\$?\\s*([\\d.,]+)/i);

        if (nameMatch || (cells.length >= 3)) {
          var item = {
            code: codeMatch ? codeMatch[1] : '',
            name: '',
            unit: unitMatch ? unitMatch[0].toUpperCase() : 'UN',
            quantity: qtyMatch ? parseFloat(qtyMatch[1].replace(/\\./g, '').replace(',', '.')) : 1,
            unitPrice: unitPriceMatch ? parseFloat(unitPriceMatch[1].replace(/\\./g, '').replace(',', '.')) : 0,
            totalPrice: totalMatch ? parseFloat(totalMatch[1].replace(/\\./g, '').replace(',', '.')) : 0,
          };

          // Extrai nome dos cells ou do match
          if (cells.length >= 2) {
            item.name = (cells[1] || cells[0]).textContent.trim().replace(/\\s+/g, ' ');
          } else if (nameMatch) {
            item.name = nameMatch[1].trim();
          }

          if (item.name && (item.unitPrice > 0 || item.totalPrice > 0)) {
            if (!item.unitPrice && item.totalPrice) item.unitPrice = item.totalPrice / item.quantity;
            if (!item.totalPrice && item.unitPrice) item.totalPrice = item.unitPrice * item.quantity;
            items.push(item);
          }
        }
      });
    }

    // Padrão 2: Spans com classes txtTit/Rqtd/RvlUnit (layout RN/outros)
    if (items.length === 0) {
      var blocks = document.querySelectorAll('.txtTit, [class*="txtTit"]');
      blocks.forEach(function(block) {
        var container = block.closest('tr, div, li') || block.parentElement;
        var text = container ? container.textContent : block.textContent;
        
        var name = block.textContent.trim();
        var qtyMatch = text.match(/(?:Qtde|Qt)[.:]?\\s*([\\d.,]+)/i);
        var unitMatch = text.match(/(?:UN|KG|LT|ML|MT|PC|CX|DZ|GR)/i);
        var unitPriceMatch = text.match(/(?:Vl\\.?\\s*Unit|V\\.Unit)[.:]?\\s*R?\\$?\\s*([\\d.,]+)/i);
        var totalMatch = text.match(/(?:Vl\\.?\\s*Total|V\\.Total|Valor)[.:]?\\s*R?\\$?\\s*([\\d.,]+)/i);

        if (name && name.length > 2) {
          items.push({
            code: '',
            name: name.replace(/\\s+/g, ' '),
            unit: unitMatch ? unitMatch[0].toUpperCase() : 'UN',
            quantity: qtyMatch ? parseFloat(qtyMatch[1].replace(/\\./g, '').replace(',', '.')) : 1,
            unitPrice: unitPriceMatch ? parseFloat(unitPriceMatch[1].replace(/\\./g, '').replace(',', '.')) : 0,
            totalPrice: totalMatch ? parseFloat(totalMatch[1].replace(/\\./g, '').replace(',', '.')) : 0,
          });
        }
      });
    }

    // ===== TOTAIS =====
    var totalText = document.body.innerHTML;
    var totalMatch = totalText.match(/(?:Valor\\s*(?:Total|a\\s*Pagar)|TOTAL)[^\\d]*R?\\$?\\s*([\\d.,]+)/i);
    var totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/\\./g, '').replace(',', '.')) : 0;
    
    if (!totalAmount && items.length > 0) {
      totalAmount = items.reduce(function(sum, i) { return sum + i.totalPrice; }, 0);
    }

    var discountMatch = totalText.match(/(?:Desconto)[^\\d]*R?\\$?\\s*([\\d.,]+)/i);
    var discountAmount = discountMatch ? parseFloat(discountMatch[1].replace(/\\./g, '').replace(',', '.')) : 0;

    // ===== DATA =====
    var dateMatch = totalText.match(/(\\d{2}\\/\\d{2}\\/\\d{4})\\s*(\\d{2}:\\d{2}(?::\\d{2})?)/);
    var purchaseDate = dateMatch ? dateMatch[1] + ' ' + dateMatch[2] : '';

    // ===== RESULTADO =====
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
      error: 'Erro ao extrair dados: ' + e.message
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
  items: Array<{ name: string; unit: string; quantity: number; unitPrice: number }>;
}): NfceReceipt {
  const items: NfceItem[] = input.items.map((item) => ({
    code: '',
    name: item.name.toUpperCase().trim(),
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
