## Structure

- `src/features/products/` is an example feature on DummyJSON, from route to tests. Delete it once a real feature shows the same.
- Routes own the URL and a loader that fills the Query cache. The UI comes from a feature.
- A component above a route (a layout, a header) is on screen while that route loads. It reads what `beforeLoad` puts in route context, with `useMatch({ from, shouldThrow: false, select })`, not a query the loader awaits: StrictMode remounts it, and Query cancels a fetch its last observer leaves, so the loader gets `CancelledError`.
- After a delete, navigate away first, then remove the deleted item's query: the old page stays on screen while the next one loads and fetches the removed item again, a 404. A test sees it only when the next page's handler is delayed.
- A list whose search changes on the same page keeps showing until the next list loads: its loader returns on `cause === 'stay'`, and the page queries with `useDeferredValue(search)` (`product-list-page.tsx`). Update search as a function of `prev`: a spread of `useSearch()` loses a change that is still loading.
- Search params reach `validateSearch` as the URL's text (`src/app/router.ts`). A number param is `z.coerce.number<number>()`: the type argument keeps links typed.
- Every API response goes through a zod schema; types come from it. Schemas are tolerant readers: only fields the UI reads, as loose as the UI can render. Enums: `z.catch(z.enum([..., 'unknown']), 'unknown')`.
- Code starts in its feature and moves to `components/`, `hooks/` or `lib/` when a second feature needs it. Test handlers and fixtures move to `src/test/` the same way.
- Auth (the session store, the token and refresh hooks on `api`) starts in `lib/`: `api` needs it, and `lib/` must not import features.
- Pages that need a signed-in user live under `src/routes/_authed/`. Its `beforeLoad` sends everyone else to `/sign-in?redirect=…` and puts `user` in route context.

## Code

- Internal refactors update every caller and delete the old code: no compat layers, fallbacks or deprecated aliases.
- URL paths, search param names and localStorage keys outlive a deploy in users' links and storage. A rename keeps the old form working (a redirect, reading the old key) unless the user agrees to break it.
- Deletion test: a helper, wrapper, hook or parameter stays only if deleting it would spread complexity across its callers. Build for today's callers: two similar blocks stay duplicated, the third extracts the shared shape.
- One concept, one word across code, tests, comments, lint messages and docs. Reuse the word the codebase already uses; a new concept gets a word that means nothing else here.
- Comments say why: a non-obvious choice, an outside constraint, what breaks if someone "simplifies" the code. Names and types say what.

## Testing

- e2e covers only what Vitest can't: the build, `index.html` and a few critical journeys against the real API.
- Test critical journeys and complex logic through the public interface, not every edge case. Before writing a feature's tests, name each seam in one line.
- Expected values are literals or worked examples, never recomputed the way the code computes them.
- Delete lower-level tests once a higher-level test covers their behavior.
- `renderRoute` signs in by default; a test of the signed-out app passes `{ signedIn: false }`. e2e signs in only with `test.use({ signedIn: true })`, as DummyJSON's demo user: each sign-in is a request to the real API.
- Base UI toasts: a `priority: 'high'` toast's visible copy is `aria-hidden`; find it with `getByRole('alert').filter({ hasText })`. Other toasts: `getByRole('dialog', { name: title })`.

## Bugs

- Before any hypothesis, get one command that goes red on the user's exact symptom (failing test, Playwright script).
- Write the regression test before the fix and watch it go red. If no seam reproduces the real bug path, say so instead of adding a shallow test.

## Conventions

- `src/components/ui/` starts as shadcn output and is ours to edit: a new look for a component is a variant there, not a `className` at the call site.
- A button that waits for a request is `<Button pending>`, not the shadcn skill's `Spinner` inside a `Button`: its width stays, so the layout-shift check in e2e passes.
- Add shadcn components with `bun run ui:add <name>`: it formats the output, and answers no to the CLI's prompt to overwrite an existing file, which no flag skips and which otherwise waits forever.
- oxlint runs the React and a11y rules; React Doctor runs only its own (`doctor.config.ts`). An exception with a reason: `// oxlint-disable-next-line <rule> -- why`, or `// react-doctor-disable-next-line <rule>` for a React Doctor rule.
- PR bodies follow `.github/PULL_REQUEST_TEMPLATE.md`, also with `gh --body`.
- A convention that tooling can check becomes a lint rule, test or hook. This file holds the rest.
- A change that makes a line here, a lint message or a comment untrue updates it in the same change.
