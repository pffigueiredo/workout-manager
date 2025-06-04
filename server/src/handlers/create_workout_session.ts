
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type CreateWorkoutSessionInput, type WorkoutSession } from '../schema';

export const createWorkoutSession = async (input: CreateWorkoutSessionInput): Promise<WorkoutSession> => {
  try {
    // Insert workout session record
    const result = await db.insert(workoutSessionsTable)
      .values({
        user_id: input.user_id,
        routine_id: input.routine_id,
        name: input.name,
      })
      .returning()
      .execute();

    const session = result[0];
    return session;
  } catch (error) {
    console.error('Workout session creation failed:', error);
    throw error;
  }
};
