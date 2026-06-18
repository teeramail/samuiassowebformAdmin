import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  text,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('applicant_status', [
  'local',
  'thai_tourist',
  'international',
]);

export const equipmentEnum = pgEnum('equipment_type', [
  'none',
  'telescope',
  'camera_stand',
]);

export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  status: statusEnum('status').notNull(),
  companions: integer('companions').notNull().default(0),
  equipment: equipmentEnum('equipment').notNull(),
  sources: text('sources').notNull(),
  sourceOther: varchar('source_other', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }),
  // Admin fields
  attended: boolean('attended').default(false).notNull(),
  isWalkIn: boolean('is_walk_in').default(false).notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

