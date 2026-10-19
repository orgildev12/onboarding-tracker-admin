# Onboarding Tracker

A SharePoint Framework (SPFx) web part for tracking employee onboarding. The UI includes Home, History, Settings, and employee process pages. Most page data is currently dummy data; the SharePoint list CRUD example is available on the Test page.

## Requirements

- Node.js `>=22.14.0 <23.0.0`
- npm
- Access to a SharePoint development tenant and the onboarding site

## Run locally

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and set your tenant hostname:

   ```env
   SPFX_SERVE_TENANT_DOMAIN=yourtenant.sharepoint.com
   ```

   `.env` is ignored by Git. The local workbench is configured to open at `/sites/onboarding`; update `config/serve.json` if your site uses a different path.

3. Start the development server:

   ```powershell
   npm start
   ```

   Accept the development certificate prompt if asked, then open the SharePoint workbench URL printed by the server. Sign in with an account that can access the site.

## Build

```powershell
npm run build
```

This builds Tailwind styles, runs the configured tests, and packages the SPFx solution. The package is generated at `sharepoint/solution/onboarding-tracker-webpart.sppkg`.

## Project notes

- SPFx `1.23.2`, React `17`, and Heft build tooling.
- Tailwind CSS utilities use the `tw-` prefix; SCSS modules are also supported.
- Iconsax is used for page icons. The navigation bar retains Fluent UI icons.
- UI data is mostly local dummy data; the Test page demonstrates CRUD operations against a SharePoint list.
