# DevFlow: FREE Deployment Guide (2026) — Hindi / Hinglish

Use the **updated ZIP** (Cloudflare-compatible React API URL). You can use ONE Render Free web service + Neon (simplest), or THREE services: Cloudflare Pages + Render Free + Neon.

## 0) Push ZIP contents to GitHub (NOT the .zip itself)

1. Extract ZIP and open **DevFlow** folder in VS Code.
2. Create an empty repo named `devflow` at https://github.com/new.
3. In VS Code terminal, while in **DevFlow** folder, type:

```bash
git init -b main
git add .
git commit -m "DevFlow: free deployment ready"
git remote add origin https://github.com/YOUR_USERNAME/devflow.git
git push -u origin main
```

If updating an existing repo, use `git add .`, `git commit -m "Enable Cloudflare deployment"`, and `git push` instead.

## 1) Neon database (Free)

- https://console.neon.tech/ > Sign up > **New Project**.
- Name: `devflow-db`; choose Free project and region near your Render deployment.
- **Connect** -> Connection details -> choose **Direct** connection (not pooled, if selectable). You will see something like:

```text
postgresql://neondb_owner:YOUR_PASSWORD@ep-EXAMPLE.REGION.aws.neon.tech/neondb?sslmode=require
```

NEVER paste actual credentials into a public repository/chat. For the Java application, split this into three Render variables:

```text
DB_URL=jdbc:postgresql://ep-EXAMPLE.REGION.aws.neon.tech:5432/neondb?sslmode=require
DB_USERNAME=neondb_owner
DB_PASSWORD=YOUR_PASSWORD
```

Make sure the host and database name match your Neon Connect panel. The `jdbc:` prefix is REQUIRED. Do not include username or password in `DB_URL`.

## 2) Render — Java backend (Free instance)

- https://dashboard.render.com/ > **New** > **Web Service** > Connect GitHub repo `devflow`.
- **Language**: Docker; **Branch**: main; **Root directory**: blank / repository root; **Dockerfile Path**: `./Dockerfile`; **Instance Type/Plan**: **Free** (scroll to instance plan).
- In **Environment**, add the following as separate entries:

```text
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://YOUR_NEON_HOST:5432/YOUR_NEON_DB?sslmode=require
DB_USERNAME=YOUR_NEON_USERNAME
DB_PASSWORD=YOUR_NEON_PASSWORD
JWT_SECRET=YOUR_LONG_RANDOM_PRIVATE_SECRET_AT_LEAST_32_BYTES
```

You can generate a secret locally in VS Code's PowerShell terminal:

```powershell
[byte[]]$bytes = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

For production, prefer a cryptographically secure secret generator/password manager or Render's Generate Value option.

- **Health Check Path**: `/actuator/health` (optional).
- Deploy Web Service. After deployment, Render gives URL e.g. `https://devflow-api.onrender.com`.
- Test `https://YOUR-SERVICE.onrender.com/api/health` and expect a simple JSON success response. Render free services spin down after 15 minutes of idle and can take around a minute to wake. If the service hits free plan resource limits, you may need a more capable paid host. This setup is suitable for a portfolio demo, not business-critical production.

**Simplest deployment stops HERE.** The existing Dockerfile copies the React production build into Spring Boot, so browsing the Render URL directly should open DevFlow! You do not need Cloudflare Pages for the app to work.

## 3) Optional: Cloudflare Pages for React frontend

If you want the frontend on Cloudflare instead of Render:

1. https://dash.cloudflare.com/ > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**. Choose the same GitHub `devflow` repo.
2. Enter:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `React (Vite)` or `None` |
| Root directory (advanced) | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |

3. **Build environment variable**: `VITE_API_BASE_URL` = `https://YOUR-SERVICE.onrender.com` (no `/api` or ending slash; don't put DB credentials here).
4. Click Deploy. You'll get `https://YOUR-PROJECT.pages.dev`.
5. Go back to **Render** > your Web Service > **Environment** > add:

```text
CORS_ORIGINS=https://YOUR-PROJECT.pages.dev
```

Use the exact domain (no `/` at end). Save / deploy changed environment.
6. Open the Cloudflare Pages URL and create an account. If login fails, ensure the Render backend responds to `/api/health`, both URLs are HTTPS, `VITE_API_BASE_URL` is set at Cloudflare BUILD time, and Render `CORS_ORIGINS` matches the Pages domain.
7. If you edit `VITE_API_BASE_URL` later, Cloudflare needs a new deployment to rebuild the frontend.

### Important notes

- Frontend `VITE_` environment variables are PUBLIC in your browser's JavaScript bundle. Never put credentials there. They are injected at BUILD TIME.
- PostgreSQL data persists independent of Render restarts; the bundled local H2 database DOES NOT survive hosted restarts.
- Don't use `postgres://user:pass@host...` as `DB_URL`; this app requires `jdbc:postgresql://host:5432/database?sslmode=require`, username and password separately.
- Don't choose **Static Site** on Render for the backend: it must be a **Web Service**.
- GitHub Pages or Cloudflare Pages cannot run Spring Boot; they only host the React frontend.
- Real-time team chat / multi-user collaboration are not included in this version.
- Neon and Render free tiers have usage/storage limits, and plans can change. Free Render services are not always-on.
- If Render demands a payment method, first check you've selected *Web Service > Free instance* rather than an upgraded tier. Don't enter payment details you don't wish to provide.
- Deployed sample workspace data is initially empty until signup; registering seeds example tasks/projects.

## 4) Troubleshooting

| Error | Cause / Fix |
|---|---|
| Render `Application failed to start` | Check **Logs**; wrong `DB_URL`/credentials, server cold start, or database unreachable |
| Render says out of memory | Free RAM budget is small; use a larger plan or different host; avoid running additional services in the container |
| `No suitable driver` / `JDBC URL must start jdbc:` | `DB_URL` must start `jdbc:postgresql://` |
| React calls `pages.dev/api` instead of Render | `VITE_API_BASE_URL` missing; set Cloudflare build env and redeploy |
| Browser says CORS error | Add exact `https://my-project.pages.dev` to Render `CORS_ORIGINS` and redeploy |
| Login fails with 401 | Check username/password or register; note JWT_SECRET changing invalidates sessions |
| Changes don't appear | Push to main; check Render/Cloudflare deployment status and rebuild |
| Git push fails due to authentication | Use browser Git login / Git Credential Manager; don't put GitHub passwords in Git remote URL |
