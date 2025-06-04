
import { db } from '../db';
import { workoutSetsTable } from '../db/schema';
import { type CreateWorkoutSetInput, type WorkoutSet } from '../schema';

export const createWorkoutSet = async (input: CreateWorkoutSetInput): Promise<WorkoutSet> => {
  try {
    // Insert workout set record
    const result = await db.insert(workoutSetsTable)
      .values({
        session_id: input.session_id,
        exercise_name: input.exercise_name,
        set_number: input.set_number,
        reps: input.reps,
        weight: input.weight.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric field back to number before returning
    const workoutSet = result[0];
    return {
      ...workoutSet,
      weight: parseFloat(workoutSet.weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Workout set creation failed:', error);
    throw error;
  }
};
