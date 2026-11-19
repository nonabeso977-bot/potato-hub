# POTATO HUB

A mobile-first Arabic game storefront prototype. Games remain independent apps/sites; the hub is their catalog, preview launcher, local library and update center.

## Current prototype
- Responsive Arabic RTL storefront with dark and light themes.
- Black, purple and blue visual palette.
- Search and category filters.
- Game detail dialog and separate preview/download links.
- Local library that records a game when its download is started.
- Local update comparison between the saved version and the latest catalog version.
- PWA manifest and service worker shell with network-first refresh for app files.
- Push-event display handler.

## Run it
Serve this folder over HTTPS or localhost. Opening the HTML file directly does not enable service workers or push notifications.

## Connect Supabase
1. Create a Supabase project.
2. Run \`supabase/schema.sql\` in the Supabase SQL Editor.
3. Create a Storage bucket named \`game-assets\`.
4. Add the project URL and public anon/publishable key in \`app.js\`.
5. Add published games to \`public.games\`. The storefront uses demo data until published catalog rows are available.

Only the public anon/publishable key belongs in browser code. Never expose the service_role key.

## Game records
Use a stable \`slug\` for the game ID. Set:
- \`demo_url\`: a hosted browser trial, separate from the hub.
- \`download_url\`: the official APK/release page or independent game download.
- \`version\`: the current release version.
- \`published\`: true when the game is ready to appear in the store.

When a user starts a download, this prototype records the selected version in local storage. The browser cannot verify that an APK was actually installed.

## Notifications: current status
The service worker can display incoming Push events, and the page can request notification permission. Remote notifications are NOT active yet.

To send real notifications while the user is outside the hub, we still need:
- HTTPS and a browser/device that supports Web Push.
- VAPID public/private keys.
- A server-side sender, preferably a secured Supabase Edge Function.
- Saved Push subscriptions tied to signed-in users.
- Server logic that sends only when the updated game exists in that user's library.

Permission alone does not subscribe the device or send notifications. Do not put VAPID private keys or Supabase service-role keys in frontend files.

## Important prototype limits
- Supabase credentials have not been connected.
- Library and favorites are local to this browser/device, not synced between devices.
- Demo and download URLs are placeholders until real links are added.
- Push subscription storage and remote delivery are not implemented.
- Android APK packaging with Capacitor comes after the web/PWA version is stable.
