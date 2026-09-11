# Express + Vitest backend

A simple TypeScript API using Express, with Vitest unit tests and Supertest route tests. Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

The development API runs at http://localhost:3000 with automatic restarts through `tsx`. Use `PORT=4000 npm run dev` to change the port.

To compile and run the production build:

```sh
npm run build
npm start
```

The build emits JavaScript and source maps into `dist/`, excluding tests. You can also use `PORT=4000 npm start` after building.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/` | Welcome message |
| GET | `/health` | Health status |
| GET | `/users` | List users |
| GET | `/users/:id` | Get a user, or 404 |
| POST | `/users` | Create a user from `{ "name": "Ada" }` |
| DELETE | `/users/:id` | Delete a user, or 404 |

Users are stored in memory and reset when the server restarts. Names must be non-empty strings; invalid input returns 400. Errors use `{ "error": "..." }`.

```sh
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada"}'

npm test
npm run test:watch
npm run typecheck
npm run test:built
npm run test:built:only # Test existing dist/ output without rebuilding
npm run test:all
```

`src/app.ts` constructs the app independently of the listener in `src/server.ts`. Each test gets fresh state. `tests/users.test.ts` tests the store directly; `tests/app.test.ts` verifies HTTP routes, validation, and errors.

Strict TypeScript checking covers both source and tests via `npm run typecheck`; Vitest runs tests separately. Relative imports use `.js` extensions for compatibility with the compiled Node.js ES modules.

`npm run test:built` first compiles the backend, then runs `tests/built/api.test.ts`. These tests launch plain Node.js processes that import `dist/app.js` and make real HTTP requests on temporary local ports. They verify health responses, the user lifecycle, validation, and JSON errors against the emitted JavaScript. Each server is closed after its test. `npm test` and watch mode run source tests only; `npm run test:all` runs both suites.
