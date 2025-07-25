import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
    notificationId: v.string(),
    userId: v.optional(v.string()),
    priority: v.optional(v.string()), // "high", "medium", "low"
  })
  .index("by_userId", ["userId"])
  .index("by_completed", ["completed"])
  .index("by_priority", ["priority"])
});