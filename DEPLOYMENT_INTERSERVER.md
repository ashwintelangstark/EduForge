# 🚀 EduForge — InterServer cPanel Build & Hosting Guide

Complete step-by-step documentation for building, packaging, and deploying the **EduForge** application (Frontend & Backend) onto an **InterServer cPanel** hosting environment.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Automated One-Step Build](#-automated-one-step-build)
3. [cPanel Hosting Directory Layout](#-cpanel-hosting-directory-layout)
4. [Step-by-Step Deployment](#-step-by-step-deployment)
   - [Step 1: Deploy Frontend](#step-1-deploy-frontend)
   - [Step 2: Deploy Backend](#step-2-deploy-backend)
   - [Step 3: Setup / Restart Node.js Application](#step-3-setup--restart-nodejs-application)
5. [Key Configurations & Gotchas](#-key-configurations--gotchas)
6. [Troubleshooting](#-troubleshooting)

---

## 🏗 Architecture Overview

```
                          ┌────────────────────────┐
                          │   EduForge End-User    │
                          │   (Browser / Mobile)   │
                          └───────────┬────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       InterServer cPanel Apache Web Server       │
             │           Domain: eduforge.haegl.in              │
             └────────┬────────────────────────────────┬────────┘
                      │                                │
                      ▼ (Static SPA Requests)          ▼ (/api Proxy Requests)
   ┌─────────────────────────────────────┐  ┌────────────────────────────────────┐
   │  Frontend (React 18 + Vite SPA)     │  │  Backend (Node.js Express Server)  │
   │  Path: /home/.../eduforge.haegl.in/ │  │  Path: /home/.../eduforge.haegl.in/api│
   │  • index.html, assets/, KaTeX fonts │  │  • server.js (Bundled standalone)  │
   │  • Direct Supabase Data Failover    │  │  • Express REST endpoints          │
   └──────────────────┬──────────────────┘  └─────────────────┬──────────────────┘
                      │                                       │
                      └───────────────────┬───────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        Supabase PostgreSQL DB         │
                      │    https://bsbbyuaqibehvcbwugif...    │
                      │   (Questions, Papers, Chapters, Auth) │
                      └───────────────────────────────────────┘
```

- **Frontend (`apps/web`)**: Modern React 18 SPA built with Vite, TailwindCSS, and KaTeX math engines. Features an automatic direct failover layer to Supabase so data loads in under 100ms even if cPanel's Node process is waking up.
- **Backend (`apps/server`)**: Standalone Express API bundled with `esbuild` into a single, self-contained `server.js` file requiring no complex remote `node_modules` installations.

---

## ⚡ Automated One-Step Build

To build both production packages simultaneously, run the included packaging script from the project root:

```bash
npm run build:cpanel
# or: node scripts/build-cpanel-change-zips.js
```

### What this script does:
1. Compiles `@eduforge/shared` AST & TypeScript types.
2. Compiles `@eduforge/web` into production assets (`apps/web/dist/`).
3. Bundles `@eduforge/server` into a self-contained `apps/server/dist/server.js` (2.2 MB).
4. Generates two clean deployment zip archives in the root directory:
   - 📦 `frontend_change_build.zip` (~5.1 MB)
   - 📦 `backend_change_build.zip` (~0.49 MB)

---

## 📁 cPanel Hosting Directory Layout

| Package | Local Output Path | Target cPanel Directory | Key Files Included |
| :--- | :--- | :--- | :--- |
| **Frontend** | `frontend_change_build.zip` | `/home/agrikart/eduforge.haegl.in/` | `index.html`, `assets/`, `.htaccess`, icons, fonts |
| **Backend** | `backend_change_build.zip` | `/home/agrikart/eduforge.haegl.in/api/` | `server.js`, `package.json`, `.env` |

---

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Frontend
1. Log in to your **cPanel Dashboard** and open **File Manager**.
2. Navigate to your root web folder:
   ```
   /home/agrikart/eduforge.haegl.in
   ```
3. Click **Upload** in the top navigation bar.
4. Upload `frontend_change_build.zip`.
5. Once the upload finishes with a green 100% bar, return to `/home/agrikart/eduforge.haegl.in`.
6. Right-click `frontend_change_build.zip` $\rightarrow$ select **Extract** $\rightarrow$ extract to `/home/agrikart/eduforge.haegl.in`.
7. Verify that `index.html`, `.htaccess`, and the `assets/` folder have been updated.

---

### Step 2: Deploy Backend
1. In **File Manager**, open the `api` subfolder:
   ```
   /home/agrikart/eduforge.haegl.in/api
   ```
2. Click **Upload** in the top navigation bar.
3. Upload `backend_change_build.zip`.
4. Right-click `backend_change_build.zip` $\rightarrow$ select **Extract** $\rightarrow$ extract into `/home/agrikart/eduforge.haegl.in/api`.
5. Verify that `server.js` (timestamped with the current time), `package.json`, and `.env` are present.

> [!IMPORTANT]
> Do NOT overwrite the `.htaccess` file inside `/api` with a custom file. cPanel's **Setup Node.js App** manages `/api/.htaccess` with internal Passenger socket paths. `backend_change_build.zip` is intentionally configured to preserve cPanel's `.htaccess`.

---

### Step 3: Setup / Restart Node.js Application
1. In cPanel, navigate to **Software** $\rightarrow$ **Setup Node.js App**.
2. If the application is already created, locate the row with:
   - **Application root**: `eduforge.haegl.in/api`
   - **Application URL**: `eduforge.haegl.in/api`
   - **Application startup file**: `server.js`
   - **Node.js version**: Recommended `v18.x`, `v20.x`, or `v22.x`
3. Click the **🔄 Restart** button (or click **Stop** and then **Start**).
4. Check the application status to ensure it shows **Running** in green.

---

## 🔒 Key Configurations & Gotchas

### 1. Single Page Application (SPA) Root `.htaccess`
The root `/home/agrikart/eduforge.haegl.in/.htaccess` ensures React Router client-side routes work on page refreshes while allowing `/api` requests to pass through to Passenger:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Do NOT rewrite backend /api requests (pass through to Passenger / subfolder)
  RewriteRule ^api(/.*)?$ - [L]

  # If requested file or directory exists, serve it directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Fallback to index.html for SPA client routing
  RewriteRule ^ index.html [L]
</IfModule>
```

### 2. Direct Supabase Client Failover
`apps/web/src/services/supabaseDirect.ts` contains the client-side PostgreSQL integration. If the Node.js process is ever cold-starting or restarting, the web app queries Supabase directly without showing any blocking loading spinners.

---

## 🩺 Troubleshooting

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **500 Internal Server Error on `/api`** | `.htaccess` inside `/api` was damaged or Node.js server crashed. | Go to cPanel **Setup Node.js App**, verify startup file is `server.js`, and click **Restart Application**. |
| **Questions showing "..." indefinitely** | Frontend cannot reach Supabase or local browser cache is stale. | Perform a hard refresh (**`Ctrl + F5`** on Windows or **`Cmd + Shift + R`** on Mac). |
| **Page refresh gives 404 on sub-routes (e.g. `/questions`)** | Root `.htaccess` is missing. | Re-extract `frontend_change_build.zip` to ensure the root `.htaccess` is present. |
| **Node.js app won't start in cPanel** | Startup file mismatch in cPanel settings. | Ensure **Application startup file** is set to exactly `server.js`. |

---

*Generated by Antigravity IDE for EduForge — HAEGL Technologies*
