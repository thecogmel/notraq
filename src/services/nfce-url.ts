import type { NfceUrlInfo } from '@/types';

/**
 * Mapa de UFs para URLs base da SEFAZ.
 * Cada estado tem seu endpoint de consulta NFC-e.
 */
const SEFAZ_URLS: Record<string, string> = {
  '12': 'https://nfce.sefaz.ac.gov.br', // AC
  '27': 'https://nfce.sefaz.al.gov.br', // AL
  '13': 'https://nfce.sefaz.am.gov.br', // AM
  '16': 'https://nfce.sefaz.ap.gov.br', // AP
  '29': 'https://nfce.sefaz.ba.gov.br', // BA
  '23': 'https://nfce.sefaz.ce.gov.br', // CE
  '53': 'https://nfce.sefaz.df.gov.br', // DF
  '32': 'https://nfce.sefaz.es.gov.br', // ES
  '52': 'https://nfce.sefaz.go.gov.br', // GO
  '21': 'https://nfce.sefaz.ma.gov.br', // MA
  '31': 'https://nfce.sefaz.mg.gov.br', // MG
  '50': 'https://nfce.sefaz.ms.gov.br', // MS
  '51': 'https://nfce.sefaz.mt.gov.br', // MT
  '15': 'https://nfce.sefaz.pa.gov.br', // PA
  '25': 'https://nfce.sefaz.pb.gov.br', // PB
  '26': 'https://nfce.sefaz.pe.gov.br', // PE
  '22': 'https://nfce.sefaz.pi.gov.br', // PI
  '41': 'https://nfce.fazenda.pr.gov.br', // PR
  '33': 'https://nfce.sefaz.rj.gov.br', // RJ
  '24': 'https://nfce.sefaz.rn.gov.br', // RN
  '11': 'https://nfce.sefaz.ro.gov.br', // RO
  '14': 'https://nfce.sefaz.rr.gov.br', // RR
  '43': 'https://nfce.sefaz.rs.gov.br', // RS
  '42': 'https://nfce.sefaz.sc.gov.br', // SC
  '28': 'https://nfce.sefaz.se.gov.br', // SE
  '35': 'https://nfce.fazenda.sp.gov.br', // SP
  '17': 'https://nfce.sefaz.to.gov.br', // TO
};

const UF_NAMES: Record<string, string> = {
  '12': 'AC', '27': 'AL', '13': 'AM', '16': 'AP', '29': 'BA',
  '23': 'CE', '53': 'DF', '32': 'ES', '52': 'GO', '21': 'MA',
  '31': 'MG', '50': 'MS', '51': 'MT', '15': 'PA', '25': 'PB',
  '26': 'PE', '22': 'PI', '41': 'PR', '33': 'RJ', '24': 'RN',
  '11': 'RO', '14': 'RR', '43': 'RS', '42': 'SC', '28': 'SE',
  '35': 'SP', '17': 'TO',
};

/**
 * Extrai a chave de acesso (44 dígitos) de uma URL de QR code NFC-e.
 * Formatos comuns:
 * - ?p=<chave>|2|1|...
 * - ?chNFe=<chave>&...
 * - Chave direta na URL path
 */
export function extractAccessKey(url: string): string | null {
  // Formato: ?p=<44digitos>|...
  const pMatch = url.match(/[?&]p=(\d{44})/);
  if (pMatch) return pMatch[1];

  // Formato: ?chNFe=<44digitos>
  const chMatch = url.match(/[?&]chNFe=(\d{44})/);
  if (chMatch) return chMatch[1];

  // Chave direta no path ou query
  const rawMatch = url.match(/(\d{44})/);
  if (rawMatch) return rawMatch[1];

  return null;
}

/**
 * Parseia uma URL de QR code NFC-e e retorna informações estruturadas.
 */
export function parseNfceUrl(qrcodeData: string): NfceUrlInfo | null {
  const accessKey = extractAccessKey(qrcodeData);
  if (!accessKey) return null;

  // UF são os 2 primeiros dígitos da chave de acesso
  const uf = accessKey.substring(0, 2);
  const sefazUrl = SEFAZ_URLS[uf] ?? '';

  return {
    url: qrcodeData,
    accessKey,
    uf,
    sefazUrl,
  };
}

/**
 * Monta a URL de consulta pública da NFC-e para o WebView.
 * Se a URL do QR já é uma URL de consulta válida da SEFAZ, usa ela diretamente.
 * Caso contrário, monta a URL de consulta pública com a chave de acesso.
 */
export function buildConsultaUrl(info: NfceUrlInfo): string {
  // Se a URL original é uma URL HTTP da SEFAZ, usar direto (já tem os params corretos)
  if (info.url.startsWith('http') && info.url.match(/sefaz|set\.\w+\.gov/i)) {
    return info.url;
  }

  // Fallback: montar URL de consulta pública
  if (info.sefazUrl) {
    return `${info.sefazUrl}/portalDFE/NFCe/ConsultaNFCe.aspx?p=${info.accessKey}`;
  }

  return info.url;
}

/**
 * Verifica se uma URL escaneada é potencialmente uma NFC-e válida.
 */
export function isNfceUrl(url: string): boolean {
  if (!url) return false;

  // Checa se contém uma chave de acesso (44 dígitos)
  if (/\d{44}/.test(url)) return true;

  // Checa domínios conhecidos de SEFAZ
  const sefazDomains = ['sefaz', 'fazenda', 'set.rn', 'nfce'];
  return sefazDomains.some((domain) => url.toLowerCase().includes(domain));
}

/**
 * Retorna o nome do estado a partir do código UF.
 */
export function getUfName(uf: string): string {
  return UF_NAMES[uf] ?? 'Desconhecido';
}
