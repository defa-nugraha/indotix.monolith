import fs from 'node:fs/promises';
import path from 'node:path';
import {launch,login,goto,click,find,fill} from './browser.mjs';
import {output,root} from './runtime.mjs';
const checks=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8'));
const {browser,page}=await launch();
async function run(name,fn){try{await fn();checks.push({name,result:'passed',at:new Date().toISOString()});console.log(name,'passed');}catch(e){checks.push({name,result:'blocked',reason:e.message});console.error(name,e.message);}}
try{
 await login(page);
 await run('destination-save',async()=>{
  await goto(page,'/mitra/wisata/destination');
  const days=await find(page,'field:Hari Buka');
  for(const input of await days.$$('input[type=checkbox]'))if(!await input.evaluate(e=>e.checked))await input.click();
  await click(page,'text:Simpan Perubahan');
  const ok=await page.$('.swal2-confirm');if(ok)await click(page,'.swal2-confirm');
  await goto(page,'/mitra/wisata/destination');
  const values=await (await find(page,'field:Hari Buka')).$$eval('input[type=checkbox]',es=>es.map(e=>e.checked));
  if(values.length!==7||values.some(x=>!x))throw new Error('Open days did not persist.');
 });
 await run('qr-pdf-download',async()=>{
  await goto(page,'/mitra/wisata/scans');
  const href=await (await find(page,'text:Unduh PDF')).evaluate(e=>e.closest('a')?.href);
  if(!href)throw new Error('PDF link not found.');
  const result=await page.evaluate(async href=>{const r=await fetch(href,{signal:AbortSignal.timeout(90000)});const b=await r.arrayBuffer();return {status:r.status,type:r.headers.get('content-type'),magic:new TextDecoder().decode(b.slice(0,5)),bytes:b.byteLength};},href);
  if(result.status!==200||result.magic!=='%PDF-')throw new Error(`PDF response ${result.status}, ${result.type}`);
 });
}finally{await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(checks,null,2));await browser.close();}
