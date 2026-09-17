import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {output,root,guidePassword} from './runtime.mjs';
import {chapters} from './chapters.mjs';
const map=JSON.parse(await fs.readFile(path.join(output,'screenshot-map.json'),'utf8'));
const ids=new Set(map.map(x=>x.id));assert.equal(ids.size,map.length);
for(const c of chapters)for(const id of c.shots)assert(ids.has(id),`Missing ${id}`);
for(const s of map){
 assert(s.annotations.length>0&&s.annotations.length<=6);
 for(const [i,a] of s.annotations.entries()){
  assert.equal(a.number,i+1);const b=a.bounds;
  assert(b.x>=0&&b.y>=0&&b.x+b.width<=1440&&b.y+b.height<=900);
 }
 for(const [folder,file] of [['screenshots',s.screenshot],['annotated',s.annotated]]){
  const png=await fs.readFile(path.join(output,'assets',folder,file));
  assert.equal(png.readUInt32BE(16),2880);assert.equal(png.readUInt32BE(20),1800);
 }
}
for(const file of await fs.readdir(path.join(output,'tools'))){
 if(file.endsWith('.mjs'))execFileSync('node',['--check',path.join(output,'tools',file)]);
 if(file.endsWith('.php'))execFileSync('php',['-l',path.join(output,'tools',file)]);
}
async function privacy(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await privacy(file);else if(/\.(md|json|html|mjs|php)$/.test(file)){const text=await fs.readFile(file,'utf8');assert(!text.includes(guidePassword),`Credential found: ${file}`);assert(!/^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----$/m.test(text),`Private key found: ${file}`);}}}
await privacy(output);
const text=execFileSync('pdftotext',['-layout',path.join(output,'user-guide-mitra.pdf'),'-'],{encoding:'utf8'});
const pages=text.split('\f').filter(x=>x.trim());
assert.equal(pages.length,2+chapters.length+chapters.reduce((n,c)=>n+c.shots.length,0));
assert(pages.every(p=>p.trim().length>170),'Unexpected nearly blank page');
const history=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8'));
const latest=[...new Map(history.map(x=>[x.name,x])).values()];
await fs.writeFile(path.join(output,'verification-summary.json'),JSON.stringify({
 generatedAt:new Date().toISOString(),actions:latest,
 additionalEvidence:{onboarding:'Read-only database check: registrasi.wisata@example.com has pending verification and all three uploaded photo paths.'},
 limits:['Package form selected and captured; package submission not exercised.','Deletion dialogs inspected, deletion not executed.','External SMTP, Google OAuth, bank transfer, Midtrans, visitor camera and physical printer not tested.'],
},null,2));
const result={sections:chapters.length,pdfPages:pages.length,originals:map.length,annotated:map.length,annotationBounds:'passed',imageDimensions:'2880 x 1800',scriptSyntax:'passed',credentialScan:'passed'};
await fs.writeFile(path.join(output,'artifact-validation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
