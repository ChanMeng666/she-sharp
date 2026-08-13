import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

/**
 * Connection options tuned for serverless deployment behind Neon's pgbouncer
 * pooler (the `-pooler` host in POSTGRES_URL):
 * - max: a modest per-instance cap. Each warm serverless instance keeps its own
 *   pool, so a high cap multiplies across instances and triggers Neon's
 *   connection-burst throttling ("Failed to acquire permit").
 * - idle_timeout: release idle sockets after 20s so a warm instance does not
 *   hold connections open between requests.
 * - connect_timeout: fail fast after 10s instead of hanging a request until the
 *   function's own timeout.
 * - prepare: REQUIRED. pgbouncer in transaction pooling mode does not support
 *   prepared statements, so postgres-js must send unnamed queries.
 */
export const client = postgres(process.env.POSTGRES_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
export const db = drizzle(client, { schema });
