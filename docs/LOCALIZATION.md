# Localization

The existing game uses Korean industry/card/action identifiers. They are **canonical data**, not untranslated UI: changing them would break rules and old saves. The presentation adapter translates text and accessibility attributes without changing `value`, `name`, IDs, event targets or stored game state.

`index.html` contains the `LANGUAGE_PACKS` registry and shared translator. Keeping packs inline preserves standalone HTML use and avoids network or build dependencies. The home language controls are generated from the registry; adding a reviewed pack makes it selectable. The language preference uses the existing `brass-birmingham-ui-language-v1` key.

## Adding a language

1. Add a registry entry with a locale ID, `label`, `messages`, and `verbatimSlots`. Use the English pack's Korean source keys as the complete catalog. Copy its `verbatimSlots` metadata so player names remain untouched.
2. Translate whole messages and templates, preserving every `{0}`, `{1}`, etc. parameter. Parameters may be reordered. Entries named in `verbatimSlots` contain user text and must not be recursively translated. Use Brass terminology reviewed by a speaker of that language.
3. Keep all canonical game identifiers and storage keys unchanged. Never bind handlers to translated button text.
4. Add the locale to browser audits and check every rendered branch: player setup, merchants, AI hands/refills, human actions, AI actions, overbuilding, markets, shortfalls, scoring, completed logs, help, import/export and updates. Include `aria-label`, `title`, `placeholder`, `alt` and select options.
5. Verify language switching and reloads preserve game state; include names that match a game term, such as `석탄`. `nameHtml()` and `data-i18n-ignore` protect user names in text and options. Translate surrounding labels independently.
6. Recheck phone/tablet widths, localhost and GitHub Pages subdirectories, direct-file gameplay, and offline PWA startup. Bump app/release/service-worker versions together when distributing a UI change.

Exact messages and complete sentence templates take priority. Short phrase substitutions support old composed labels and stored log descriptions. This compatibility layer is not a general machine translator: missing strings must be added to the catalog and exercised in tests. Do not hide untranslated text to make an audit pass.

The reversible DOM adapter remembers original text/attributes, translates new content, and restores Korean without modifying inputs. Native confirmations and toast messages use the same translator. Korean remains the canonical fallback for legacy source messages; unsupported browser languages initially choose English.

## Verified for v1.0.36

- English screens and accessibility text, including every historical release note.
- Korean/English starting-order buttons and real human/AI action recording.
- Card/industry/action IDs, JSON backup/import, game history, and language preference persistence.
- A save generated with the unchanged v1.0.33 code loaded successfully.
- Phone (390 px) and tablet (820 px) layouts.
- Service-worker scope and offline reload under `/brass-table-ai/`.

Era/shortfall and uncommon AI instruction branches use controlled test fixtures; these tests do not simulate an entire physical game. Direct `file://` opening was blocked by this cloud browser policy and was not validated. Live GitHub Pages publication, App Store distribution and additional language packs are separate release work.
