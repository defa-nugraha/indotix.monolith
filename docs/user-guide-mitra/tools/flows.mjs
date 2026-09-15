import fs from 'node:fs/promises';
import path from 'node:path';
import {launch,login,goto,capture,click,find,fill,settle} from './browser.mjs';
import {output,root,guidePassword,baseUrl} from './runtime.mjs';
const map=JSON.parse(await fs.readFile(path.join(output,'screenshot-map.json'),'utf8'));
const verification=JSON.parse(await fs.readFile(path.join(output,'verification.json'),'utf8').catch(()=> '[]'));
const {browser,page}=await launch();
const a=(selector,label,description)=>[selector,label,description];
const shot=async(id,title,annotations,focus)=>{const i=map.findIndex(e=>e.id===id);if(i>=0)map.splice(i,1);await capture(page,{id,title,annotations,focus},map);};
const assert=async(text)=>{if(!(await page.evaluate(()=>document.body.innerText)).includes(text))throw new Error(`Expected visible: ${text}`);};
const dismiss=async()=>{const el=await find(page,'.swal2-confirm',false);if(el)await click(page,'.swal2-confirm');};
async function run(name,fn){
    if(process.argv[2]&&!process.argv[2].split(',').includes(name))return;
    try{await fn();verification.push({name,result:'passed',at:new Date().toISOString()});console.log(`Verified ${name}`);}
    catch(e){verification.push({name,result:'blocked',reason:e.message,at:new Date().toISOString()});console.error(name,e.message);}
    await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(verification,null,2));
}
try {
    await login(page);
    await run('ticket-create-edit',async()=>{
        await goto(page,'/mitra/wisata/tickets/create');
        await fill(page,'field:Nama Tiket','Tiket Rekreasi Keluarga');
        await fill(page,'field:Deskripsi','Akses wisata keluarga untuk kunjungan harian.');
        await fill(page,'field:Harga (Rp)','45000');
        await fill(page,'field:Kuota Total','200');
        await fill(page,'field:Kuota Harian (opsional)','50');
        await click(page,'button[type=submit]');
        await dismiss();
        await goto(page,'/mitra/wisata/tickets');
        await assert('Tiket Rekreasi Keluarga');
        await shot('25-ticket-created','Memeriksa tiket yang tersimpan',[a('table','Tiket tersimpan','Cari tiket baru dan periksa harga, kuota, serta status.'),a('text:Edit','Edit','Buka kembali produk untuk memperbarui data.')]);
        await click(page,'a[href*="/tickets/create?edit="]');
        await fill(page,'field:Deskripsi','Akses wisata keluarga, berlaku sesuai jam operasional.');
        await click(page,'button[type=submit]');
        await dismiss();
        await goto(page,'/mitra/wisata/tickets');
        await click(page,'a[href*="/tickets/create?edit="]');
        const value=await (await find(page,'field:Deskripsi')).$eval('textarea',e=>e.value);
        if(value!=='Akses wisata keluarga, berlaku sesuai jam operasional.')throw new Error('Edit did not persist.');
    });
    await run('ticket-package',async()=>{
        await goto(page,'/mitra/wisata/tickets/create');
        await fill(page,'field:Nama Tiket','Paket Rekreasi Berdua');
        await fill(page,'field:Kuota Total','100');
        await click(page,'text:Paket wisata');
        await shot('25b-ticket-package','Menyusun paket wisata',[a('field:Jenis Produk','Paket wisata','Gabungkan tiket satuan milik destinasi yang sama.'),a('field:Isi Paket Wisata','Isi Paket Wisata','Pilih tiket komponen dan jumlahnya; harga dihitung otomatis.')],'field:Isi Paket Wisata');
    });
    await run('booking-detail-filter',async()=>{
        await goto(page,'/mitra/wisata/bookings');
        await page.select('select[name=status]','paid');
        await click(page,'text:Filter');
        await assert('WST-PANDUAN-001');
        if((await page.evaluate(()=>document.body.innerText)).includes('WST-PANDUAN-004'))throw new Error('Filter returned cancelled booking.');
        await click(page,'text:Detail');
        await shot('28-booking-detail','Memeriksa detail pesanan',[a('h1','Kode booking','Pastikan kode sesuai booking pengunjung.'),a('section.grid','Rincian tiket','Cocokkan jenis tiket, jumlah, harga satuan, subtotal, status dan pemesan.')]);
    });
    await run('review-reply',async()=>{
        await goto(page,'/mitra/wisata/reviews');
        await click(page,'text:Balas');
        await fill(page,'.swal2-textarea','Terima kasih atas kunjungannya. Kami menantikan kedatangan Anda kembali.');
        await shot('35-review-reply','Mengirim balasan ulasan',[a('.swal2-textarea','Balasan','Tulis tanggapan yang sopan dan relevan.'),a('.swal2-confirm','Kirim','Simpan balasan untuk ulasan ini.'),a('.swal2-cancel','Batal','Tutup tanpa mengirim.')]);
        await click(page,'.swal2-confirm');
        await goto(page,'/mitra/wisata/reviews');
        await assert('Terima kasih atas kunjungannya.');
    });
    await run('dispute-create',async()=>{
        await goto(page,'/mitra/wisata/disputes');
        const select=await (await find(page,'field:Booking')).$('select');
        const values=await select.$$eval('option',els=>els.map(e=>e.value).filter(Boolean));
        await select.select(values.at(-1));
        await fill(page,'field:Subjek','Konfirmasi jumlah pengunjung');
        await fill(page,'field:Deskripsi','Mohon bantuan memeriksa kesesuaian jumlah tiket pada booking ini sebelum kunjungan.');
        await click(page,'text:Kirim Laporan');await dismiss();
        await goto(page,'/mitra/wisata/disputes');
        await assert('Konfirmasi jumlah pengunjung');
        await shot('37-dispute-created','Memantau laporan yang dikirim',[a('table','Riwayat laporan','Periksa booking, subjek, dan status laporan setelah dikirim.')],'table');
    });
    await run('chat-send',async()=>{
        await goto(page,'/mitra/chat');
        await fill(page,'input[placeholder="Tulis balasan..."]','Selamat pagi. Destinasi buka setiap hari pukul 08.00 sampai 17.00.');
        await click(page,'text:Kirim');
        await goto(page,'/mitra/chat');
        await assert('Destinasi buka setiap hari pukul 08.00 sampai 17.00.');
    });
    await run('profile-save',async()=>{
        await goto(page,'/settings/profile');
        await fill(page,'field:Nomor HP','080000000001');
        await click(page,'text:Simpan Profil');
        await goto(page,'/settings/profile');
        const value=await (await find(page,'field:Nomor HP')).$eval('input',e=>e.value);
        if(!['080000000001','6280000000001'].includes(value))throw new Error(`Profile value: ${value}`);
    });
    await run('password-save',async()=>{
        await goto(page,'/settings/profile');
        await fill(page,'field:Password Saat Ini',guidePassword);
        await fill(page,'field:Password Baru',guidePassword+'A1');
        await fill(page,'field:Konfirmasi Password',guidePassword+'A1');
        await click(page,'text:Simpan Password');
        await fill(page,'field:Password Saat Ini',guidePassword+'A1');
        await fill(page,'field:Password Baru',guidePassword);
        await fill(page,'field:Konfirmasi Password',guidePassword);
        await click(page,'text:Simpan Password');
        const errors=await page.evaluate(()=>[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent));
        if(errors.length)throw new Error('Password validation error.');
    });
    await run('guide-tour',async()=>{
        await goto(page,'/mitra/dashboard');
        await (await find(page,'button[aria-label="Tampilkan panduan halaman"]')).click();
        await new Promise(r=>setTimeout(r,500));
        await shot('41-guide','Membuka panduan interaktif',[a('text:Lanjut','Lanjut','Lanjutkan ke petunjuk berikutnya.'),a('button[aria-label="Tutup panduan"]','Tutup panduan','Tutup petunjuk untuk kembali bekerja.')]);
    });
    await run('logout',async()=>{
        await goto(page,'/mitra/dashboard');
        await click(page,'text:Pengelola Telaga Biru');
        await shot('42-logout','Keluar dari akun Mitra',[a('[data-test=logout-button]','Log out','Akhiri sesi setelah selesai, terutama di perangkat bersama.')]);
        await click(page,'[data-test=logout-button]');
        await goto(page,'/mitra/dashboard');
        if(!page.url().includes('/login'))throw new Error('Protected page remains accessible after logout.');
    });
} finally {await browser.close();}
