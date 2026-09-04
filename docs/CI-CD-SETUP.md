# CI/CD Server Setup

Run these one-time steps as an administrator. Replace placeholders; never use
the root account as the GitHub SSH user. These commands affect only the
Indotix application directories and do not touch mail services.

## VPS 1: Production

```bash
sudo adduser --disabled-password --gecos '' deploy
sudo install -d -o deploy -g deploy -m 750 /www/wwwroot/indotix
sudo -u deploy mkdir -p /www/wwwroot/indotix/{releases,incoming,backups,shared/storage}
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

Set aaPanel document root to:

```text
/www/wwwroot/indotix-staging/current/public
```

Do not alter Postfix, Dovecot, Rspamd, SMTP/IMAP ports, mail certificates,
hostname, firewall, DNS, or `/var/vmail`. The staging deploy user has no access
to mail configuration or mail storage.

## Queue

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
