# NEXORA backend setup

## Supabase
1. Create a new Supabase project dedicated to NEXORA (do not reuse SENTRIX's project).
2. Open SQL Editor and run `supabase/migrations/001_initial_schema.sql`.
3. Configure email confirmation and redirect URLs for the deployed NEXORA domain.
4. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the hosting provider's environment settings.
5. Keep service-role credentials server-side only; never commit secrets.

## Current boundary
The schema defines profiles, clans, memberships, invitations, chat messages, and moderation reports with Row Level Security. Membership changes, invite redemption, and report status changes are intentionally server-only pending trusted Edge Functions. Enable Supabase Realtime for `clan_messages` only after reviewing policies and publication settings.

## Before production
Add username normalization, invite token generation and hashing, anti-spam limits, message moderation, report review workflows, account deletion, and automated RLS tests. Add clear community rules and reporting/contact flows.
