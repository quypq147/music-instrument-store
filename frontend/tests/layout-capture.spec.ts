import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

const seedCart = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'cart',
      JSON.stringify([
        { id: 1, name: 'Yamaha YAS-280', price: '35.800.000đ', image: '/placeholder.jpg', quantity: 2 },
        { id: 2, name: 'Selmer AS500', price: '51.000.000đ', image: '/placeholder.jpg', quantity: 1 },
      ])
    );
  });
};

const seedOrders = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'orders',
      JSON.stringify([
        {
          id: 'DH1720000000000',
          customer: { name: 'Nguyễn Văn A', phone: '0912345678', address: '123 Lê Lợi, Q1, TP.HCM', note: '' },
          paymentMethod: 'COD',
          products: [{ id: 1, name: 'Yamaha YAS-280', price: '35.800.000đ', image: '/placeholder.jpg', quantity: 1 }],
          totalItems: 1,
          totalPrice: 35800000,
          status: 'Chờ xác nhận',
          createdAt: new Date().toLocaleString('vi-VN'),
        },
      ])
    );
  });
};

test.describe('Modernization Verification', () => {
  test('Homepage - full desktop', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-homepage-full.png', fullPage: true });
  });

  test('Homepage - hero close-up', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/02-hero-section.png', clip: { x: 0, y: 0, width: 1280, height: 500 } });
  });

  test('Homepage - footer', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: 'screenshots/03-footer.png' });
  });

  test('Homepage - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/04-mobile-homepage.png', fullPage: true });
  });

  test('Homepage - dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/05-dark-homepage.png', fullPage: true });
  });

  test('Products listing page', async ({ page }) => {
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-products.png', fullPage: true });
  });

  test('Cart page - empty state', async ({ page }) => {
    await page.goto(`${BASE}/cart`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/07-cart-empty.png', fullPage: true });
  });

  test('Cart page - with items', async ({ page }) => {
    await seedCart(page);
    await page.goto(`${BASE}/cart`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-cart-filled.png', fullPage: true });
  });

  test('Orders page - empty state', async ({ page }) => {
    await page.goto(`${BASE}/orders`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-orders-empty.png', fullPage: true });
  });

  test('Orders page - with items', async ({ page }) => {
    await seedOrders(page);
    await page.goto(`${BASE}/orders`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/10-orders-filled.png', fullPage: true });
  });

  test('Admin page - unauthorized state', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/11-admin-unauthorized.png', fullPage: true });
  });

  test('Login page', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/12-login.png', fullPage: true });
  });

  test('Contact page', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/13-contact.png', fullPage: true });
  });
});
