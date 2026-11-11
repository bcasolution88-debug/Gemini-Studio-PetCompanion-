import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/webapp/ui-showcase/screens';
fs.mkdirSync(OUT, { recursive: true });

const TIP = 'Positive reinforcement works fastest: reward the exact behavior within 2 seconds with a high-value treat and calm praise.';
const MOCK = {
  '/api/health': { status: 'ok' },
  '/api/geoip': { status: 'success', lat: 40.7128, lon: -74.006, city: 'New York', region: 'New York', country: 'United States' },
  '/api/behavior-tip': { tip: TIP },
  '/api/daily-wisdom': { tip: TIP },
  '/api/chat': { reply: 'Aim for 30–60 minutes of daily activity, fresh water at all times, and portion-controlled meals.\n\n*Disclaimer: educational guidance only.*' },
  '/api/recommendations': [{ petId: '1', reason: 'High energy — matches your active lifestyle.' }],
  '/api/match-score': { score: 92, reason: 'Excellent lifestyle alignment.' },
  '/api/calculate-match': { score: 94, explanation: 'Your activity level and home space align almost perfectly.' },
  '/api/pet-matching-quiz': { matches: [{ petId: '1', score: 96, reason: 'Playful and fully vaccinated.' }] },
  '/api/analyze-behavior': { analysis: 'Steady improvement in mood and activity.', tags: ['stable weight'] },
  '/api/generate-insights': { summary: 'Consistently positive wellness trends.', trends: ['Weight stable'], actions: ['Keep feeding schedule'] },
  '/api/personalized-recommendations': { tips: ['Schedule a dental check within 30 days'] },
  '/api/generate-routine': { routine: [{ time: '07:00', task: 'Morning walk' }] },
  '/api/generate-avatar': { imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400' },
  '/api/generate-care-infographic': { imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=800' },
  '/api/virtual-tour-status': { status: 'completed', videoUrl: '' },
  '/api/generate-virtual-tour': { operationName: 'mock' }
};

const SEED = {
  pet_community_lang: 'zh', theme: 'light', sound_enabled: 'true',
  adoption_readiness: JSON.stringify({ quizCompleted: true, careTipsRead: true, profileInfoSet: true, homeContextSet: true }),
  compatibility_quiz_completed: 'true', care_tips_read: 'true', notifications_enabled: 'true',
  pet_community_viewed_ids: JSON.stringify(['1']),
  pet_adoption_quiz_answers: JSON.stringify({ homeType: 'Apartment', activity: 'High', experience: 'Experienced' }),
  adoption_inquiries: JSON.stringify([{ id: 'inq-1', petId: '1', petName: 'Buddy', name: 'Alex', email: 'a@b.com', message: 'Hi', status: 'approved', timestamp: Date.now() - 6 * 864e5 }]),
  pet_health_journal_entries: JSON.stringify([{ id: 'h1', petId: '1', date: '2026-11-03', activity: 'Park walk', weight: 12.4, mood: 'Happy' }]),
  care_routines: JSON.stringify([{ id: 'r1', petId: '1', title: 'Morning walk', time: '07:00', frequency: 'Daily', done: true }])
};

async function setup(browser, { dark = false, width = 1440, height = 1500 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: dark ? 'dark' : 'light', locale: 'zh-CN' });
  await ctx.addInitScript((seed) => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, SEED);
  if (dark) await ctx.addInitScript(() => document.documentElement.classList.add('dark'));
  const page = await ctx.newPage();
  await page.route('**/api/**', (route) => {
    const key = new URL(route.request().url()).pathname;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK[key] ?? {}) });
  });
  return { ctx, page };
}

/* click the first pet card in the grid (the one with data-testid-ish structure) */
async function openFirstPet(page) {
  await page.goto(BASE + '/adoption', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  // The pet grid cards are the cursor-pointer rounded-2xl divs containing an img
  const card = page.locator('div.cursor-pointer.rounded-2xl.border-orange-100, div.cursor-pointer.rounded-2xl[class*="border-orange-100"]').first();
  if (await card.count()) {
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.waitForTimeout(2500);
    return (await page.locator('text=申请正式领养').count()) > 0;
  }
  return false;
}

async function shot(page, name, full = false) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log('✓', name);
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });

// light detail modal
{
  const { ctx, page } = await setup(browser);
  if (await openFirstPet(page)) {
    await shot(page, '06-modal-pet-detail-light');
    await page.locator('button', { hasText: '申请正式领养' }).first().click();
    await page.waitForTimeout(2000);
    await shot(page, '07-modal-apply-adopt');
  } else console.log('✗ detail light');
  await ctx.close();
}

// dark detail modal
{
  const { ctx, page } = await setup(browser, { dark: true });
  if (await openFirstPet(page)) await shot(page, '08-modal-pet-detail-dark');
  else console.log('✗ detail dark');
  await ctx.close();
}

// mobile detail modal
{
  const { ctx, page } = await setup(browser, { width: 390, height: 1100 });
  if (await openFirstPet(page)) await shot(page, '12-modal-pet-detail-mobile');
  else console.log('✗ detail mobile');
  await ctx.close();
}

// quiz modal on pet detail
{
  const { ctx, page } = await setup(browser);
  if (await openFirstPet(page)) {
    const q = page.locator('button', { hasText: /开启智能适配度测评|Start Match Quiz/ }).first();
    if (await q.count()) { await q.click(); await page.waitForTimeout(2500); await shot(page, '13-modal-match-quiz'); }
  }
  await ctx.close();
}

await browser.close();
console.log('DONE');
