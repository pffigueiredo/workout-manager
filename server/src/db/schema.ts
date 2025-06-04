
import { serial, text, pgTable, timestamp, integer, numeric, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutRoutinesTable = pgTable('workout_routines', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  routine_id: integer('routine_id').notNull().references(() => workoutRoutinesTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutSessionsTable = pgTable('workout_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  routine_id: integer('routine_id').notNull().references(() => workoutRoutinesTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutSetsTable = pgTable('workout_sets', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').notNull().references(() => workoutSessionsTable.id, { onDelete: 'cascade' }),
  exercise_name: varchar('exercise_name', { length: 255 }).notNull(),
  set_number: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 8, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  workoutRoutines: many(workoutRoutinesTable),
  workoutSessions: many(workoutSessionsTable),
}));

export const workoutRoutinesRelations = relations(workoutRoutinesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [workoutRoutinesTable.user_id],
    references: [usersTable.id],
  }),
  exercises: many(exercisesTable),
  workoutSessions: many(workoutSessionsTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ one }) => ({
  routine: one(workoutRoutinesTable, {
    fields: [exercisesTable.routine_id],
    references: [workoutRoutinesTable.id],
  }),
}));

export const workoutSessionsRelations = relations(workoutSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [workoutSessionsTable.user_id],
    references: [usersTable.id],
  }),
  routine: one(workoutRoutinesTable, {
    fields: [workoutSessionsTable.routine_id],
    references: [workoutRoutinesTable.id],
  }),
  sets: many(workoutSetsTable),
}));

export const workoutSetsRelations = relations(workoutSetsTable, ({ one }) => ({
  session: one(workoutSessionsTable, {
    fields: [workoutSetsTable.session_id],
    references: [workoutSessionsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  workoutRoutines: workoutRoutinesTable,
  exercises: exercisesTable,
  workoutSessions: workoutSessionsTable,
  workoutSets: workoutSetsTable,
};
