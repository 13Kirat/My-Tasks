import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks
export const getTasks = query({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      _creationTime: v.number(),
      text: v.string(),
      completed: v.boolean(),
      notificationId: v.string(),
      priority: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => 
        args.userId ? q.eq("userId", args.userId) : q
      )
      .collect();
    
    return tasks.map(task => ({
      _id: task._id,
      _creationTime: task._creationTime,
      text: task.text,
      completed: task.completed,
      notificationId: task.notificationId,
      priority: task.priority || "medium", // Default to medium if not set
    }));
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    text: v.string(),
    notificationId: v.string(),
    userId: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      completed: false,
      notificationId: args.notificationId,
      userId: args.userId,
      priority: args.priority || "medium", // Default to medium if not provided
    });
    
    return taskId;
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    text: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    notificationId: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Only include fields that are provided
    const updateFields: any = {};
    if (updates.text !== undefined) updateFields.text = updates.text;
    if (updates.completed !== undefined) updateFields.completed = updates.completed;
    if (updates.notificationId !== undefined) updateFields.notificationId = updates.notificationId;
    if (updates.priority !== undefined) updateFields.priority = updates.priority;
    
    await ctx.db.patch(id, updateFields);
    return true;
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});