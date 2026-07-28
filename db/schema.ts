import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  project: text("project").notNull(),
  photoKey: text("photo_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const organizers = sqliteTable("organizers", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    senderType: text("sender_type", { enum: ["participant", "organizer"] }).notNull(),
    senderId: text("sender_id").notNull(),
    recipientId: text("recipient_id").notNull(),
    likes: integer("likes").notNull(),
    message: text("message").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("feedback_sender_recipient_idx").on(
      table.senderType,
      table.senderId,
      table.recipientId,
    ),
  ],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
