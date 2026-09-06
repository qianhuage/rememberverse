import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
function authorize(secret: string) {
  if (
    !process.env.CONVEX_BRIDGE_SECRET ||
    secret !== process.env.CONVEX_BRIDGE_SECRET
  )
    throw new Error('Unauthorized');
}
export const record = mutationGeneric({
  args: { secret: v.string(), islandId: v.string(), event: v.string() },
  handler: async (ctx, args) => {
    authorize(args.secret);
    if (args.event.length > 5000) throw new Error('Event too large');
    return ctx.db.insert('memorialEvents', {
      islandId: args.islandId,
      event: args.event,
    });
  },
});
export const list = queryGeneric({
  args: { secret: v.string(), islandId: v.string() },
  handler: async (ctx, args) => {
    authorize(args.secret);
    return ctx.db
      .query('memorialEvents')
      .withIndex('by_island', (q) => q.eq('islandId', args.islandId))
      .order('desc')
      .take(100);
  },
});
