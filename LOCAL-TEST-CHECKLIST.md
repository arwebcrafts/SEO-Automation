# Local Test Checklist

Use this checklist to verify the WordPress plugin and SaaS connection before pushing or deploying.

## 1. WordPress Plugin Smoke Test

1. Install and activate the plugin on a clean local WordPress site.
2. Open `SEO AutoFix -> API / Connect`.
3. Confirm Remote API is enabled.
4. Copy the generated API key.
5. Verify these endpoints:

```bash
curl http://YOUR-WP-SITE.local/wp-json/seo-autofix/v1/ping
curl -H "X-SEO-AutoFix-Key: YOUR_API_KEY" http://YOUR-WP-SITE.local/wp-json/seo-autofix/v1/verify
curl -H "X-SEO-AutoFix-Key: YOUR_API_KEY" http://YOUR-WP-SITE.local/wp-json/seo-autofix/v1/status
curl -H "X-SEO-AutoFix-Key: YOUR_API_KEY" http://YOUR-WP-SITE.local/wp-json/seo-autofix/v1/verify-status
```

Expected result: all responses return valid JSON. `/verify` should return site/plugin info. `/verify-status` should return SEO status categories.

## 2. Next.js App Smoke Test

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open `http://localhost:3000`.
4. Connect the WordPress site with the local site URL and plugin API key.
5. Run one audit and trigger one small fix, such as alt text or OG tags.

## 3. Content Publishing Test

1. Add the local WordPress site in the content/site connection flow.
2. Confirm connection verification succeeds.
3. Publish a draft test post.
4. Confirm the post appears in WordPress with title, content, meta fields, and featured image if provided.

## 4. Regression Checks

- `/verify` is only for connection verification.
- `/verify-status` is only for post-fix/rescan status.
- App requests use `X-SEO-AutoFix-Key` or `Authorization: Bearer`.
- WordPress proxy sends fix options directly to plugin endpoints.
- `/content/publish` and `/content/update` are handled by the main plugin callbacks only.

## 5. Before Push

Run:

```bash
npm run lint
npm run build
```

If PHP CLI is installed:

```bash
php -l "Wordpress Plugin/seo-auto-fix.php"
php -l "Wordpress Plugin/includes/class-seo-autofix-content.php"
```
