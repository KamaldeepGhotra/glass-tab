# To-do sync: Todoist, Microsoft To Do and Google Tasks

The to-do widget can show a list from Todoist, Microsoft To Do or Google Tasks
instead of the list kept in Chrome. Users pick the source in **Customize › To-do list**.
Adding, ticking, editing and deleting tasks in the widget updates that app.

- The code is the "to-do sync" section of `extension/newtab.js` (`SYNC`, `connectSync`, `syncRefresh`).
- Sign-in details and the cached tasks live in `chrome.storage.local` (`todoSync`, `todoSyncCache`). They're never put in synced settings.
- Every permission is optional. Chrome asks only when the user connects a service, so installing or updating Glass Tab shows **no new warning**.

| Service | How users connect | Needs from you | Status |
| --- | --- | --- | --- |
| Todoist | Paste the API token from Todoist › Settings › Integrations › Developer | Nothing | Works now |
| Microsoft To Do | Sign in with Microsoft in Chrome's sign-in window | An app registration (free), about 10 minutes | Off until the client ID is added |
| Google Tasks | Sign in with Google in Chrome's sign-in window | A Google Cloud OAuth client, plus Google's verification to go beyond 100 users | Off until the client ID is added |

A service whose client ID is empty in `SYNC_CLIENT_IDS` (top of the sync section in
`newtab.js`) isn't shown to users.

## Extension IDs and redirect URLs

Chrome's sign-in window returns to `https://<extension-id>.chromiumapp.org/<service>`.
Register both the store copy and your unpacked copy:

- Store: `https://fhjfmkjhchflbbgklhabbgomnkadcmlp.chromiumapp.org/microsoft` and `.../google`
- Unpacked: open `chrome://extensions`, copy Glass Tab's ID, and use `https://<that-id>.chromiumapp.org/microsoft` and `.../google`

## Microsoft To Do

1. Sign in at <https://entra.microsoft.com> with a personal Microsoft account. Then go to **Applications › App registrations › New registration**.
2. Fill in the registration:
   - **Name:** Glass Tab
   - **Supported account types:** *Accounts in any organizational directory and personal Microsoft accounts*
   - **Redirect URI:** platform **Single-page application (SPA)**, URI `https://fhjfmkjhchflbbgklhabbgomnkadcmlp.chromiumapp.org/microsoft`. Afterwards, add the unpacked one under **Authentication**.
3. Under **API permissions**, add **Microsoft Graph › Delegated › Tasks.ReadWrite**. `offline_access` is already allowed.
4. Copy the **Application (client) ID** into `SYNC_CLIENT_IDS.microsoft`.

How sign-in works:

- It uses the code flow with PKCE. There's no client secret, which is right for an app that runs on people's computers.
- Microsoft gives single-page apps refresh tokens that last 24 hours. When one runs out, Glass Tab signs in again quietly (`prompt=none`) while the user is still signed in to Microsoft. Only if that fails does the widget ask them to sign in again.
- Optional: **Publisher verification** (Branding & properties) removes the "unverified" label on Microsoft's consent screen. It needs a Microsoft Partner Network ID.

## Google Tasks

1. At <https://console.cloud.google.com>, create a project called "Glass Tab". Then enable the **Google Tasks API** (APIs & Services › Library).
2. Go to **Google Auth Platform › Branding**:
   - App name, support email and logo
   - **Privacy policy:** `https://kamaldeepghotra.github.io/glass-tab/privacy.html`
   - **Home page:** the GitHub repo
3. Under **Audience**, choose **External**. While it's in *Testing*, add yourself and up to 100 testers as test users.
4. Under **Data access**, add the scope `https://www.googleapis.com/auth/tasks`.
5. Under **Clients › Create client**:
   - **Type:** *Web application*
   - **Authorized redirect URIs:** `https://fhjfmkjhchflbbgklhabbgomnkadcmlp.chromiumapp.org/google` and the unpacked one
6. Copy the **Client ID** into `SYNC_CLIENT_IDS.google`.

The Tasks scope is a *sensitive* scope, so going public needs Google's verification:

- **Publish app**, then submit for verification.
- Google asks for a short video showing the sign-in and how the tasks are used.
- It also asks you to prove you own the privacy policy's domain. For GitHub Pages, verify `kamaldeepghotra.github.io` in Google Search Console with the HTML-file method.
- Verification usually takes a few days to a few weeks.
- Until it's verified, people who aren't test users see Google's "unverified app" warning.

How sign-in works:

- Google's sign-in gives an access token that lasts an hour.
- After that, Glass Tab gets a new one quietly (`prompt=none`) while the user is signed in to Google. Only if that fails does the widget ask them to sign in again.

## Testing first, then everyone

`SYNC_TESTING` (next to `SYNC_CLIENT_IDS`) keeps a service out of the store version
while its app is still in testing with Microsoft or Google, since only test users could
sign in. Unpacked copies still show it, so you can test. Set it to `false` once Google
has verified the app (or, for Microsoft, once you're happy it works).

The Google client ID is set: `544432589627-msj23kilqev2gkv59cjf64b6i5gqirpj.apps.googleusercontent.com`
(project "Glass Tab", kamghotradev@gmail.com).

## After adding a client ID

1. Put the ID in `SYNC_CLIENT_IDS`, raise the version in `extension/manifest.json`, and build the zip.
2. In the store's Privacy tab, paste the updated permission lines from `store/LISTING.md`.
3. Submit for review.

## Testing

`sync.mjs` (kept outside the repo) runs all three services against fake servers in a throwaway Chrome profile. It checks:

- Sign-in: PKCE for Microsoft, scopes, quiet renewal, a closed sign-in window
- Paging through long lists
- Add, tick, untick, edit and delete, including on a task that hasn't been saved yet
- Clear done
- Changes made in the app itself showing up
- Switching lists and services
- Running offline, and a revoked token falling back to the local list
- A second tab following along
- Disconnecting, and that no tokens ever reach synced settings
