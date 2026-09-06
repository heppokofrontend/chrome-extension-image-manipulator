# Manual QA Checklist — Image Manipulator

Built from reading the current source (context menu, dialog, canvas, image list,
search-in-page) — not an exhaustive spec, a walkthrough for exercising every user-facing
path before a release. Load the unpacked `package/` build via `chrome://extensions` →
Developer mode → "Load unpacked" and test against a real page with `<img>`, inline-SVG,
and CSS `background-image` content.

Ready-made fixture pages for most of the checklist below live in this same `qa/`
directory — see `qa/index.html` for the list. Run `npm run qa` to serve them over
`http://localhost:8888/` (covers the `http://` case in §0; `https://` and `file://`
still need a page of your own — `file://` can just be one of these HTML files opened
directly from disk).

## 0. Setup

Fixtures:

- [index.html](index.html) — fixture list / serving notes
- any page here, opened directly from disk — covers `file://`

| Action | Expected | Notes |
| --- | --- | --- |
| Run `npm run build` (or equivalent) and load `package/` as an unpacked extension | Loads successfully |  |
| Check the extension's name/description as shown by Chrome | Shows the real name/description, not an unexpanded placeholder like `__MSG_extName__` |  |
| Exercise the menu on `http://`, `https://`, and local `file://` pages | The menu works on all three schemes | All three are registered via `documentUrlPatterns`. `file://` support has regressed before — re-verify every release |

## 1. Context menu

Fixtures:

- [basic.html](basic.html) — sections 1–3
- [no-image.html](no-image.html) — no-image case

| Action | Expected | Notes |
| --- | --- | --- |
| Right-click an `<img>`, inline `<svg>`, `background-image` element, blank space, and a no-image page in turn | The "Image Manipulator" submenu appears | The menu is registered with `contexts: 'all'`, so appearance never depends on the click target. One check is enough — no need to repeat per element type |
| Right-click an `<img>`, inline `<svg>`, and an inline-style `background-image` element in turn, choosing "View details" each time | The dialog opens on that element (info panel URL matches) | The per-element difference is about *tracking*, not menu appearance. A `background-image` set via an external stylesheet/class is correctly not tracked (the matcher is a plain `style*="url("` substring check) |
| Right-click blank space or a no-image page and choose Zoom/Rotate/Reverse/Reset with nothing tracked | Instead of a silent no-op, a localized "no target image detected" toast fades in/out and disappears on its own. Repeated clicks don't stack toasts | "Reset All" is exempt by design. Toast trigger conditions and add/remove logic are unit-tested (`on-message.test.ts` / `toast.test.ts`) — here just confirm the visual fade and copy |
| Right-click a `background-image` element (section 3, inline `url()`) and choose Zoom or Rotate | Instead of applying the edit, a localized toast appears pointing to "View the details"; the element itself is left untouched | The synthetic `<img>` box built for a background-image target doesn't match the real `background-size`/`position` rendering, so applying the edit in place would look visibly wrong. Blocking logic is unit-tested (`on-message.test.ts`) — here just confirm the toast and copy |
| Right-click the same `background-image` element and choose Reverse | Same toast, no edit applied |  |
| Right-click the same `background-image` element and choose Reset / Reset All | Applies normally, no toast | Reset is exempt — only scale/rotate/reverse are blocked |
| Try each item in the Zoom/Rotate submenus on a regular `<img>` or inline `<svg>` (dialog doesn't need to be open) | Values apply directly | Every step (25%–300% / 0°–360°) is unit-tested (`create-context-menus.test.ts`) — here just an E2E spot check of one item each |
| Choose "Reverse" on a regular `<img>` or inline `<svg>` | Flips the image horizontally, toggling back on a second click |  |
| Choose "View details" | Opens the dialog | Details in §2-1 |
| Reset submenu → "Reset" | Reverts only the current image's transform |  |
| Reset submenu → "Reset All" | Reverts every image touched on the page, not just the current one |  |
| Apply zoom/rotate/reverse to an image via the context menu, then reload the page | State doesn't persist | No `chrome.storage`/persistence path for transform state — it lives only in an in-memory `Map` (`utils/image-data.ts`) that's discarded on reload |
| Right-click the enlarged image inside the open dialog and apply zoom/rotate/reverse | Reflects on the same image, staying in sync with the dialog's own controls |  |

## 2. Dialog

Fixture: [basic.html](basic.html).

### 2-1. open/close

| Action | Expected | Notes |
| --- | --- | --- |
| Open the dialog via context menu → "View details" | Dialog opens |  |
| Close via the top-right `×` close button (standard layout) | Closes |  |
| Close via the portrait-layout close button (`closeBtnForPortrait`) — narrow the window/use a narrow viewport to trigger the portrait layout | This button is reachable and works |  |
| Close with <kbd>Esc</kbd> | Closes | Native `<dialog>` behavior via `closedBy="closerequest"` (set explicitly in `ui.ts`). The keydown listener itself only calls `stopPropagation` and doesn't perform the close — its sole job is stopping the Escape key from propagating to the host page through the closed shadow root |
| Close the dialog for an image, then reopen it for the same image | The previous scale/rotate/reverse/border/render state is restored (not reset) | State is kept per element in `Map<HTMLImageElement, StyleData>` (`utils/image-data.ts`), so re-fetching the same element returns the same values |
| Open the dialog for image A, close it, then open it for image B | A's state doesn't leak into B's initial display | The Map above is keyed by element, so a different element gets its own entry (default if unset) — leakage isn't structurally possible |

### 2-2. Image info panel

Fixtures:

- [basic.html](basic.html) — section 1 (regular `<img>`), section 2 (inline `<svg>`), section 11 (external `.svg` file)
- any page, opened via `file://` — for the raster file-size case below

| Action | Expected | Notes |
| --- | --- | --- |
| Check the URL field | Matches the image's actual `src` |  |
| Check the Alt field | Matches the image's `alt` attribute (an image with no `alt` shows a sensible blank, not the string "undefined") |  |
| Check the file-size display (both raster images and SVG) | Doesn't get stuck on "loading..." — the real value shows up | SVG resolves file size through a separate code path |
| Check a raster image's file size on a `file://` page | Shows a "Failed to load" error state (doesn't get stuck on "loading..."). SVG is unaffected and resolves normally | Chrome's `fetch()` can't reach `file:` URLs — that's the underlying constraint. The error-message fallback itself is unit-tested (`get-file-size.test.ts`); here just confirm the constraint still holds |
| Check the file-type display for a raster `<img>`, an inline `<svg>`, and an external `.svg` file | Each shows the correct type | `get-file-size.ts` only branches on "is this a `data:image/svg+xml` URI" vs. everything else — one raster format plus both SVG cases (inline-converted and file-based) already cover both branches; no format-specific logic exists to justify testing every raster format |
| Check natural width/height | Matches the image's actual pixel dimensions, not its displayed size on the page |  |
| Check the aspect-ratio display (16:9, 4:3, square 1:1, and a 0-height/degenerate case if possible) | Shows a sensible reduced ratio without crashing |  |

### 2-3. Image controller — scale

Fixture: [basic.html](basic.html).

| Action | Expected | Notes |
| --- | --- | --- |
| Type directly into the numeric input and apply | The canvas image size updates live |  |
| Press "FIT" / "100%" | FIT sizes to fit the viewport; 100% goes to native size | Both buttons' wiring is unit-tested (`scale.test.ts`) — here just a visual fit/size check |
| Enter 0 or a negative value | Clamped/rejected — never a zero, negative, or invalid transform | Lower bound is `min="1"` |
| Enter an extreme value (e.g. 1000%) | Image and scroll area scale up correctly without breaking the layout |  |
| Zoom with the mouse wheel over the canvas | Matches the numeric input's value after the gesture |  |

### 2-4. Image controller — rotate

Fixture: [basic.html](basic.html).

| Action | Expected | Notes |
| --- | --- | --- |
| Type directly into the numeric input (range `-360`–`360`) | Image rotates |  |
| Press "RESET" / the left/right rotate icon buttons | RESET returns to 0°. The left/right buttons rotate visibly in the direction their icon shows | The increment/decrement logic and RESET→0 behavior are unit-tested (`rotate.test.ts`) — here just a visual sanity check the mirrored icons can't cover |
| <kbd>Shift</kbd> + mouse wheel over the canvas | Matches the numeric input's value after the gesture, with the correct sense of direction (wheel up/down) |  |
| Apply the boundary values -360 and 360 | Both are visually indistinguishable from 0° |  |

### 2-5. Image controller — reverse / border / render mode

Fixture: [basic.html](basic.html) — section 7 pixel-art image, for render-mode comparison.

| Action | Expected | Notes |
| --- | --- | --- |
| Toggle the "Reverse" checkbox on/off | Image flips horizontally / reverts |  |
| Toggle the "Border" checkbox on/off | Image gains/loses a border |  |
| Cycle the render-mode `<select>` through all four values (`crisp-edges`/`pixelated`/`smooth`/`high-quality`) | The interpolation visibly changes on a small/pixel-art image shown at high magnification |  |

### 2-6. Image controller — background

Fixture: [basic.html](basic.html) — section 6 transparent checkerboard PNG.

| Action | Expected | Notes |
| --- | --- | --- |
| Change the color via the custom color picker (default `#202124`) | Canvas background color changes |  |
| Press the "Bright" preset button | Background becomes light |  |
| Press the "Dark" preset button | Background becomes dark |  |
| Switch backgrounds on a transparent PNG/SVG and an opaque photo | The contrast is actually useful for judging transparency |  |

### 2-7. Canvas interaction

Fixture: [basic.html](basic.html).

| Action | Expected | Notes |
| --- | --- | --- |
| Drag (press + move) with the mouse | Image pans within the canvas |  |
| Drag past the edge of the scrollable area | No error, no visual breakage | Scrolling is clamped |
| Resize the window while the dialog is open | Canvas/scroll re-centering behaves sensibly, image doesn't jump unnaturally |  |

### 2-8. Image list (thumbnail strip)

Fixtures:

- [lazy.html](lazy.html) — lazy-loaded pickup
- [basic.html](basic.html) — SVG/background-image thumbnails, dedup, and enough tracked images to wrap past one row

| Action | Expected | Notes |
| --- | --- | --- |
| Check that every target image on the page shows up as a thumbnail | All shown, row-wrapping to a second row is correct | The grid is a plain `flex-wrap` layout with each item fixed at `100% / IMAGE_LIST_COLS` width (`build-style-element.ts`) — wrapping isn't sensitive to hitting an exact multiple of the column count, so no dedicated boundary-count fixture is needed here |
| Click a thumbnail | The dialog's main view switches to that image; the info panel updates too |  |
| Focus a thumbnail and move with arrow keys / Home / End | Focus visibly moves as expected | Wrap/boundary cases and the Alt/Ctrl no-op are exhaustively unit-tested (`on-image-list-keydown.test.ts`, which only verifies the click target is correct) — here just confirm focus visibly moves |
| Scroll a lazy-loaded image below the fold into view first, then check | Isn't silently skipped before load — shows up in the image list |  |
| Check thumbnails for an SVG entry and an (inline-style) `background-image` entry | Shows a valid thumbnail, not a broken-image icon |  |
| Check a page with multiple elements resolving to the same `src` | Deduplicated to one entry in the list. The dialog's "N / total" counter also reflects the deduplicated total (not the raw DOM element count) | Dedup is by `src` match in `collectImageListEntries` (intended behavior, not a bug). The counter is likewise computed from that same deduplicated list's rendered output (button count) |

### 2-9. Search-in-page ("locate on page" from the dialog)

Fixture: [basic.html](basic.html) — section 2 inline SVG, for the converted-element resolution case.

| Action | Expected | Notes |
| --- | --- | --- |
| With the original element still present and visible on the page, press the search button | Dialog closes, the page scrolls if needed, and the original image flashes/highlights 3 times and receives focus | Off-screen origin, resolving through the SVG/dummy conversion map, the "not found" alert when the original element has been removed from the DOM, and the no-op when not "in dialog" state are all exhaustively unit-tested (`search-in-page.test.ts`) — here just one E2E pass to confirm the flash/scroll/focus are actually visible |

## 3. Cross-cutting / edge cases

Fixtures:

- [basic.html](basic.html) — sections 8–9 tiny/huge images
- [basic.html](basic.html), opened in two tabs — for the shared-state check

| Action | Expected | Notes |
| --- | --- | --- |
| Open the dialog on a different page in each of two tabs/windows | No state leaks between them | The extension is a per-tab content script plus an almost-stateless worker relay |
| Open a very large image (e.g. one side over 8000px) | File size/dimensions resolve without hanging |  |
| Open a very small image (e.g. a 1×1 tracking pixel) | The aspect-ratio GCD calculation doesn't crash and doesn't show `NaN`/`Infinity` in the info panel |  |
| Perform rapid repeated actions (mashing zoom buttons / image-list arrow keys) | No dropped frames, stuck state, or duplicate dialogs |  |
| Reload the extension (`chrome://extensions` reload) while the dialog is open | No console errors on the next action | The content script re-injects cleanly on the next page load |

## 4. Localization

Fixture: none — switch Chrome's own language setting and re-run any page above.

| Action | Expected | Notes |
| --- | --- | --- |
| Switch Chrome's language / `chrome://extensions` locale between English and Japanese and re-run any page above | Every label used above (menu items, controller labels, error/search messages) shows translated text | No raw message keys leak through (`_locales` only has en/ja) |

## 5. Accessibility

Fixture: [basic.html](basic.html).

| Action | Expected | Notes |
| --- | --- | --- |
| Using only the keyboard, open the dialog → operate scale/rotate/reverse/border/render/background → close it, start to finish | The whole flow completes with the keyboard alone |  |
| With a screen reader (VoiceOver/NVDA), check the scale/rotate control groups, the background group, and the background-custom color input | The groups are announced via `aria-labelledby`/`role="group"`, and background-custom is announced via its `aria-label` |  |
| Open and close the dialog | Focus moves to a sensible place on open, and back to a sensible place (ideally the trigger element/original page position) on close |  |
