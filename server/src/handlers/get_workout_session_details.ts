
import { db } from '../db';
import { workoutSessionsTable, workoutSetsTable } from '../db/schema';
import { type WorkoutSessionWithSets } from '../schema';
import { eq } from 'drizzle-orm';

export const getWorkoutSessionDetails = async (sessionId: number): Promise<WorkoutSessionWithSets> => {
  try {
    // Get the workout session
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, sessionId))
      .execute();

    if (sessions.length === 0) {
      throw new Error(`Workout session with id ${sessionId} not found`);
    }

    const session = sessions[0];

    // Get all sets for this session
    const sets = await db.select()
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.session_id, sessionId))
      .execute();

    // Convert numeric weight values to numbers
    const processedSets = sets.map(set => ({
      ...set,
      weight: parseFloat(set.weight)
    }));

    return {
      ...session,
      sets: processedSets
    };
  } catch (error) {
    console.error('Get workout session details failed:', error);
    throw error;
  }
};
