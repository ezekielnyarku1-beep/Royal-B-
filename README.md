# Big B Royale

A responsive storefront and single-page Login/Sign Up experience built with Next.js App Router, TypeScript, and Tailwind CSS 4. The primary palette is Royal Blue `#091A73`, Deep Blue `#06145C`, White `#FFFFFF`, and subtle Gold `#D4A73B` accents.

The main home page at `/` shows the three-photo introduction. The existing `/welcome/` address remains available. Get Started opens `/shop/` for guests, and Sign In opens the existing login/signup screen, now at `/login/`. The shop footer includes a Home link.

Existing Supabase confirmation and password-recovery URLs that return to `/` are forwarded to `/login/` with their query and fragment intact. The catalogue provider waits until that redirect finishes before initialising Supabase, so the login screen can exchange the code and receive password-recovery events. Ordinary home-page links stay on the landing page. The provider's existing email-return settings are unchanged.

For guests, the store's account link opens `/login/`; successful Supabase sign-in redirects to `/shop/` only after a session is returned. Returning signed-in shoppers see their account name/email, a continue-shopping link, and a sign-out button at `/login/`. Sign-out uses Supabase's local scope to end this browser's session, removes the remember-me preference, and retains the shopping bag. Failed sign-ins remain on the login page. Signup keeps its email-confirmation step, and recovery links open the new-password form before returning to the account screen. A "Visit the store" link also allows guest browsing.

## Run

Requires Node.js 22.18 or newer (including the native TypeScript test runner).

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if script execution is restricted.

## Catalogue and WhatsApp enquiries

Open http://localhost:3000/shop/ for the store. Product data is centralized in `src/lib/catalogue.ts`, with the second collection and photo replacements in `src/lib/collection-additions.ts`. The catalogue contains 102 entries. All 103 unique supplied JPEGs are used from `public/products/collection/`: 27 original photos plus 76 unique photos from the second batch of 77 files (one cuff photo was duplicated). The second batch adds 71 individual listings, replaces the bedding, jewellery, watch and photo-necklace images, and adds a second photo to the existing name-plate bracelet listing. Each listing has at most two photos. Prices are per item, not for every item shown together. Engraved names identify example styles; customers can request their own engraving. The business WhatsApp number is `+233557356892`.

Owner-supplied prices in Ghana Cedis: Phone Chargers 150; Customized Bracelets 130; Personalized Necklaces 100; Photo-Customized Necklace 140; Customized Rings 50; Fashion Jewelry 60; both floor mirrors 360; the 20,000 mAh power bank 200; both 10,000 mAh power banks 150. Individual watches show "About GH₵200.00" because the owner said most watches are 200; the selected model's final price remains seller-confirmed. Both two-piece and three-piece watch sets offer "Without customisation" at 350 and "With customisation" at 400. The wood-look gift set and necklace/bracelet gift sets remain unpriced, alongside other home items, curtains, bedding and earbuds. A gift set does not inherit the price of one of its pieces. Only bottles, diaries and pens retain illustrative placeholder listings. Stock is always "Confirm Availability". Materials, charger output, brand authenticity, product compatibility and set contents are not inferred from photo/packaging text. The photo-customised necklace shows a supplied picture-customisation example; customers send their own photo directly in WhatsApp. The Home & living navigation link includes bedding, home items and curtains.

To replace a placeholder, put the actual photo in `public/products/`, update that product's `image` path, and set `imageIsPlaceholder: false`. Set `isSample: false` only after verifying the listing. Add a new style to `styles` to give it its own listing, or use `secondPhoto` for one supporting image; keep each listing to two photos maximum. Styles inherit their category's supplied price and can be updated individually in the structured data. `imageIsReference` and `imageNote` label reference-only images and explain personalisation examples. `priceGhs` accepts an owner-supplied amount in Ghana Cedis, or `null` to keep "Contact for Price". Availability remains seller-confirmed until real inventory is connected. The original local SVG placeholder artwork is stored in `public/products/placeholders/`.

Customers can search, filter, sort, select quantities, choose a gallery photo as a style reference, and add optional customisation requests. The bag saves only product IDs, customisation option IDs, quantities, preferences and an optional catalogue photo path in browser local storage; it does not store login credentials or payment details. Distinct photo references/customisations stay separate. Selected photos survive reload and are shown in the bag and WhatsApp draft. Storage parsing accepts only photo paths and option IDs belonging to that product. Existing saved bags remain compatible. The 99-per-line enquiry limit is not a stock quantity. Additions that exceed that limit are rejected in full with an explanation of the remaining quantity; the app does not silently discard quantities or claim a failed addition succeeded. On short phone screens, the whole cart scrolls with a sticky header so items, controls and checkout remain reachable in landscape.

"Continue on WhatsApp" opens a draft with products, quantities, selected photo references, preferences, customisation price options, listed unit prices and line subtotals. Subtotals use integer-pesewa arithmetic. Mixed bags label the priced subtotal separately and request quotes for unpriced items. If a watch guide price is included, the subtotal is labeled estimated in the bag and draft. Watch-set options persist as validated IDs, stay distinct in the bag and can be changed there; matching selections merge only within the quantity limit. Old saved set enquiries without an option stay unpriced until an option is chosen. No delivery charge or complete total is invented. Customers review and send the draft themselves; they send photos for photo-customisation directly in the chat. The site never sends a message automatically, charges a payment, claims order confirmation, or clears the bag merely because the WhatsApp link was opened. Availability, customisation and location-based delivery charges are confirmed by the seller. The number is configured from owner input; its WhatsApp registration has not been independently verified.

## Mobile shopping layout

Phone layouts use a compact sticky search header and a bottom bar for Shop, Bag, WhatsApp and Account. The bottom Shop link clears search/category filters. Product prices and text are larger, primary controls and quantity buttons have touch areas of at least 44px, and decorative hero artwork is omitted on phones to reach the catalogue sooner. Categories scroll horizontally, product cards use two columns (one below 351px), and the floating chat button is replaced by the bottom WhatsApp link so it does not cover products.

Product details open as a scrollable sheet with a sticky close button and Add to bag action. Short screens scroll the whole bag to keep editing and checkout reachable. The layout accounts for safe areas and retains browser zoom. Mobile browser checks cover 320–430px phones, tablet widths and short landscape screens. These are browser viewport tests, not tests on physical iOS or Android devices.

## Supabase authentication

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's API settings. These are public client settings; never put a secret or service-role key in a `NEXT_PUBLIC_*` variable. The checked-in `.env.local` is ignored by Git.

The login, signup, email-confirmation redirect, and password-reset flows use Supabase Auth through `@supabase/ssr`. Supabase's browser client manages and refreshes the session in cookies. “Remember me” controls whether those cookies persist for 400 days or until the browser session ends. Because this is a static site, these browser-managed cookies are JavaScript-readable, not `HttpOnly`; they are not server-verified sessions. Passwords exist only in transient React form state and are cleared after submission or changing modes; confirm password is checked locally and never sent to the provider. Account-existence-sensitive responses are kept generic.

Signup displays inbox/spam-folder and same-browser confirmation instructions when Supabase requires email confirmation. It redirects to the shop immediately only if Supabase returns a session. Known provider errors now explain email-delivery restrictions, email/request rate limits, password requirements, unconfirmed emails, disabled signup and connection problems. A sanitized support reference identifies the provider code without showing raw backend messages, email addresses, credentials or session tokens. Unknown failures retain a generic message; existing-account responses do not disclose account existence.

For `email_address_not_authorized`, inspect the project's email delivery configuration: Supabase's default sender restricts recipients, so customer-facing confirmation emails require configured delivery. For `over_email_send_rate_limit`, inspect Auth email limits and delivery settings instead of retrying repeatedly. See the official [SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp) and [Auth error codes](https://supabase.com/docs/guides/auth/debugging/error-codes). These server settings must be checked through authorized Supabase administration; the frontend does not change them or bypass email confirmation.

This project uses `output: "export"` to publish a static frontend, so it cannot use Next.js server components, route handlers, or middleware/proxy for session refresh. Session refresh is handled by the Supabase browser client instead. Configure the Supabase Auth site's URL and allowed redirect URLs for your local and production origins. Supabase Auth validates credentials and manages confirmation/reset links; enable row-level security and appropriate policies for any database access. If you need server-verified sessions or server-only secrets, remove static export and deploy with a Next.js server runtime.

## Accounts and store management

`/account/` provides saved products, contact/delivery details and saved order requests with their status history. `/admin/` provides product creation/editing, up to two photos, listed/guide/customisation prices, visibility, availability and optional stock quantities. The interface checks owner access through Supabase; all data permissions are enforced by database policies. Regular account metadata cannot grant owner access.

The database must be activated before these shared features work. See [supabase/README.md](supabase/README.md) for the prepared migrations, catalogue seed and owner grant. Until activation, the original catalogue and WhatsApp checkout continue to work, and account features show an honest unavailable message. After activation, the shared catalogue is authoritative; product edits do not require a site rebuild. Local TypeScript catalogue data is retained as the pre-activation fallback and initial seed.

Saving a request creates a server-priced record and reference. The customer still explicitly sends the WhatsApp draft. An owner can confirm, customise, mark ready, dispatch, deliver or cancel a request using valid transitions; updates appear in the customer's account. Stock is reserved on confirmation, not on a customer enquiry. Delivery details are copied into new requests; editing a profile does not rewrite past requests.

Shop and account layouts use larger text, plain labels and phone navigation. Owner forms use 16px inputs and scrollable sheets with reachable close/save controls. Passwords and payment details are never stored in browser local storage.

## Verification

```sh
npm test
npm run typecheck
npm run build
npx playwright test
```

Browser tests expect the dev server at localhost:3000 and Microsoft Edge installed (change the Playwright browser channel for other environments). They cover both viewports, validation, tabs, password controls, reset dialog, absence of fake authentication/storage, overflow, and automated WCAG AA checks. Production static files are generated in `out/`.

The monogram and illustrations are original SVG assets. Fonts load from Google Fonts with system fallbacks. Browser tests cover the storefront's filters, search, product options, bag persistence, WhatsApp draft contents and automated accessibility, alongside the existing Supabase authentication tests. Regression checks cover landscape cart editing/checkout, full and near-full quantity limits, account restoration on reload, session-cookie removal on sign-out and bag retention. Tests use mocked Supabase responses and inspect WhatsApp links without opening them or contacting the seller.
