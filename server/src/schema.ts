
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Workout routine schemas
export const workoutRoutineSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type WorkoutRoutine = z.infer<typeof workoutRoutineSchema>;

export const createWorkoutRoutineInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export type CreateWorkoutRoutineInput = z.infer<typeof createWorkoutRoutineInputSchema>;

// Exercise schemas
export const exerciseSchema = z.object({
  id: z.number(),
  routine_id: z.number(),
  name: z.string(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const createExerciseInputSchema = z.object({
  routine_id: z.number(),
  name: z.string().min(1),
  order_index: z.number().int().nonnegative(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;

// Workout session schemas
export const workoutSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  routine_id: z.number(),
  name: z.string(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

export const createWorkoutSessionInputSchema = z.object({
  user_id: z.number(),
  routine_id: z.number(),
  name: z.string().min(1),
});

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionInputSchema>;

// Workout set schemas
export const workoutSetSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  exercise_name: z.string(),
  set_number: z.number().int(),
  reps: z.number().int(),
  weight: z.number(),
  created_at: z.coerce.date(),
});

export type WorkoutSet = z.infer<typeof workoutSetSchema>;

export const createWorkoutSetInputSchema = z.object({
  session_id: z.number(),
  exercise_name: z.string().min(1),
  set_number: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
});

export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetInputSchema>;

// Complex response schemas
export const workoutRoutineWithExercisesSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  exercises: z.array(exerciseSchema),
});

export type WorkoutRoutineWithExercises = z.infer<typeof workoutRoutineWithExercisesSchema>;

export const workoutSessionWithSetsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  routine_id: z.number(),
  name: z.string(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date(),
  sets: z.array(workoutSetSchema),
});

export type WorkoutSessionWithSets = z.infer<typeof workoutSessionWithSetsSchema>;
