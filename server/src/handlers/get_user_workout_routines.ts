
import { db } from '../db';
import { workoutRoutinesTable, exercisesTable } from '../db/schema';
import { type WorkoutRoutineWithExercises } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserWorkoutRoutines = async (userId: number): Promise<WorkoutRoutineWithExercises[]> => {
  try {
    // Get all workout routines for the user with their exercises
    const results = await db.select()
      .from(workoutRoutinesTable)
      .leftJoin(exercisesTable, eq(workoutRoutinesTable.id, exercisesTable.routine_id))
      .where(eq(workoutRoutinesTable.user_id, userId))
      .execute();

    // Group exercises by routine
    const routineMap = new Map<number, WorkoutRoutineWithExercises>();

    for (const result of results) {
      const routine = result.workout_routines;
      const exercise = result.exercises;

      if (!routineMap.has(routine.id)) {
        routineMap.set(routine.id, {
          id: routine.id,
          user_id: routine.user_id,
          name: routine.name,
          description: routine.description,
          created_at: routine.created_at,
          exercises: []
        });
      }

      // Add exercise if it exists (leftJoin can return null exercises)
      if (exercise) {
        routineMap.get(routine.id)!.exercises.push({
          id: exercise.id,
          routine_id: exercise.routine_id,
          name: exercise.name,
          order_index: exercise.order_index,
          created_at: exercise.created_at
        });
      }
    }

    // Convert map to array and sort exercises by order_index
    const routines = Array.from(routineMap.values());
    routines.forEach(routine => {
      routine.exercises.sort((a, b) => a.order_index - b.order_index);
    });

    // Sort routines by creation date (newest first)
    routines.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return routines;
  } catch (error) {
    console.error('Failed to get user workout routines:', error);
    throw error;
  }
};
