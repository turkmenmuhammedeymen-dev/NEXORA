# NEXORA — Independent CPM Community

NEXORA is an independent community platform for Car Parking Multiplayer players to present clans, gather members, and organize team communication. It is not an in-game integration.

## Current clan platform
- Account registration with display name, email and password; the NEXORA UI does not request an email verification code.
- Clan creation with gallery logo, clan name, short tag, founder name, founder game ID and founder in-game name.
- Unique clan invite ID, entered from the Join Clan screen.
- Full clan workspace with logo/name/tag header, rank-grouped member roster and shared text chat.
- Owner-managed rank labels, member rank assignment, admin promotion/demotion and member removal.
- Server-side Cloud Code checks for logged-in accounts and active clan membership.

## Back4App setup
1. Configure the NEXORA Application ID and JavaScript Key in `back4app-config.js`. These are client keys only; never expose the Master Key.
2. Upload the root `main.js` file to the NEXORA Back4App Cloud Code editor, or deploy the matching `cloud/main.js`.
3. Keep direct client writes to the protected clan classes blocked.
4. If you do not want email verification codes, disable email verification in this dedicated NEXORA Back4App app.
5. Test with two accounts: create a clan, join by invite ID, check the member list and send messages in both directions.

Detailed steps: [BACKEND_SETUP.md](BACKEND_SETUP.md).

## Deployment note
GitHub Pages hosts the static site only. Back4App Cloud Code must be uploaded separately. The project cannot connect to the live Back4App app until real client keys are configured and Cloud Code is deployed.

## Brand
NEXORA is independent and is not affiliated with, sponsored by, or endorsed by the creators or rights holders of Car Parking Multiplayer.
