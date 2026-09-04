# Indotix Application Rollback

The deployment process retains the active and prior release. A failed `/up` or
`/wisata` check during release activation automatically repoints `current` to
`previous`. This rolls back code, `vendor`, and built assets only.

## Manual Rollback

Use the deploy account, not root:

```bash
sudo -u deploy DEPLOY_ROOT=/www/wwwroot/indotix \
  /www/wwwroot/indotix/current/deploy/rollback.sh
```

Verify afterward:

```bash
curl -fsS https://indotix.co.id/up
curl -fsS https://indotix.co.id/wisata -o /dev/null
readlink -f /www/wwwroot/indotix/current
```

## Database Safety

Do not run `php artisan migrate:rollback` automatically or as a first response.
Production migrations may already contain data written by the new release. A
pre-migration compressed MySQL backup is stored under `<deploy-root>/backups`
with restrictive permissions. Restore only through an approved incident
procedure after assessing schema and data compatibility.
