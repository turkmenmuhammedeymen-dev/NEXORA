# NEXORA — Back4App deployment

## 1. Dedicated app and client keys
Create a separate Back4App Parse app named NEXORA. Do not reuse any other project app. Put its Application ID and JavaScript Key in the root `back4app-config.js` file. These are browser client keys; never expose the Master Key.

## 2. Account registration without email codes
NEXORA stores username, email and password in Parse User. The registration flow does not send or request an email code. In the Back4App dashboard, keep email verification disabled for this app. Do not disable password/session security.

## 3. Deploy Cloud Code
Deploy repository `cloud/main.js` as the NEXORA app's Cloud Code main file. Confirm functions are available: `nexoraHealth`, `nexoraCreateClan`, `nexoraJoinClan`, `nexoraGetClan`, `nexoraListMyClans`, `nexoraListMembers`, `nexoraSetRanks`, `nexoraManageMember`, `nexoraSendMessage`, `nexoraListMessages`, and `nexoraCreateReport`.

## 4. Data and security
Cloud Code creates and manages `NxClan`, `NxClanMember`, `NxClanMessage`, `NxClanActivity`, and `NxModerationReport`. Keep direct client writes to these classes blocked. Cloud functions validate the logged-in user and membership before privileged writes. Never put the Master Key in browser code or this repository.

## 5. Features in this version
- Sign up with display name, email and password; no email code in the app flow.
- Create a clan with gallery logo, name, short tag, founder display name, founder game ID and in-game name.
- Unique clan invitation ID; joining requires account login and a valid clan ID.
- Clan workspace with member roster grouped under custom rank headings.
- Owner can rename rank labels, change member ranks, grant/remove admin permission and remove members.
- Shared text chat for logged-in clan members. The page refreshes the message list every five seconds while the clan workspace is open.

## 6. Deployment and testing checklist
1. Add real NEXORA App ID and JavaScript Key to root `back4app-config.js`.
2. Deploy `cloud/main.js` to the dedicated NEXORA Back4App app.
3. Confirm email verification is disabled if email codes are not wanted.
4. Confirm Cloud Code deploy succeeded and class-level permissions block direct client writes.
5. Test with two separate accounts: create clan, copy ID, join from the second account, verify member roster and send messages both ways.
6. Test owner rank changes, promote/demote and member removal.

The GitHub Pages site is static hosting; it does not deploy Back4App Cloud Code automatically. Live multi-user features are not operational until steps 1–4 are completed and tested.
