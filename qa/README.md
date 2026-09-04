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

- [ ] Build (`npm run build` or equivalent) and load `package/` as an unpacked extension.
- [ ] Confirm the extension name/description render (not raw `__MSG_extName__` placeholders).
- [ ] Test on `http://`, `https://`, and a local `file://` page (menu is registered for all three
      via `documentUrlPatterns` — the `file://` case is the exact regression fixed in v1.2.7,
      worth re-checking every release).

## 1. Context menu

- [ ] Right-click directly on an `<img>` → "Image Manipulator" submenu appears.
- [ ] Right-click on an inline `<svg>` → menu appears.
- [ ] Right-click on an element with a CSS `background-image` set via inline `style` → menu appears
      (matcher is a plain `style*="url("` substring check — an element with `background-image` set
      only via an external stylesheet/class, not inline `style`, will NOT match; confirm that's
      expected, not a gap).
- [ ] Right-click on empty space elsewhere on a page that _does_ contain an image somewhere → menu
      still appears (per CHANGELOG v1.2.5: "right-click anywhere on the screen if an image is present").
- [ ] Right-click on a page with **no** image at all → menu item doesn't spuriously act on nothing.
- [ ] Zoom submenu lists 25%–300% in 25% steps (12 items); clicking one applies that scale directly
      (no dialog needs to be open first).
- [ ] Rotate submenu lists 0°–360° in 45° steps (9 items); clicking one applies that rotation directly.
- [ ] "Reverse" toggles horizontal flip directly from the menu (toggle, not one-way — click twice
      returns to original).
- [ ] "View details" opens the dialog (see §3).
- [ ] Reset submenu → "Reset" reverts only the current image's transform.
- [ ] Reset submenu → "Reset All" reverts every image touched on the page, not just the current one.

## 2. Quick actions without the dialog

- [ ] Apply zoom/rotate/reverse from the context menu on an image, then reload the page — confirm
      state does **not** persist (or does, if that's intended — check against current behavior,
      not assumed).
- [ ] Apply zoom/rotate/reverse on an image already inside the open dialog via the context menu
      (right-click the dialog's own enlarged image) — should route to the same image, not desync
      from the in-dialog controls.

## 3. Dialog — open/close

- [ ] Open dialog via context menu → "View details".
- [ ] Close via the `×` close button (top-right / standard layout).
- [ ] Close via the portrait-layout close button (`closeBtnForPortrait`) — narrow the browser
      window / use a narrow viewport to trigger the portrait layout and confirm this second button
      is reachable and works.
- [ ] Close via <kbd>Esc</kbd> (native `<dialog>` behavior).
- [ ] Re-open the dialog for the same image after closing — prior scale/rotate/reverse/border/render
      state is restored, not reset.
- [ ] Open the dialog for image A, close it, open it for image B — no state bleeds from A into B.

## 4. Image info panel

- [ ] URL field matches the image's actual `src`.
- [ ] Alt field matches the image's `alt` attribute (and is sensibly empty, not "undefined", when
      the image has no `alt`).
- [ ] File size renders a real value, not a stuck "loading..." (check both raster image and SVG —
      SVG file-size resolution has its own code path).
  - [ ] On a `file://` page specifically: raster images (JPEG/PNG/GIF/WebP) are expected to always
        show the "読み込めませんでした" / "Failed to load" error here — Chrome's `fetch()` doesn't
        support the `file:` scheme, so the HEAD-request size lookup always rejects. This is a
        platform limitation, not a bug; confirm it fails gracefully (error text), not a stuck
        "loading..." or a thrown error. SVG is unaffected (its size comes from a `Blob`, no `fetch`
        involved) and should still resolve normally on `file://`.
- [ ] File type renders correctly for at least: JPEG, PNG, GIF, WebP, SVG.
- [ ] Natural width / height match the image's real intrinsic pixel size (not the on-page display size).
- [ ] Aspect ratio renders a sane reduced ratio (e.g. 16:9, 4:3) — including for a perfectly square
      image (1:1) and a 0-height/degenerate edge case if one is reachable without crashing.

## 5. Image controller — scale

- [ ] Number input accepts direct typing; applying updates the canvas image size live.
- [ ] "FIT" button scales the image to fit the visible canvas area.
- [ ] "100%" button resets to natural size.
- [ ] Min bound (`min="1"`) — try entering 0 or a negative number; confirm it clamps/rejects
      rather than producing a zero/negative/invalid transform.
- [ ] Extreme values (e.g. 1000%) — image and surrounding scroll area both grow correctly, no
      layout break.
- [ ] Scale via mouse wheel over the canvas — matches the number input's value after the gesture.

## 6. Image controller — rotate

- [ ] Number input accepts direct typing (range `-360` to `360`); applying rotates the image.
- [ ] "RESET" button returns rotation to 0°.
- [ ] Left/right rotate icon buttons step by a fixed increment — confirm the direction of each
      matches its icon/label (a mirrored icon here would be an easy silent bug).
- [ ] Rotate via <kbd>Shift</kbd> + mouse wheel over the canvas — matches the number input's value
      after the gesture, and direction feels correct (wheel-up vs wheel-down).
- [ ] Boundary values -360 and 360 — both apply without visually differing from 0.

## 7. Image controller — reverse / border / render mode

- [ ] "Reverse" checkbox flips the image horizontally; unchecking restores it.
- [ ] "Border" checkbox adds a visible border/frame around the image; unchecking removes it.
- [ ] Render-mode `<select>` — cycle through all four options (`crisp-edges`, `pixelated`, `smooth`,
      `high-quality`) on a small/pixel-art-style image at high zoom, confirm each visibly changes
      the scaling/interpolation.

## 8. Image controller — background

- [ ] Custom color picker (default `#202124`) changes the canvas backdrop to the chosen color.
- [ ] "Bright" preset button applies a light backdrop.
- [ ] "Dark" preset button applies a dark backdrop.
- [ ] Backdrop choice is visually distinguishable against both a transparent-background PNG/SVG and
      an opaque photo, to confirm it's actually useful for checking transparency.

## 9. Canvas interaction

- [ ] Drag (mouse down + move) pans the image within the canvas.
- [ ] Dragging past the edge of the scrollable area doesn't throw or visually glitch (scroll clamps).
- [ ] Window resize while the dialog is open — canvas/scroll recentering behaves sanely, doesn't
      leave the image oddly offset.

## 10. Image list (thumbnail strip)

- [ ] All eligible images on the page appear as thumbnails (grid width: 8 columns per row —
      confirm row-wrap looks correct with page image counts above/below/exactly a multiple of 8).
- [ ] Click a thumbnail → dialog's main view switches to that image, info panel updates to match.
- [ ] Focus a thumbnail, then arrow keys (<kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd>) navigate
      the grid — including wrap/boundary behavior at the first/last item and at row edges.
- [ ] Keyboard nav while holding <kbd>Alt</kbd> or <kbd>Ctrl</kbd> is a no-op (should not also
      trigger browser/OS shortcuts).
- [ ] A lazy-loaded image below the fold — scroll it into view on the host page first, then confirm
      it's picked up in the image list (not silently skipped because it hadn't loaded yet).
- [ ] An SVG entry and a background-image (`style*="url("`) entry both render sensible thumbnails,
      not broken-image icons.
- [ ] Multiple elements resolving to the same `src` collapse into a single list entry (dedup by
      `src` — confirmed intended behavior, not a bug). The "selected image: N / total" counter in
      the dialog reflects this deduped total, not the raw element count on the page.

## 11. Search-in-page ("locate on page" from the dialog)

- [ ] Click the search button while viewing an image whose original element is still present and
      visible on the page → dialog closes, page scrolls if needed, original image blinks/highlights
      3 times and receives focus.
- [ ] Same, but the original element is currently scrolled out of view → page auto-scrolls to it
      (`scrollIntoView`) before the highlight/focus fires.
- [ ] Same, but the current dialog image is a **converted** element (SVG-converted-to-img or a
      background-image "dummy" element) whose original still exists in the DOM → correctly resolves
      back to the real original via the SVG/dummy tracking maps, not to the converted stand-in.
- [ ] Same, but the original element has since been **removed from the DOM** (e.g. by page JS, SPA
      navigation) → shows the "not found" alert (`searched_image_error`) instead of throwing.
- [ ] Click search while the dialog is showing an image that was opened directly (not via "in dialog"
      state) — confirm it's a no-op rather than erroring, per the `isInDialog`/`origin` guard.

## 12. Cross-cutting / edge cases

- [ ] Two browser tabs/windows each with the dialog open on different pages — no shared-state leakage
      (extension is per-tab content-script + a stateless-ish worker relay).
- [ ] Very large image (e.g. >8000px on a side) — file size / dimensions still resolve, no hang.
- [ ] Very small image (e.g. 1×1 tracking pixel) — doesn't crash the aspect-ratio GCD calculation
      or produce `NaN`/`Infinity` anywhere in the info panel.
- [ ] Rapid repeated actions (spam the zoom buttons / mash arrow keys in the image list) — no
      dropped frames, stuck state, or duplicate dialogs.
- [ ] Reload the extension (`chrome://extensions` reload) with a dialog open on a page — no console
      errors on the next interaction (content script should just re-inject cleanly on next page load).

## 13. Localization

- [ ] Switch Chrome's language / `chrome://extensions` locale between English and Japanese (the two
      shipped `_locales`) — every label used above (menu items, controller labels, error/search
      messages) renders translated text, not a raw message key.

## 14. Accessibility

- [ ] Full flow (open dialog → adjust scale/rotate/reverse/border/render/background → close) using
      keyboard only, no mouse.
- [ ] Screen reader (VoiceOver/NVDA) announces the scale/rotate control groups and background group
      via their `aria-labelledby`/`role="group"` wiring, and the background-custom color input via
      its `aria-label`.
- [ ] Focus lands somewhere sensible when the dialog opens, and returns somewhere sensible (ideally
      the triggering element / page position) when it closes.
