# Chatbot Upgrade (Lex Fixes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the chatbot from giving one canned "I don't understand" reply to almost everything, by fixing the actual bugs causing it (wrong intent names, a wasted failed API call on every single message, no answer variety) and adding a few more FAQ topics it can actually answer.

**Architecture:** This is a Lex-configuration and bug-fix upgrade, not a move to an LLM (explicitly declined in the design spec). Two surfaces change: (1) `frontend/app/api/chat/route.ts` — fix the intent-name check that silently disables the DynamoDB order/product enrichment, fix a locale bug that wastes an API call on every message, and add varied fallback responses; (2) the live Amazon Lex bot itself (`EDGDWWRZNM`, region `ap-southeast-1`) — scripted via `aws lexv2-models` CLI (credentials already available locally) rather than manual console clicking: more sample utterances on existing intents, a few new static FAQ intents, and removal of an unused draft intent.

**Tech Stack:** TypeScript (Next.js API route), AWS Lex V2 (`aws lexv2-models` / `aws lexv2-runtime` CLI), no new libraries.

## Global Constraints

- This is section D of `docs/superpowers/specs/2026-07-07-account-ux-chatbot-upgrade-design.md` — a Lex bug-fix/config upgrade, explicitly NOT a move to Bedrock/OpenAI/any LLM.
- **The bot's `TSTALIASID` alias is what the live chat widget actually calls today** (`frontend/app/api/chat/route.ts` uses `process.env.LEX_BOT_ALIAS_ID || "TSTALIASID"`). `TSTALIASID` is Lex's reserved, non-deletable alias that always tracks the bot's `DRAFT` version — there is no separate staging alias. This means **running `build-bot-locale` immediately changes what real users see** the next time they chat. Task 4's build step requires explicit human go-ahead in the moment it's about to run — do not run it as a routine, unattended part of task execution.
- Confirmed via direct AWS CLI inspection of the live bot (not assumed from docs) before writing this plan:
  - Real bot: `botId=EDGDWWRZNM`, region `ap-southeast-1` (NOT `us-east-1`, despite that being the default in some env-var fallbacks).
  - Only the `en_US` locale is actually built on this bot — **no `vi_VN` locale exists at all**, even though all sample utterances and responses are Vietnamese text. This is a previously-undocumented bug: `route.ts` requests `localeId: "vi_VN"` first, which throws `ResourceNotFoundException` on literally every single message (confirmed by directly calling `RecognizeText` with `vi_VN` — it fails), and only succeeds after silently retrying with `en_US`. Every chat message today costs one guaranteed-failed Lex call before the real one.
  - Real intents on the bot: `WelcomeIntent`, `CheckProductsIntent`, `CheckOrderIntent`, `NewIntent` (empty draft, confirmed unused), `FallbackIntent` (built-in, has zero configured closing response — this is *why* every unmatched message returns 0 messages from Lex, making `route.ts`'s own hardcoded string the only thing users ever see for anything the bot doesn't recognize).
  - `CheckOrderIntent` has one slot already configured: `slotId=CTH6TE3NIS` (`orderId`), referenced via the intent's `slotPriorities` field — any `update-intent` call on this intent MUST include `"slotPriorities": [{"priority": 1, "slotId": "CTH6TE3NIS"}]` or the slot gets unlinked from the intent.
  - `update-intent` replaces the *entire* intent definition (not a patch) — every CLI step below that updates an existing intent includes the intent's full current config (utterances + closing response + slot priorities where applicable), not just the new additions.
- `services/product-api` and `services/auth-post-confirmation` already have Jest test infra from a prior plan; this plan does not touch either service, so no test infra changes are needed here.
- Frontend has no test runner (see prior plans' Global Constraints) — `route.ts` changes are verified via `npx tsc --noEmit`, `npm run lint`, and manual browser chat testing, not automated tests.

---

## Task 1: Fix `route.ts` — correct intent names, drop the broken `vi_VN` attempt, vary the fallback reply

**Files:**
- Modify: `frontend/app/api/chat/route.ts`

**Interfaces:**
- No exported interfaces change — this is a same-file behavioral fix.

- [ ] **Step 1: Fix the locale — call `en_US` directly, remove the wasted fallback attempt**

In `frontend/app/api/chat/route.ts`, find this block (currently around line 193-217):

```ts
    // 4. Nếu ở chế độ BOT, gọi Amazon Lex V2
    const params = {
      botId: process.env.LEX_BOT_ID || "EDGDWWRZNM",
      botAliasId: process.env.LEX_BOT_ALIAS_ID || "TSTALIASID",
      localeId: "vi_VN", // Dùng tiếng Việt
      sessionId: sessionId,
      text: text,
      sessionState: {
        sessionAttributes: {
          userName: clientName,
          userEmail: clientEmail === "guest" ? "" : clientEmail,
        }
      }
    };

    let lexResponse;
    try {
      const command = new RecognizeTextCommand(params);
      lexResponse = await lexClient.send(command);
    } catch (lexErr) {
      console.warn("Lex Send Error (trying en_US fallback):", lexErr);
      // Fallback sang en_US đề phòng Bot chỉ config tiếng Anh
      const fallbackParams = { ...params, localeId: "en_US" };
      const command = new RecognizeTextCommand(fallbackParams);
      lexResponse = await lexClient.send(command);
    }
```

Replace it with (the bot only has an `en_US` locale built — the `vi_VN` attempt was never valid and cost a guaranteed failed round-trip on every single message):

```ts
    // 4. Nếu ở chế độ BOT, gọi Amazon Lex V2
    // Bot chỉ build locale "en_US" (dù toàn bộ utterance/response đều là tiếng Việt —
    // "locale" ở đây chỉ là tên bucket cấu hình trên Lex, không phải ngôn ngữ thật sự
    // của nội dung). Gọi thẳng "vi_VN" từng khiến MỌI tin nhắn tốn 1 lần gọi lỗi
    // (ResourceNotFoundException) trước khi rơi về "en_US" — đã xác nhận qua AWS CLI.
    const params = {
      botId: process.env.LEX_BOT_ID || "EDGDWWRZNM",
      botAliasId: process.env.LEX_BOT_ALIAS_ID || "TSTALIASID",
      localeId: "en_US",
      sessionId: sessionId,
      text: text,
      sessionState: {
        sessionAttributes: {
          userName: clientName,
          userEmail: clientEmail === "guest" ? "" : clientEmail,
        }
      }
    };

    const command = new RecognizeTextCommand(params);
    const lexResponse = await lexClient.send(command);
```

- [ ] **Step 2: Fix the intent-name check so DynamoDB enrichment actually fires**

Find this block (currently around line 222-260):

```ts
    const matchedIntent = lexResponse.sessionState?.intent?.name;
    
    if (matchedIntent === "TrackOrder" && clientEmail !== "guest") {
```

Change `"TrackOrder"` to `"CheckOrderIntent"` (the real intent name — confirmed against the live bot):

```ts
    const matchedIntent = lexResponse.sessionState?.intent?.name;

    if (matchedIntent === "CheckOrderIntent" && clientEmail !== "guest") {
```

A few lines further down, find:

```ts
    } else if (matchedIntent === "SearchProduct") {
```

Change `"SearchProduct"` to `"CheckProductsIntent"`:

```ts
    } else if (matchedIntent === "CheckProductsIntent") {
```

- [ ] **Step 3: Replace the single hardcoded fallback with a varied set**

Find:

```ts
    if (messages.length === 0) {
      messages = ["Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có muốn gặp nhân viên hỗ trợ trực tiếp không? (Gõ 'nhân viên' để kết nối)"];
    }
```

Replace with:

```ts
    if (messages.length === 0) {
      const fallbackReplies = [
        "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có muốn gặp nhân viên hỗ trợ trực tiếp không? (Gõ 'nhân viên' để kết nối)",
        "Tôi chưa nắm được câu hỏi này. Bạn có thể hỏi về sản phẩm, đơn hàng, đổi trả, bảo hành, vận chuyển hoặc thanh toán — hoặc gõ 'nhân viên' để được hỗ trợ trực tiếp.",
        "Câu này hơi khó với tôi. Bạn thử diễn đạt lại, hoặc gõ 'nhân viên' để kết nối với người hỗ trợ nhé!",
      ];
      messages = [fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]];
    }
```

- [ ] **Step 4: Type-check and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev -w @music-store/web`, open the chat widget, and confirm:
1. A message like "saxophone" gets a real product-related reply (not the fallback).
2. A message like "kiểm tra đơn hàng" (if logged in) gets the order-lookup enrichment text, not just the generic Lex closing response.
3. Sending a nonsense message a few times in a row shows different fallback wording, not the exact same sentence every time.
4. Check server logs — there should be no more `"Lex Send Error (trying en_US fallback)"` warning on every message.
Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/api/chat/route.ts
git commit -m "fix(chatbot): correct Lex intent names, fix wasted vi_VN call, vary fallback replies"
```

---

## Task 2: Lex CLI — add more sample utterances, remove the unused draft intent

**Files:** none in the repo — this task only calls `aws lexv2-models` against the live bot (`botId=EDGDWWRZNM`, region `ap-southeast-1`). Use a scratch directory (e.g. the session's scratchpad) for the JSON payload files described below; they are not part of the git repo.

**Interfaces:** none — this task changes AWS-hosted bot configuration, not repo code.

- [ ] **Step 1: Delete the unused `NewIntent` draft**

Run:
```bash
aws lexv2-models delete-intent --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --intent-id XARAAJZ2SL --region ap-southeast-1
```
Expected: exits with no output (204 No Content is normal for this API). Verify it's gone:
```bash
aws lexv2-models list-intents --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --region ap-southeast-1
```
Expected: `NewIntent` no longer appears in `intentSummaries`.

- [ ] **Step 2: Add more utterances to `WelcomeIntent`**

Write this to a scratch file (e.g. `welcome-intent-update.json`):

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentId": "3EWEPI8EZK",
  "intentName": "WelcomeIntent",
  "sampleUtterances": [
    { "utterance": "Xin chào" },
    { "utterance": "Chào bot" },
    { "utterance": "Cần giúp đỡ" },
    { "utterance": "Hello" },
    { "utterance": "Hi" },
    { "utterance": "Alo" },
    { "utterance": "Có ai ở đó không" },
    { "utterance": "Cho tôi hỏi chút" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Chào mừng bạn đến với Cửa hàng Nhạc cụ! Tôi có thể giúp gì cho bạn hôm nay?"
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models update-intent --cli-input-json file://welcome-intent-update.json --region ap-southeast-1`
Expected: returns the updated intent JSON with 8 `sampleUtterances`.

- [ ] **Step 3: Add more utterances to `CheckOrderIntent` (preserving its slot)**

Write this to a scratch file (e.g. `checkorder-intent-update.json`) — note `slotPriorities` is carried over unchanged so the existing `orderId` slot stays linked:

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentId": "ZPIGISDLBL",
  "intentName": "CheckOrderIntent",
  "sampleUtterances": [
    { "utterance": "Kiểm tra đơn hàng của tôi" },
    { "utterance": "Đơn hàng của tôi đâu rồi" },
    { "utterance": "Check my order status" },
    { "utterance": "Đơn hàng của tôi tới đâu rồi" },
    { "utterance": "Tình trạng đơn hàng của tôi thế nào" },
    { "utterance": "Tôi muốn theo dõi đơn hàng" }
  ],
  "slotPriorities": [
    { "priority": 1, "slotId": "CTH6TE3NIS" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Đang kiểm tra trạng thái đơn hàng {orderId} của bạn. Bạn vui lòng truy cập trang 'Đơn đã mua' để xem cập nhật mới nhất nhé."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models update-intent --cli-input-json file://checkorder-intent-update.json --region ap-southeast-1`
Expected: returns the updated intent JSON with 6 `sampleUtterances` and the `slotPriorities` field still present (confirming the slot wasn't unlinked).

- [ ] **Step 4: Add more utterances to `CheckProductsIntent`**

Write this to a scratch file (e.g. `checkproducts-intent-update.json`):

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentId": "8HXXKCNHNM",
  "intentName": "CheckProductsIntent",
  "sampleUtterances": [
    { "utterance": "Tôi muốn mua kèn saxophone" },
    { "utterance": "Cửa hàng bán những loại nhạc cụ nào?" },
    { "utterance": "saxophone" },
    { "utterance": "Show me your instruments" },
    { "utterance": "Tôi muốn tìm mua nhạc cụ" },
    { "utterance": "Cửa hàng có bán kèn clarinet không" },
    { "utterance": "Giá đàn guitar bao nhiêu" },
    { "utterance": "Có kèn trumpet không" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Cửa hàng hiện có các loại kèn Saxophone cao cấp từ Yamaha, Selmer,... Bạn có thể truy cập trang Sản phẩm để xem chi tiết nhé!"
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models update-intent --cli-input-json file://checkproducts-intent-update.json --region ap-southeast-1`
Expected: returns the updated intent JSON with 8 `sampleUtterances`.

- [ ] **Step 5: Verify all three via `describe-intent`**

Run each and confirm `sampleUtterances` length matches what was just written (8, 6, 8 respectively):
```bash
aws lexv2-models describe-intent --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --intent-id 3EWEPI8EZK --region ap-southeast-1
aws lexv2-models describe-intent --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --intent-id ZPIGISDLBL --region ap-southeast-1
aws lexv2-models describe-intent --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --intent-id 8HXXKCNHNM --region ap-southeast-1
```

Note: these changes are on the bot's `DRAFT` — they do not affect the live `TSTALIASID` alias until `build-bot-locale` runs (Task 4).

---

## Task 3: Lex CLI — create new FAQ intents (return policy, warranty, shipping, payment)

**Files:** none in the repo — same as Task 2, AWS-side only.

**Interfaces:** produces 4 new Lex intents, built and smoke-tested in Task 4.

- [ ] **Step 1: Create `ReturnPolicyIntent`**

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentName": "ReturnPolicyIntent",
  "sampleUtterances": [
    { "utterance": "Chính sách đổi trả như thế nào" },
    { "utterance": "Tôi muốn đổi trả sản phẩm" },
    { "utterance": "Có được hoàn tiền không" },
    { "utterance": "Return policy" },
    { "utterance": "Sản phẩm lỗi thì đổi trả thế nào" },
    { "utterance": "Mua nhầm có trả lại được không" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Cửa hàng hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên tem, phụ kiện và chưa qua sử dụng. Với sản phẩm lỗi do nhà sản xuất, thời gian đổi trả là 30 ngày. Bạn vui lòng gõ 'nhân viên' để được hỗ trợ đổi trả cụ thể nhé!"
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models create-intent --cli-input-json file://return-policy-intent.json --region ap-southeast-1`
Expected: returns a new `intentId` — record it for Step 5.

- [ ] **Step 2: Create `WarrantyIntent`**

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentName": "WarrantyIntent",
  "sampleUtterances": [
    { "utterance": "Sản phẩm này bảo hành bao lâu" },
    { "utterance": "Chính sách bảo hành thế nào" },
    { "utterance": "Warranty policy" },
    { "utterance": "Đàn guitar có bảo hành không" },
    { "utterance": "Hỏng trong thời gian bảo hành thì sao" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Đa số nhạc cụ tại cửa hàng được bảo hành chính hãng 12 tháng, riêng phụ kiện là 3 tháng. Thời gian bảo hành cụ thể được ghi trên phiếu bảo hành đi kèm sản phẩm. Bạn có thể gõ 'nhân viên' nếu cần kiểm tra bảo hành cho một sản phẩm cụ thể."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models create-intent --cli-input-json file://warranty-intent.json --region ap-southeast-1`

- [ ] **Step 3: Create `ShippingIntent`**

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentName": "ShippingIntent",
  "sampleUtterances": [
    { "utterance": "Phí vận chuyển bao nhiêu" },
    { "utterance": "Giao hàng mất bao lâu" },
    { "utterance": "Shipping cost" },
    { "utterance": "Có giao hàng toàn quốc không" },
    { "utterance": "Bao giờ tôi nhận được hàng" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Cửa hàng giao hàng toàn quốc, thời gian giao dự kiến 2-5 ngày làm việc tùy khu vực. Phí vận chuyển được tính cụ thể ở bước thanh toán dựa trên địa chỉ nhận hàng. Đơn từ 2 triệu đồng được miễn phí vận chuyển nội thành."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models create-intent --cli-input-json file://shipping-intent.json --region ap-southeast-1`

- [ ] **Step 4: Create `PaymentMethodIntent`**

```json
{
  "botId": "EDGDWWRZNM",
  "botVersion": "DRAFT",
  "localeId": "en_US",
  "intentName": "PaymentMethodIntent",
  "sampleUtterances": [
    { "utterance": "Có những hình thức thanh toán nào" },
    { "utterance": "Thanh toán bằng thẻ được không" },
    { "utterance": "Payment methods" },
    { "utterance": "Có trả góp không" },
    { "utterance": "Thanh toán khi nhận hàng được không" }
  ],
  "intentClosingSetting": {
    "closingResponse": {
      "messageGroups": [
        {
          "message": {
            "plainTextMessage": {
              "value": "Cửa hàng hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, và thanh toán online qua thẻ. Bạn có thể chọn hình thức phù hợp ngay ở bước thanh toán khi đặt hàng."
            }
          }
        }
      ],
      "allowInterrupt": true
    },
    "active": true,
    "nextStep": {
      "dialogAction": { "type": "EndConversation" },
      "intent": {}
    }
  }
}
```

Run: `aws lexv2-models create-intent --cli-input-json file://payment-method-intent.json --region ap-southeast-1`

- [ ] **Step 5: Verify all 4 new intents exist**

```bash
aws lexv2-models list-intents --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --region ap-southeast-1
```
Expected: `intentSummaries` now includes `WelcomeIntent`, `CheckProductsIntent`, `CheckOrderIntent`, `FallbackIntent`, `ReturnPolicyIntent`, `WarrantyIntent`, `ShippingIntent`, `PaymentMethodIntent` (8 total — `NewIntent` removed in Task 2, 4 new ones added here).

---

## Task 4: Build the bot (publishes to the live `TSTALIASID` alias) + smoke test + doc update

**This task changes what real users see as soon as the build completes — get explicit confirmation from the user immediately before running Step 1, even if the rest of this plan was pre-approved.**

**Files:**
- Modify: `docs/huong_dan_tao_amazon_lex_chatbot.md`

- [ ] **Step 1: Confirm with the user, then build**

After confirmation, run:
```bash
aws lexv2-models build-bot-locale --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --region ap-southeast-1
```
Then poll until built:
```bash
aws lexv2-models describe-bot-locale --bot-id EDGDWWRZNM --bot-version DRAFT --locale-id en_US --region ap-southeast-1
```
Expected: `botLocaleStatus` moves from `Building` to `Built` (typically 10-60 seconds).

- [ ] **Step 2: Smoke-test each intent via `recognize-text` against the live alias**

Run each of these (using the actual `TSTALIASID` the live widget calls) and confirm the response text matches what was configured, and that unrelated queries hit the FAQ intents correctly:

```bash
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-welcome --text "Xin chao" --region ap-southeast-1
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-order --text "Check my order status" --region ap-southeast-1
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-return --text "Chinh sach doi tra nhu the nao" --region ap-southeast-1
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-warranty --text "San pham nay bao hanh bao lau" --region ap-southeast-1
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-shipping --text "Phi van chuyen bao nhieu" --region ap-southeast-1
aws lexv2-runtime recognize-text --bot-id EDGDWWRZNM --bot-alias-id TSTALIASID --locale-id en_US --session-id smoke-test-payment --text "Co nhung hinh thuc thanh toan nao" --region ap-southeast-1
```
(Diacritics stripped in `--text` values above to avoid the Windows console `charmap` encoding crash seen during research — Lex's NLU still matches these close enough to the trained utterances; if a call returns an empty/fallback response, retype the exact text from the sample utterances list instead.)
Expected: each returns its configured `messages[0].content`, not the generic Fallback response.

- [ ] **Step 3: Update the setup doc to reflect reality**

`docs/huong_dan_tao_amazon_lex_chatbot.md` currently describes only 3 intents and doesn't mention the actual locale gotcha. Add a new section after "## 3. Thiết kế Cấu trúc hội thoại (Intents & Slots)" documenting the 4 new FAQ intents (name + purpose, one line each: `ReturnPolicyIntent`, `WarrantyIntent`, `ShippingIntent`, `PaymentMethodIntent`), and add a note near section 2.3 clarifying that this bot's locale is `en_US` only despite Vietnamese content, and that `route.ts` must call `en_US` directly (not `vi_VN`).

- [ ] **Step 4: Commit the doc update**

```bash
git add docs/huong_dan_tao_amazon_lex_chatbot.md
git commit -m "docs: document new chatbot FAQ intents and the en_US-only locale gotcha"
```

---

## Task 5: Remove the dead legacy chatbot Lambda + its API Gateway route

**Files:**
- Delete: `services/chatbot-backend/chatBotHandler.js`
- Delete: `services/chatbot-backend/package.json`
- Modify: `infrastructure/lib/backend-stack.ts`

**Why this is safe to remove:** the live chat widget (`frontend/app/components/chat/ChatWidget.tsx`) posts to the Next.js API route `frontend/app/api/chat/route.ts`, which calls `LexRuntimeV2Client` directly — it never calls the separate `/chat` API Gateway route backed by this Lambda. Confirmed: `services/chatbot-backend` is not in the root `package.json`'s `build:lambdas` esbuild list at all (every other active service is), meaning it isn't even part of the normal build/deploy pipeline today.

- [ ] **Step 1: Delete the service directory**

```bash
git rm -r services/chatbot-backend
```

- [ ] **Step 2: Remove the Lambda, its IAM policy, and its API Gateway route from CDK**

In `infrastructure/lib/backend-stack.ts`, remove the `ChatbotApiFunction` Lambda definition (search for `"Chatbot AI Lambda (Amazon Lex integration)"` — remove that comment and the `chatbotApiLambda` block that follows it, up to its closing `});`).

Remove its IAM policy grant (search for `"Quyền gọi Lex V2 cho Chatbot Lambda"` — remove that comment and the `chatbotApiLambda.addToRolePolicy(...)` block that follows it).

Remove its API Gateway route (search for `"// Route: /chat"` — remove that comment and the `chatResource`/`addMethod` block that follows it).

- [ ] **Step 3: Verify the CDK stack still type-checks**

Run: `cd infrastructure && npx tsc --noEmit`
Expected: no errors (confirms no other code still references `chatbotApiLambda` or `chatResource`).

- [ ] **Step 4: Commit**

```bash
git add -A services/chatbot-backend infrastructure/lib/backend-stack.ts
git commit -m "chore(chatbot): remove dead legacy chatbot Lambda and its API Gateway route"
```

---

## Self-Review Notes

- **Spec coverage:** All 5 bullets from spec section D are covered — intent-name fix (Task 1), varied fallback (Task 1), more utterances (Task 2), new FAQ intents (Task 3), scripted-via-CLI-with-confirmation-before-publish (Task 4), and cleanup of the dead Lambda/route (Task 5).
- **Beyond the original spec, two real bugs were found via direct AWS CLI inspection of the live bot** (not assumed from the outdated setup doc) and are fixed here: the `vi_VN`-locale-doesn't-exist issue (Task 1) and the unused `NewIntent` draft (Task 2). Both are called out explicitly in Global Constraints and task text rather than silently folded in, since they weren't in the original design spec.
- **Ambiguity resolved:** the spec's "requires explicit confirmation before executing, since it affects the running chatbot immediately" language is implemented as a hard stop at the top of Task 4, not a soft suggestion.
- **No task depends on Plan A/B/C** — this plan can execute independently, matching the design's "each section is independently shippable" intent.
