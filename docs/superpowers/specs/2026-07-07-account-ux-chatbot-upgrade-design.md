# Account UX + Chatbot Upgrade — Design

Branch: `feat/quy/account-ux-chatbot`

This spec bundles four independent-but-related improvements requested together: fixing
username display gaps, making "remember me" actually do something plus adding a
device/inactivity re-verification step, replacing URL-text-input avatars/product images
with a real file picker, and upgrading the chatbot's Lex intents so it stops giving one
canned fallback reply.

Each section (A–D) is independently shippable and testable; they share a branch because
they were requested together, not because they're coupled.

## A. Username display fix

**Problem:** Cognito user `name` attribute is sometimes missing, and prior to commit
`1e28688` no DynamoDB `PROFILE` record existed for many users at all. That commit added a
Post-Confirmation Lambda that backfills a `PROFILE` item on signup, plus a manual
`backfill:profiles` script for pre-existing users. Two gaps remain:

1. `services/auth-post-confirmation/index.ts` writes `name: event.request.userAttributes.name || ""`
   — no fallback to email, so a signup without a `name` attribute (e.g. a future
   OAuth/social signup) permanently stores an empty string.
2. The admin `GET /users` handler (`services/product-api/index.ts`, ~line 1134) does a
   raw DynamoDB `Scan` filtered on `SK = "PROFILE"`. Any Cognito user who has no `PROFILE`
   item (backfill never run in that environment) is **entirely missing** from
   `frontend/app/admin/users/page.tsx`, not just blank.

**Design:**

- Add a shared `UserProfile` type to `packages/shared-types` (today the shape
  `{ userId, email, name, phone, address, updatedAt }` is duplicated ad hoc across
  `auth-post-confirmation`, `product-api`, and `scripts/backfill-profiles.ts`). Use it in
  all three places.
- `auth-post-confirmation/index.ts`: fallback `name` to the email's local part
  (`email.split("@")[0]`) when the Cognito `name` attribute is empty/missing, matching
  the fallback already used by the single-user `GET /users/profile` synthesis path.
- Admin `GET /users`: merge Cognito `ListUsers` with the DynamoDB `PROFILE` scan. For any
  Cognito user with no matching `PROFILE` item, synthesize one in the response (name →
  email prefix) instead of omitting the user. This is a runtime fix — no data migration
  or backfill script run is required, and it self-heals as new users sign up.

**Out of scope:** no new "username/handle" field — this is purely about the existing
`name` display never being blank or a missing row.

## B. Remember me + device/inactivity re-verification

**Problem:** The login page's "remember me" checkbox (`frontend/app/(auth)/login/page.tsx:31`)
is pure UI — `rememberMe` state is never read again. Amplify defaults to persisting
tokens in `localStorage` unconditionally (Cognito refresh token: 30 days, per CDK
defaults in `infrastructure/lib/auth-stack.ts`). There is no mechanism to require
re-verification after a long absence or on a new device — a valid refresh token silently
keeps a session alive for the full 30 days.

**Design (app-level gate, not a Cognito custom-auth-challenge):** we don't want to touch
the Cognito `signIn()` flow itself — instead, layer a check on top after a normal
successful sign-in.

1. **Remember-me → real storage behavior.** At sign-in time, based on the checkbox,
   configure Amplify's key-value storage: checked → `localStorage` (current default,
   persists across browser restarts); unchecked → a `sessionStorage`-backed store
   (cleared when the tab/browser closes). Swap the storage adapter via Amplify's
   `cognitoUserPoolsTokenProvider.setKeyValueStorage(...)` before calling `signIn()`.

2. **Device identity.** On first successful login, the frontend generates a random
   `deviceId` (UUID) and persists it in `localStorage` (independent of the
   remember-me storage choice, since we need to recognize the device even for
   session-only logins). It's sent as a header on the new device-check calls below.

3. **New DynamoDB items** (same `PROFILE`-style table, new `SK` prefixes):
   - `PK=USER#<sub>, SK=DEVICE#<deviceId>` — `{ lastSeenAt, createdAt }` for each device
     the user has verified before.
   - `PK=USER#<sub>, SK=OTP` — pending verification code `{ code, expiresAt }` with a
     TTL (10 minutes), one active code per user at a time.

4. **New endpoints** (in `services/product-api`, alongside the existing
   `/users/profile` routes, or a new small route group — implementation detail for the
   plan):
   - `POST /auth/device/check` — called right after Amplify `signIn()` succeeds, before
     the existing redirect logic in `login/page.tsx`. Given `deviceId`, looks up the
     `DEVICE#` item: **trusted** if it exists and `lastSeenAt` is within 30 days (same
     window as the Cognito refresh token, so this roughly coincides with "about to need
     real re-login anyway"). If trusted, updates `lastSeenAt` and returns `{ trusted: true }`.
     Otherwise generates a 6-digit OTP, stores it in the `OTP` item, sends it by email,
     and returns `{ trusted: false }`.
   - `POST /auth/device/verify` — given the entered code, checks it against the stored
     `OTP` item (and expiry); on success, upserts the `DEVICE#<deviceId>` item as trusted
     and deletes the `OTP` item.

5. **OTP email sending is new plumbing, not a reuse of something existing.** Today's OTP
   codes (signup confirmation, forgot-password) are entirely Cognito-internal — no app
   code generates, stores, or sends them, and `services/notification` has no OTP case
   (it only handles order/campaign events). Add a new use case to
   `services/notification` (pattern: `src/application/use-cases/sendOrderConfirmation.usecase.ts`)
   that sends the device-verification code via the existing `sesEmailProvider.ts`.

6. **Frontend gate.** After `POST /auth/device/check` returns `{ trusted: false }`,
   redirect to a new `/verify-device` page (mirrors the existing client-side gating
   pattern in `frontend/app/admin/layout.tsx`) that blocks navigation elsewhere until
   `POST /auth/device/verify` succeeds. Once trusted, proceed with the existing
   Admin/Staff-vs-home redirect logic that's already in `login/page.tsx`.

**Out of scope:** MFA, Cognito device tracking, changing the Cognito auth flow to
`CUSTOM_AUTH`. Threshold (30 days) is a constant, not user-configurable.

## C. Avatar + file-picker image upload

**Problem:** No avatar concept exists at all — the profile page renders an initial
letter as a placeholder. Separately, admin product images
(`frontend/app/admin/products/page.tsx` / `ProductModal.tsx`, `formData.imageUrl`) are a
plain URL text input — admins paste a URL rather than uploading a file. A working
presigned-upload pattern already exists for review images
(`services/product-api/index.ts:487-549`, `POST /products/{id}/ratings/upload-url`,
using `@aws-sdk/s3-presigned-post` against the existing `MusicStoreProductsBucket`).

**Design:**

- Add `avatarUrl` (optional string) to the shared `UserProfile` type from Section A.
- New presigned-upload route `POST /users/profile/avatar-upload-url`, mirroring the
  review-image route: allow-list `jpeg/png/webp`, size limit, S3 key
  `users/{userId}/profile/{uuid}.ext`, returns `{ uploadUrl, fields, publicUrl }`.
- New reusable frontend component (e.g. `ImagePicker`): file `<input>` + image preview +
  "upload to S3 via presigned POST" helper (adapting the existing
  `uploadRatingImages` logic in `ProductDetailClient.tsx`).
- Used in two places:
  1. **Profile page** — replaces the initial-letter placeholder with an actual avatar
     image once `avatarUrl` is set; file picker to change it.
  2. **Admin product modal** (`ProductModal.tsx`) — replaces the plain `imageUrl` text
     input with the same picker. `ProductRecord.imageUrl` keeps its existing shape (a
     plain string URL) — only the input UX changes, no schema change on the product
     side.

**Out of scope:** cropping/resizing UI, multiple avatars, product image galleries.

## D. Chatbot upgrade (Lex-based, not a move to an LLM)

**Problem:** The chatbot is Amazon Lex V2 with only 3 configured intents
(`WelcomeIntent`, `CheckOrderIntent`, `CheckProductsIntent`, plus an unused draft
`NewIntent` and the default `FallbackIntent`, which is unconfigured). The frontend's
fulfillment-enrichment code (`frontend/app/api/chat/route.ts`, ~lines 224 and 254) checks
for intent names `"TrackOrder"` / `"SearchProduct"`, which don't match the real deployed
intent names (`CheckOrderIntent` / `CheckProductsIntent`) — so the DynamoDB order/product
lookup enrichment never fires, and nearly everything falls through to the single
hardcoded fallback sentence at line ~263. That's the main source of the "repetitive
answers" complaint.

**Design:**

1. Fix the intent-name check in `route.ts` to match the real names
   (`CheckOrderIntent`, `CheckProductsIntent`), restoring the DynamoDB-backed
   order/product enrichment.
2. Replace the single hardcoded fallback string with a small set of varied responses,
   chosen at random, so repeated misses don't look identical.
3. Add several new static FAQ intents directly in Lex (return/exchange policy, warranty,
   shipping, payment methods), each with a fuller set of sample utterances and a fixed
   closing response — no new Lambda fulfillment needed for these (same pattern as
   `WelcomeIntent`).
4. Since local AWS CLI credentials for this account are already available, these Lex
   changes will be scripted via `aws lexv2-models` (create/update intents & utterances)
   rather than done by hand in the console. The bot will be built and tested against its
   draft version first; publishing to the `TSTALIASID` alias (which is what's actually
   serving the live widget today — there's no separate staging alias) requires explicit
   confirmation before executing, since it affects the running chatbot immediately.
5. Cleanup: remove the unused `NewIntent` draft, and remove the legacy
   `services/chatbot-backend` Lambda + its API Gateway route
   (`infrastructure/lib/backend-stack.ts` ~lines 153-160, 350-353, 672) — it's a
   dead/duplicate path not called by the current frontend widget (which talks to the
   Next.js `route.ts` API route directly).

**Out of scope:** moving to an LLM/Bedrock-based bot (explicitly declined — this is a
Lex-configuration and bug-fix upgrade, not a rewrite).
