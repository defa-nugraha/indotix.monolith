import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE='https://staging.indotix.co.id';
const OUT='qa-artifacts-v2';
const ACCOUNTS={
  user:{email:'user@indotix.id',password:'password'},
  admin:{email:'admin@indotix.id',password:'password'},
  mitra:{email:'mitra.wisata@indotix.id',password:'password'},
};
fs.mkdirSync(OUT,{recursive:true});
const results=[];
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function record(id,title,status,actual,evidence=null){results.push({id,title,status,actual,evidence,executed_at:new Date().toISOString()});console.log(`[${status}] ${id} - ${title}: ${actual}`)}
async function test(id,title,fn){try{const r=await fn();record(id,title,r?.status||'Passed',r?.actual||String(r||'OK'),r?.evidence||null)}catch(e){record(id,title,'Failed',e?.stack||String(e))}}
async function api(pathname,opts={}){const res=await fetch(BASE+pathname,{redirect:'manual',...opts,headers:{Accept:'application/json',...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});const text=await res.text();let data=null;try{data=JSON.parse(text)}catch{}return{res,text,data}}
async function apiLogin(a){return api('/api/auth/login',{method:'POST',body:JSON.stringify({email:a.email,password:a.password,device_name:'qa-v2'})})}

const apiStates={};
for(const [role,a] of Object.entries(ACCOUNTS)){
  await test(`ENV-AUTH-${role.toUpperCase()}`,`${role} QA account readiness`,async()=>{
    const r=await apiLogin(a);apiStates[role]=r;
    if(r.res.status===200)return{status:'Passed',actual:`Verified ${role} account accepted; token issued.`};
    if(r.res.status===403 && r.data?.requires_email_verification)return{status:'Blocked',actual:`${role} account exists but is not email-verified on staging (HTTP 403).`};
    if(r.res.status===422)return{status:'Blocked',actual:`${role} seeded credential is not accepted on staging (HTTP 422).`};
    return{status:'Failed',actual:`Unexpected HTTP ${r.res.status}: ${r.text.slice(0,250)}`};
  });
}

await test('TC-RETIRE-006','Legacy route behavior for /affiliate',async()=>{
  const r=await fetch(BASE+'/affiliate',{redirect:'manual'});const loc=r.headers.get('location')||'';
  if(r.status===404)return{status:'Passed',actual:'Route retired with HTTP 404.'};
  if([301,302,303,307,308].includes(r.status) && /login/.test(loc))return{status:'Blocked',actual:`Route still exists but is auth-protected (${r.status} -> ${loc}); workbook expected result explicitly says business decision needs verification.`};
  return{status:'Blocked',actual:`Observed HTTP ${r.status}; workbook marks this surface as needs business verification.`};
});

await test('ENV-DATA-001','Entry criteria: live wisata destination with tickets exists',async()=>{
 const r=await api('/api/products/wisata');if(r.res.status!==200)throw new Error(`HTTP ${r.res.status}`);const n=r.data?.destinations?.length||0;
 if(n<1)return{status:'Blocked',actual:'No live wisata destination with available ticket exists. This violates Test Plan Entry Criteria and blocks catalog/detail/booking/payment/scan coverage.'};
 return{status:'Passed',actual:`${n} live destination(s) available.`};
});

const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox']});
async function isolatedLogin(role){
 const ctx=await browser.createBrowserContext();const page=await ctx.newPage();await page.setViewport({width:1440,height:900});page.setDefaultTimeout(15000);
 const resp=await page.goto(BASE+'/login',{waitUntil:'domcontentloaded',timeout:30000});
 if(!resp||resp.status()>=500){await ctx.close();return{status:'Failed',actual:`Login page HTTP ${resp?.status()}`}}
 const email=await page.$('#email');const pwd=await page.$('#password');if(!email||!pwd){const url=page.url();await ctx.close();return{status:'Failed',actual:`Fresh isolated context did not render login fields; URL=${url}`}}
 await page.type('#email',ACCOUNTS[role].email);await page.type('#password',ACCOUNTS[role].password);
 await Promise.allSettled([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:12000}),page.click('[data-test="login-button"]')]);await sleep(800);
 const url=page.url();const text=await page.evaluate(()=>document.body?.innerText||'');
 if(url.includes('/email/verify'))return{status:'Blocked',actual:`${role} login accepted password but account is unverified; redirected to /email/verify.`,page,ctx};
 if(url.includes('/login')){await ctx.close();return{status:'Blocked',actual:`${role} credentials did not authenticate. ${text.slice(0,180)}`}}
 return{status:'Passed',actual:`${role} authenticated to ${url}`,page,ctx};
}

const sessions={};
for(const role of ['user','admin','mitra']){
 await test(role==='user'?'TC-AUTH-001':role==='admin'?'SMK-006':'SMK-009',role==='user'?'Login with valid user credentials':role==='admin'?'Open admin dashboard':'Open mitra dashboard',async()=>{
  const s=await isolatedLogin(role);sessions[role]=s;
  if(s.status!=='Passed')return{status:s.status,actual:s.actual};
  const target=role==='admin'?'/dashboard':role==='mitra'?'/mitra/dashboard':'/';
  const resp=await s.page.goto(BASE+target,{waitUntil:'domcontentloaded',timeout:30000});await sleep(500);
  const finalUrl=s.page.url();if(!resp||resp.status()>=500)throw new Error(`HTTP ${resp?.status()}`);
  if(finalUrl.includes('/email/verify')||finalUrl.includes('/login'))return{status:'Blocked',actual:`Authenticated session cannot access expected page; redirected to ${finalUrl}`};
  const evidence=path.join(OUT,`${role}-dashboard.png`);await s.page.screenshot({path:evidence,fullPage:true});return{status:'Passed',actual:`HTTP ${resp.status()}, final URL ${finalUrl}`,evidence};
 });
}

if(sessions.admin?.status==='Passed'){
 const routes=['/admin/public/banners','/admin/public/partners','/admin/public/home','/admin/public/promo-items','/admin/public/faqs','/admin/public/contacts','/admin/public/about','/admin/public/privacy-policy','/admin/public/entry-qr','/admin/wisata/destinations','/admin/wisata/tickets','/admin/wisata/bookings','/admin/wisata/scans','/admin/wisata/finance/commissions','/admin/wisata/finance/payouts','/admin/wisata/finance/reports','/admin/wisata/vouchers','/admin/system/audit-logs','/admin/system/notifications','/admin/system/roles','/admin/system/settings','/admin/system/special-admins','/admin/mitra-wisata'];
 await test('QA-ADMIN-ROUTE-SMOKE','Admin feature route inventory',async()=>{const bad=[];for(const route of routes){const r=await sessions.admin.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});await sleep(150);const u=sessions.admin.page.url();if(!r||r.status()>=500||r.status()===404||u.includes('/email/verify')||u.includes('/login'))bad.push(`${route}:HTTP${r?.status()}=>${u}`)}if(bad.length)throw new Error(bad.join('\n'));return{status:'Passed',actual:`${routes.length} admin routes loaded without 404/5xx/auth redirect.`}});
}else record('QA-ADMIN-ROUTE-SMOKE','Admin feature route inventory','Blocked','Admin QA account is not ready/verified.');

if(sessions.mitra?.status==='Passed'){
 const routes=['/mitra/wisata/destination','/mitra/wisata/tickets','/mitra/wisata/bookings','/mitra/wisata/scans','/mitra/wisata/finance/summary','/mitra/wisata/finance/payouts','/mitra/wisata/reviews','/mitra/wisata/notifications','/mitra/wisata/disputes'];
 await test('QA-MITRA-ROUTE-SMOKE','Mitra wisata route inventory',async()=>{const bad=[];for(const route of routes){const r=await sessions.mitra.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});await sleep(150);const u=sessions.mitra.page.url();if(!r||r.status()>=500||r.status()===404||u.includes('/email/verify')||u.includes('/login'))bad.push(`${route}:HTTP${r?.status()}=>${u}`)}if(bad.length)throw new Error(bad.join('\n'));return{status:'Passed',actual:`${routes.length} mitra routes loaded without 404/5xx/auth redirect.`}});
 await test('TC-WISATA-SCAN-002','Download mitra QR as PDF',async()=>{const cookies=await sessions.mitra.page.cookies();const res=await fetch(BASE+'/mitra/wisata/scans/qr.pdf',{headers:{Cookie:cookies.map(c=>`${c.name}=${c.value}`).join('; ')},redirect:'manual'});const ct=res.headers.get('content-type')||'';const b=(await res.arrayBuffer()).byteLength;if(res.status!==200)throw new Error(`HTTP ${res.status}`);if(!/pdf/i.test(ct)||b<1000)throw new Error(`content-type=${ct}, bytes=${b}`);return{status:'Passed',actual:`PDF HTTP 200, ${b} bytes.`}});
}else{record('QA-MITRA-ROUTE-SMOKE','Mitra wisata route inventory','Blocked','Mitra QA account is not ready/verified.');record('TC-WISATA-SCAN-002','Download mitra QR as PDF','Blocked','Mitra QA account is not ready/verified.');}

if(sessions.user?.status==='Passed'){
 const routes=[['TC-USER-001','/settings/profile'],['TC-USER-002','/settings/password'],['TC-USER-004','/notifications'],['TC-WISATA-BOOKING-015','/history'],['TC-USER-009','/chat']];
 for(const [id,route] of routes)await test(id,`Authenticated user page ${route}`,async()=>{const r=await sessions.user.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});await sleep(250);const u=sessions.user.page.url();if(!r||r.status()>=500)throw new Error(`HTTP ${r?.status()}`);if(u.includes('/email/verify')||u.includes('/login'))return{status:'Blocked',actual:`Redirected to ${u}`};return{status:'Passed',actual:`HTTP ${r.status()}, final URL ${u}`}});
}else for(const [id,route] of [['TC-USER-001','/settings/profile'],['TC-USER-002','/settings/password'],['TC-USER-004','/notifications'],['TC-WISATA-BOOKING-015','/history'],['TC-USER-009','/chat']])record(id,`Authenticated user page ${route}`,'Blocked','Verified user QA session unavailable.');

for(const s of Object.values(sessions)){try{await s?.ctx?.close()}catch{}}
await browser.close();
const counts=results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});fs.writeFileSync(path.join(OUT,'qa-results-v2.json'),JSON.stringify({base_url:BASE,generated_at:new Date().toISOString(),counts,total:results.length,results},null,2));console.log(`QA_V2_SUMMARY ${JSON.stringify({counts,total:results.length})}`);
