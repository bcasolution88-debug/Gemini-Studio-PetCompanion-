import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/webapp/ui-showcase/screens';
fs.mkdirSync(OUT, { recursive: true });

/* ---------- Mock AI payloads so every view renders with realistic content ---------- */
const TIP = 'Positive reinforcement works fastest: reward the exact behavior within 2 seconds with a high-value treat and calm praise. Short, daily 5-minute sessions beat one long weekly session.';
const MOCK = {
  '/api/health': { status: 'ok' },
  '/api/geoip': { status: 'success', lat: 40.7128, lon: -74.006, city: 'New York', region: 'New York', country: 'United States' },
  '/api/behavior-tip': { tip: TIP },
  '/api/daily-wisdom': { tip: TIP },
  '/api/chat': { reply: 'Great question! For a healthy daily routine, aim for 30–60 minutes of activity, fresh water at all times, and portion-controlled meals matched to your pet\'s life stage.\n\n*Disclaimer: educational guidance only — not a substitute for veterinary diagnosis.*' },
  '/api/recommendations': [
    { petId: '1', reason: 'High energy and playful — matches your active lifestyle preference.' },
    { petId: '2', reason: 'Calm, affectionate and apartment-friendly for your living space.' },
    { petId: '3', reason: 'Great with first-time adopters and low grooming needs.' }
  ],
  '/api/match-score': { score: 92, reason: 'Excellent lifestyle alignment: energy level, space and experience all match.' },
  '/api/calculate-match': { score: 94, explanation: 'Your activity level and home space align almost perfectly with this pet.' },
  '/api/match-breed': [
    { breed: 'Cavalier King Charles Spaniel', reason: 'Affectionate lap dog that thrives in apartments.' },
    { breed: 'British Shorthair', reason: 'Independent, calm and low-maintenance for busy schedules.' },
    { breed: 'Miniature Poodle', reason: 'Highly trainable and low-shedding for allergy-sensitive homes.' }
  ],
  '/api/pet-matching-quiz': { matches: [{ petId: '1', score: 96, reason: 'Playful, energetic and fully vaccinated.' }] },
  '/api/expert-search': {
    answer: 'This is a very common behavioral pattern. The evidence-based approach is threefold:\n\n1. **Positive reinforcement** — reward the desired behavior immediately.\n2. **Environmental enrichment** — puzzle feeders, scheduled play, sniff walks.\n3. **Rule out medical causes** — pain and discomfort frequently present as behavior change.\n\n*Educational advice only — please consult a licensed veterinarian.*',
    sources: [{ title: 'AVMA — Pet Behavior & Care', uri: 'https://www.avma.org' }, { title: 'ASPCA — Behaviorist Guidelines', uri: 'https://www.aspca.org' }]
  },
  '/api/analyze-behavior': { analysis: 'Steady improvement in mood and activity over the last 7 days. Weight is stable within a healthy range.', tags: ['stable weight', 'high activity'] },
  '/api/check-symptoms': { severity: 'low', assessment: 'Mild, non-urgent signs. Monitor for 24 hours and ensure hydration.', recommendations: ['Monitor water intake', 'Book a routine vet visit if it persists'] },
  '/api/generate-insights': { summary: 'Your pet shows consistently positive wellness trends this week — appetite, activity and mood all stable.', trends: ['Weight stable', 'Activity up 12%'], actions: ['Keep the current feeding schedule', 'Add one enrichment session per day'] },
  '/api/personalized-recommendations': { tips: ['Schedule a dental check within 30 days', 'Add an omega-3 supplement to the diet'] },
  '/api/generate-routine': { routine: [{ time: '07:00', task: 'Morning walk & potty break' }, { time: '12:00', task: 'Meal + fresh water' }, { time: '18:00', task: 'Play & training session' }] },
  '/api/generate-caption': { caption: 'Sunbeam supervisor on duty ☀️' },
  '/api/identify-pet': { species: 'Dog', breed: 'Golden Retriever', confidence: 0.96 },
  '/api/generate-avatar': { imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400' },
  '/api/generate-care-infographic': { imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=800' },
  '/api/analyze-vision': { caption: 'Happy, healthy dog enjoying the outdoors.' },
  '/api/virtual-tour-status': { status: 'completed', videoUrl: '' },
  '/api/generate-virtual-tour': { operationName: 'mock-op' }
};

/* ---------- localStorage seed: makes dashboards/journeys look populated ---------- */
const SEED = {
  pet_community_lang: 'zh',
  theme: 'light',
  sound_enabled: 'true',
  adoption_readiness: JSON.stringify({ quizCompleted: true, careTipsRead: true, profileInfoSet: true, homeContextSet: true }),
  compatibility_quiz_completed: 'true',
  care_tips_read: 'true',
  notifications_enabled: 'true',
  pet_community_viewed_ids: JSON.stringify(['1', '2']),
  adoption_quiz_answers: JSON.stringify({ homeType: 'Apartment', activity: 'Moderate', experience: 'Some', hoursAway: '6-8' }),
  pet_adoption_quiz_answers: JSON.stringify({ homeType: 'Apartment', activity: 'High', experience: 'Experienced', hoursAway: '4-6', hasChildren: 'No', budget: 'Medium' }),
  adoption_inquiries: JSON.stringify([
    { id: 'inq-1', petId: '1', petName: 'Buddy', petImageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400', name: 'Alex Mercer', email: 'alex@example.com', message: 'Would love to meet Buddy this weekend!', status: 'approved', timestamp: Date.now() - 6 * 864e5 },
    { id: 'inq-2', petId: '2', petName: 'Luna', petImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400', name: 'Alex Mercer', email: 'alex@example.com', message: 'Interested in adopting Luna.', status: 'pending', timestamp: Date.now() - 2 * 864e5 }
  ]),
  pet_health_journal_entries: JSON.stringify([
    { id: 'h1', petId: '1', date: '2026-11-03', activity: 'Park walk 45 min', weight: 12.4, mood: 'Happy', moodTags: ['Playful'] },
    { id: 'h2', petId: '1', date: '2026-11-05', activity: 'Agility class', weight: 12.5, mood: 'Energetic', moodTags: ['Active'] },
    { id: 'h3', petId: '1', date: '2026-11-08', activity: 'Rest day', weight: 12.5, mood: 'Calm', moodTags: ['Relaxed'] }
  ]),
  care_routines: JSON.stringify([
    { id: 'r1', petId: '1', title: 'Morning walk', time: '07:00', frequency: 'Daily', done: true },
    { id: 'r2', petId: '1', title: 'Dental chew', time: '20:00', frequency: 'Daily', done: false }
  ])
};

const ROUTES = [
  { file: '01-adoption', url: '/adoption', label: '宠物领养 / Adoption' },
  { file: '02-community-feed', url: '/community', label: '社区动态 / Community Feed' },
  { file: '03-community-qa', url: '/community', label: '专家问答 / Expert Q&A', qa: true },
  { file: '04-ai-helper', url: '/ai-helper', label: 'AI 助手 / AI Helper' },
  { file: '05-map-tracking', url: '/map', label: '地图与追踪 / Map & Tracking' }
];

async function seedAndMock(page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const key = url.pathname;
    const body = MOCK[key];
    if (body !== undefined) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
  // Kill firebase/analytics noise & block heavy 3rd parties that slow rendering
  await page.route('**/*firebase*/**', r => r.abort());
}

async function newCtx(browser, { width, height, dark, mobile }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: dark ? 'dark' : 'light',
    locale: 'zh-CN'
  });
  await ctx.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, SEED);
  return ctx;
}

async function capture(browser, cfg) {
  const { file, url, qa, dark, mobile } = cfg;
  const ctx = await newCtx(browser, { width: mobile ? 390 : 1440, height: mobile ? 844 : 1000, dark, mobile });
  const page = await ctx.newPage();
  await seedAndMock(page);

  if (dark) {
    await page.addInitScript(() => { localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); });
  }

  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 });

  // Community Q&A sub-tab
  if (qa) {
    const qaBtn = page.locator('button', { hasText: /专家在线问答|Pet Expert Q&A/ }).first();
    if (await qaBtn.count()) { await qaBtn.click(); await page.waitForTimeout(2500); }
  }

  // Force dark class (ThemeToggle runs on mount and may reset)
  if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'));
  else await page.evaluate(() => document.documentElement.classList.remove('dark'));

  await page.waitForTimeout(3500);
  // Lazy-load all images
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        y += 900;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 120); else { window.scrollTo(0, 0); res(); }
      };
      step();
    });
  });
  await page.waitForTimeout(2500);

  const suffix = `${dark ? 'dark' : 'light'}-${mobile ? 'mobile' : 'desktop'}`;
  const out = path.join(OUT, `${file}-${suffix}.png`);
  await page.screenshot({ path: out, fullPage: true });
  const h = await page.evaluate(() => document.body.scrollHeight);
  console.log(`✓ ${path.basename(out)}  (${h}px)`);
  await ctx.close();
  return out;
}

const browser = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
const jobs = [];
for (const r of ROUTES) {
  for (const dark of [false, true]) {
    for (const mobile of [false, true]) {
      // mobile only a couple of routes to keep it fast
      if (mobile && !['01-adoption', '02-community-feed', '04-ai-helper'].includes(r.file)) continue;
      jobs.push({ ...r, dark, mobile });
    }
  }
}

for (const j of jobs) {
  try { await capture(browser, j); } catch (e) { console.error('✗', j.file, e.message); }
}
await browser.close();
console.log('DONE');
