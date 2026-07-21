import {
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── User Persona Favorites ───────────────────────────────────────
export const userPersonaFavorites = mysqlTable("user_persona_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: varchar("personaId", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserPersonaFavorite = typeof userPersonaFavorites.$inferSelect;
export type InsertUserPersonaFavorite = typeof userPersonaFavorites.$inferInsert;

// ─── Persona Ratings ─────────────────────────────────────────────
export const personaRatings = mysqlTable("persona_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: varchar("personaId", { length: 100 }).notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  rating: mysqlEnum("rating", ["up", "down"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PersonaRating = typeof personaRatings.$inferSelect;
export type InsertPersonaRating = typeof personaRatings.$inferInsert;
