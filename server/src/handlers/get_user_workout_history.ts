
import { db } from '../db';
import { workoutSessionsTable, workoutSetsTable } from '../db/schema';
import { type WorkoutSessionWithSets } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserWorkoutHistory = async (userId: number): Promise<WorkoutSessionWithSets[]> => {
  try {
    // Get all workout sessions for the user
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.user_id, userId))
      .execute();

    // Get all sets for these sessions
    const sessionIds = sessions.map(session => session.id);
    
    let sets: any[] = [];
    if (sessionIds.length > 0) {
      sets = await db.select()
        .from(workoutSetsTable)
        .where(eq(workoutSetsTable.session_id, sessionIds[0]))
        .execute();

      // Get sets for all sessions if there are multiple
      for (let i = 1; i < sessionIds.length; i++) {
        const additionalSets = await db.select()
          .from(workoutSetsTable)
          .where(eq(workoutSetsTable.session_id, sessionIds[i]))
          .execute();
        sets.push(...additionalSets);
      }
    }

    // Group sets by session_id and convert numeric fields
    const setsBySessionId = sets.reduce((acc, set) => {
      const sessionId = set.session_id;
      if (!acc[sessionId]) {
        acc[sessionId] = [];
      }
      acc[sessionId].push({
        ...set,
        weight: parseFloat(set.weight) // Convert numeric field
      });
      return acc;
    }, {} as Record<number, any[]>);

    // Combine sessions with their sets
    return sessions.map(session => ({
      ...session,
      sets: setsBySessionId[session.id] || []
    }));
  } catch (error) {
    console.error('Get user workout history failed:', error);
    throw error;
  }
};
