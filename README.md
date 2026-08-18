This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# distillery-flat

## Google Sheets backend

This app stores operational data in one Google Spreadsheet, with one tab per
table. The app creates missing tabs and header rows on first use.

Recommended for Netlify: use the included Apps Script backend. This avoids
putting a Google service-account JSON key in Netlify.

Required server environment variables:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=15wy_SErBhoCWvdAVWE6zfs15NWoHAueFy7lvQUOZWqU
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
GOOGLE_APPS_SCRIPT_SECRET=generate-a-long-random-secret

ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=choose-a-strong-password
AUTH_SECRET=generate-a-long-random-secret
```

Keep all Google and auth values server-only; do not expose them as
`NEXT_PUBLIC_*` variables.

### Apps Script backend

1. Open the Google Sheet.
2. Choose Extensions > Apps Script.
3. Paste the contents of `apps-script/Code.gs`.
4. In Apps Script, open Project Settings > Script Properties and add:

```bash
GOOGLE_APPS_SCRIPT_SECRET=the_same_secret_you_put_in_netlify
GOOGLE_SHEETS_SPREADSHEET_ID=15wy_SErBhoCWvdAVWE6zfs15NWoHAueFy7lvQUOZWqU
```

5. Deploy > New deployment > Web app.
6. Set Execute as to "Me".
7. Set Who has access to "Anyone".
8. Copy the `/exec` web app URL into Netlify as `GOOGLE_APPS_SCRIPT_URL`.

The web app requires the shared secret on every POST request, so the public
Apps Script URL alone is not enough to read or mutate the sheet.

### Service account fallback

If you prefer the direct Google Sheets API instead of Apps Script, create a
Google Cloud service account, enable the Google Sheets API, share the
spreadsheet with the service account email as an editor, and set one of these
credential forms:

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"client_email":"...","private_key":"..."}'
```

or:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

For Netlify service-account deploys, base64 encode the JSON and set
`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`.

### Netlify

The checked-in `netlify.toml` uses `npm run build`, publishes `.next`, and pins
Node 22 to match `package.json`.

Set these in Netlify under Project configuration > Environment variables. They
must be available to runtime Functions, because App Router route handlers,
Server Actions, and the scheduled iCal sync need them after build time:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=15wy_SErBhoCWvdAVWE6zfs15NWoHAueFy7lvQUOZWqU
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
GOOGLE_APPS_SCRIPT_SECRET=the_same_secret_you_set_in_apps_script
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=choose-a-strong-password
AUTH_SECRET=generate-a-long-random-secret
ICAL_SYNC_SECRET=generate-another-random-secret
STAFF_ICAL_TOKEN=generate-a-calendar-token
```

`APP_URL` is optional on Netlify. If it is absent, the app uses Netlify's `URL`
runtime variable for scheduled sync calls and generated guest/staff links. Set
`APP_URL=https://your-custom-domain.com` only when you want links to always use
that domain.
