
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type CreateExerciseInput, type Exercise } from '../schema';

export const createExercise = async (input: CreateExerciseInput): Promise<Exercise> => {
  try {
    const result = await db.insert(exercisesTable)
      .values({
        routine_id: input.routine_id,
        name: input.name,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Exercise creation failed:', error);
    throw error;
  }
};
