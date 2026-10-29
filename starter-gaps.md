# Starter gaps

Places where the starter got in the way while building the recipes app on DummyJSON. Most severe
first. Each entry: symptom, where, workaround, suggested fix.

## 1. No way to look at a signed-in page in the dev server without typing real credentials

- **Symptom:** every recipes page is under `_authed`. To see one in `bun run dev` you sign in
  against DummyJSON. An agent cannot type the demo password into a browser, so the only visual
  check was a throwaway Playwright spec that uses the `signedIn` fixture and takes a screenshot.
- **Where:** `src/routes/_authed.tsx`, `e2e/fixtures.ts` (the only code that can sign in), no
  dev-mode mocks.
- **Workaround:** a temporary `e2e/zz-shot.spec.ts` with `test.use({ signedIn: true })` and
  `page.screenshot`, deleted before the commit.
- **Fix:** a `bun run screenshot <path>` script (or a Playwright project) that reuses the
  `signedIn` fixture, or an opt-in dev mode that starts MSW with the test handlers.

## 2. The shadcn Select trigger reads "Pasta▼"

- **Symptom:** a test of the selected tag failed: the trigger's text was `Pasta▼`. The generated
  `SelectTrigger` passes the chevron as `render={<ChevronDownIcon />}`; Base UI's `Select.Icon`
  then renders its default `▼` child inside the svg.
- **Where:** `src/components/ui/select.tsx` as `bun run ui:add select` writes it.
- **Workaround:** the chevron is a child of `Select.Icon`, not its `render`.
- **Fix:** ship the patched `select.tsx`, or a check after `ui:add` (a test like
  `contrast.test.tsx` that renders each ui component and asserts no stray text).

## 3. The pagination nav is copied, layout-shift rules and all

- **Symptom:** the recipes list needed the products list's 40-line pagination nav. Its
  "disabled, not hidden" and "one text node" choices are what keep e2e's layout-shift check green,
  so a hand-written nav would fail CI in non-obvious ways.
- **Where:** `src/features/products/product-list-page.tsx`.
- **Workaround:** copied into `recipe-list-page.tsx` with `/recipes` links.
- **Fix:** a `components/pagination.tsx` that takes `page`, `pageCount` and a link render
  function, so typed `Link` stays at the call site.

## 4. The app shell has no navigation

- **Symptom:** the header holds only the user menu and the theme toggle. Nothing links home or to
  a feature; the home page shows only `APP_NAME`, which is `'Spa'` in `vite.config.ts`.
- **Where:** `src/routes/__root.tsx`, `src/features/home/home-page.tsx`, `vite.config.ts`.
- **Workaround:** a `Main` nav in the header (app name and Recipes), a link on the home page, and
  `APP_NAME` set to `Recipe Book`.
- **Fix:** a nav slot in the header with a link home, and `APP_NAME` read from `package.json` or
  `.env` so a new app renames itself in one place.

## 5. Each search param repeats the same zod wrapper

- **Symptom:** every list param is `z.catch(z._default(schema, fallback), fallback)` with the
  fallback twice, and the sort enum repeats the keys of the sort table.
- **Where:** `src/routes/_authed/products/index.tsx` is the pattern to copy.
- **Workaround:** a local `text(fallback)` helper in the recipes route.
- **Fix:** a `searchParam(schema, fallback)` helper in `lib/` once a second list exists, which
  the starter could show with its own example.

## Worked well

- `renderRoute`, MSW with a 501 for an unhandled request, and the console.error check made test
  failures specific.
- The products list showed the `useDeferredValue` + `cause === 'stay'` pattern; copying it gave a
  list that keeps its rows while the next filter loads, with no layout shift in e2e.
