# Project Memory

## Project

This repository is the foundation for our first project with Codex.

- Repository: https://github.com/mavicair2tw/codex
- Production site: https://i.openai-tw.com
- GitHub Pages fallback URL: https://mavicair2tw.github.io/codex/
- Current page: a simple `index.html` that prints `Hello World!`

## What We Have Done

1. Created a minimal static web page in `index.html`.
2. Deployed it to the GitHub repository `mavicair2tw/codex`.
3. Enabled GitHub Pages from the `main` branch and repository root.
4. Configured the custom domain `i.openai-tw.com` using a `CNAME` file.
5. Confirmed Cloudflare DNS for `i.openai-tw.com` points to `mavicair2tw.github.io`.
6. Verified the site is working at the custom domain.

## DNS Configuration

The domain `openai-tw.com` is managed by Cloudflare.

Authoritative nameservers observed:

- `alan.ns.cloudflare.com`
- `braelyn.ns.cloudflare.com`

Required DNS record:

```text
Type: CNAME
Name: i
Target: mavicair2tw.github.io
Proxy status: DNS only / grey cloud
TTL: Auto
```

## GitHub Pages Configuration

GitHub Pages should use:

```text
Source: Deploy from a branch
Branch: main
Folder: / root
Custom domain: i.openai-tw.com
HTTPS: Enforce HTTPS enabled once GitHub certificate provisioning is complete
```

The repository contains a root `CNAME` file with:

```text
i.openai-tw.com
```

## Useful Verification Commands

```bash
dig i.openai-tw.com CNAME +short
curl -I https://i.openai-tw.com
curl -L https://i.openai-tw.com
```

Expected DNS result:

```text
mavicair2tw.github.io.
```

Expected page content includes:

```text
Hello World!
```

## Related Skills And Tools

- GitHub plugin: used to create files in `mavicair2tw/codex` and inspect repository state.
- GitHub Pages: used for static site hosting.
- Cloudflare DNS: used to point the subdomain `i.openai-tw.com` to GitHub Pages.
- Browser Use plugin: useful for opening and testing local or production pages in the in-app browser.
- `dig`: useful for DNS verification.
- `curl`: useful for HTTP/HTTPS and content verification.

## Operating Notes

- Keep the project simple until the first real feature direction is clear.
- Prefer static HTML/CSS/JS unless the project starts needing a build system.
- When changing the production site, update this memory if the deployment, DNS, URLs, or important workflow changes.
