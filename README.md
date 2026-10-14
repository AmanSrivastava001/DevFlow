> **Build fix update (October 2026):** See [FIXES_AND_REDEPLOY.md](FIXES_AND_REDEPLOY.md) if GitHub Actions reports unused `Activity` import or `activity_logs.OWNER_ID` not-null constraint failures.

# DevFlow — Professional Full-Stack Java Project

**DevFlow** is a responsive project/task management starter application, built using **Java 21 + Spring Boot 3.5 + Spring Security + JPA + React 19 + TypeScript + Vite**. It is a functional, self-hostable portfolio/college project with a clean SaaS-inspired user interface.

> **Scope:** This is a personal workspace task manager (each user's workspace is isolated). It is **not** full Jira/Slack: invitations, shared teams, real-time chat, payments, and AI integrations are **not implemented**. Do not claim these features in your presentation.

## Features implemented

- Sign up / sign in; BCrypt-hashed passwords and 12-hour JWT authentication.
- Separate, user-owned workspaces: only a project's owner can read/change its projects and tasks.
- Projects: create, list, edit, delete; custom accent colors.
- Tasks: create, list, edit, delete; descriptions, status, priority, and deadlines.
- Kanban board: drag a task to another status column to save the new status.
- Dashboard: stats, visual progress ring, upcoming due dates, and recent activity.
- Search and filter by project. Mobile-responsive navigation.
- New users receive **three example projects and nine example tasks** (real records that can be changed/deleted).
- Database persists across local restarts with file-based H2; PostgreSQL production configuration.
- Dockerfile builds frontend and backend into one deployable container; GitHub Actions builds both.

## Requirements

- **Java JDK 21** — https://adoptium.net/temurin/releases/?version=21
- **Apache Maven 3.9+** — https://maven.apache.org/download.cgi
- **Node.js 20.19+ or 22.12+** (Node 22 LTS recommended) — https://nodejs.org/
- **VS Code** — https://code.visualstudio.com/
- Recommended VS Code extensions: *Extension Pack for Java*, *Spring Boot Extension Pack*, *ESLint* (optional)

Check installation in **VS Code > Terminal > New Terminal**:

```powershell
java -version
mvn -version
node -v
npm -v
```

If `mvn` is not recognized on Windows, install Maven and add Maven's `bin` directory to **PATH**; restart VS Code. Ensure `JAVA_HOME` points to your JDK 21 installation.

## Run in VS Code (recommended)

1. **Extract the ZIP** completely (don't try to run commands inside the ZIP).
2. In VS Code choose **File > Open Folder** and select the extracted **DevFlow** root folder.
3. Start the backend in **Terminal 1**:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

   Wait until the console says the application started (usually port `8080`). The initial Maven run downloads dependencies from the internet.
4. Open a **second terminal** (+ button) and run the React frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   The first `npm install` needs internet access.
5. Visit **http://localhost:5173** in your browser and **create an account**. Your starter workspace loads automatically.

**Ports:** React `5173`; Java API `8080`; frontend Vite proxy routes `/api` to Spring Boot. No external database setup is required for local use. Backend stores H2 files under `backend/data/` and retains them after restarts.

### If your second terminal opens in `backend`
Run `cd ..\frontend` on Windows, or `cd ../frontend` on Linux/macOS, instead of `cd frontend`.

### Useful API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register + seed starter workspace |
| POST | `/api/auth/login` | Login / receive JWT |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET/POST | `/api/projects` | Projects |
| PUT/DELETE | `/api/projects/{id}` | Manage project |
| GET/POST | `/api/tasks` | Tasks, optional `?projectId=1` |
| PUT/DELETE | `/api/tasks/{id}` | Manage task |
| PATCH | `/api/tasks/{id}/status` | Kanban move (`{"status":"DONE"}`) |
| GET | `/api/dashboard` | Stats, deadlines, activity |
| GET | `/api/health` | Simple backend health endpoint |

Use `Authorization: Bearer YOUR_TOKEN` on authenticated endpoints.

### Production-like local build (without Docker)

```powershell
cd frontend
npm install
npm run build
```

Then copy **the contents** of `frontend/dist/` into `backend/src/main/resources/static/` (create `static` if needed), and run:

```powershell
cd ..\backend
mvn clean package
java -jar target/devflow-backend-1.0.0.jar
```

Open **http://localhost:8080**. The Dockerfile automates this process.

### Tests

```powershell
cd backend
mvn test
```

The included test checks Spring context startup. Functional regression tests for every endpoint and UI scenario should be added before serious production use.

## Upload code to GitHub

> GitHub is for your **source repository**, not for hosting a running Java server. Push the **extracted project files**, not the ZIP file.

1. Sign in to https://github.com/ and create a new **empty repository** called `devflow` (don't add another README or `.gitignore`).
2. In **VS Code > Terminal**, make sure you're in the **DevFlow root** (the folder that contains `frontend`, `backend` and this `README.md`).
3. Replace `YOUR_USERNAME` and run:

```bash
git init -b main
git add .
git commit -m "Initial commit: DevFlow full-stack application"
git remote add origin https://github.com/YOUR_USERNAME/devflow.git
git push -u origin main
```

GitHub may open a browser for authentication. If Git asks for `user.name` and `user.email`, configure them with `git config --global user.name "Your Name"` and `git config --global user.email "your-email@example.com"`. Never upload real DB passwords, JWT secrets, or `.env` files (these paths are gitignored).

For later changes:

```bash
git add .
git commit -m "Improve DevFlow"
git push
```

If you don't want Git commands, install **GitHub Desktop**, choose **File > Add local repository**, select the extracted project, and choose **Publish repository**.

## Deploy FREE with Neon + Render + optional Cloudflare Pages

**NEW:** See [`FREE_DEPLOY_HINGLISH.md`](FREE_DEPLOY_HINGLISH.md) for current, step-by-step free deployment settings and exact commands. For Cloudflare Pages, set build root `frontend`, output `dist`, and `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com`; configure Render `CORS_ORIGINS` to your Pages site. The same Dockerfile also serves the React app directly on Render if you prefer only two providers.

## Deploy live to Render (Docker + PostgreSQL)

**Recommended beginner production setup:** single Render Docker web service that serves the React app and Spring API on one URL + one managed PostgreSQL database. **This may cost money** depending on hosting plan, database availability, and usage; check pricing first.

1. Push your code to GitHub.
2. In https://dashboard.render.com, create a **PostgreSQL database** (or use an existing reachable PostgreSQL host). Copy its host, port, database name, user, and password. The app needs a **JDBC URL** formatted like `jdbc:postgresql://HOST:5432/DATABASE`, **not** `postgres://user:pass@...`.
3. **New > Web Service** > connect GitHub > select the DevFlow repo.
4. Set **Language/Runtime = Docker**, branch `main`, Dockerfile path `./Dockerfile`.
5. Add service **Environment variables**:

   ```text
   SPRING_PROFILES_ACTIVE=prod
   DB_URL=jdbc:postgresql://YOUR_DB_HOST:5432/YOUR_DATABASE
   DB_USERNAME=YOUR_DB_USER
   DB_PASSWORD=YOUR_DB_PASSWORD
   JWT_SECRET=A_RANDOM_SECRET_OF_32_BYTES_OR_MORE
   ```

   Replace every example. The secret must be random; use Render's secret generator or a secure password manager. Do not paste actual secrets into GitHub. The Dockerfile includes `SPRING_PROFILES_ACTIVE=prod` already; setting it explicitly on Render is fine.
6. Deploy. Render's public service URL, e.g. `https://your-devflow.onrender.com`, hosts **both** the dashboard and `/api`. Health check path: `/actuator/health`.

**Important:** In production, use PostgreSQL so data survives container restarts. H2 is local development only. If Render/PostgreSQL credentials are wrong, the backend cannot start. Hosting provider features and prices change; check the current plan.

### Alternative hosting (Railway)

Railway supports building from a Dockerfile. Create a project from your GitHub repository, add PostgreSQL, and configure the **same variables** as above with Railway's generated Postgres connection details converted to a JDBC URL. Expose/assign a public domain and ensure the service routes to the app's `PORT` (default `8080`). Check Railway pricing and resource limits before using it. Documentation: https://docs.railway.com/guides/dockerfiles

### Why not GitHub Pages / a frontend-only site?

GitHub Pages and frontend-only static services cannot execute a Spring Boot backend. To use them, you'd need to host the Java API separately and configure the frontend to call it; this project is purposely set up for simpler *single-site* Docker deployment.

## Security / important limitations

- Uses a **development-only fallback signing secret** in the local application profile; production profile requires `JWT_SECRET`. **Use a new random secret in production.** Changing it invalidates existing logins.
- Access tokens last 12 hours and are kept in `sessionStorage` for this demo; log in again if a token expires.
- All project/task read/write operations are scoped to the authenticated owner.
- Database schema currently uses Hibernate `ddl-auto=update`; migrate to Flyway/Liquibase migrations for large production apps.
- Does not include password reset, verified email, rate limiting, advanced monitoring, or invitation/team role support. Add these before onboarding real users at scale.
- Use HTTPS for deployed sites. Keep database and API credentials secret.

## Folder structure

```
DevFlow/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/devflow/
│       ├── config/        # JWT + Spring Security
│       ├── model/         # JPA user, project, task, activity
│       ├── repo/          # Spring Data repositories
│       └── web/           # REST APIs and validation
├── frontend/
│   ├── src/App.tsx        # UI / views / forms / board
│   ├── src/api.ts        # TypeScript data types + API wrapper
│   └── src/style.css     # Responsive visual design
├── .github/workflows/ci.yml
├── Dockerfile
├── .env.example
└── README.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `mvn` not found | Install Maven, add `bin` to PATH, and restart VS Code. |
| Java compilation error due to old Java | Check `java -version` / `mvn -version` and use JDK 21. |
| `npm` not found | Install Node.js and restart VS Code. |
| Blank page / network errors | Make sure both terminals are running; open `http://localhost:5173` and check F12 > Console. |
| Port `8080` occupied | Stop other Java apps, or set `PORT=8081` and change the Vite proxy target accordingly. |
| Port `5173` occupied | Stop the other Vite server or note Vite's alternate port printed in terminal. |
| Wrong login | Register a new account. The app has **no universal admin/default password**. |
| No tasks | New accounts get sample data, but existing/deleted accounts may have none; use **New project** then **New task**. |
| Frontend build can't find modules | Run `npm install` in `frontend`, not the root. |
| Production deploy cannot connect to database | Double-check JDBC `DB_URL`, username, password, and provider network rules. |

## Suggested extensions

Add actual team invites and permissions; task comments; attachments; WebSocket live updates; push/email notifications; tests for tenant isolation; accessibility audit; refresh tokens / OAuth login; AI assistant with an explicit external API key. These are future ideas, **not included** in the current ZIP.

---

Built as a learning and portfolio project. MIT licensed.
