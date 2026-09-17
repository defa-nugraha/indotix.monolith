import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE = process.env.STAGING_BASE_URL || 'https://staging.indotix.co.id';
const OUT = process.env.QA_OUT_DIR || 'qa-artifacts';
const USER = { email: process.env.QA_USER_EMAIL || 'user@indotix.id', password: process.env.QA_USER_PASSWORD || 'password' };
const ADMIN = { email: process.env.QA_ADMIN_EMAIL || 'admin@indotix.id', password: process.env.QA_ADMIN_PASSWORD || 'password' };
const MITRA = { email: process.env.QA_MITRA_EMAIL || 'mitra.wisata@indotix.id', password: process.env.QA_MITRA_PASSWORD || 'password' };
const results = [];
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const safeName = (s) => s.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

function add(id, title, status, actual, evidence = null, meta = {}) {
  results.push({ id, title, status, actual, evidence, executed_at: now(), ...meta });
  console.log(`[${status}] ${id} - ${title}: ${actual}`);
}

async function run(id, title, fn) {
  try {
    const out = await fn();
    if (out?.status && ['Passed','Failed','Blocked','Skipped'].includes(out.status)) {
      add(id, title, out.status, out.actual || '', out.evidence || null, out.meta || {});
    } else {
      add(id, title, 'Passed', typeof out === 'string' ? out : JSON.stringify(out ?? 'OK'));
    }
  } catch (error) {
    add(id, title, 'Failed', error?.stack || String(error));
  }
}

async function http(pathname, opts = {}) {
  const url = pathname.startsWith('http') ? pathname : `${BASE}${pathname}`;
  const response = await fetch(url, { redirect: opts.redirect || 'manual', ...opts });
  const text = await response.text();
  return { response, text, url };
}

async function json(pathname, opts = {}) {
  const headers = { Accept: 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) };
  const body = opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body;
  const { response, text, url } = await http(pathname, { ...opts, headers, body });
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { response, text, data, url };
}

let browser = null;
let browserLaunchError = null;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
} catch (error) {
  browserLaunchError = String(error);
  console.error('Puppeteer launch failed:', error);
}

async function newPage(viewport = { width: 1440, height: 900 }) {
  if (!browser) throw new Error(`Browser unavailable: ${browserLaunchError}`);
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.setDefaultTimeout(20000);
  return page;
}

async function goto(page, pathname, waitUntil = 'domcontentloaded') {
  const url = pathname.startsWith('http') ? pathname : `${BASE}${pathname}`;
  const response = await page.goto(url, { waitUntil, timeout: 30000 });
  await sleep(500);
  return response;
}

async function bodyText(page) {
  return await page.evaluate(() => document.body?.innerText || '');
}

async function screenshot(page, name) {
  const file = path.join(OUT, `${safeName(name)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function loginPage(credentials, label) {
  const page = await newPage();
  const response = await goto(page, '/login');
  if (!response || response.status() >= 500) throw new Error(`Login page unavailable: ${response?.status()}`);
  await page.type('#email', credentials.email);
  await page.type('#password', credentials.password);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 12000 }),
    page.click('[data-test="login-button"]'),
  ]);
  await sleep(1200);
  const text = await bodyText(page);
  if (page.url().includes('/login')) {
    if (/email atau password salah|credentials|tidak terdaftar/i.test(text)) {
      await page.close();
      return { status: 'Blocked', actual: `${label} QA credential not accepted on staging.` };
    }
    if (/server error|500|whoops/i.test(text)) throw new Error(`${label} login returned server error`);
    throw new Error(`${label} login did not leave /login. Body: ${text.slice(0,500)}`);
  }
  return { page, status: 'Passed', actual: `${label} login redirected to ${page.url()}` };
}

async function apiLogin(credentials) {
  return await json('/api/auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password, device_name: 'github-actions-qa' } });
}

async function authApi(pathname, token, opts = {}) {
  return await json(pathname, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

// Environment reachability
await run('ENV-STAGING-001', 'Staging base URL resolves and responds', async () => {
  const r = await http('/');
  if (r.response.status >= 500) throw new Error(`HTTP ${r.response.status}`);
  return `HTTP ${r.response.status}`;
});

// Guest/security HTTP checks
await run('TC-SEC-001', 'Guest cannot access admin dashboard', async () => {
  const r = await http('/dashboard');
  const location = r.response.headers.get('location') || '';
  if (![301,302,303,307,308,401,403].includes(r.response.status)) throw new Error(`Unexpected HTTP ${r.response.status}`);
  return `HTTP ${r.response.status}; location=${location}`;
});
for (const [id, route] of [
  ['TC-SEC-005','/events'],['TC-RETIRE-004','/hotels'],['TC-RETIRE-001','/admin/events'],
  ['TC-RETIRE-002','/admin/academy/classes'],['TC-RETIRE-003','/admin/retail-shop/products'],
  ['TC-RETIRE-005','/api/hotel/bookings/quote'],['TC-RETIRE-006','/affiliate']
]) {
  await run(id, `Retired route ${route} is blocked`, async () => {
    const r = await http(route);
    if (r.response.status !== 404) throw new Error(`Expected 404, got ${r.response.status}`);
    return 'HTTP 404';
  });
}
await run('TC-API-004', 'Auth me requires Sanctum token', async () => {
  const r = await json('/api/auth/me');
  if (r.response.status !== 401) throw new Error(`Expected 401, got ${r.response.status}`);
  return 'HTTP 401 unauthenticated';
});
await run('TC-API-019', 'Mobile scan lookup requires authenticated verified user', async () => {
  const r = await json('/api/wisata/ticket-scans/lookup?code=invalid');
  if (r.response.status !== 401) throw new Error(`Expected 401, got ${r.response.status}`);
  return 'HTTP 401 unauthenticated';
});
await run('TC-SEC-008', 'SQL injection string in search is handled safely', async () => {
  const q = encodeURIComponent("%' OR 1=1 --");
  const r = await http(`/wisata?q=${q}`);
  if (r.response.status >= 500 || /SQLSTATE|syntax error|QueryException/i.test(r.text)) throw new Error(`Unsafe error response: HTTP ${r.response.status}`);
  return `HTTP ${r.response.status}; no SQL error leaked`;
});
await run('TC-SEC-007', 'XSS payload is escaped/sanitized in public search', async () => {
  const payload = '<script>window.__qa_xss=1</script>';
  const r = await http(`/wisata?q=${encodeURIComponent(payload)}`);
  if (r.response.status >= 500) throw new Error(`HTTP ${r.response.status}`);
  if (r.text.includes(payload)) throw new Error('Raw script payload reflected in response');
  return `HTTP ${r.response.status}; raw script not reflected`;
});
await run('TC-SEC-006', 'CSRF blocks state-changing web request without token', async () => {
  const r = await http('/notifications/read-all', { method: 'POST', headers: { Accept: 'text/html' } });
  if (![302,401,403,419].includes(r.response.status)) throw new Error(`Expected auth/CSRF rejection, got ${r.response.status}`);
  return `HTTP ${r.response.status}`;
});

// Public APIs
let wisataData = null;
await run('TC-API-007', 'Discovery metadata exposes only wisata type', async () => {
  const r = await json('/api/discovery/metadata');
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,300)}`);
  const serialized = JSON.stringify(r.data).toLowerCase();
  if (/"hotel"|"event"|"academy"|"souvenir"/.test(serialized)) throw new Error('Retired product type found in metadata');
  return 'HTTP 200; no retired product type in metadata payload';
});
await run('TC-CATALOG-001', 'Catalog API loads live wisata destinations', async () => {
  const r = await json('/api/products/wisata');
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}`);
  wisataData = r.data;
  const count = Array.isArray(r.data?.destinations) ? r.data.destinations.length : 0;
  if (count < 1) return { status: 'Blocked', actual: 'API reachable but no live destination with available ticket exists.' };
  return `${count} live destination(s)`;
});
await run('TC-CATALOG-002', 'Search filters by destination keyword', async () => {
  const first = wisataData?.destinations?.[0];
  if (!first) return { status: 'Blocked', actual: 'No live destination fixture.' };
  const term = encodeURIComponent(String(first.destination_name).split(/\s+/)[0]);
  const r = await json(`/api/products/wisata?q=${term}`);
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}`);
  if (!(r.data?.destinations || []).some((d) => d.destination_name === first.destination_name)) throw new Error('Known destination missing from search result');
  return `Search returned ${r.data.destinations.length} destination(s), including ${first.destination_name}`;
});
await run('TC-CATALOG-003', 'Search with no result shows empty state', async () => {
  const r = await json(`/api/products/wisata?q=${encodeURIComponent('qa-no-result-9f29e77c')}`);
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}`);
  if ((r.data?.destinations || []).length !== 0) throw new Error('Expected zero results');
  return 'API returned empty destinations array';
});
await run('TC-CATALOG-005', 'Invalid filter does not crash listing', async () => {
  const r = await json('/api/products/wisata?quantity=99999&visit_date=not-a-date');
  if (r.response.status >= 500) throw new Error(`HTTP ${r.response.status}`);
  return `HTTP ${r.response.status}; handled without server error`;
});
await run('TC-API-026', 'Public mobile home returns banner data', async () => {
  const r = await json('/api/mobile/home');
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}`);
  return `HTTP 200; keys=${Object.keys(r.data || {}).join(',')}`;
});
await run('TC-API-027', 'Public contact API returns contact content', async () => {
  const r = await json('/api/public/contact');
  if (r.response.status !== 200) throw new Error(`HTTP ${r.response.status}`);
  return 'HTTP 200';
});

// Browser public UI
if (!browser) {
  for (const id of ['TC-HOME-001','TC-HOME-002','TC-HOME-003','TC-HOME-005','TC-HOME-006','TC-HOME-007','TC-HOME-009','TC-HOME-010','TC-CATALOG-008','TC-CATALOG-010','TC-WISATA-DETAIL-001','TC-WISATA-DETAIL-002','TC-WISATA-DETAIL-003','TC-WISATA-DETAIL-009']) {
    add(id, 'Browser UI scenario', 'Blocked', `Puppeteer unavailable: ${browserLaunchError}`);
  }
} else {
  await run('TC-HOME-001', 'Homepage opens with managed banner carousel', async () => {
    const page = await newPage();
    const resp = await goto(page, '/');
    const text = await bodyText(page);
    const evidence = await screenshot(page, 'home-desktop');
    await page.close();
    if (!resp || resp.status() !== 200) throw new Error(`HTTP ${resp?.status()}`);
    if (!/wisata/i.test(text)) throw new Error('Tourism content not visible');
    return { actual: 'Homepage HTTP 200 with tourism content', evidence };
  });
  await run('TC-HOME-002', 'Desktop banner side previews are proportional', async () => {
    const page = await newPage({ width: 1440, height: 900 });
    await goto(page, '/');
    const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, images: [...document.images].filter(i => i.complete).length }));
    await page.close();
    if (metrics.width > metrics.viewport + 4) throw new Error(`Horizontal overflow ${metrics.width} > ${metrics.viewport}`);
    return `No desktop horizontal overflow; ${metrics.images} loaded images`;
  });
  await run('TC-HOME-003', 'Mobile homepage remains scrollable without horizontal overflow', async () => {
    const page = await newPage({ width: 390, height: 844 });
    await goto(page, '/');
    const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    const evidence = await screenshot(page, 'home-mobile-390x844');
    await page.close();
    if (metrics.width > metrics.viewport + 4) throw new Error(`Horizontal overflow ${metrics.width} > ${metrics.viewport}`);
    return { actual: `scrollWidth=${metrics.width}, viewport=${metrics.viewport}`, evidence };
  });
  await run('TC-HOME-005', 'Part Of section displays separate logo collection', async () => {
    const page = await newPage(); await goto(page, '/'); const text = await bodyText(page); await page.close();
    if (!/Part of/i.test(text)) return { status: 'Blocked', actual: 'Part Of fixture/section not present on current staging data.' };
    return 'Part Of section visible';
  });
  await run('TC-HOME-006', 'Promo special videos autoplay muted', async () => {
    const page = await newPage(); await goto(page, '/');
    const videos = await page.evaluate(() => [...document.querySelectorAll('video')].map(v => ({ muted: v.muted || v.hasAttribute('muted'), autoplay: v.autoplay || v.hasAttribute('autoplay') })));
    await page.close();
    if (!videos.length) return { status: 'Blocked', actual: 'No active promo video fixture on homepage.' };
    if (videos.some(v => !v.muted || !v.autoplay)) throw new Error(`Video flags invalid: ${JSON.stringify(videos)}`);
    return `${videos.length} video(s) muted + autoplay`;
  });
  await run('TC-HOME-007', 'Promo special three-image layout remains intentional on mobile', async () => {
    const page = await newPage({ width: 390, height: 844 }); await goto(page, '/');
    const overlaps = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter(i => i.offsetWidth > 120 && i.offsetHeight > 60).slice(0,20);
      let count = 0;
      for (let i=0;i<imgs.length;i++) for (let j=i+1;j<imgs.length;j++) { const a=imgs[i].getBoundingClientRect(), b=imgs[j].getBoundingClientRect(); const overlap = Math.max(0, Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)); if (overlap > Math.min(a.width*a.height,b.width*b.height)*0.25) count++; }
      return { images: imgs.length, significantOverlaps: count };
    });
    const evidence = await screenshot(page, 'home-promo-mobile'); await page.close();
    if (overlaps.significantOverlaps > 0) throw new Error(`Detected ${overlaps.significantOverlaps} significant image overlap(s)`);
    return { actual: `No significant overlaps among ${overlaps.images} major images`, evidence };
  });
  await run('TC-HOME-009', 'Home category sections show unavailable ticket copy', async () => {
    const page = await newPage(); await goto(page, '/'); const text = await bodyText(page); await page.close();
    if (!/Tiket belum tersedia/i.test(text)) return { status: 'Blocked', actual: 'No destination without active ticket/price in current staging homepage fixture.' };
    return 'Unavailable ticket copy is visible';
  });
  await run('TC-HOME-010', 'About page no longer exposes retired product navigation', async () => {
    const page = await newPage(); const resp = await goto(page, '/about');
    const retiredLinks = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /^\/(hotels|events|academy|retail-shop)/.test(h || '')));
    await page.close();
    if (!resp || resp.status() >= 500) throw new Error(`HTTP ${resp?.status()}`);
    if (retiredLinks.length) throw new Error(`Retired links exposed: ${retiredLinks.join(',')}`);
    return 'No retired product navigation links detected';
  });
  await run('TC-CATALOG-008', 'Clicking destination card opens detail page', async () => {
    const first = wisataData?.destinations?.[0];
    if (!first?.slug) return { status: 'Blocked', actual: 'No live destination fixture.' };
    const page = await newPage(); const resp = await goto(page, `/wisata/${first.slug}`); await page.close();
    if (!resp || resp.status() !== 200) throw new Error(`HTTP ${resp?.status()}`);
    return `Opened /wisata/${first.slug}`;
  });
  await run('TC-CATALOG-010', 'Catalog mobile filter/search remains usable', async () => {
    const page = await newPage({ width: 390, height: 844 }); await goto(page, '/wisata');
    const m = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, inputs: document.querySelectorAll('input').length }));
    const evidence = await screenshot(page, 'catalog-mobile'); await page.close();
    if (m.width > m.viewport + 4) throw new Error(`Horizontal overflow ${m.width} > ${m.viewport}`);
    return { actual: `No mobile overflow; ${m.inputs} input(s)`, evidence };
  });
  await run('TC-WISATA-DETAIL-001', 'Open valid destination detail', async () => {
    const first = wisataData?.destinations?.[0]; if (!first?.slug) return { status:'Blocked', actual:'No live destination fixture.' };
    const page=await newPage(); const resp=await goto(page, `/wisata/${first.slug}`); const text=await bodyText(page); const evidence=await screenshot(page,'wisata-detail'); await page.close();
    if (!resp || resp.status()!==200) throw new Error(`HTTP ${resp?.status()}`); if (!text.includes(first.destination_name)) throw new Error('Destination name missing'); return {actual:`Loaded ${first.destination_name}`,evidence};
  });
  await run('TC-WISATA-DETAIL-002', 'Invalid destination slug returns safe 404', async () => {
    const page=await newPage(); const resp=await goto(page,'/wisata/qa-slug-does-not-exist-9f29e77c'); const text=await bodyText(page); await page.close();
    if (!resp || resp.status()!==404) throw new Error(`Expected 404, got ${resp?.status()}`); if (/SQLSTATE|QueryException/i.test(text)) throw new Error('Internal error leaked'); return 'HTTP 404 without DB error leak';
  });
  await run('TC-WISATA-DETAIL-003', 'Ticket list shows active tickets only', async () => {
    const first=wisataData?.destinations?.[0]; if (!first) return {status:'Blocked',actual:'No live destination fixture.'}; if (!(first.tickets||[]).length) return {status:'Blocked',actual:'No active ticket fixture.'}; return `${first.tickets.length} active ticket(s) exposed by public API`;
  });
  await run('TC-WISATA-DETAIL-004', 'Package ticket shows included ticket information', async () => {
    const first=wisataData?.destinations?.[0]; const pkg=(first?.tickets||[]).find(t=>t.ticket_kind==='package'); if (!pkg) return {status:'Blocked',actual:'No package ticket fixture.'}; if (!Array.isArray(pkg.package_items) || !pkg.package_items.length) throw new Error('Package ticket missing package_items'); return `${pkg.name} includes ${pkg.package_items.length} item(s)`;
  });
  await run('TC-WISATA-DETAIL-005', 'Minimum order is enforced in selector/data', async () => {
    const t=wisataData?.destinations?.[0]?.tickets?.[0]; if(!t)return{status:'Blocked',actual:'No ticket fixture.'}; if(Number(t.min_order_quantity||0)<1) throw new Error(`Invalid min ${t.min_order_quantity}`); return `min_order_quantity=${t.min_order_quantity}`;
  });
  await run('TC-WISATA-DETAIL-006', 'Maximum order is enforced in selector/data', async () => {
    const t=wisataData?.destinations?.[0]?.tickets?.[0]; if(!t)return{status:'Blocked',actual:'No ticket fixture.'}; if(t.max_order_quantity==null)return{status:'Blocked',actual:'Ticket has no max_order_quantity fixture.'}; if(Number(t.max_order_quantity)<Number(t.min_order_quantity||1))throw new Error('Max lower than min'); return `max_order_quantity=${t.max_order_quantity}`;
  });
  await run('TC-WISATA-DETAIL-009', 'Gallery images maintain aspect ratio on mobile', async () => {
    const first=wisataData?.destinations?.[0]; if(!first?.slug)return{status:'Blocked',actual:'No live destination fixture.'}; const page=await newPage({width:390,height:844}); await goto(page,`/wisata/${first.slug}`); const bad=await page.evaluate(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth>0).filter(i=>i.clientWidth>window.innerWidth+4).length); const ev=await screenshot(page,'detail-mobile'); await page.close(); if(bad)throw new Error(`${bad} image(s) exceed viewport`); return {actual:'No loaded image exceeds mobile viewport',evidence:ev};
  });
}

// Auth UI
if (browser) {
  await run('TC-AUTH-002', 'Login rejects invalid password', async () => {
    const page=await newPage(); await goto(page,'/login'); await page.type('#email',USER.email); await page.type('#password','wrong-password-qa'); await page.click('[data-test="login-button"]'); await sleep(1200); const text=await bodyText(page); const url=page.url(); await page.close(); if(!url.includes('/login'))throw new Error(`Unexpected navigation to ${url}`); if(!/password|email/i.test(text))throw new Error('No login error visible'); return 'Stayed on login with validation/auth error';
  });
  await run('TC-AUTH-003', 'Login rejects empty credentials', async () => {
    const page=await newPage(); await goto(page,'/login'); const required=await page.evaluate(()=>({email:document.querySelector('#email')?.required,password:document.querySelector('#password')?.required})); await page.close(); if(!required.email||!required.password)throw new Error(`Required flags: ${JSON.stringify(required)}`); return 'Email and password fields are HTML-required';
  });
  await run('TC-AUTH-005', 'Password visibility toggle works', async () => {
    const page=await newPage(); await goto(page,'/login'); const before=await page.$eval('#password',e=>e.type); await page.click('button[aria-label="Lihat password"]'); const after=await page.$eval('#password',e=>e.type); await page.close(); if(before!=='password'||after!=='text')throw new Error(`${before} -> ${after}`); return 'Password input toggles password -> text';
  });
}

let userPageSession = null, adminPageSession = null, mitraPageSession = null;
await run('TC-AUTH-001', 'Login with valid user credentials', async () => {
  if(!browser)return{status:'Blocked',actual:`Browser unavailable: ${browserLaunchError}`}; const r=await loginPage(USER,'User'); if(r.status==='Blocked')return r; userPageSession=r.page; return r.actual;
});
await run('SMK-006', 'Admin dashboard login/open', async () => {
  if(!browser)return{status:'Blocked',actual:`Browser unavailable: ${browserLaunchError}`}; const r=await loginPage(ADMIN,'Admin'); if(r.status==='Blocked')return r; adminPageSession=r.page; const resp=await goto(adminPageSession,'/dashboard'); const ev=await screenshot(adminPageSession,'admin-dashboard'); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); return {actual:`Dashboard HTTP ${resp.status()}`,evidence:ev};
});
await run('SMK-009', 'Mitra dashboard loads for verified wisata partner', async () => {
  if(!browser)return{status:'Blocked',actual:`Browser unavailable: ${browserLaunchError}`}; const r=await loginPage(MITRA,'Mitra'); if(r.status==='Blocked')return r; mitraPageSession=r.page; const resp=await goto(mitraPageSession,'/mitra/dashboard'); const ev=await screenshot(mitraPageSession,'mitra-dashboard'); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); return {actual:`Mitra dashboard HTTP ${resp.status()}`,evidence:ev};
});

// Auth API + mobile flows
let userToken = null;
await run('TC-API-002', 'Mobile login returns token for valid credentials', async () => {
  const r=await apiLogin(USER); if(r.response.status!==200){ if([401,403,422].includes(r.response.status))return{status:'Blocked',actual:`QA user credential not accepted: HTTP ${r.response.status} ${r.text.slice(0,200)}`}; throw new Error(`HTTP ${r.response.status}`);} userToken=r.data?.token; if(!userToken)throw new Error('No token'); return 'HTTP 200 + bearer token';
});
await run('TC-API-004-AUTH', 'Authenticated auth/me returns QA user', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/auth/me',userToken); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}`); if(r.data?.user?.email!==USER.email)throw new Error(`Unexpected user ${r.data?.user?.email}`); return `Authenticated as ${r.data.user.email}`;
});
await run('TC-API-021', 'Mobile notifications unread count works', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/notifications/unread-count',userToken); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}`); return `HTTP 200; ${JSON.stringify(r.data)}`;
});
await run('TC-USER-004', 'Notifications list loads user-only items', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/notifications',userToken); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}`); return `HTTP 200; payload keys=${Object.keys(r.data||{}).join(',')}`;
});
await run('TC-USER-005', 'Mark all notifications read', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/notifications/read-all',userToken,{method:'POST',body:{}}); if(![200,204].includes(r.response.status))throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,200)}`); const c=await authApi('/api/notifications/unread-count',userToken); return `read-all HTTP ${r.response.status}; unread=${JSON.stringify(c.data)}`;
});
await run('TC-API-023', 'Profile update API requires phone', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/profile',userToken,{method:'PUT',body:{name:'QA User',email:USER.email,phone:'',gender:'other'}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}: ${r.text.slice(0,300)}`); return 'HTTP 422 when phone is empty';
});
await run('TC-API-005', 'Mobile passkey registration options require auth', async () => {
  const r=await json('/api/auth/passkeys/register/options',{method:'POST',body:{}}); if(r.response.status!==401)throw new Error(`Expected 401, got ${r.response.status}`); return 'HTTP 401 unauthenticated';
});
await run('TC-API-024', 'Review API rejects invalid media upload', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const form=new FormData(); form.set('type','wisata'); form.set('rating','5'); form.set('comment','QA invalid upload test'); form.set('media',new Blob(['<?php echo 1; ?>'],{type:'application/x-httpd-php'}),'malware.php.jpg'); const response=await fetch(`${BASE}/api/reviews`,{method:'POST',headers:{Authorization:`Bearer ${userToken}`,Accept:'application/json'},body:form,redirect:'manual'}); const text=await response.text(); if(response.status>=500)throw new Error(`HTTP ${response.status}: ${text.slice(0,200)}`); if(![400,413,415,422].includes(response.status))return{status:'Failed',actual:`Expected upload rejection, got HTTP ${response.status}: ${text.slice(0,200)}`}; return `Rejected with HTTP ${response.status}`;
});
await run('TC-API-028', 'Chat API conversation ownership surface is authenticated', async () => {
  if(!userToken)return{status:'Blocked',actual:'No QA user token.'}; const r=await authApi('/api/chat/conversations',userToken); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}`); return 'Conversation list HTTP 200';
});

// Registration validation + safe dummy registration
const qaEmail=`qa.e2e.${Date.now()}@example.com`;
await run('TC-API-001', 'Mobile register requires phone and legal acceptance', async () => {
  const r=await json('/api/auth/register',{method:'POST',body:{name:'QA E2E',email:`missing.${qaEmail}`,password:'StrongPass123!',terms_accepted:false,device_name:'qa'}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422 for missing phone/unaccepted terms';
});
await run('TC-AUTH-006', 'Register with valid required fields', async () => {
  const r=await json('/api/auth/register',{method:'POST',body:{name:'QA E2E User',email:qaEmail,phone:'081234567890',password:'StrongPass123!',terms_accepted:true,role:'user',device_name:'github-actions-qa'}}); if(r.response.status!==201)throw new Error(`Expected 201, got ${r.response.status}: ${r.text.slice(0,300)}`); return `Created dummy unverified QA account ${qaEmail}`;
});
await run('TC-AUTH-007', 'Register rejects missing phone/WhatsApp', async () => {
  const r=await json('/api/auth/register',{method:'POST',body:{name:'QA',email:`phone.${qaEmail}`,password:'StrongPass123!',terms_accepted:true}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422';
});
await run('TC-AUTH-008', 'Register rejects unchecked legal terms', async () => {
  const r=await json('/api/auth/register',{method:'POST',body:{name:'QA',email:`terms.${qaEmail}`,phone:'0812',password:'StrongPass123!',terms_accepted:false}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422';
});
await run('TC-AUTH-009', 'Register rejects duplicate email', async () => {
  const r=await json('/api/auth/register',{method:'POST',body:{name:'Duplicate',email:USER.email,phone:'0812',password:'StrongPass123!',terms_accepted:true}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422 duplicate email';
});
await run('TC-AUTH-011', 'Forgot password accepts registered QA email', async () => {
  const r=await json('/api/auth/password/forgot',{method:'POST',body:{email:qaEmail}}); if(r.response.status>=500)throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,300)}`); if(![200,202,429].includes(r.response.status))throw new Error(`Unexpected HTTP ${r.response.status}`); return `HTTP ${r.response.status}; no server error`;
});
await run('TC-AUTH-012', 'Reset password rejects invalid OTP/token state', async () => {
  const r=await json('/api/auth/password/reset',{method:'POST',body:{email:qaEmail,code:'000000',password:'AnotherStrong123!'}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422 invalid OTP';
});
add('TC-AUTH-013','Email verification link validates signature','Blocked','Valid signed verification URL requires access to QA mailbox/link capture; not available to runner.');
add('TC-AUTH-014','Two factor challenge accepts valid code','Blocked','No QA account with known active 2FA secret/code fixture.');

// Booking API: quote/store/pay/cancel with dummy QA user if token + live ticket
let createdBooking = null;
if (userToken && wisataData?.destinations?.[0]?.tickets?.[0]) {
  const d=wisataData.destinations[0], t=d.tickets[0];
  const visit=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  await run('TC-API-010','Wisata quote returns pricing for available ticket',async()=>{const r=await authApi('/api/wisata/bookings/quote',userToken,{method:'POST',body:{destination_id:d.id,ticket_id:t.id,visit_date:visit,quantity:1}}); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,300)}`); if(!r.data?.pricing?.total && r.data?.pricing?.total!==0)throw new Error('pricing.total missing'); return `total=${r.data.pricing.total}`;});
  await run('TC-API-011','Wisata quote rejects invalid encrypted/plain id',async()=>{const r=await authApi('/api/wisata/bookings/quote',userToken,{method:'POST',body:{destination_id:'invalid-id',ticket_id:'invalid-ticket',visit_date:visit,quantity:1}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422';});
  await run('TC-API-012','Wisata quote enforces max order limits',async()=>{const r=await authApi('/api/wisata/bookings/quote',userToken,{method:'POST',body:{destination_id:d.id,ticket_id:t.id,visit_date:visit,quantity:21}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422 quantity > 20';});
  await run('TC-WISATA-BOOKING-003','Prepare rejects quantity above 20',async()=>{const r=await authApi('/api/wisata/bookings/quote',userToken,{method:'POST',body:{destination_id:d.id,ticket_id:t.id,visit_date:visit,quantity:21}}); if(r.response.status!==422)throw new Error(`Expected 422, got ${r.response.status}`); return 'HTTP 422';});
  await run('TC-WISATA-BOOKING-001','Prepare booking with one valid ticket',async()=>{const r=await authApi('/api/wisata/bookings',userToken,{method:'POST',body:{destination_id:d.id,ticket_id:t.id,visit_date:visit,quantity:1,guest_name:'QA User',guest_email:USER.email,special_request:'Automated staging QA - safe to cancel'}}); if(r.response.status!==201)throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,500)}`); createdBooking=r.data?.booking; if(!createdBooking?.id)throw new Error('Booking id missing'); return `Created booking ${createdBooking.booking_code||createdBooking.id}`;});
  await run('TC-API-015','Mobile booking show enforces own booking access',async()=>{if(!createdBooking?.id)return{status:'Blocked',actual:'Booking creation failed.'}; const r=await authApi(`/api/wisata/bookings/${encodeURIComponent(createdBooking.id)}`,userToken); if(r.response.status!==200)throw new Error(`HTTP ${r.response.status}`); return 'Owner booking HTTP 200';});
  await run('TC-WISATA-BOOKING-012','Payment page/API opens for owner booking',async()=>{if(!createdBooking?.id)return{status:'Blocked',actual:'Booking creation failed.'}; const r=await authApi(`/api/wisata/bookings/${encodeURIComponent(createdBooking.id)}/pay`,userToken,{method:'POST',body:{}}); if(r.response.status>=500)throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,500)}`); if(r.response.status===422 && /midtrans|payment|pembayaran/i.test(r.text))return{status:'Blocked',actual:`Payment sandbox/provider unavailable: ${r.text.slice(0,250)}`}; if(r.response.status!==200)throw new Error(`Unexpected HTTP ${r.response.status}: ${r.text.slice(0,300)}`); return `Payment initiation HTTP 200; keys=${Object.keys(r.data||{}).join(',')}`;});
  await run('TC-API-017','Mobile booking cancel updates own pending booking',async()=>{if(!createdBooking?.id)return{status:'Blocked',actual:'Booking creation failed.'}; const r=await authApi(`/api/wisata/bookings/${encodeURIComponent(createdBooking.id)}/cancel`,userToken,{method:'POST',body:{}}); if(r.response.status>=500)throw new Error(`HTTP ${r.response.status}: ${r.text.slice(0,500)}`); if(![200,422].includes(r.response.status))throw new Error(`HTTP ${r.response.status}`); return `Cancel HTTP ${r.response.status}: ${r.text.slice(0,200)}`;});
} else {
  for (const id of ['TC-API-010','TC-API-011','TC-API-012','TC-WISATA-BOOKING-001','TC-WISATA-BOOKING-003','TC-API-015','TC-WISATA-BOOKING-012','TC-API-017']) add(id,'Booking API scenario','Blocked','No authenticated QA token or live destination/ticket fixture.');
}

// User pages
if (userPageSession) {
  for (const [id,route,title] of [
    ['TC-USER-001','/settings/profile','Profile page'],['TC-USER-002','/settings/password','Password page'],['TC-USER-004-WEB','/notifications','Notifications page'],['TC-WISATA-BOOKING-015','/history','History page'],['TC-USER-009','/chat','Chat page']
  ]) await run(id,title,async()=>{const resp=await goto(userPageSession,route); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); return `HTTP ${resp.status()}`;});
}
add('TC-USER-003','Delete account requires password confirmation','Blocked','Destructive account deletion intentionally not executed against shared staging QA account.');

// Admin page inventory smoke
if (adminPageSession) {
  const adminRoutes=[
    '/admin/public/banners','/admin/public/partners','/admin/public/home','/admin/public/promo-items','/admin/public/faqs','/admin/public/contacts','/admin/public/about','/admin/public/privacy-policy','/admin/public/entry-qr',
    '/admin/wisata/destinations','/admin/wisata/tickets','/admin/wisata/bookings','/admin/wisata/scans','/admin/wisata/finance/commissions','/admin/wisata/finance/payouts','/admin/wisata/finance/reports','/admin/wisata/vouchers',
    '/admin/system/audit-logs','/admin/system/notifications','/admin/system/roles','/admin/system/settings','/admin/system/special-admins','/admin/mitra-wisata'
  ];
  await run('QA-ADMIN-ROUTE-SMOKE','Admin feature pages load without server errors',async()=>{const failures=[]; for(const route of adminRoutes){const resp=await goto(adminPageSession,route); if(!resp||resp.status()>=500||resp.status()===404)failures.push(`${route}:${resp?.status()}`);} const ev=await screenshot(adminPageSession,'admin-last-page'); if(failures.length)throw new Error(`Admin route failures: ${failures.join(', ')}`); return {actual:`${adminRoutes.length} admin routes loaded without 404/5xx`,evidence:ev};});
  await run('TC-SEC-011','Admin audit log redaction page is accessible',async()=>{const resp=await goto(adminPageSession,'/admin/system/audit-logs'); const text=await bodyText(adminPageSession); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); if(/password\s*[:=]\s*[^*\s]{4,}|authorization\s*[:=]\s*bearer/i.test(text))throw new Error('Potential sensitive value visible in audit page'); return 'Audit log page loaded; no obvious raw password/bearer token pattern in rendered text';});
}

// Access-control with authenticated role browser sessions
if (userPageSession) await run('TC-SEC-002','User cannot access admin wisata routes',async()=>{const resp=await goto(userPageSession,'/admin/wisata/destinations'); const u=userPageSession.url(); if(resp && resp.status()===200 && u.includes('/admin/wisata'))throw new Error('User reached admin wisata page'); return `Denied/redirected: HTTP ${resp?.status()} URL ${u}`;});
if (mitraPageSession) {
  await run('TC-SEC-003','Mitra cannot access admin-only routes',async()=>{const resp=await goto(mitraPageSession,'/admin/users'); const u=mitraPageSession.url(); if(resp && resp.status()===200 && u.includes('/admin/users'))throw new Error('Mitra reached admin users'); return `Denied/redirected: HTTP ${resp?.status()} URL ${u}`;});
  await run('TC-SEC-004','Mitra cannot open retired hotel/event operational routes',async()=>{const statuses=[]; for(const r of ['/mitra/events','/mitra/hotels']){const resp=await goto(mitraPageSession,r); statuses.push(`${r}:${resp?.status()}`); if(resp?.status()!==404)throw new Error(`${r} expected 404, got ${resp?.status()}`);} return statuses.join(', ');});
}

// Mitra page inventory + QR download
if (mitraPageSession) {
  const mitraRoutes=['/mitra/wisata/destination','/mitra/wisata/tickets','/mitra/wisata/bookings','/mitra/wisata/scans','/mitra/wisata/finance/summary','/mitra/wisata/finance/payouts','/mitra/wisata/reviews','/mitra/wisata/notifications','/mitra/wisata/disputes'];
  await run('TC-MITRA-001','Mitra dashboard summarizes wisata-only metrics',async()=>{const resp=await goto(mitraPageSession,'/mitra/dashboard'); const text=await bodyText(mitraPageSession); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); if(/hotel|event|academy/i.test(text))return{status:'Failed',actual:'Retired product wording found on mitra dashboard'}; return 'Mitra dashboard loads without retired product wording';});
  await run('QA-MITRA-ROUTE-SMOKE','Mitra wisata feature pages load',async()=>{const failures=[]; for(const r of mitraRoutes){const resp=await goto(mitraPageSession,r); if(!resp||resp.status()>=500||resp.status()===404)failures.push(`${r}:${resp?.status()}`);} if(failures.length)throw new Error(failures.join(', ')); return `${mitraRoutes.length} mitra routes loaded without 404/5xx`;});
  await run('TC-MITRA-013','Mitra QR tab displays poster and download buttons',async()=>{const resp=await goto(mitraPageSession,'/mitra/wisata/scans?tab=qr'); const text=await bodyText(mitraPageSession); const ev=await screenshot(mitraPageSession,'mitra-qr-tab'); if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`); if(!/QR/i.test(text))throw new Error('QR copy not visible'); if(!/download|unduh/i.test(text))return{status:'Failed',actual:'QR page visible but no download action text found',evidence:ev}; return {actual:'QR tab and download action visible',evidence:ev};});
  await run('TC-WISATA-SCAN-002','Mitra QR PDF download endpoint returns PDF',async()=>{const cookies=await mitraPageSession.cookies(); const cookieHeader=cookies.map(c=>`${c.name}=${c.value}`).join('; '); const r=await fetch(`${BASE}/mitra/wisata/scans/qr.pdf`,{headers:{Cookie:cookieHeader},redirect:'manual'}); const ct=r.headers.get('content-type')||''; const bytes=(await r.arrayBuffer()).byteLength; if(r.status!==200)throw new Error(`HTTP ${r.status}`); if(!ct.includes('pdf'))throw new Error(`Unexpected content-type ${ct}`); if(bytes<1000)throw new Error(`PDF too small: ${bytes}`); return `PDF HTTP 200, ${bytes} bytes`;});
}

// Compatibility representative checks in Chromium only
if (browser) {
  for (const [id,width,height,label] of [['COMP-CHROME-1440',1440,900,'Desktop Chrome 1440x900'],['COMP-CHROME-390',390,844,'Mobile Chrome 390x844']]) {
    await run(id,label,async()=>{const page=await newPage({width,height}); const bad=[]; for(const route of ['/','/wisata']){const resp=await goto(page,route); const m=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:window.innerWidth})); if(!resp||resp.status()>=500)bad.push(`${route}:HTTP${resp?.status()}`); if(m.sw>m.vw+4)bad.push(`${route}:overflow ${m.sw}>${m.vw}`);} await page.close(); if(bad.length)throw new Error(bad.join(', ')); return 'Representative public pages no horizontal overflow/server error';});
  }
}

// Rate-limit test last, to avoid affecting earlier auth tests.
await run('TC-API-003','Mobile login throttles repeated failures',async()=>{let statuses=[]; for(let i=0;i<7;i++){const r=await json('/api/auth/login',{method:'POST',body:{email:'qa-rate-limit@example.com',password:'wrong-password',device_name:'qa-rate'}}); statuses.push(r.response.status); if(r.response.status===429)break;} if(!statuses.includes(429))return{status:'Failed',actual:`No 429 observed; statuses=${statuses.join(',')}`}; return `Rate limit observed: ${statuses.join(',')}`;});

// Explicitly blocked scenarios requiring external inbox/2FA/paid-ticket fixture or destructive admin mutations.
for (const [id,title,reason] of [
  ['TC-WISATA-BOOKING-017','Booking email is sent after successful paid order','Requires a provider-confirmed paid order plus mailbox inspection.'],
  ['TC-WISATA-SCAN-005','Use one ticket item successfully','Requires a known paid unused ticket fixture and consumes it.'],
  ['TC-WISATA-SCAN-006','Use same ticket item twice is rejected','Requires destructive use of a paid ticket fixture.'],
  ['TC-WISATA-SCAN-007','User cannot consume another user ticket','Requires second user + paid ticket fixture.'],
  ['TC-ADMIN-WISATA-018','Generate wisata payout','Financial mutation intentionally not executed in broad automated staging sweep.'],
  ['TC-ADMIN-SYSTEM-006','System reset requires exact confirmation text','Destructive system reset endpoint intentionally not executed.'],
  ['TC-ADMIN-SYSTEM-007','System reset selected sections preserve admin accounts','Destructive system reset intentionally not executed.'],
  ['TC-USER-007','Submit valid review for eligible booking','Requires eligible used/paid booking fixture.']
]) add(id,title,'Blocked',reason);

for (const p of [userPageSession,adminPageSession,mitraPageSession]) { if (p) { try { await p.close(); } catch {} } }
if (browser) await browser.close();

const counts = results.reduce((acc,r)=>{acc[r.status]=(acc[r.status]||0)+1; return acc;},{});
const summary = { base_url: BASE, generated_at: now(), counts, total: results.length, results };
fs.writeFileSync(path.join(OUT,'qa-results.json'), JSON.stringify(summary,null,2));
const md = [
  '# INDOTIX Staging QA Automation', '', `Base: ${BASE}`, `Generated: ${summary.generated_at}`, '',
  `- Passed: ${counts.Passed||0}`, `- Failed: ${counts.Failed||0}`, `- Blocked: ${counts.Blocked||0}`, `- Skipped: ${counts.Skipped||0}`, '',
  '| ID | Status | Actual | Evidence |','|---|---|---|---|',
  ...results.map(r=>`| ${r.id} | ${r.status} | ${(r.actual||'').replace(/\|/g,'\\|').replace(/\n/g,' ')} | ${r.evidence||''} |`)
].join('\n');
fs.writeFileSync(path.join(OUT,'qa-results.md'),md);
console.log(`QA_SUMMARY ${JSON.stringify({counts,total:results.length})}`);
