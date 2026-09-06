import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const islands = sqliteTable(
  'islands',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    kind: text('kind').notNull(),
    theme: text('theme').notNull(),
    story: text('story').notNull(),
    dates: text('dates').notNull(),
    photo: text('photo'),
    created: integer('created').notNull(),
  },
  (t) => [index('islands_owner').on(t.owner)],
);
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  mime: text('mime').notNull(),
});
export const memories = sqliteTable(
  'memories',
  {
    id: text('id').primaryKey(),
    island: text('island').notNull(),
    kind: text('kind').notNull(),
    text: text('text').notNull(),
    created: integer('created').notNull(),
  },
  (t) => [index('memories_island').on(t.island)],
);
export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    island: text('island').notNull(),
    provider: text('provider').notNull(),
    status: text('status').notNull(),
    operation: text('operation'),
    result: text('result'),
    error: text('error'),
    created: integer('created').notNull(),
  },
  (t) => [uniqueIndex('jobs_island_provider').on(t.island, t.provider)],
);
