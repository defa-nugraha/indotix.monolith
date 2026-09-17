import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {launch,login,goto,click,find,capture} from './browser.mjs';
import {output,env,root} from './runtime.mjs';
const map=JSON.parse(await fs.readFile(path.join(output,'screenshot-map.json'),'utf8'));
const checks=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8'));
const {browser,page}=await launch();
const shot=async(id,title,annotations,focus)=>{const i=map.findIndex(x=>x.id===id);if(i>=0)map.splice(i,1);await capture(page,{id,title,annotations,focus},map);};
try {
 await login(page,process.env.GUIDE_REGISTRATION_EMAIL ?? 'registrasi.wisata@example.com');
 await goto(page,'/mitra/wisata/onboarding');
 await shot('16-onboarding-checklist','Memeriksa kelengkapan pengajuan',[
 ['text:Checklist kelengkapan','Checklist kelengkapan','Lengkapi persyaratan yang masih belum terpenuhi sebelum mengirim pengajuan.']],'text:Checklist kelengkapan');
 const setup=spawnSync('php',['docs/user-guide-mitra/tools/additional-fixtures.php'],{cwd:root,env:{...env,GUIDE_PREPARE_DRAFT:'true',GUIDE_REGISTRATION_EMAIL:process.env.GUIDE_REGISTRATION_EMAIL ?? 'registrasi.wisata@example.com'},encoding:'utf8'});
 if(setup.status!==0)throw new Error(setup.stderr);
 await goto(page,'/mitra/wisata/onboarding');
 await click(page,'text:Data Destinasi Wisata');
 for(const id of ['photo_gate_file','photo_area_file','photo_ticket_file']){
  const input=await page.$('#'+id);await input.uploadFile(path.join(root,'public/images/qr/blue-mountains-cc0.jpg'));
 }
 await click(page,'button[type=submit]');
 const ok=await page.$('.swal2-confirm');if(ok)await click(page,'.swal2-confirm');
 await goto(page,'/mitra/wisata/onboarding');
 await shot('17-onboarding-submit','Mengirim pendaftaran untuk verifikasi',[
 ['text:Kirim Verifikasi','Kirim Verifikasi','Kirim setelah seluruh data dan dokumen diperiksa. Contoh berkas pada lingkungan dokumentasi bukan identitas atau izin usaha nyata.']],'text:Kirim Verifikasi');
 await click(page,'text:Kirim Verifikasi');
 const confirm=await page.$('.swal2-confirm');if(confirm)await click(page,'.swal2-confirm');
 checks.push({name:'onboarding-upload-submit',result:'observed',scope:'Three photo uploads and submission through actual UI; legal fields preloaded with non-sensitive documentation fixtures.'});
 await browser.close();
 const next=await launch();
 try {
  await login(next.page);await goto(next.page,'/mitra/dashboard');
  const i=map.findIndex(x=>x.id==='07-terms');if(i>=0)map.splice(i,1);
  await capture(next.page,{id:'07-terms',title:'Menyetujui dokumen kerja sama',focus:'text:Kirim tanda tangan',annotations:[
   ['input[type=checkbox]','Persetujuan','Centang hanya setelah membaca dan menyetujui dokumen kerja sama.'],
   ['text:Kirim tanda tangan','Kirim tanda tangan','Catat persetujuan dan kirim salinan dokumen ke email akun.'],
  ]},map);
  await click(next.page,'input[type=checkbox]');await click(next.page,'text:Kirim tanda tangan');
  await goto(next.page,'/mitra/dashboard');
  if(!(await next.page.evaluate(()=>document.body.innerText)).includes('Dokumen kerja sama sudah disetujui'))throw new Error('Agreement not persisted.');
  checks.push({name:'partner-terms-sign',result:'passed',scope:'Actual UI signature; local mailer only.'});
 }finally{await next.browser.close();}
}catch(e){checks.push({name:'additional-capture',result:'blocked',reason:e.message});console.error(e.message);process.exitCode=1;}
finally{await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(checks,null,2));if(browser.connected)await browser.close();}
