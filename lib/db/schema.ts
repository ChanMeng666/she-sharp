/**
 * Database schema barrel.
 *
 * The schema is split by domain under ./schema/. This file re-exports every
 * symbol so that `@/lib/db/schema` keeps resolving exactly as it always has —
 * no import site anywhere in the repo changes — and so drizzle-kit, which is
 * pointed at this file by drizzle.config.ts, still sees the whole schema.
 *
 * Load order is the dependency order and is deliberate:
 *   enums -> users -> {mentorship, events, engagement, system} -> relations
 */
export * from './schema/enums';
export * from './schema/users';
export * from './schema/mentorship';
export * from './schema/events';
export * from './schema/engagement';
export * from './schema/system';
export * from './schema/relations';
