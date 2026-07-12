import { formatBRL, getNameColor, toTitleCase } from '@/lib/utils';

describe('formatBRL', () => {
  it('formats integer values', () => {
    expect(formatBRL(10)).toBe('R$ 10,00');
  });

  it('formats decimal values', () => {
    expect(formatBRL(12.5)).toBe('R$ 12,50');
    expect(formatBRL(1234.99)).toBe('R$ 1234,99');
  });

  it('handles zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatBRL(9.999)).toBe('R$ 10,00');
    expect(formatBRL(5.555)).toBe('R$ 5,55');
  });
});

describe('getNameColor', () => {
  it('returns a consistent color for the same name', () => {
    const color1 = getNameColor('Nordestão');
    const color2 = getNameColor('Nordestão');
    expect(color1).toBe(color2);
  });

  it('returns a valid hex color', () => {
    const color = getNameColor('Test');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('handles empty string', () => {
    const color = getNameColor('');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('toTitleCase', () => {
  it('converts uppercase to title case', () => {
    expect(toTitleCase('REFRIG PEPSI COLA 2L')).toBe('Refrig Pepsi Cola 2l');
  });

  it('converts lowercase to title case', () => {
    expect(toTitleCase('arroz tipo 1')).toBe('Arroz Tipo 1');
  });

  it('handles mixed case', () => {
    expect(toTitleCase('pAO Frances KG')).toBe('Pao Frances Kg');
  });

  it('handles single word', () => {
    expect(toTitleCase('CEBOLA')).toBe('Cebola');
  });

  it('handles empty string', () => {
    expect(toTitleCase('')).toBe('');
  });
});
