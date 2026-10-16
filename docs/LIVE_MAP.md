# Live board map

The map draws recorded industry tiles and links over the existing, embedded board image. It reads `game.buildings`, `game.links` and `game.players`; it never maintains a second board state. Saving, importing, undoing, editing resources and moving to the Rail Era continue to use the existing game logic and save format.

Industry spaces are filled with their owner’s full player color and labeled with a plain industry name. Text switches between black and white for contrast. Levels, stock counts and flipped/sold indicators are shown in the selected tile’s details instead of adding symbols to the map. The small map follows every game render. The full map refreshes when the game renders while it is open. Select a tile or link by tapping it, pressing Enter/Space on its keyboard focus, or using the item list. Details show owner, industry, level, remaining stock and flipped/sold state. Canal links are solid; rail links are dashed. Double rail actions draw both segments.

`BOARD_SLOTS` follows the exact order of `CITY_SLOTS`, using coordinates in the original 1536 × 1536 board image. `BOARD_ROUTES` covers each logical route once and follows its printed corridor. Coordinates affect presentation only. Both farm breweries have their own markers; the Worcester farm brewery does not introduce a new logical link.

The map opens in Current Game mode when a game exists. Canal and Rail examples are temporary display data: they never replace the current game, enter undo history, or write to localStorage. Without a current game the map opens a clearly labeled example. Zoom ranges from 100% of the fitted board to 400%; Fit shows the whole board at the available width and height. Zoomed maps can be scrolled.

## Standalone HTML for review

```sh
python3 scripts/export-review.py /tmp/Brass-Birmingham-AI-v1.0.37-color-tiles-preview.html
```

The exported file includes the full game, map image, styles and Korean/English packs. Its banner links directly to the example map. It omits PWA installation links and does not check for deployed updates or install a service worker, so it needs no neighboring files. Opening it via `file://` depends on browser policy. For a local HTTP preview, serve its folder with `python3 -m http.server`.

The regular application retains its existing save keys. A downloaded HTML file uses the browser's local-file storage behavior; import an exported JSON backup if you want to inspect an existing game there. Do not clear the deployed application's browser data to test the preview.

## Validation

Run the existing localization and compatibility checks plus:

```sh
node tests/live-map.spec.cjs
```

The live-map runner checks every industry space and route, example isolation, selection, fit/zoom, actual recorded build/link actions, undo, actual resource depletion and tile flips, double rail, era cleanup, language/name preservation, phone/tablet layouts and offline reload. Controlled game states provide resource and era scenarios; this is not a full end-to-end playthrough of the physical game.

The app displays actions recorded in this device's game. It does not detect physical pieces or synchronize multiple devices.
