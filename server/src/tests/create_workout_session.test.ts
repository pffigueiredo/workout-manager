
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, workoutSessionsTable } from '../db/schema';
import { type CreateWorkoutSessionInput } from '../schema';
import { createWorkoutSession } from '../handlers/create_workout_session';
import { eq } from 'drizzle-orm';

describe('createWorkoutSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a workout session', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create prerequisite workout routine
    const routineResult = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Test Routine',
        description: 'A test routine',
      })
      .returning()
      .execute();

    const routine = routineResult[0];

    // Test input
    const testInput: CreateWorkoutSessionInput = {
      user_id: user.id,
      routine_id: routine.id,
      name: 'Test Session',
    };

    const result = await createWorkoutSession(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.routine_id).toEqual(routine.id);
    expect(result.name).toEqual('Test Session');
    expect(result.id).toBeDefined();
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout session to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create prerequisite workout routine
    const routineResult = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Test Routine',
        description: 'A test routine',
      })
      .returning()
      .execute();

    const routine = routineResult[0];

    const testInput: CreateWorkoutSessionInput = {
      user_id: user.id,
      routine_id: routine.id,
      name: 'Test Session',
    };

    const result = await createWorkoutSession(testInput);

    // Query database to verify session was saved
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toEqual(user.id);
    expect(sessions[0].routine_id).toEqual(routine.id);
    expect(sessions[0].name).toEqual('Test Session');
    expect(sessions[0].completed_at).toBeInstanceOf(Date);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint violations', async () => {
    const testInput: CreateWorkoutSessionInput = {
      user_id: 999, // Non-existent user
      routine_id: 999, // Non-existent routine
      name: 'Test Session',
    };

    await expect(createWorkoutSession(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
