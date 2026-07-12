import { by, device, element, expect } from 'detox';

describe('Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should show home tab with app title', async () => {
    await expect(element(by.text('notraq'))).toBeVisible();
  });

  it('should navigate to Produtos tab', async () => {
    await element(by.text('Produtos')).tap();
    await expect(element(by.text('Produtos'))).toBeVisible();
  });

  it('should navigate to Mercados tab', async () => {
    await element(by.text('Mercados')).tap();
    await expect(element(by.text('Mercados'))).toBeVisible();
  });

  it('should navigate back to Início', async () => {
    await element(by.text('Início')).tap();
    await expect(element(by.text('notraq'))).toBeVisible();
  });
});
