# Big B Royale

A responsive storefront and single-page Login/Sign Up experience built with Next.js App Router, TypeScript, and Tailwind CSS 4. The primary palette is Royal Blue `#091A73`, Deep Blue `#06145C`, White `#FFFFFF`, and subtle Gold `#D4A73B` accents.

The customer storefront is at `/shop/`. Login and signup stay at `/` so existing Supabase confirmation and password-recovery callbacks keep working. The store's account link opens the login page; a successful Supabase sign-in redirects to `/shop/` only after a session is returned. The shopping bag is retained across this trip. Failed sign-ins remain on the login page. Signup keeps its email-confirmation step, and recovery links continue to open the new-password form. A "Visit the store" link also allows guest browsing.

## Run

Requires Node.js 22.18 or newer (including the native TypeScript test runner).

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if script execution is restricted.

## Catalogue and WhatsApp enquiries

Open http://localhost:3000/shop/ for the store. Product data is centralized in `src/lib/catalogue.ts`. The eight sample products and WhatsApp business number `+233557356892` were supplied by the owner. Every product is marked as a sample, every current image is visibly identified as an illustrative placeholder, prices are `null` ("Contact for Price"), and stock is not claimed ("Confirm Availability"). The sample descriptions are illustrative copy, not verified specifications. No inventory quantities, discounts, ratings or prices have been invented.

To replace a placeholder, put the actual photo in `public/products/`, update that product's `image` path, and set `imageIsPlaceholder: false`. Set `isSample: false` only after verifying the listing. `priceGhs` accepts a verified amount in Ghana Cedis, or `null` to keep "Contact for Price". Availability remains seller-confirmed until real inventory is connected. The original local SVG placeholder artwork is stored in `public/products/placeholders/`.

Customers can search, filter, sort, select quantities, and add optional customisation requests. The bag saves only product IDs, quantities and preferences in browser local storage; it does not store login credentials or payment details. It supports separate lines for distinct customisations, quantity changes, removal, safe recovery from malformed storage, and a usable session-only fallback when storage is unavailable. The 99-per-line enquiry limit is not a stock quantity.

"Continue on WhatsApp" opens a draft addressed to the supplied number with the selected products, quantities, preferences, and a request to confirm GHS prices, availability, customisation and delivery charges. Customers review and send the draft themselves. The site never sends a message automatically, charges a payment, claims order confirmation, or clears the bag merely because the WhatsApp link was opened. Delivery charges depend on the customer's location and are confirmed by the seller in chat. The number is configured from owner input; its WhatsApp registration has not been independently verified.

## Supabase authentication

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's API settings. These are public client settings; never put a secret or service-role key in a `NEXT_PUBLIC_*` variable. The checked-in `.env.local` is ignored by Git.

The login, signup, email-confirmation redirect, and password-reset flows use Supabase Auth through `@supabase/ssr`. Supabase's browser client manages and refreshes the session in cookies. “Remember me” controls whether those cookies persist for 400 days or until the browser session ends. Because this is a static site, these browser-managed cookies are JavaScript-readable, not `HttpOnly`; they are not server-verified sessions. Passwords exist only in transient React form state and are cleared after submission or changing modes; confirm password is checked locally and never sent to Supabase. Account-existence-sensitive responses are kept generic.

This project uses `output: "export"` to publish a static frontend, so it cannot use Next.js server components, route handlers, or middleware/proxy for session refresh. Session refresh is handled by the Supabase browser client instead. Configure the Supabase Auth site's URL and allowed redirect URLs for your local and production origins. Supabase Auth validates credentials and manages confirmation/reset links; enable row-level security and appropriate policies for any database access. If you need server-verified sessions or server-only secrets, remove static export and deploy with a Next.js server runtime.

## Checks

```sh
npm test
npm run typecheck
npm run build
npx playwright test
```

Browser tests expect the dev server at localhost:3000 and Microsoft Edge installed (change the Playwright browser channel for other environments). They cover both viewports, validation, tabs, password controls, reset dialog, absence of fake authentication/storage, overflow, and automated WCAG AA checks. Production static files are generated in `out/`.

The monogram and illustrations are original SVG assets. Fonts load from Google Fonts with system fallbacks. Browser tests cover the storefront's filters, search, product options, bag persistence, WhatsApp draft contents and automated accessibility, alongside the existing Supabase authentication tests. Tests inspect WhatsApp links without opening them or contacting the seller.
