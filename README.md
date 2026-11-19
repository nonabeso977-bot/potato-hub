# POTATO HUB

A mobile-first game storefront prototype. Each game is intended to remain an independent app/site; the hub is its catalog, library and update center.

## Included
- Responsive Arabic RTL storefront with dark and light themes.
- Search and category filters.
- Game detail dialog, preview and download actions (URLs are placeholders until configured).
- Local favorites and a basic local library prototype.
- PWA manifest and service worker shell.
- Push-event handler for future server-sent Web Push notifications.
- Supabase schema for games, update history, user library and push subscriptions.

## Run it
Serve this folder over HTTPS or localhost. Opening the HTML file directly will not enable service workers or push notifications.

## Connect Supabase
1. Create a Supabase project.
2. Run the SQL in supabase/schema.sql in the Supabase SQL Editor.
3. Create a Storage bucket named game-assets for game covers and downloadable builds.
4. Add the project URL and public anon/publishable key in app.js as SUPABASE_URL and SUPABASE_ANON_KEY.
5. Add published games to public.games. The storefront falls back to demo data until the Supabase catalog contains published rows.

Only the public anon/publishable key belongs in browser code. Never expose the service_role key.

## Independent game links
For each game, set demo_url to a hosted browser trial, download_url to the official APK/release page, and version to the current release. The demo and installed game should run independently of the hub.

## Push notifications: status
The service worker can display a push event, and the page can request browser notification permission. Remote notifications are NOT active yet. They require HTTPS, a browser/device that supports Web Push, VAPID keys and a server-side sender (such as a Supabase Edge Function), saved subscriptions after sign-in, and server logic that selects only users whose library contains the updated game.

Never put VAPID private keys or Supabase service-role keys in frontend files. Notification permission alone does not send notifications.

## Next steps
1. Connect Supabase credentials and create the first real catalog row for ORBIT ARCADE.
2. Add the actual ORBIT ARCADE preview URL and release/download URL.
3. Add Supabase Auth and sync the library across devices.
4. Implement a secured Edge Function for per-game push delivery.
5. Add Capacitor after the web/PWA experience is stable.

## Prototype limits
Game cards use sample data until Supabase is configured. Favorites and library are currently stored on this device only. Preview/download buttons need real URLs. Push subscription storage and push delivery backend are not implemented yet.
