
import { db } from '../db';
import { workoutRoutinesTable } from '../db/schema';
import { type CreateWorkoutRoutineInput, type WorkoutRoutine } from '../schema';

export const createWorkoutRoutine = async (input: CreateWorkoutRoutineInput): Promise<WorkoutRoutine> => {
  try {
    // Insert workout routine record
    const result = await db.insert(workoutRoutinesTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Workout routine creation failed:', error);
    throw error;
  }
};
