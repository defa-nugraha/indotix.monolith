import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE='https://staging.indotix.co.id';
const OUT='qa-artifacts-v2';
const ACCOUNTS={
  user:{email:'qa.e2e.1789614795483@example.com',password:'StrongPass123!'},
  admin:{email:'admin@indotix.id',password:'password'},
  mitra:{email:'defanugraha30@gmail.com',password:'password'},
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
    if(r.res.status===422)return{status:'Blocked',actual:`${role} credential is not accepted on staging (HTTP 422).`};
    return{status:'Failed',actual:`Unexpected HTTP ${r.res.status}: ${r.text.slice(0,250)}`};
  });
}

await test('TC-RETIRE-006','Legacy route behavior for /affiliate',async()=>{const res=await fetch(BASE+'/affiliate',{redirect:'manual'});const loc=res.headers.get('location')||'';if(res.status===404)return{status:'Passed',actual:'HTTP 404'};if([301,302,303,307,308].includes(res.status))return{status:'Blocked',actual:`Route still exists but is auth-protected (${res.status} -> ${loc}); workbook expected result explicitly says business decision needs verification.`};return{status:'Failed',actual:`Unexpected HTTP ${res.status}`}});

await test('ENV-DATA-001','Entry criteria: live wisata destination with tickets exists',async()=>{const r=await api('/api/products/wisata');const count=r.data?.destinations?.length||0;if(count>0)return{status:'Passed',actual:`${count} public destination(s) with tickets available.`};return{status:'Blocked',actual:'No live wisata destination with available ticket exists. This violates Test Plan Entry Criteria and blocks catalog/detail/booking/payment/scan coverage.'}});

let browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox']});
async function isolatedLogin(account,label){const ctx=await browser.createBrowserContext();const p=await ctx.newPage();await p.setViewport({width:1440,height:900});await p.goto(BASE+'/login',{waitUntil:'domcontentloaded',timeout:30000});if(!(await p.$('#email')))return{status:'Failed',actual:`${label}: login form missing; URL=${p.url()}`,ctx,page:p};await p.type('#email',account.email);await p.type('#password',account.password);await Promise.allSettled([p.waitForNavigation({waitUntil:'domcontentloaded',timeout:12000}),p.click('[data-test="login-button"]')]);await sleep(1200);const text=await p.evaluate(()=>document.body?.innerText||'');if(p.url().includes('/login')){await ctx.close();return{status:'Blocked',actual:`${label} credentials did not authenticate. ${text.slice(0,350)}`}};return{status:'Passed',actual:`${label} login -> ${p.url()}`,ctx,page:p}}

const sessions={};
for(const role of ['user','admin','mitra']){
  const r=await isolatedLogin(ACCOUNTS[role],role);
  sessions[role]=r;
  record(`WEB-AUTH-${role.toUpperCase()}`,`${role} isolated web login`,r.status,r.actual);
}

await test('SMK-006','Open admin dashboard',async()=>{const s=sessions.admin;if(s.status!=='Passed')return s;const resp=await s.page.goto(BASE+'/dashboard',{waitUntil:'domcontentloaded',timeout:30000});const ev=path.join(OUT,'admin-dashboard.png');await s.page.screenshot({path:ev,fullPage:true});return{status:resp.status()===200?'Passed':'Failed',actual:`HTTP ${resp.status()}, final URL ${s.page.url()}`,evidence:ev}});
await test('SMK-009','Open mitra dashboard',async()=>{const s=sessions.mitra;if(s.status!=='Passed')return s;const resp=await s.page.goto(BASE+'/mitra/dashboard',{waitUntil:'domcontentloaded',timeout:30000});const ev=path.join(OUT,'mitra-dashboard.png');await s.page.screenshot({path:ev,fullPage:true});if(resp.status()>=500)return{status:'Failed',actual:`HTTP ${resp.status()}`};return{status:'Passed',actual:`HTTP ${resp.status()}, final URL ${s.page.url()}`,evidence:ev}});
await test('TC-AUTH-001','Login with valid user credentials',async()=>{const s=sessions.user;if(s.status!=='Passed')return s;return{status:'Passed',actual:`User login final URL ${s.page.url()}`}});

const adminRoutes=['/admin/public/banners','/admin/public/partners','/admin/public/home','/admin/public/promo-items','/admin/public/faqs','/admin/public/contacts','/admin/public/about','/admin/public/privacy-policy','/admin/public/entry-qr','/admin/wisata/destinations','/admin/wisata/tickets','/admin/wisata/bookings','/admin/wisata/scans','/admin/wisata/finance/commissions','/admin/wisata/finance/payouts','/admin/wisata/finance/reports','/admin/wisata/vouchers','/admin/system/audit-logs','/admin/system/notifications','/admin/system/roles','/admin/system/settings','/admin/system/special-admins','/admin/mitra-wisata'];
await test('QA-ADMIN-ROUTE-SMOKE','Admin feature route inventory',async()=>{const s=sessions.admin;if(s.status!=='Passed')return s;const failures=[];for(const route of adminRoutes){const resp=await s.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});if(resp.status()===404||resp.status()>=500)failures.push(`${route}:HTTP${resp.status()}=>${s.page.url()}`)}if(failures.length)return{status:'Failed',actual:failures.join('\n')};return{status:'Passed',actual:`${adminRoutes.length} admin feature routes loaded without 404/5xx.`}});

const mitraRoutes=['/mitra/wisata/destination','/mitra/wisata/tickets','/mitra/wisata/bookings','/mitra/wisata/scans','/mitra/wisata/finance/summary','/mitra/wisata/finance/payouts','/mitra/wisata/reviews','/mitra/wisata/notifications','/mitra/wisata/disputes'];
await test('QA-MITRA-ROUTE-SMOKE','Mitra wisata route inventory',async()=>{const s=sessions.mitra;if(s.status!=='Passed')return s;const failures=[];for(const route of mitraRoutes){const resp=await s.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});if(resp.status()===404||resp.status()>=500)failures.push(`${route}:HTTP${resp.status()}=>${s.page.url()}`)}if(failures.length)return{status:'Failed',actual:failures.join('\n')};return{status:'Passed',actual:`${mitraRoutes.length} mitra routes loaded without 404/5xx.`}});
await test('TC-WISATA-SCAN-002','Download mitra QR as PDF',async()=>{const s=sessions.mitra;if(s.status!=='Passed')return s;const resp=await s.page.goto(BASE+'/mitra/wisata/qr/download',{waitUntil:'domcontentloaded',timeout:30000});const type=resp.headers()['content-type']||'';if(resp.status()===404)return{status:'Blocked',actual:'Expected QR download route is not available at guessed URL; requires exact route from UI/route inventory.'};if(resp.status()>=500)return{status:'Failed',actual:`HTTP ${resp.status()}`};return{status:/pdf/i.test(type)?'Passed':'Blocked',actual:`HTTP ${resp.status()}, content-type=${type}, final URL ${s.page.url()}`}});

const userRoutes=[['TC-USER-001','/settings/profile'],['TC-USER-002','/settings/password'],['TC-USER-004','/notifications'],['TC-WISATA-BOOKING-015','/history'],['TC-USER-009','/chat']];
for(const [id,route] of userRoutes)await test(id,`Authenticated user page ${route}`,async()=>{const s=sessions.user;if(s.status!=='Passed')return s;const resp=await s.page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});if(resp.status()===404||resp.status()>=500)return{status:'Failed',actual:`HTTP ${resp.status()}, URL ${s.page.url()}`};return{status:'Passed',actual:`HTTP ${resp.status()}, URL ${s.page.url()}`}});

for(const s of Object.values(sessions))if(s.ctx)await s.ctx.close();
await browser.close();
const summary=results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});fs.writeFileSync(path.join(OUT,'qa-v2-results.json'),JSON.stringify({base:BASE,summary,results},null,2));console.log('QA_V2_SUMMARY',JSON.stringify({counts:summary,total:results.length}));