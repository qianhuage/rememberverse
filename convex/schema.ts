import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export default defineSchema({
  memorialEvents: defineTable({
    islandId: v.string(),
    event: v.string(),
  }).index('by_island', ['islandId']),
});
