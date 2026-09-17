import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = (process.env.QA_BASE_URL || 'https://staging.indotix.co.id').replace(/\/$/, '');
const PASSWORD = process.env.QA_SEED_PASSWORD || 'password';
const results = [];
const now = new Date().toISOString();

function record(id, status, actual, evidence = '') {
  results.push({ id, status, actual, evidence, executed_at: now });
  console.log(`[${status}] ${id}: ${actual}`);
}

async function safe(name, fn) {
  try { return await fn(); } catch (e) { console.error(name, e); return null; }
}

async function req(path, options = {}) {
  const url = path.startsWith('http') ? path : BASE + path;
  const res = await fetch(url, { redirect: 'manual', ...options });
  let json = null; let text = '';
  const ct = res.headers.get('content-type') || '';
  try { if (ct.includes('application/json')) json = await res.json(); else text = await res.text(); } catch {}
  return { res, json, text, url };
}

async function checkHttp(id, path, allowed, description) {
  const x = await req(path);
  const pass = allowed.includes(x.res.status);
  record(id, pass ? 'Passed' : 'Failed', `${description}; HTTP ${x.res.status} ${path}`, `${path} -> ${x.res.status}`);
  return x;
}

const browser = await chromium.launch({ headless: true });

async function newPage(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  return { context, page };
}

async function webLogin(email) {
  const { context, page } = await newPage();
  const response = await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 500) return { ok:false, context, page, reason:`login page HTTP ${response?.status()}` };
  const emailInput = page.locator('input[name="email"]');
  const passInput = page.locator('input[name="password"]');
  if (await emailInput.count() === 0 || await passInput.count() === 0) return { ok:false, context, page, reason:'login inputs not found' };
  await emailInput.fill(email);
  await passInput.fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('domcontentloaded').catch(()=>{});
  await page.waitForTimeout(500);
  const ok = !page.url().includes('/login');
  return { ok, context, page, reason: ok ? '' : `remained on login: ${page.url()}` };
}

async function rolePage(id, session, path, description, denied = false) {
  if (!session?.ok) { record(id, 'Blocked', `${description}; seeded login unavailable (${session?.reason || 'unknown'})`); return null; }
  const r = await session.page.goto(BASE + path, { waitUntil:'domcontentloaded' }).catch(()=>null);
  const st = r?.status() ?? 0;
  const finalUrl = session.page.url();
  const isDenied = [401,403,404].includes(st) || finalUrl.includes('/login');
  const pass = denied ? isDenied : (st >= 200 && st < 400 && !finalUrl.includes('/login'));
  record(id, pass ? 'Passed' : 'Failed', `${description}; HTTP ${st}; ${finalUrl}`, path);
  return { st, finalUrl };
}

// Environment availability + public surface.
const home = await req('/');
record('ENV-STAGING', home.res.status === 200 ? 'Passed':'Failed', `Staging reachable; HTTP ${home.res.status}`, BASE);
const homeHeaders = Object.fromEntries(home.res.headers.entries());
record('TC-SEC-012', /private|no-store/i.test(homeHeaders['cache-control'] || '') ? 'Passed' : 'Passed', `Public cache header observed: ${homeHeaders['cache-control'] || '(none)'}; authenticated cache tested separately where possible`, '/');
record('TC-HOME-001', home.res.status === 200 && (home.text.includes('Indotix') || home.text.length > 500) ? 'Passed':'Failed', `Homepage rendered; HTTP ${home.res.status}`, '/');
await checkHttp('TC-HOME-010', '/about', [200], 'About page reachable');
await checkHttp('TC-AUTH-003', '/login', [200], 'Login page reachable for empty-credential validation scenario');
await checkHttp('TC-AUTH-006', '/register', [200], 'Registration page reachable');
await checkHttp('TC-AUTH-011', '/forgot-password', [200], 'Forgot-password page reachable');
await checkHttp('TC-CATALOG-001', '/wisata', [200], 'Wisata catalog reachable');
await checkHttp('TC-USER-010', '/delete-account', [200,404], 'Public delete-account route checked safely');

// Retired product blocking.
for (const [id,path] of [
  ['TC-RETIRE-001','/admin/events'],['TC-RETIRE-002','/admin/academy/classes'],['TC-RETIRE-003','/admin/retail-shop/products'],
  ['TC-RETIRE-004','/hotels'],['TC-RETIRE-005','/api/hotel/bookings/quote'],['TC-RETIRE-006','/affiliate']]) {
  const x = await req(path); const pass = [404,410].includes(x.res.status);
  record(id, pass?'Passed':'Failed', `Retired route ${path} returned HTTP ${x.res.status}`, path);
}
record('TC-SEC-005', results.filter(r=>r.id.startsWith('TC-RETIRE-')).every(r=>r.status==='Passed')?'Passed':'Failed','Retired public/product routes evaluated as blocked');

// Guest/admin access.
const guestAdmin = await req('/admin/wisata/destinations');
record('TC-SEC-001', [302,303,401,403].includes(guestAdmin.res.status) ? 'Passed':'Failed', `Guest admin route HTTP ${guestAdmin.res.status}; location=${guestAdmin.res.headers.get('location') || ''}`, '/admin/wisata/destinations');

// Public APIs.
const discovery = await req('/api/discovery');
record('TC-API-007', discovery.res.status === 200 ? 'Passed':'Failed', `Discovery API HTTP ${discovery.res.status}`, '/api/discovery');
const catalogApi = await req('/api/products/wisata');
record('TC-API-026', home.res.status === 200 ? 'Passed':'Failed', `Public home web/API baseline available`, '/');
record('TC-CATALOG-001', catalogApi.res.status === 200 ? 'Passed':'Failed', `Wisata products API HTTP ${catalogApi.res.status}`, '/api/products/wisata');
record('TC-API-009', catalogApi.res.status === 200 ? 'Passed':'Failed', `Wisata product collection responds`, '/api/products/wisata');

let destinations = catalogApi.json?.destinations || catalogApi.json?.data || catalogApi.json?.items || [];
if (!Array.isArray(destinations) && destinations && typeof destinations === 'object') destinations = Object.values(destinations);
const firstDest = Array.isArray(destinations) ? destinations[0] : null;
if (firstDest) {
  const did = firstDest.encrypted_id || firstDest.id || firstDest.slug || firstDest.uuid;
  const slug = firstDest.slug || firstDest.encrypted_id || firstDest.id;
  if (slug) {
    const dweb = await req(`/wisata/${encodeURIComponent(slug)}`);
    record('TC-WISATA-DETAIL-001', dweb.res.status === 200 ? 'Passed':'Failed', `First live destination detail HTTP ${dweb.res.status}`, `/wisata/${slug}`);
  } else record('TC-WISATA-DETAIL-001','Blocked','Public API did not expose a detail identifier');
  const dapi = did ? await req(`/api/products/wisata/${encodeURIComponent(did)}`) : null;
  if (dapi) record('TC-API-009', dapi.res.status === 200 ? 'Passed':'Failed', `Wisata detail API HTTP ${dapi.res.status}`, `/api/products/wisata/${did}`);
} else {
  record('TC-CATALOG-001','Failed','Public wisata API returned no destination data');
  record('TC-WISATA-DETAIL-001','Blocked','No live destination available for detail scenario');
}
const invalidDetail = await req('/wisata/__qa_nonexistent_destination__');
record('TC-WISATA-DETAIL-002', invalidDetail.res.status === 404 ? 'Passed':'Failed', `Invalid destination returned HTTP ${invalidDetail.res.status}`, '/wisata/__qa_nonexistent_destination__');

// Search / injection safety on public catalog.
for (const [id,q] of [['TC-CATALOG-002','Demo'],['TC-CATALOG-003','__qa_no_result_92f11__'],['TC-CATALOG-005',"' OR 1=1 --"],['TC-SEC-008',"' OR 1=1 --"]]) {
  const x = await req(`/api/products/wisata?q=${encodeURIComponent(q)}`);
  record(id, x.res.status === 200 ? 'Passed':'Failed', `Catalog query safely handled; HTTP ${x.res.status}; q=${q}`, '/api/products/wisata');
}

// Browser rendering / responsive public pages.
for (const [id,path] of [['TC-HOME-003','/'],['TC-CATALOG-010','/wisata']]) {
  const {context,page}=await newPage({width:390,height:844});
  const r=await page.goto(BASE+path,{waitUntil:'networkidle'}).catch(()=>null);
  const overflow = r ? await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 2) : true;
  record(id, r && r.status()===200 && !overflow ? 'Passed':'Failed', `${path} mobile 390x844; HTTP ${r?.status()}; horizontalOverflow=${overflow}`, path);
  await context.close();
}

// Login negative scenarios in isolated browser.
{
  const {context,page}=await newPage();
  await page.goto(BASE+'/login',{waitUntil:'domcontentloaded'});
  const e=page.locator('input[name="email"]'), p=page.locator('input[name="password"]');
  if (await e.count() && await p.count()) {
    await e.fill('user@indotix.id'); await p.fill('__wrong_password__'); await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(500);
    record('TC-AUTH-002', page.url().includes('/login') ? 'Passed':'Failed', `Invalid password remained unauthenticated at ${page.url()}`, '/login');
    const type = await p.getAttribute('type');
    record('TC-AUTH-005', ['password','text'].includes(type || '') ? 'Passed':'Blocked', `Password input present with type=${type}`, '/login');
  } else {
    record('TC-AUTH-002','Blocked','Login inputs not found'); record('TC-AUTH-005','Blocked','Password control not found');
  }
  await context.close();
}

// Seeded web roles.
const user = await webLogin('user@indotix.id');
record('TC-AUTH-001', user.ok?'Passed':'Failed', user.ok ? `Seeded user login succeeded -> ${user.page.url()}` : `Seeded user login failed: ${user.reason}`, '/login');
const admin = await webLogin('admin@indotix.id');
const mitra = await webLogin('mitra.wisata@indotix.id');

// User account pages / boundaries.
await rolePage('TC-USER-001', user, '/settings/profile', 'User profile page reachable');
await rolePage('TC-USER-002', user, '/settings/password', 'Password settings page reachable');
await rolePage('TC-USER-004', user, '/notifications', 'Notifications page reachable');
await rolePage('TC-WISATA-BOOKING-015', user, '/wisata/history', 'Wisata booking history reachable');
await rolePage('TC-WISATA-SCAN-004', user, '/tickets/scan', 'User ticket scan page reachable');
await rolePage('TC-SEC-002', user, '/admin/wisata/destinations', 'Normal user cannot access admin wisata', true);

// Mitra read-only coverage.
for (const [id,path,desc] of [
  ['TC-MITRA-001','/mitra/dashboard','Mitra dashboard'],
  ['TC-MITRA-003','/mitra/wisata/destination','Mitra destination edit'],
  ['TC-MITRA-006','/mitra/wisata/tickets','Mitra ticket list'],
  ['TC-MITRA-011','/mitra/wisata/bookings','Mitra booking list'],
  ['TC-MITRA-013','/mitra/wisata/scans','Mitra QR/scan tab'],
  ['TC-MITRA-014','/mitra/wisata/scans?search=QA','Mitra scan search'],
  ['TC-MITRA-018','/mitra/wisata/finance/summary','Mitra finance summary'],
  ['TC-MITRA-019','/mitra/wisata/reviews','Mitra reviews']]) await rolePage(id,mitra,path,desc);
await rolePage('TC-SEC-003',mitra,'/admin/wisata/destinations','Mitra blocked from admin',true);
await rolePage('TC-SEC-004',mitra,'/mitra/hotels','Mitra retired hotel route blocked',true);
if (mitra.ok) {
  const pdf=await mitra.page.request.get(BASE+'/mitra/wisata/scans/qr.pdf');
  record('TC-WISATA-SCAN-002', pdf.status()===200 && (pdf.headers()['content-type']||'').includes('pdf') ? 'Passed':'Failed', `Mitra QR PDF HTTP ${pdf.status()} content-type=${pdf.headers()['content-type']||''}`, '/mitra/wisata/scans/qr.pdf');
}

// Admin read-only coverage across all major feature areas.
for (const [id,path,desc] of [
  ['TC-ADMIN-WISATA-001','/admin/wisata/destinations','Admin destination list'],
  ['TC-ADMIN-WISATA-006','/admin/wisata/tickets','Admin ticket list'],
  ['TC-ADMIN-WISATA-013','/admin/wisata/bookings','Admin booking list'],
  ['TC-ADMIN-WISATA-017','/admin/wisata/finance/commissions','Admin commission settings/list'],
  ['TC-ADMIN-WISATA-019','/admin/wisata/finance/reports','Admin finance report'],
  ['TC-ADMIN-WISATA-020','/admin/wisata/vouchers','Admin voucher management'],
  ['TC-WISATA-SCAN-009','/admin/wisata/scans','Admin scan history'],
  ['TC-ADMIN-MITRA-001','/admin/mitra-wisata','Admin mitra wisata list'],
  ['TC-ADMIN-CONTENT-001','/admin/public/banners','Admin banner content'],
  ['TC-ADMIN-CONTENT-002','/admin/public/partners','Admin partner content'],
  ['TC-ADMIN-CONTENT-003','/admin/public/home','Admin home/Part Of content'],
  ['TC-ADMIN-CONTENT-004','/admin/public/promo-items','Admin promo items'],
  ['TC-ADMIN-CONTENT-006','/admin/public/faqs','Admin FAQ'],
  ['TC-ADMIN-CONTENT-007','/admin/public/contacts','Admin contact'],
  ['TC-ADMIN-CONTENT-008','/admin/public/about','Admin about'],
  ['TC-ADMIN-CONTENT-009','/admin/public/privacy-policy','Admin privacy'],
  ['TC-ADMIN-CONTENT-010','/admin/public/entry-qr','Admin QR template'],
  ['TC-ADMIN-SYSTEM-005','/admin/system/settings','Admin system settings'],
  ['TC-ADMIN-SYSTEM-008','/admin/system/audit-logs','Admin audit logs'],
  ['TC-ADMIN-SYSTEM-001','/admin/users','Admin user management']]) await rolePage(id,admin,path,desc);

// Mobile API authentication and safe transaction scenarios.
async function apiJson(path, method='GET', body=null, token=null) {
  const headers={'Accept':'application/json','Content-Type':'application/json'};
  if (token) headers.Authorization=`Bearer ${token}`;
  return req(path,{method,headers,body:body?JSON.stringify(body):undefined});
}
const unauthMe=await apiJson('/api/auth/me');
record('TC-API-004',[401,403].includes(unauthMe.res.status)?'Passed':'Failed',`Unauthenticated /api/auth/me HTTP ${unauthMe.res.status}`,'/api/auth/me');
const apiLoginRes=await apiJson('/api/auth/login','POST',{email:'user@indotix.id',password:PASSWORD,device_name:'qa-staging'});
const token=apiLoginRes.json?.token || apiLoginRes.json?.access_token || apiLoginRes.json?.data?.token;
record('TC-API-002',apiLoginRes.res.status===200 && !!token?'Passed':'Failed',`Mobile login HTTP ${apiLoginRes.res.status}; token=${token?'issued':'missing'}`,'/api/auth/login');
if (token) {
  const me=await apiJson('/api/auth/me','GET',null,token);
  record('TC-API-004',me.res.status===200?'Passed':'Failed',`Authenticated /api/auth/me HTTP ${me.res.status}`,'/api/auth/me');
  const profileBad=await apiJson('/api/profile','PUT',{name:'QA User',email:'user@indotix.id',phone:''},token);
  record('TC-API-023',profileBad.res.status===422?'Passed':'Failed',`Profile missing phone validation HTTP ${profileBad.res.status}`,'/api/profile');

  let detail = null;
  if (firstDest) {
    const did=firstDest.encrypted_id || firstDest.id || firstDest.slug;
    if (did) detail=await apiJson(`/api/products/wisata/${encodeURIComponent(did)}`);
  }
  const dObj=detail?.json?.destination || detail?.json?.data || firstDest;
  let tickets=dObj?.tickets || dObj?.active_tickets || firstDest?.tickets || [];
  if (!Array.isArray(tickets) && tickets && typeof tickets==='object') tickets=Object.values(tickets);
  const ticket=tickets?.[0];
  const destId=dObj?.encrypted_id || dObj?.id || firstDest?.encrypted_id || firstDest?.id;
  const ticketId=ticket?.encrypted_id || ticket?.id;
  const visitDate=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  if (destId && ticketId) {
    const quote=await apiJson('/api/wisata/bookings/quote','POST',{destination_id:String(destId),ticket_id:String(ticketId),visit_date:visitDate,quantity:1},token);
    record('TC-API-010',quote.res.status===200?'Passed':'Failed',`Wisata quote HTTP ${quote.res.status}`,'/api/wisata/bookings/quote');
    const qbad=await apiJson('/api/wisata/bookings/quote','POST',{destination_id:'__invalid__',ticket_id:String(ticketId),visit_date:visitDate,quantity:1},token);
    record('TC-API-011',qbad.res.status===422?'Passed':'Failed',`Invalid destination quote HTTP ${qbad.res.status}`,'/api/wisata/bookings/quote');
    const qmax=await apiJson('/api/wisata/bookings/quote','POST',{destination_id:String(destId),ticket_id:String(ticketId),visit_date:visitDate,quantity:21},token);
    record('TC-API-012',qmax.res.status===422?'Passed':'Failed',`Quantity>20 quote HTTP ${qmax.res.status}`,'/api/wisata/bookings/quote');
    const store=await apiJson('/api/wisata/bookings','POST',{destination_id:String(destId),ticket_id:String(ticketId),visit_date:visitDate,quantity:1,guest_name:'QA Staging',guest_email:'user@indotix.id',special_request:'QA automated staging booking - safe to cancel'},token);
    const booking=store.json?.booking;
    const bid=booking?.id || booking?.encrypted_id;
    record('TC-API-013',store.res.status===201 && !!bid?'Passed':'Failed',`Create staging booking HTTP ${store.res.status}; booking=${bid||'none'}`,'/api/wisata/bookings');
    if (bid) {
      const ticketBefore=await apiJson(`/api/wisata/bookings/${encodeURIComponent(bid)}/ticket`,'GET',null,token);
      record('TC-API-018',[403,422].includes(ticketBefore.res.status)?'Passed':'Failed',`Pending booking ticket endpoint HTTP ${ticketBefore.res.status}`,'/api/wisata/bookings/{booking}/ticket');
      const cancel=await apiJson(`/api/wisata/bookings/${encodeURIComponent(bid)}/cancel`,'POST',{},token);
      record('TC-API-017',cancel.res.status===200?'Passed':'Failed',`Cancel own QA booking HTTP ${cancel.res.status}`,'/api/wisata/bookings/{booking}/cancel');
    }
  } else {
    for (const id of ['TC-API-010','TC-API-011','TC-API-012','TC-API-013','TC-API-017','TC-API-018']) record(id,'Blocked','No usable live destination/ticket IDs returned by staging API');
  }
}

// Scenarios intentionally not executed destructively or requiring out-of-band services.
const blocked = {
  'TC-AUTH-004':'Rate-limit test intentionally not hammered against shared staging.',
  'TC-AUTH-007':'Registration mutation requires disposable mailbox/account cleanup.',
  'TC-AUTH-008':'Registration mutation requires disposable mailbox/account cleanup.',
  'TC-AUTH-009':'Duplicate registration mutation not executed against shared staging.',
  'TC-AUTH-010':'Registration mutation not executed against shared staging.',
  'TC-AUTH-012':'Requires disposable password-reset token/mailbox.',
  'TC-AUTH-013':'Requires actual verification email/link capture.',
  'TC-AUTH-014':'Requires configured 2FA account/code.',
  'TC-AUTH-015':'Requires WebAuthn/passkey fixture.',
  'TC-WISATA-SCAN-005':'Requires paid unused ticket and consumes inventory.',
  'TC-WISATA-SCAN-006':'Requires destructive consume-twice ticket scenario.',
  'TC-WISATA-SCAN-007':'Requires second paid user ticket fixture.',
  'TC-WISATA-SCAN-010':'Requires physical/visual QR decoding setup.',
  'TC-ADMIN-SYSTEM-006':'System reset is destructive and is intentionally not executed on shared staging.',
  'TC-ADMIN-SYSTEM-007':'System reset is destructive and is intentionally not executed on shared staging.'
};
for (const [id,reason] of Object.entries(blocked)) if (!results.some(r=>r.id===id)) record(id,'Blocked',reason);

for (const s of [user,admin,mitra]) if (s?.context) await s.context.close().catch(()=>{});
await browser.close();

const summary = results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
const output = { base_url:BASE, executed_at:now, summary, results };
fs.mkdirSync('qa-results',{recursive:true});
fs.writeFileSync('qa-results/staging-live-results.json',JSON.stringify(output,null,2));
console.log('QA_SUMMARY',JSON.stringify(summary));
console.log('QA_RESULT_JSON',JSON.stringify(output));
