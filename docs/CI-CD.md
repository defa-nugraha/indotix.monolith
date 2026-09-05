# Indotix CI/CD

## Architecture

GitHub Actions runs CI for pull requests targeting `develop` or `main`. A
successful push to `develop` deploys a built release artifact to staging. A
production deployment is started only through `workflow_dispatch` from `main`
with the `production` confirmation value and the GitHub `production`
Environment approval gate.

VPS 1 hosts production at `indotix.co.id`. VPS 2 hosts only the staging
application at `staging.indotix.co.id`; its mail services are outside the
deployment scope. The workflow does not restart services, alter firewall,
hostname, DNS, or any Postfix, Dovecot, Rspamd, SMTP, IMAP, or mail directory.

Cloudflare DNS is not managed by this repository. Keep `mail.indotix.co.id`
DNS Only.

## Branch Flow

`feature/*` is merged through a pull request into `develop`. CI gates that
pull request. A push to `develop` builds one artifact and automatically deploys
it to staging. After QA, `develop` is merged to `main`. A main push runs CI but
does not deploy production. An operator starts **Run workflow**, selects
`main`, and chooses `production`; GitHub Environment protection then controls
approval.

## Release Layout

After the one-time server migration, each application root is:

```text
<deploy-root>/
  current -> releases/<release-id>
  previous -> releases/<previous-release-id>
  releases/<release-id>/
  shared/.env
  shared/storage/
  backups/                       # production only
```

The aaPanel site document root must be `<deploy-root>/current/public`. Every
release receives the same CI-built `vendor/` and `public/build/`; `.env` and
runtime storage are never inside an artifact. The deploy user owns each release
and generates its `bootstrap/cache`; the PHP-FPM group needs read/traverse
access to the deploy root, `releases`, and `shared`, plus write access to
`shared/storage`.

The workflow retains the five newest releases, plus the active and previous
release. Each release receives `release.json` with release ID, environment,
commit, and time.

## Deployment Sequence

1. CI validates manifests, dependencies, audits, PHP syntax, TypeScript,
   frontend build, and Pest.
2. GitHub builds a production dependency/frontend artifact once.
3. The artifact is copied by key-authenticated SSH to a new release directory.
4. The server validates `APP_ENV`, `APP_URL`, and production `APP_DEBUG=false`.
5. Production backs up MySQL before migrations. A failed backup stops deploy.
6. Laravel package discovery, migrations, cache preparation, and the atomic
   `current` symlink switch run.
7. `/up` and `/wisata` must return HTTP 2xx. Failed health/smoke checks roll
   application files back to `previous`.

Database migrations are deliberately **not** rolled back automatically. New
migrations must be backward compatible: add nullable/expand first, deploy
readers/writers next, and only contract in a later release.

## GitHub Environments and Secrets

Create `staging` and `production` GitHub Environments. Require reviewers for
`production`; configure `staging` only if its QA process requires approval.

Staging environment secrets:

```text
STAGING_HOST
STAGING_PORT
STAGING_USER
STAGING_SSH_KEY
STAGING_SSH_KNOWN_HOSTS
STAGING_DEPLOY_ROOT
STAGING_FRONTEND_BUILD_ENV
```

Production environment secrets:

```text
PRODUCTION_HOST
PRODUCTION_PORT
PRODUCTION_USER
PRODUCTION_SSH_KEY
PRODUCTION_SSH_KNOWN_HOSTS
PRODUCTION_DEPLOY_ROOT
PRODUCTION_FRONTEND_BUILD_ENV
```

`*_FRONTEND_BUILD_ENV` is optional and contains only newline-separated public
`VITE_*` assignments needed by the frontend build, such as the Reverb public
host and key. It is not the server `.env`, must not contain `APP_KEY` or any
database credential, and is excluded from the release artifact.

Use a non-root deploy user. `*_SSH_KNOWN_HOSTS` must contain the target host's
verified host key. Do not put `.env`, database passwords, Cloudflare tokens,
or payment/mail credentials in repository or workflow YAML.

## Rollback

The release script automatically rolls application files back if its health
checks fail after activation. For an operator rollback:

```bash
sudo -u deploy DEPLOY_ROOT=/www/wwwroot/indotix bash \
  /www/wwwroot/indotix/current/deploy/rollback.sh
```

This moves `current` to `previous`, rebuilds Laravel caches, and signals queue
workers. It does not execute `migrate:rollback`.

## CI Baseline

The repository currently has existing Pint and ESLint baseline violations.
CI intentionally does not run mutating `pint` or ESLint `--fix`, because that
would make deployment artifacts differ from the reviewed commit. Resolve the
baseline in a dedicated formatting PR, then add check-only lint gates.
