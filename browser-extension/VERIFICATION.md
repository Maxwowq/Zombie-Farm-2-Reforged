# Local prototype verification

- Upstream fixture: unmodified `main` commit `44b598aa28f1a224b76420da3ac956bb8b21dd56`, production build, offline mode.
- Browser: existing Microsoft Edge 156.0.4314.58; actual unpacked MV3 extension loaded with `Extensions.loadUnpacked` into an isolated, temporary profile.
- No additional Chromium installation is needed. The temporary browser download attempted during setup was stopped and its browser directory removed.
- Extension TypeScript check and bundle generation passed.

The browser smoke test verified:

- Injection and translation under a strict `script-src 'self'` page CSP.
- DOM labels, hover attributes, input placeholders, dynamic level updates, short durations and level abbreviations.
- Input values and explicit/implicit option values retain their original English values.
- Known player/zombie name locations and operator announcement bodies remain verbatim.
- A localStorage test canary and the local play-mode preference remain unchanged.
- Canvas and OffscreenCanvas produce identical measured widths and pixel data for translated English labels and the corresponding direct Chinese strings, including fill and stroke.
- The upstream production game has no `window.ZF`; the Market displays 市场 and 胡萝卜, with translated duration/level labels.
- Real farm work reaches the JobSystem's 15px `Plow` progress label, distinct from the 22px cursor hint. The progress bar visibly displays 犁.
- No browser page errors in these checks.

Version 0.1.1 adds a quest regression check covering 1230 distinct strings from
both authored quest catalogs and daily/weekly generation at multiple levels and
periods. Objective markers and live counters are preserved while translating the
inner text, task-title counters, reward labels and reset durations. `Claim` is
overridden to 领取 and `Claimed` to 已领取; the original IPA table retains 索要.
The browser test also opens the real quest log and daily/weekly board in a
generated level-15 offline test farm, verifies Chinese objectives and headings,
clicks 领取 and checks the resulting 已领取 state. Saved quest text remains English.

Version 0.1.2 corrects the Market category `Decors` from 花色 to 装饰. The browser
test opens Items → 装饰, checks the selected shelf and a known decoration (雏菊),
and verifies that the mistaken 花色 tab is absent. Canonical game categories and
the original IPA table remain unchanged.

The distributable manifest excludes localhost. Its JavaScript is the same as the
tested build; `--test-origins` only changes the manifest's URL matching.

Not verified: live online gameplay, every battle state, every panel, all long-text
wrapping, and browser versions other than the installed Edge version. This is an
experimental display adapter, not a guarantee of complete native localization.

No Worker deployment or database migration is required or performed.
