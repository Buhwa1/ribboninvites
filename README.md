# RibbonInvites

Elegant digital invitations for weddings, introductions and celebrations.
Each guest gets a personal link that opens with their name, replies with a headcount,
receives a QR entry pass, and is checked in at the gate. Couples manage everything
from a private dashboard.

## Pages

| URL | Who it's for |
|---|---|
| `/` | Landing page: live demos, designs, pricing, FAQ |
| `/create` | Builder with a live phone preview (free to design) |
| `/dashboard/<ref>?k=<key>` | The couple's private dashboard |
| `/i/<ref>?g=<guest>` | A guest's personal invitation |
| `/i/<ref>?preview=1` | The couple's preview (replies here are not saved) |
| `/checkin/<ref>?k=<gateKey>` | Gate check-in for ushers |
| `/admin` | Your owner console: see every invitation, activate paid ones |

## Run it on your computer

```bash
npm install
npm run dev          # then open http://localhost:3000
```

Locally, data is saved in `.data/` and the owner key for `/admin` is `owner-dev-key`.

## Go live on Vercel (about 10 minutes)

1. Push this folder to GitHub, then in Vercel choose **Add New → Project** and import it.
   Framework preset: **Other**. Leave the build command empty.
   (Or run `npx vercel --prod` inside this folder.)
2. In the project, open **Storage** and create an **Upstash Redis** database. Connect it to the project.
3. Still in **Storage**, create a **Blob** store and connect it. This stores songs and photos.
4. In **Settings → Environment Variables**, add `OWNER_KEY` with a long secret only you know.
5. Redeploy. Open `https://<your-site>/api/health` and check it shows `"storage":"redis"`.
6. In **Settings → Domains**, add `ribboninvites.com` and copy the DNS records Vercel shows into your registrar.

## Before showing it to clients

Edit `public/js/brand.js`:

- `salesWhatsApp` — your business WhatsApp number, digits only (e.g. `256772123456`)
- `payment.lines` — your real MTN and Airtel Mobile Money numbers
- `email`, `instagram`, `tiktok`

If your domain is not `ribboninvites.com`, also update the `og:image` address in
`public/index.html` and `build/build.py` (these are the WhatsApp link-preview images).

## Pricing

Plans live in `public/js/brand.js` (what customers see) and `lib/plans.js` (the limits the
server enforces). Keep the guest numbers the same in both.

| Plan | Guests | Price |
|---|---|---|
| Intimate | 50 | UGX 200,000 |
| Classic | 100 | UGX 300,000 |
| Grand | 250 | UGX 550,000 |
| Gala | 500 | UGX 850,000 |

## How a sale works

1. A couple designs their invitation free and tests it with up to 5 guests, including themselves.
2. They pay by Mobile Money and tap **I've paid**, which messages you on WhatsApp with their reference.
3. You confirm the payment, open `/admin`, choose their plan and tap **Activate**.
4. They can now add and message their full guest list.

## Editing the invitation designs

The five designs live in `build/themes/<name>/`, with shared pages in `build/invite/`.
After changing them, rebuild the invitation page:

```bash
python3 build/build.py      # writes public/invite.html
```

## Limits

- Uploads: up to 4 MB each. Photos are resized in the browser before upload.
- WhatsApp messages are sent one guest at a time from the dashboard (no paid API needed).
