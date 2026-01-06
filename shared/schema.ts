import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Aircraft table
export const aircraftTable = pgTable("aircraft", {
  id: text("id").primaryKey(),
  callsign: text("callsign").notNull(),
  type: text("type").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  altitude: real("altitude").notNull(),
  speed: real("speed").notNull(),
  heading: real("heading").notNull(),
  threatLevel: text("threat_level").notNull(),
  lastUpdate: timestamp("last_update").defaultNow(),
});

// Alerts table
export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Missiles table
export const missilesTable = pgTable("missiles", {
  id: text("id").primaryKey(),
  targetId: text("target_id").notNull(),
  startLat: real("start_lat").notNull(),
  startLng: real("start_lng").notNull(),
  startAltitude: real("start_altitude").notNull(),
  targetLat: real("target_lat").notNull(),
  targetLng: real("target_lng").notNull(),
  targetAltitude: real("target_altitude").notNull(),
  currentLat: real("current_lat").notNull(),
  currentLng: real("current_lng").notNull(),
  currentAltitude: real("current_altitude").notNull(),
  speed: real("speed").notNull(),
  active: boolean("active").default(true),
  launchTime: timestamp("launch_time").defaultNow(),
});

// System status table
export const systemStatusTable = pgTable("system_status", {
  id: serial("id").primaryKey(),
  radarStatus: text("radar_status").notNull(),
  radarUptime: real("radar_uptime").notNull(),
  activeThreats: integer("active_threats").notNull(),
  aircraftTracked: integer("aircraft_tracked").notNull(),
  systemLoad: real("system_load").notNull(),
  missileReady: integer("missile_ready").notNull(),
  lastUpdate: timestamp("last_update").defaultNow(),
});

// Zod schemas for validation
export const insertAircraftSchema = createInsertSchema(aircraftTable);
export const insertAlertSchema = createInsertSchema(alertsTable);
export const insertMissileSchema = createInsertSchema(missilesTable);
export const insertSystemStatusSchema = createInsertSchema(systemStatusTable);

// Types
export type Aircraft = typeof aircraftTable.$inferSelect;
export type InsertAircraft = z.infer<typeof insertAircraftSchema>;
export type Alert = typeof alertsTable.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Missile = typeof missilesTable.$inferSelect;
export type InsertMissile = z.infer<typeof insertMissileSchema>;
export type SystemStatus = typeof systemStatusTable.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
