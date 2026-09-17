import fs from 'node:fs/promises';
import path from 'node:path';
import {launch,goto,fill,click,capture,settle,login} from './browser.mjs';
import {output,guidePassword} from './runtime.mjs';
const map=JSON.parse(await fs.readFile(path.join(output,'screenshot-map.json'),'utf8'));
const checks=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8'));
const {browser,page}=await launch();
try{
 await goto(page,'/forgot-password');
 await fill(page,'input[type=email]','pengelola@example.com');
 await click(page,'[data-test=email-password-reset-link-button]');
 const log=(await fs.readFile('/tmp/indotix-guide-storage/logs/laravel.log','utf8')).replace(/=\r?\n/g,'').replace(/=3D/g,'=').replace(/&amp;/g,'&');
 const urls=[...log.matchAll(/http:\/\/127\.0\.0\.1:8017\/reset-password\/[^\s"<>]+/g)].map(m=>m[0]);
 if(!urls.length)throw new Error('Local reset mail not found.');
 await page.goto(urls.at(-1),{waitUntil:'networkidle2'});await settle(page);
 const old=map.findIndex(x=>x.id==='04b-reset-password');if(old>=0)map.splice(old,1);
 await capture(page,{id:'04b-reset-password',title:'Menetapkan password pengganti',routeTemplate:'/reset-password/{token}',annotations:[
  ['input[name=email]','Email','Pastikan akun yang akan dipulihkan sudah benar.'],
  ['input[name=password]','Password','Isi password baru yang unik.'],
  ['input[name=password_confirmation]','Confirm password','Ulangi password baru yang sama.'],
  ['[data-test=reset-password-button]','Reset password','Simpan password baru, lalu masuk kembali.'],
 ]},map);
 await fill(page,'input[name=password]',guidePassword+'R2');
 await fill(page,'input[name=password_confirmation]',guidePassword+'R2');
 await click(page,'[data-test=reset-password-button]');
 if(!page.url().endsWith('/login'))throw new Error('Reset did not redirect to login.');
 await fill(page,'input[type=email]','pengelola@example.com');await fill(page,'input[type=password]',guidePassword+'R2');await click(page,'button[type=submit]');
 await goto(page,'/settings/profile');
 if(page.url().endsWith('/login'))throw new Error('New password login rejected.');
 await fill(page,'field:Password Saat Ini',guidePassword+'R2');await fill(page,'field:Password Baru',guidePassword);await fill(page,'field:Konfirmasi Password',guidePassword);await click(page,'text:Simpan Password');
 checks.push({name:'password-reset-email-and-login',result:'passed',scope:'Real password reset link from local mail log; login with new password and restoration through profile form. External inbox not tested.'});
 console.log('Password reset and new-password login passed.');
}catch(e){checks.push({name:'password-reset-email-and-login',result:'blocked',reason:'Reset workflow requires review; no token or URL logged.'});console.error('Reset workflow requires review.');process.exitCode=1;}
finally{await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(checks,null,2));await browser.close();}
