import fs from 'node:fs/promises';
import path from 'node:path';
import {launch,goto,click,fill,capture,settle} from './browser.mjs';
import {output,root,guidePassword} from './runtime.mjs';
const map=JSON.parse(await fs.readFile(path.join(output,'screenshot-map.json'),'utf8'));
const verification=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8').catch(()=> '[]'));
const {browser,page}=await launch();
const a=(s,l,d)=>[s,l,d];
async function shot(id,title,annotations,focus){const i=map.findIndex(e=>e.id===id);if(i>=0)map.splice(i,1);await capture(page,{id,title,annotations,focus},map);}
try{
    await goto(page,'/register');
    await click(page,'text:Mitra');
    await fill(page,'input[name=name]','Pengelola Wisata Baru');
    await fill(page,'input[name=email]',process.env.GUIDE_REGISTRATION_EMAIL ?? 'registrasi.baru@example.com');
    await fill(page,'input[name=phone]','081200000003');
    await fill(page,'input[name=password]',guidePassword);
    await fill(page,'input[name=password_confirmation]',guidePassword);
    await click(page,'#terms_accepted');
    await click(page,'button[type=submit]');
    if(!page.url().includes('/email/verify'))throw new Error('Registration did not reach email verification: '+await page.evaluate(()=>document.body.innerText));
    await shot('05-email-verification','Memverifikasi email akun',[a('text:Kirim ulang link verifikasi','Kirim ulang link verifikasi','Gunakan jika tautan belum diterima; periksa folder spam terlebih dahulu.'),a('text:Keluar','Keluar','Akhiri sesi jika ingin menggunakan akun lain.')]);
    await click(page,'text:Kirim ulang link verifikasi');
    const log=await fs.readFile('/tmp/indotix-guide-storage/logs/laravel.log','utf8');
    const decoded=log.replace(/=\r?\n/g,'').replace(/=3D/g,'=').replace(/&amp;/g,'&');
    const links=[...decoded.matchAll(/http:\/\/127\.0\.0\.1:8017\/email\/verify\/[^\s"<>]+/g)].map(m=>m[0]);
    if(!links.length)throw new Error('Verification URL not found in local mail log.');
    await page.goto(links.at(-1),{waitUntil:'networkidle2'});await settle(page);
    await goto(page,'/mitra/dashboard');
    await shot('06-choose-wisata','Memulai pendaftaran Mitra Wisata',[a('text:Daftar Wisata','Daftar Wisata','Pilih untuk melengkapi data usaha wisata.')]);
    await click(page,'text:Daftar Wisata');
    await fill(page,'field:Nama Lengkap Penanggung Jawab','Pengelola Wisata Baru');
    await fill(page,'field:Nomor HP','081200000003');
    await click(page,'button[role=combobox]');
    await click(page,'[role=option]');
    await click(page,'button[type=submit]');
    const ok=await page.$('.swal2-confirm');if(ok)await click(page,'.swal2-confirm');
    await shot('16-onboarding-checklist','Memeriksa kelengkapan pengajuan',[a('text:Checklist kelengkapan','Checklist kelengkapan','Lengkapi setiap persyaratan yang belum terpenuhi; tombol Kirim Verifikasi muncul setelah data siap.')],'text:Checklist kelengkapan');
    verification.push({name:'register-email-link-type-onboarding-account',result:'passed',at:new Date().toISOString(),scope:'UI register, local mail link, choose Wisata, save responsible data; external SMTP not tested'});
}catch(e){verification.push({name:'register-email-link-type-onboarding-account',result:'blocked',reason:e.message});console.error(e.message);process.exitCode=1;}
finally{await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(verification,null,2));await browser.close();}
