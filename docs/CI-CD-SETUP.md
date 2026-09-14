# CI/CD Server Setup

Run these one-time steps as an administrator. Replace placeholders; never use
the root account as the GitHub SSH user. These commands affect only the
Indotix application directories and do not touch mail services.

## VPS 1: Production

```bash
sudo adduser --disabled-password --gecos '' deploy
sudo install -d -o deploy -g <php-fpm-group> -m 750 /www/wwwroot/indotix
sudo -u deploy mkdir -p /www/wwwroot/indotix/{releases,incoming,backups,shared/storage}
sudo chgrp <php-fpm-group> /www/wwwroot/indotix/{releases,shared}
sudo chmod 750 /www/wwwroot/indotix/{releases,shared}
sudo install -o deploy -g <php-fpm-group> -m 640 /dev/null /www/wwwroot/indotix/shared/.env
sudo chown -R deploy:<php-fpm-group> /www/wwwroot/indotix/shared/storage
sudo find /www/wwwroot/indotix/shared/storage -type d -exec chmod 775 {} \;
sudo find /www/wwwroot/indotix/shared/storage -type f -exec chmod 664 {} \;
```

Populate `shared/.env` with production configuration before the first deploy:
`APP_ENV=production`, `APP_URL=https://indotix.co.id`, and `APP_DEBUG=false`.
Use production database, Redis, queue, payment, and mail credentials only.

Add the GitHub Actions public key to `/home/deploy/.ssh/authorized_keys`, then
record the server host key in `PRODUCTION_SSH_KNOWN_HOSTS`. Install `php`,
`curl`, `tar`, `gzip`, and `mysqldump`/`mariadb-dump` as normal server packages.
Do not grant sudo to `deploy` for application deployment.

In aaPanel, change the site's document root only after a release exists:

```text
/www/wwwroot/indotix/current/public
```

Keep the existing site path online until this cutover has been tested. Do not
move or delete the prior directory during the first release deployment.

## VPS 2: Staging

Use a separate application root, for example `/www/wwwroot/indotix-staging`,
and repeat the same setup with `APP_ENV=staging`,
`APP_URL=https://staging.indotix.co.id`, staging database credentials, sandbox
payment credentials, and a staging Redis prefix/database.

Replace `<php-fpm-group>` with the aaPanel PHP-FPM worker group (commonly
`www` or `www-data`) and `<existing-staging-root>` with the current staging
application directory:

```bash
sudo adduser --disabled-password --gecos '' deploy
sudo install -d -o deploy -g <php-fpm-group> -m 750 /www/wwwroot/indotix-staging
sudo -u deploy mkdir -p /www/wwwroot/indotix-staging/{releases,incoming,shared/storage}
sudo chgrp <php-fpm-group> /www/wwwroot/indotix-staging/{releases,shared}
sudo chmod 750 /www/wwwroot/indotix-staging/{releases,shared}
sudo install -o deploy -g <php-fpm-group> -m 640 <existing-staging-root>/.env \
  /www/wwwroot/indotix-staging/shared/.env
sudo rsync -a --chown=deploy:<php-fpm-group> <existing-staging-root>/storage/ \
  /www/wwwroot/indotix-staging/shared/storage/
sudo rsync -a --ignore-existing --chown=deploy:<php-fpm-group> <existing-staging-root>/public/storage/ \
  /www/wwwroot/indotix-staging/shared/storage/app/public/
sudo chown -R deploy:<php-fpm-group> /www/wwwroot/indotix-staging/shared/storage
sudo find /www/wwwroot/indotix-staging/shared/storage -type d -exec chmod 775 {} \;
sudo find /www/wwwroot/indotix-staging/shared/storage -type f -exec chmod 664 {} \;
sudo -u deploy ln -sfn <existing-staging-root> /www/wwwroot/indotix-staging/current
```

Before creating the first release, confirm that `shared/.env` has
`APP_ENV=staging`, `APP_URL=https://staging.indotix.co.id`, staging-only
database credentials, sandbox payment credentials, and an isolated Redis
database/prefix. Do not copy a production `.env`.

The temporary `current` symlink lets aaPanel keep serving the existing staging
application during the document-root cutover. The first successful deployment
atomically replaces it with a release under `releases/`.

If the previous aaPanel deployment stored uploaded files directly under
`public/storage`, copy that directory into `shared/storage/app/public` before
or immediately after the cutover. Otherwise public media URLs such as
`/storage/home-content/*.mp4` can fall through to Laravel's private storage
handler and return 403/404 even though the database still references them.

Set aaPanel document root to:

```text
/www/wwwroot/indotix-staging/current/public
```

Do not alter Postfix, Dovecot, Rspamd, SMTP/IMAP ports, mail certificates,
hostname, firewall, DNS, or `/var/vmail`. The staging deploy user has no access
to mail configuration or mail storage.

## Upload Succeeds But Staging Still Shows Old Code

Uploading and switching `current` does not change the aaPanel site root.
In aaPanel, edit **only the staging website**: set its site directory to
`/www/wwwroot/indotix-staging/current` and running directory to `/public`.
The effective Nginx document root must be
`/www/wwwroot/indotix-staging/current/public`, not the old
`/www/wwwroot/staging.indotix.co.id/public` directory. If PHP uses an explicit
`SCRIPT_FILENAME` or `open_basedir`, its staging-only configuration must allow
the new releases and shared storage. Do not change global PHP/Nginx settings
or mail services. Keep the old directory intact for recovery.

Verify the active release without printing any environment secrets:

```bash
readlink -f /www/wwwroot/indotix-staging/current
cat /www/wwwroot/indotix-staging/current/release.json
curl -fsS -D - -o /dev/null "https://staging.indotix.co.id/up?deploy_check=$(date +%s)"
```

New releases return `X-Indotix-Release` from Laravel on `/up`; it must match
`release.json`. The deployment now fails and attempts application rollback
when the header is missing or different, even if HTTP is 200. Older releases
do not have this header. Correct the site root before deploying this change.
Exclude `/up` from any Cloudflare cache-everything rule. A static file check
alone is insufficient because PHP can still serve a different release.

## Queue Workers

If Supervisor manages `queue:work`, configure it to run from the stable
`current` path. The deployment only sends `php artisan queue:restart`; it does
not restart Supervisor or any system service.

## First Cutover

1. Configure GitHub Environments/secrets listed in `CI-CD.md`.
2. Create the release roots and shared `.env` above.
3. Run a controlled production workflow from `main` after Environment approval.
4. Verify `/up`, `/`, `/wisata`, queue processing, storage upload, and aaPanel
   document root.
5. Keep the prior in-place directory intact until verification is complete.
