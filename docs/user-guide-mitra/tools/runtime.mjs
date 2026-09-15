import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const output = path.resolve(root, 'docs/user-guide-mitra');
export const baseUrl = 'http://127.0.0.1:8017';
const passwordFile = '/tmp/indotix-guide-password';
if (!fs.existsSync(passwordFile)) fs.writeFileSync(passwordFile, crypto.randomBytes(24).toString('base64url'), {mode: 0o600, flag: 'wx'});
export const guidePassword = fs.readFileSync(passwordFile, 'utf8').trim();
for (const directory of ['app/public','app/private','framework/sessions','framework/views','framework/cache/data','logs']) {
    fs.mkdirSync(path.join('/tmp/indotix-guide-storage',directory),{recursive:true,mode:0o700});
}
export const env = {...process.env, APP_ENV: 'local', APP_URL: baseUrl, APP_DEBUG: 'false',
    DB_CONNECTION: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '13316', DB_DATABASE: 'indotix_user_guide',
    DB_USERNAME: 'root', DB_PASSWORD: '', DB_SOCKET: '/tmp/indotix-guide-mysql.sock',
    CACHE_STORE: 'array', API_CACHE_STORE: 'array', SESSION_DRIVER: 'file', SESSION_SECURE_COOKIE: 'false', SESSION_DOMAIN: '',
    MAIL_MAILER: 'log', LOG_CHANNEL:'single', MAIL_LOG_CHANNEL:'single', BROADCAST_CONNECTION: 'null', QUEUE_CONNECTION: 'sync',
    PULSE_ENABLED: 'false', TELESCOPE_ENABLED: 'false', NIGHTWATCH_ENABLED: 'false', GUIDE_PASSWORD: guidePassword,
    LARAVEL_STORAGE_PATH:'/tmp/indotix-guide-storage', LARAVEL_PDF_CHROME_PATH:'/usr/bin/google-chrome', LARAVEL_PDF_NO_SANDBOX:'true'};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const mode = process.argv[2];
    if (mode === 'seed') {
        const result = spawnSync('php', ['docs/user-guide-mitra/tools/fixtures.php'], {cwd: root, env, stdio: 'inherit'});
        process.exit(result.status ?? 1);
    } else if (mode === 'serve') {
        const log = fs.openSync('/tmp/indotix-guide-server.log', 'a', 0o600);
        const child = spawn('php', ['-S', '127.0.0.1:8017', '-t', 'public', 'docs/user-guide-mitra/tools/router.php'], {cwd: root, env, detached: true, stdio: ['ignore', log, log]});
        fs.writeFileSync('/tmp/indotix-guide-server.pid', String(child.pid), {mode: 0o600});
        child.unref();
        console.log(`Documentation application: ${baseUrl}`);
    } else {
        throw new Error('Use seed or serve. Database must already be migrated.');
    }
}
