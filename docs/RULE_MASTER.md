# Rule Master

Rule Master is opened explicitly from the labeled book button in the header. Nothing opens automatically. All next-step guidance is inside the Rule Master dialog. Closing the dialog removes visible guidance; there is no global coaching switch, saved coaching preference or gameplay banner.

The thirteen Korean/English lessons cover the goal, setup, turns, all six action types plus passing, resources, changing eras and scoring. Each lesson has Before/After tabletop scenes showing cards, cardboard tiles, cubes, beer barrels and money. Two original material sheets were generated without references to publisher art: generic tabletop components and six industrial building vignettes. All language labels, object counts, numerical values and placement are rendered locally. Each PNG is embedded once in the HTML and clipped/reused through SVG, so standalone previews and offline lessons need no additional files.

Industry fronts show the owner-colored face, level, illustrated building, construction cost/resources and prospective scoring values. The flipped face uses a predominantly charcoal field with a purple ownership rim, a large VP shield, an income-space amount and the printed link-icon count. These values come from the same industry tables used by the game engine. Selling and scoring enlarge the tile and include readable explanations; production examples show Coal Mine, Iron Works and Brewery values separately. Income increases once when a tile flips; industry VP is counted at era end. The front's muted VP badge is prospective and is explicitly described as requiring a flip. These are original teaching designs rather than scans or exact replicas of published components.

Location cards use an original illustrated map motif, industry cards use building artwork, Wild cards have distinct labels, and card backs have a bordered pattern. Canal pieces include water and a boat; the rail renderer includes sleepers and two rails. City teaching boards have textured terrain and the correct number and types of industry slots. This illustration work does not change the live-map ownership markers or any gameplay logic.

Scout shows three ordinary cards before the exchange, then three discarded cards and exactly two Wild cards. The Build scene shows a location-card Brewery build in Walsall, where a Brewery space is legal. The era-change scene places Level I and II industries in different cities, preserving the Canal Era one-industry-per-player-per-location limit. The example scoring scene uses Cotton Mill I (5 VP) and a canal to Oxford (1+2 link icons = 3 VP). All scenes are independent learning examples and never change the actual game. Lessons are a beginner reference rather than an exhaustive reproduction of every overbuilding exception.

The What to Do Now tab reads the current setup, selected human action, AI turn, card refill, resource migration, income shortfall, round settlement, era scoring/cleanup and final-score states. It never executes an action or writes a save. Related Rules opens the corresponding lesson. Lesson navigation and language switching preserve the game, undo history and completed records.

The official-rules link opens the publisher's public product page at https://roxley.com/products/brass-birmingham in a separate tab with `noopener noreferrer`. No rulebook PDF, publisher artwork or rulebook text is bundled or fetched. The link is labeled Publisher Page and directs the user to its Rules/Downloads section; it is not presented as a verified direct PDF URL. Network access to Roxley was blocked by this environment, so the current destination and downloadable rulebook location could not be checked here. Linking alone does not claim endorsement or certify legal permission for other uses.

No voice input, speech service, paid model, API token or backend is introduced. Lessons and diagrams work offline; opening the external publisher page requires internet access.

## Preview and checks

```sh
python3 scripts/export-review.py /tmp/Brass-Birmingham-AI-v1.0.38-detailed-preview.html --feature rule-master
node --test tests/localization.test.cjs
node tests/rule-master.spec.cjs
```

Serve the app locally and set `BRASS_TEST_URL` when using a different server. The browser runner checks every lesson, context-dependent guidance, absence of guidance from normal play, read-only behavior, Korean/English, literal player names, phone/tablet layout and offline operation. Controlled game states cover uncommon scoring/refill phases; these checks are not a complete physical-game rules audit.
