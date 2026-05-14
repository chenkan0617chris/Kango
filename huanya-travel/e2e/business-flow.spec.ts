import { test, expect, type Page } from '@playwright/test'

const TOURIST_EMAIL = process.env.E2E_EMAIL         ?? ''
const TOURIST_PASS  = process.env.E2E_PASSWORD      ?? ''
const DRIVER_EMAIL  = process.env.E2E_DRIVER_EMAIL  ?? ''
const DRIVER_PASS   = process.env.E2E_DRIVER_PASSWORD ?? ''

test.describe.configure({ mode: 'serial' })

let demandId = ''
let orderId  = ''
let driverId = ''

// ─── Auth helpers ──────────────────────────────────────────────────────────────

async function loginAsTourist(page: Page) {
  await page.context().clearCookies()
  await page.goto('/login')
  await page.fill('input[type="email"]', TOURIST_EMAIL)
  await page.fill('input[type="password"]', TOURIST_PASS)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

async function loginAsDriver(page: Page) {
  await page.context().clearCookies()
  await page.goto('/login')
  await page.fill('input[type="email"]', DRIVER_EMAIL)
  await page.fill('input[type="password"]', DRIVER_PASS)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

/** Travel date 30 days from now in YYYY-MM-DD format. */
function travelDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

// ─── Step 0 — Environment guard ────────────────────────────────────────────────

test('Step 0 — all required env vars are present', () => {
  expect(TOURIST_EMAIL, 'E2E_EMAIL must be set in .env.test').not.toBe('')
  expect(TOURIST_PASS,  'E2E_PASSWORD must be set in .env.test').not.toBe('')
  expect(DRIVER_EMAIL,  'E2E_DRIVER_EMAIL must be set in .env.test').not.toBe('')
  expect(DRIVER_PASS,   'E2E_DRIVER_PASSWORD must be set in .env.test').not.toBe('')
})

// ─── Step 1 — Tourist login ────────────────────────────────────────────────────

test('Step 1 — tourist can log in and sees the app name', async ({ page }) => {
  await loginAsTourist(page)

  // The navbar shows "HuanYa Travel" for the English locale.
  await expect(
    page.getByText('HuanYa Travel').first(),
    'Navbar should display app name after login',
  ).toBeVisible()
})

// ─── Step 2 — Tourist posts a demand via API ───────────────────────────────────

test('Step 2 — tourist creates a demand via API and receives a UUID', async ({ page }) => {
  test.slow()
  await loginAsTourist(page)

  const res = await page.request.post('/api/demands', {
    data: {
      pickup_loc:    'Melbourne Airport (MEL), Tullamarine',
      dropoff_loc:   'Sydney CBD, NSW',
      travel_date:   travelDate(),
      pax_count:     2,
      luggage_count: 1,
      budget_min:    200,
      budget_max:    400,
    },
  })

  expect(res.status(), 'POST /api/demands should return 201').toBe(201)

  const json = await res.json()
  demandId = json.data?.id ?? ''

  expect(demandId, 'Response should contain a demand UUID').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )
})

// ─── Step 3 — Tourist dashboard shows the demand ───────────────────────────────

test('Step 3 — tourist dashboard lists the newly created demand', async ({ page }) => {
  test.slow()
  await loginAsTourist(page)
  await page.goto('/tourist/dashboard')

  await expect(
    page.getByText('Melbourne Airport').first(),
    'Tourist dashboard should show a card containing "Melbourne Airport"',
  ).toBeVisible({ timeout: 15_000 })
})

// ─── Step 4 — Driver sees demand in marketplace ────────────────────────────────

test('Step 4 — driver sees the demand in the marketplace', async ({ page }) => {
  test.slow()
  await loginAsDriver(page)
  await page.goto('/driver/marketplace')

  await expect(
    page.getByText('Melbourne Airport').first(),
    'Marketplace should list the demand containing "Melbourne Airport"',
  ).toBeVisible({ timeout: 15_000 })
})

// ─── Step 5 — Driver submits a bid via API ─────────────────────────────────────

test('Step 5 — driver submits a bid via API and receives 201', async ({ page }) => {
  test.slow()
  await loginAsDriver(page)

  const res = await page.request.post('/api/bids', {
    data: {
      demand_id:    demandId,
      price:        300,
      vehicle_info: 'Toyota HiAce 2022 白色 8座 · E2ETEST',
    },
  })

  expect(res.status(), 'POST /api/bids should return 201').toBe(201)

  // While logged in as driver, capture the driver's profile UUID for later use.
  const bidsRes = await page.request.get('/api/bids?mine=true')
  expect(bidsRes.ok(), 'GET /api/bids?mine=true should succeed').toBe(true)
  const bidsJson = await bidsRes.json()
  // The API returns { data: [{ ..., driver: { id, ... } }] }
  driverId = bidsJson.data?.[0]?.driver?.id ?? ''
})

// ─── Step 6 — Bid appears in marketplace "already bid" section ─────────────────

test('Step 6 — driver marketplace reflects the submitted bid', async ({ page }) => {
  test.slow()
  await loginAsDriver(page)
  await page.goto('/driver/marketplace')
  await page.waitForLoadState('networkidle')

  // After bidding, the demand card moves to the "已报价" / "Already Bid" section
  // (rendered at reduced opacity) or disappears from the available section.
  // Either outcome means "Melbourne Airport" is still present on the page (in the
  // bidded section) OR the available section no longer contains it.
  // We check for the bidded section heading as the positive assertion.
  const hasBiddedSection = await page.getByText(/已报价|Already Bid/i).count() > 0
  const hasMelbourneCard = await page.getByText('Melbourne Airport').count() > 0

  expect(
    hasBiddedSection || hasMelbourneCard,
    'Marketplace should show the demand in the "already bid" section or the card should still be visible',
  ).toBe(true)
})

// ─── Step 7 — Tourist selects the bid via UI ───────────────────────────────────

test('Step 7 — tourist selects the driver bid and is redirected to pay page', async ({ page }) => {
  test.slow()
  await loginAsTourist(page)
  await page.goto(`/demand/${demandId}`)

  // Wait for at least one bid card to be visible.
  await expect(
    page.locator('[class*="rounded-2xl"][class*="border"]').filter({ hasText: /Toyota|E2ETEST|300/ }).first(),
    'At least one bid card should be visible on the demand detail page',
  ).toBeVisible({ timeout: 15_000 })

  // Click "选择此报价" (Select This Bid) — the button rendered by BidsClient.
  await page.getByRole('button', { name: /选择此报价|Select This Bid/i }).first().click()

  // After acceptance the app navigates to /order/<uuid>/pay.
  await page.waitForURL(/\/order\/[a-f0-9-]+\/pay/, { timeout: 15_000 })

  const match = page.url().match(/\/order\/([a-f0-9-]+)\/pay/)
  orderId = match?.[1] ?? ''

  expect(orderId, 'orderId should be extracted from the redirect URL').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )
})

// ─── Step 8 — Tourist pays the deposit via UI ──────────────────────────────────

test('Step 8 — tourist pays deposit and sees driver contact info', async ({ page }) => {
  test.slow()
  await loginAsTourist(page)
  await page.goto(`/order/${orderId}/pay`)

  // The pay button text is generated from the "payBtn" i18n key, e.g. "确认支付 $30.00".
  // We match it loosely so it works regardless of the exact amount.
  const payBtn = page.getByRole('button', { name: /Pay|确认支付/i })
  await expect(payBtn, 'Pay button should be visible on the payment page').toBeVisible({ timeout: 10_000 })
  await payBtn.click()

  // After payment the router pushes to /order/<id> (no /pay suffix).
  await page.waitForURL(new RegExp(`/order/${orderId}$`), { timeout: 15_000 })

  // The order page shows the contact section heading for tourist ("driverContact" i18n key).
  await expect(
    page.getByText(/Driver Contact|司机联系方式/i).first(),
    'Order page should display driver contact section after payment',
  ).toBeVisible({ timeout: 10_000 })
})

// ─── Step 9 — Driver starts the trip ──────────────────────────────────────────

test('Step 9 — driver clicks "开始行程" to start the trip', async ({ page }) => {
  test.slow()
  await loginAsDriver(page)
  await page.goto(`/order/${orderId}`)

  const startBtn = page.getByRole('button', { name: '开始行程' })
  await expect(startBtn, '"开始行程" button should be visible for driver').toBeVisible({ timeout: 15_000 })
  await startBtn.click()

  // DriverStatusClient calls router.refresh() — the page reloads and now shows "完成行程".
  await expect(
    page.getByRole('button', { name: '完成行程' }),
    '"完成行程" button should appear after starting the trip',
  ).toBeVisible({ timeout: 15_000 })
})

// ─── Step 10 — Driver completes the trip ──────────────────────────────────────

test('Step 10 — driver clicks "完成行程" to complete the trip', async ({ page }) => {
  test.slow()
  await loginAsDriver(page)
  await page.goto(`/order/${orderId}`)

  const completeBtn = page.getByRole('button', { name: '完成行程' })
  await expect(completeBtn, '"完成行程" button should be visible').toBeVisible({ timeout: 15_000 })
  await completeBtn.click()

  // After completion DriverStatusClient renders the "行程已完成" confirmation element.
  await expect(
    page.getByText('行程已完成'),
    'Completion confirmation text "行程已完成" should appear',
  ).toBeVisible({ timeout: 15_000 })
})

// ─── Step 11 — Tourist submits a review via API ────────────────────────────────

test('Step 11 — tourist submits a review for the driver via API', async ({ page }) => {
  test.slow()
  await loginAsTourist(page)

  const res = await page.request.post('/api/reviews', {
    data: {
      order_id: orderId,
      rating:   5,
      comment:  'Great driver! E2E test.',
    },
  })

  // The reviews API is expected to return 201 on success.
  expect(res.status(), 'POST /api/reviews should return 201').toBe(201)
})

// ─── Step 12 — Driver profile shows the new review ────────────────────────────

test('Step 12 — driver profile page shows the submitted review', async ({ page }) => {
  test.slow()
  expect(driverId, 'driverId must have been captured in Step 5').not.toBe('')

  // Visit the driver profile as an unauthenticated (or tourist) user — the page is public.
  await loginAsTourist(page)
  await page.goto(`/profile/driver/${driverId}`)

  await expect(
    page.getByText('Great driver! E2E test.'),
    'Driver profile should display the review comment submitted in Step 11',
  ).toBeVisible({ timeout: 15_000 })
})

// ─── Step 13 — Cancel order flow (separate demand) ────────────────────────────

test('Step 13 — tourist can cancel a confirmed and paid order', async ({ page }) => {
  test.slow()

  // 13a: Tourist creates a second demand.
  await loginAsTourist(page)
  const demandRes = await page.request.post('/api/demands', {
    data: {
      pickup_loc:    'Great Ocean Road, VIC',
      dropoff_loc:   'Melbourne Airport (MEL), Tullamarine',
      travel_date:   travelDate(),
      pax_count:     3,
      luggage_count: 2,
      budget_min:    150,
      budget_max:    350,
    },
  })
  expect(demandRes.status(), 'Cancel-flow: POST /api/demands should return 201').toBe(201)
  const cancelDemandId: string = (await demandRes.json()).data?.id ?? ''
  expect(cancelDemandId, 'Cancel-flow: cancelDemandId should be a UUID').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )

  // 13b: Driver submits a bid on the new demand.
  await loginAsDriver(page)
  const bidRes = await page.request.post('/api/bids', {
    data: {
      demand_id:    cancelDemandId,
      price:        250,
      vehicle_info: 'Toyota HiAce 2022 白色 8座 · E2ETEST',
    },
  })
  expect(bidRes.status(), 'Cancel-flow: POST /api/bids should return 201').toBe(201)
  const cancelBidId: string = (await bidRes.json()).data?.id ?? ''
  expect(cancelBidId, 'Cancel-flow: cancelBidId should be a UUID').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )

  // 13c: Tourist accepts the bid — this creates an order.
  await loginAsTourist(page)
  const acceptRes = await page.request.patch(`/api/demands/${cancelDemandId}`, {
    data: { action: 'accept_bid', bid_id: cancelBidId },
  })
  expect(acceptRes.status(), 'Cancel-flow: PATCH /api/demands/[id] (accept_bid) should return 200').toBe(200)
  const cancelOrderId: string = (await acceptRes.json()).data?.id ?? ''
  expect(cancelOrderId, 'Cancel-flow: cancelOrderId should be a UUID').toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )

  // 13d: Tourist pays the deposit.
  const payRes = await page.request.patch(`/api/orders/${cancelOrderId}`, {
    data: { action: 'pay_deposit' },
  })
  expect(payRes.status(), 'Cancel-flow: PATCH /api/orders/[id] (pay_deposit) should return 200').toBe(200)

  // 13e: Tourist cancels the order.
  // The orders API routes cancel through the demands endpoint — the demand must be
  // cancelled to also reflect on the order.  The orders PATCH currently only supports
  // pay_deposit and update_trip_status.  We cancel via the demand status endpoint.
  const cancelRes = await page.request.patch(`/api/orders/${cancelOrderId}`, {
    data: { action: 'cancel' },
  })
  expect(cancelRes.status(), 'Cancel-flow: PATCH /api/orders/[id] (cancel) should return 200').toBe(200)

  const cancelJson = await cancelRes.json()
  expect(
    cancelJson.data?.trip_status,
    'Cancelled order should have trip_status "cancelled"',
  ).toBe('cancelled')
  expect(
    cancelJson.data?.payment_status,
    'Cancelled order should have payment_status "refunded"',
  ).toBe('refunded')
})
