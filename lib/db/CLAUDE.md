# `lib/db/` — schema, migrations, client

PostgreSQL (Neon) + Drizzle. `lib/db/schema.ts` is a **barrel** over
`lib/db/schema/{enums,users,mentorship,events,engagement,system,relations}.ts` —
37 tables, 32 enums, re-exported in dependency order. Import sites keep using
`@/lib/db/schema`; splitting the file did not change a single import.

`relations.ts` is a **leaf** holding only `usersRelations`, because that one
object names a table from every other module and would otherwise make each
module import all the others. The reason is written in the file — read it before
moving a relation somewhere that reads more naturally.

New form tables follow `mentorFormSubmissions` / `menteeFormSubmissions`.

Migrations: `pnpm db:generate` writes one from the schema diff into
`lib/db/migrations/`, `pnpm db:migrate` applies it (on pnpm 11 use
`npx drizzle-kit migrate` — `pnpm db:migrate` tries to purge `node_modules`).
A boolean → enum column change needs an explicit cast in the generated SQL.

Table-by-table reference: `docs/database/DATABASE_SCHEMA.md`.
