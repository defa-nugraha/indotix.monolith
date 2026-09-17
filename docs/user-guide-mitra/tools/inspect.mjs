import fs from 'node:fs/promises';
import {launch, login, goto} from './browser.mjs';
const {browser,page} = await launch();
const result = [];
try {
    await login(page);
    for (const route of ['/mitra/dashboard','/mitra/wisata/onboarding','/mitra/wisata/destination','/mitra/wisata/tickets','/mitra/wisata/tickets/create','/mitra/wisata/bookings','/mitra/wisata/scans','/mitra/wisata/scans?tab=history','/mitra/wisata/finance/summary','/mitra/wisata/finance/payouts','/mitra/wisata/notifications','/mitra/wisata/reviews','/mitra/wisata/disputes','/mitra/chat','/settings/profile','/settings/password']) {
        await goto(page,route);
        result.push({route,url:page.url(), ...await page.evaluate(()=>({text:document.body.innerText,
            controls:[...document.querySelectorAll('input,textarea,select,button')].map(e=>({tag:e.tagName,type:e.type,id:e.id,name:e.name,text:e.innerText,placeholder:e.placeholder,aria:e.getAttribute('aria-label')}))}))});
        console.log(route);
    }
} finally {await fs.writeFile('/tmp/indotix-guide-ui.json',JSON.stringify(result,null,2)); await browser.close();}
