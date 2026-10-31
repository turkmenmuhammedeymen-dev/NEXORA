# NEXORA — Back4App setup

## 1. Create a dedicated Back4App app
Create a new Parse app named NEXORA. Do not reuse the SENTRIX, AETHRION, or TdevKuantum app.

## 2. Configure the browser
In `public/js/back4app-config.js`, replace the placeholders with this NEXORA app's **Application ID** and **JavaScript Key**. These are client keys, not the Master Key.

## 3. Deploy Cloud Code
Deploy `cloud/main.js` as the NEXORA app's Cloud Code main.js. Confirm these functions are available: `nexoraHealth`, `nexoraCreateClan`, `nexoraListPublicClans`, `nexoraJoinClan`, `nexoraListMyClans`, `nexoraSendMessage`, `nexoraListMessages`, and `nexoraCreateReport`.

## 4. Configure Parse security
Enable email verification if desired. Review class-level permissions so browser clients cannot directly write protected classes: `NxClan`, `NxClanMember`, `NxClanMessage`, and `NxModerationReport`. The Cloud Code functions perform the writes with master privileges after checking the session user. Never expose the Master Key.

## 5. Deploy and test
Deploy the repository root to your static host. Verify `/js/back4app-config.js` and `/js/app.js` load. Test signup, login, clan creation, clan discovery, joining, messages, reporting, and logout using separate test accounts.

## Current limitations
The backend foundation is connected in code, but it is not live until you create the Back4App app, add its client keys, deploy Cloud Code, and test the functions. Invite-token generation/redemption, moderation review tools, profile editing, and full chat UI remain follow-up work. Do not promise these features as complete yet.
