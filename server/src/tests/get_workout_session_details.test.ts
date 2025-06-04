
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, workoutSessionsTable, workoutSetsTable } from '../db/schema';
import { getWorkoutSessionDetails } from '../handlers/get_workout_session_details';

describe('getWorkoutSessionDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get workout session with sets', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const routineResult = await db.insert(workoutRoutinesTable)
      .values({
        user_id: userResult[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        user_id: userResult[0].id,
        routine_id: routineResult[0].id,
        name: 'Test Session'
      })
      .returning()
      .execute();

    // Create workout sets
    await db.insert(workoutSetsTable)
      .values([
        {
          session_id: sessionResult[0].id,
          exercise_name: 'Push-ups',
          set_number: 1,
          reps: 10,
          weight: '0.00'
        },
        {
          session_id: sessionResult[0].id,
          exercise_name: 'Squats',
          set_number: 1,
          reps: 15,
          weight: '50.50'
        }
      ])
      .execute();

    const result = await getWorkoutSessionDetails(sessionResult[0].id);

    // Verify session details
    expect(result.id).toEqual(sessionResult[0].id);
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.routine_id).toEqual(routineResult[0].id);
    expect(result.name).toEqual('Test Session');
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify sets
    expect(result.sets).toHaveLength(2);

    const pushUpSet = result.sets.find(set => set.exercise_name === 'Push-ups');
    expect(pushUpSet).toBeDefined();
    expect(pushUpSet!.set_number).toEqual(1);
    expect(pushUpSet!.reps).toEqual(10);
    expect(pushUpSet!.weight).toEqual(0);
    expect(typeof pushUpSet!.weight).toBe('number');

    const squatSet = result.sets.find(set => set.exercise_name === 'Squats');
    expect(squatSet).toBeDefined();
    expect(squatSet!.set_number).toEqual(1);
    expect(squatSet!.reps).toEqual(15);
    expect(squatSet!.weight).toEqual(50.5);
    expect(typeof squatSet!.weight).toBe('number');
  });

  it('should return session with empty sets array when no sets exist', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const routineResult = await db.insert(workoutRoutinesTable)
      .values({
        user_id: userResult[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        user_id: userResult[0].id,
        routine_id: routineResult[0].id,
        name: 'Empty Session'
      })
      .returning()
      .execute();

    const result = await getWorkoutSessionDetails(sessionResult[0].id);

    expect(result.id).toEqual(sessionResult[0].id);
    expect(result.name).toEqual('Empty Session');
    expect(result.sets).toHaveLength(0);
  });

  it('should throw error when session does not exist', async () => {
    await expect(getWorkoutSessionDetails(999)).rejects.toThrow(/not found/i);
  });
});
