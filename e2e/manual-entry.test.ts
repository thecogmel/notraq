import { by, device, element, expect, waitFor } from 'detox';

describe('Manual Entry Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should open scan modal from home', async () => {
    // Tap the scan/add button (navigates to /scan)
    await element(by.text('Início')).tap();
    // The FAB or scan button should be visible
    await waitFor(element(by.text('Adicionar Nota')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should select manual entry mode', async () => {
    await element(by.text('Digitar Manualmente')).tap();
    await expect(element(by.text('Entrada Manual'))).toBeVisible();
  });

  it('should fill store name', async () => {
    await element(by.placeholder('Ex: Supermercado X')).typeText('Mercado Teste E2E');
  });

  it('should fill product name', async () => {
    await element(by.placeholder('Ex: Arroz 5kg')).typeText('Produto Teste');
  });

  it('should fill price', async () => {
    await element(by.placeholder('R$ 0,00')).typeText('1299');
    // Should format as R$ 12,99
  });

  it('should submit and see success', async () => {
    await element(by.text('Salvar')).tap();
    await waitFor(element(by.text('Nota registrada!')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to receipt detail', async () => {
    await element(by.text('Ver detalhes da nota')).tap();
    await waitFor(element(by.text('Nota fiscal')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Mercado Teste E2E'))).toBeVisible();
    await expect(element(by.text('Produto Teste'))).toBeVisible();
  });

  it('should complete and return to home', async () => {
    await element(by.text('Concluir')).tap();
    await waitFor(element(by.text('notraq')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
