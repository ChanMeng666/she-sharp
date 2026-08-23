-- Drops `email_queue`, created by 0008 and never used by anything.
--
-- Nothing in the codebase references it: it is absent from `lib/db/schema/`,
-- so Drizzle does not know it exists, and no route, service or script reads or
-- writes it. It is also already absent from the production database.
--
-- It is dropped rather than left alone because its `from_email` column defaults
-- to 'noreply@shesharp.org' — missing the `.nz`. That default is unreachable
-- today, but a wrong-domain sender literal sitting in the tree is exactly the
-- kind of thing a future reader revives by accident, and it would fail both the
-- `from-identity` gate and DMARC alignment if it ever reached a real send.
--
-- 0008 itself is left byte-identical. Drizzle records a hash per migration, so
-- editing an applied file makes it look new and re-runs it — which for 0008
-- would *create* this table rather than remove it.
--
-- `IF EXISTS` because the table is already gone in production; this is a no-op
-- there and a cleanup everywhere it was ever built.

DROP TABLE IF EXISTS email_queue CASCADE;
