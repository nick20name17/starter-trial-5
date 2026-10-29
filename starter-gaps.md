# Starter gaps

Places where the starter got in the way while building the recipes app on DummyJSON. Most severe
first. Each entry: symptom, where, workaround, suggested fix. Files under
`src/features/products/` are the starter's; this repo deleted them in the last PR.

## 1. No way to look at a signed-in page in the dev server without typing real credentials

- **Symptom:** every recipes page is under `_authed`. To see one in `bun run dev` you sign in
  against DummyJSON. An agent cannot type the demo password into a browser, so the only visual
  check was a throwaway Playwright spec that uses the `signedIn` fixture and takes a screenshot.
- **Where:** `src/routes/_authed.tsx`, `e2e/fixtures.ts` (the only code that can sign in), no
  dev-mode mocks. The `playwright-cli` skill in `.claude/skills/` drives a browser but has the
  same sign-in problem.
- **Workaround:** a temporary `e2e/zz-shot.spec.ts` with `test.use({ signedIn: true })` and
  `page.screenshot`, deleted before the commit.
- **Fix:** a `bun run screenshot <path>` script (or a Playwright project) that reuses the
  `signedIn` fixture, or an opt-in dev mode that starts MSW with the test handlers.

## 2. Deleting the example feature breaks the starter's own tests

- **Symptom:** CLAUDE.md says to delete `src/features/products/` once a real feature shows the
  same. Ten tests outside it depend on it: `auth.test.tsx` (redirect after sign-in, refresh
  during a save), `render.test.tsx` (preload under the cursor, a test that ends mid-load) and
  `e2e/smoke.spec.ts` (sign-in journey) all open `/products` with `src/test/products.ts`.
  CLAUDE.md also names `product-list-page.tsx` as the pattern to copy. The delete is a port of
  the starter's guards, not a delete.
- **Where:** `src/features/auth/auth.test.tsx`, `src/test/render.test.tsx`,
  `src/test/products.ts`, `e2e/smoke.spec.ts`, `CLAUDE.md`.
- **Workaround:** the products tests that guard starter behavior (search keeps the list and
  focus, next page during a search, long numeric `q`, Save keeps its width, id as one path
  segment, 404) were rewritten for recipes; auth and render tests now open `/recipes/1`; the
  recipe fixtures moved to `src/test/recipes.ts`.
- **Fix:** list in CLAUDE.md which tests to port when the example goes, or have the starter's
  infrastructure tests use their own tiny route under `src/test/` instead of the example.

## 3. The "navigate first, then remove the query" rule cannot be made to fail

- **Symptom:** CLAUDE.md says that removing a deleted item's query before navigating away makes
  the old page fetch it again (a 404), and that a test sees it only with a delayed handler. With
  the order reversed on purpose, neither a Vitest test with a 300 ms list handler nor an e2e
  run against DummyJSON (counting `GET /recipes/2`) saw a second request. The rule is followed,
  but nothing guards it, and a test written for it would pass either way.
- **Where:** `CLAUDE.md` (Structure), no example of a delete in `src/features/products/`.
- **Workaround:** the delete navigates, then removes the query, with a comment; the test checks
  only the confirmation, the DELETE and the list.
- **Fix:** a delete in the example feature with a test that goes red on the wrong order, or
  drop the rule if the current router and Query no longer refetch.

## 4. No form building block: each field is six lines of wiring

- **Symptom:** the recipe form has 12 fields. Each one repeats `Field data-invalid`,
  `FieldLabel htmlFor`, an `id`, `aria-invalid`, `register` and `FieldError errors={[...]}`.
  Missing one of them breaks the error color, the label, or the screen-reader state without a
  failing test. The form is 330 lines, most of it this wiring.
- **Where:** `src/features/products/product-edit-page.tsx` and
  `src/features/auth/sign-in-page.tsx` show the pattern; nothing in `components/` wraps it.
- **Workaround:** written out by hand in `recipe-form.tsx`.
- **Fix:** a `FormField` in `components/` that takes `name`, `label` and the control and does
  the ids, `aria-invalid` and `FieldError`, or the shadcn Form pattern adapted to Base UI.

## 5. No example of a controlled field: Select and Checkbox need hand-wired focus

- **Symptom:** RHF focuses the first invalid field only through the `ref` it gets. A Base UI
  `Select` takes it on the trigger; a Base UI `Checkbox` root is a `span`, so it goes to
  `inputRef`. Finding that took reading Base UI's types. The starter's forms use only
  `register`.
- **Where:** `src/features/products/product-edit-page.tsx` (the only form example).
- **Workaround:** `Controller` with `ref={field.ref}` on `SelectTrigger` and
  `inputRef={field.ref}` on the first `Checkbox`.
- **Fix:** one controlled field in the example form, or the `FormField` above handling it.

## 6. The pagination nav is copied, layout-shift rules and all

- **Symptom:** the recipes list needed the products list's 40-line pagination nav. Its
  "disabled, not hidden" and "one text node" choices are what keep e2e's layout-shift check green,
  so a hand-written nav would fail CI in non-obvious ways.
- **Where:** `src/features/products/product-list-page.tsx`.
- **Workaround:** copied into `recipe-list-page.tsx` with `/recipes` links.
- **Fix:** a `components/pagination.tsx` that takes `page`, `pageCount` and a link render
  function, so typed `Link` stays at the call site.

## 7. The shadcn Select trigger reads "Pasta▼"

- **Symptom:** a test of the selected tag failed: the trigger's text was `Pasta▼`. The generated
  `SelectTrigger` passes the chevron as `render={<ChevronDownIcon />}`; Base UI's `Select.Icon`
  then renders its default `▼` child inside the svg.
- **Where:** `src/components/ui/select.tsx` as `bun run ui:add select` writes it.
- **Workaround:** the chevron is a child of `Select.Icon`, not its `render`.
- **Fix:** ship the patched `select.tsx`, or a check after `ui:add` (a test like
  `contrast.test.tsx` that renders each ui component and asserts no stray text).

## 8. The app shell has no navigation

- **Symptom:** the header holds only the user menu and the theme toggle. Nothing links home or to
  a feature; the home page shows only `APP_NAME`, which is `'Spa'` in `vite.config.ts`.
- **Where:** `src/routes/__root.tsx`, `src/features/home/home-page.tsx`, `vite.config.ts`.
- **Workaround:** a `Main` nav in the header (app name and Recipes), a link on the home page, and
  `APP_NAME` set to `Recipe Book`.
- **Fix:** a nav slot in the header with a link home, and `APP_NAME` read from `package.json` or
  `.env` so a new app renames itself in one place.

## 9. The example shows edit but not create on an API that stores nothing

- **Symptom:** DummyJSON answers `POST /recipes/add` with id 51 but does not store it, so the
  new recipe's page loaded `GET /recipes/51` and got 404. The products example covers only an
  update, where the old record still exists.
- **Where:** `src/features/products/products-queries.ts` (`productUpdateMutationOptions`).
- **Workaround:** the create mutation puts its response in the detail query's cache before the
  page opens it; the 60 s `staleTime` keeps the loader from refetching.
- **Fix:** a sentence in CLAUDE.md or the example next to "Use the response": a created item's
  page reads it from the cache too.

## 10. Each detail query repeats the 404 to notFound mapping

- **Symptom:** the recipe query copies the products query's `try`/`catch` that turns a 404 into
  the router's `notFound()`. Forgetting it shows the error page with "Try again" for a deleted or
  mistyped id.
- **Where:** `src/features/products/products-queries.ts` (`productQueryOptions`).
- **Workaround:** copied into `recipeQueryOptions`.
- **Fix:** a `notFoundOn404(promise)` helper in `lib/api.ts`, or a `queryFn` wrapper, once a
  second feature needs it.

## 11. Each search param repeats the same zod wrapper

- **Symptom:** every list param is `z.catch(z._default(schema, fallback), fallback)` with the
  fallback twice, and the sort enum repeats the keys of the sort table.
- **Where:** `src/routes/_authed/products/index.tsx` is the pattern to copy.
- **Workaround:** a local `text(fallback)` helper in the recipes route.
- **Fix:** a `searchParam(schema, fallback)` helper in `lib/` once a second list exists, which
  the starter could show with its own example.

## 12. An MSW handler cannot spread the request body without a type argument

- **Symptom:** `request.json()` is `any`. The products tests store it in `let changes: unknown`,
  which works until the handler must echo it back (`{ ...body, id: 51 }`): lint forbids `as`, and
  `no-unsafe-assignment` forbids the `any`.
- **Where:** `src/features/products/products.test.tsx`, `oxlint.config.ts`
  (`consistent-type-assertions: never`).
- **Workaround:** `http.post<never, Record<string, unknown>>(...)` types the body.
- **Fix:** use the type argument in the example test, or mention it next to the lint rule.

## 13. Vitest times out in unrelated tests when the machine is busy

- **Symptom:** after adding `ui/alert-dialog.tsx`, `bun run check` failed with seven tests from
  other files (theme toggle, contrast, sign-in) each timing out. Later, with the machine's load
  average at 16 on 8 cores (other processes), all four `vitest run`s failed the same way:
  the first test of a file times out at 5 s, or a `click` gets a 1–200 ms budget. CI passed
  every time.
- **Where:** `vite.config.ts` (`testTimeout: 5000`, set low so a missing handler fails fast),
  Vitest running every file in parallel browser tabs.
- **Workaround:** ran it again; trusted CI.
- **Fix:** a lower `maxWorkers` for local runs, or a `testTimeout` that scales with
  `process.env.CI`, keeping the fast fail in CI where load is known.

## Worked well

- `renderRoute`, MSW with a 501 for an unhandled request, and the console.error check made test
  failures specific.
- The products list showed the `useDeferredValue` + `cause === 'stay'` pattern; copying it gave a
  list that keeps its rows while the next filter loads, with no layout shift in e2e.
- The e2e fixtures (axe, layout shifts, unexpected HTTP errors, `signedIn`) checked every journey
  for free, and `test.use({ expectedHttpErrors })` made the real-API 404 test one line.
- `<Button pending>` kept the Save and Delete buttons' width; no layout-shift failures in CI.
- Auth needed no changes: `_authed`, token refresh and sign-out covered every recipes page.
- `bun run ui:add` added select, textarea, checkbox and alert-dialog without touching
  `button.tsx`.
