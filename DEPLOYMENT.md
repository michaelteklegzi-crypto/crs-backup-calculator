# Deployment Guide for CRS Backup Calculator

This application is built with **React (Vite)** and uses **Supabase** for the backend. It can be easily deployed to static hosting platforms like Vercel or Netlify.

## 1. Prerequisites

Before deploying, ensure you have:
1.  **Supabase Project:** Your Supabase project should be set up with the correct database schema.
    - Run the contents of `setup_database.sql` and `update_schema_banks.sql` in your Supabase SQL Editor.
2.  **Supabase Credentials:** You will need your project URL and Anon Key.
3.  **GitHub Account:** Recommended for continuous deployment.

## 2. Deploying to Vercel (Recommended)

Vercel is the creators of Next.js and offers excellent support for Vite apps.

### Option A: Automatic Deployment (via GitHub)
1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com).
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your GitHub repository.
5.  Vercel will detect `Vite`. The default build settings are usually correct:
    - **Framework Preset:** `Vite`
    - **Build Command:** `npm run build`
    - **Output Directory:** `dist`
6.  **Environment Variables:**
    - Expand the "Environment Variables" section.
    - Add the following keys (copy values from your Supabase project settings):
      - `VITE_SUPABASE_URL`: Your Supabase Project URL
      - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon/Public Key
7.  Click **"Deploy"**.

### Option B: Command Line Deployment
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in your project root.
3.  Follow the prompts.

## 3. Deploying to Netlify

### Option A: Automatic Deployment (via GitHub)
1.  Push your code to GitHub.
2.  Log in to [Netlify](https://netlify.com).
3.  Click **"Add new site"** -> **"Import an existing project"**.
4.  Connect to GitHub and select your repository.
5.  **Build Settings:**
    - **Build command:** `npm run build`
    - **Publish directory:** `dist`
6.  **Environment Variables:**
    - Click on "Show advanced" or go to **Site settings > Build & deploy > Environment**.
    - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7.  Click **"Deploy site"**.

### Option B: Manual Upload
1.  Run `npm run build` locally.
2.  Drag and drop the created `dist` folder into the Netlify dashboard "Drag and drop your site folder here" area.
    - *Note:* This method doesn't support easy updates via git push.

## 4. Post-Deployment Verification

1.  **Visit your new URL.**
2.  **Test Functionality:**
    - Try creating a lead (Residential flow).
    - Ensure the calculation works.
    - Check if "Banks & Rates" in Admin Panel loads correctly (verifies database connection).
3.  **Supabase URL Configuration (Auth):**
    - Taking your new domain (e.g., `https://your-project.vercel.app`), go to your **Supabase Dashboard**.
    - Go to **Authentication > URL Configuration**.
    - Add your new domain to the **Site URL** or **Redirect URLs** to ensure authentication redirects work correctly (if you add login in the future).

## 5. Troubleshooting

-   **White Screen / 404 on Refresh:** If you implement React Router with multiple pages in the future, you might need a `_redirects` file (for Netlify) or `vercel.json` (for Vercel) to redirect all requests to `index.html`.
    - *Current app is single-page, so this shouldn't be a major issue yet.*
-   **Database Connection Errors:** Double-check your Environment Variables in the hosting dashboard. They must match exactly (no extra spaces).
