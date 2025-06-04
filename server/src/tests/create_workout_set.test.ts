
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, workoutSessionsTable, workoutSetsTable } from '../db/schema';
import { type CreateWorkoutSetInput } from '../schema';
import { createWorkoutSet } from '../handlers/create_workout_set';
import { eq } from 'drizzle-orm';

// Test input for workout set
const testInput: CreateWorkoutSetInput = {
  session_id: 1, // Will be created in beforeEach
  exercise_name: 'Bench Press',
  set_number: 1,
  reps: 10,
  weight: 135.5
};

describe('createWorkoutSet', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .execute();

    // Create prerequisite workout routine
    await db.insert(workoutRoutinesTable)
      .values({
        user_id: 1,
        name: 'Push Day',
        description: 'Upper body workout'
      })
      .execute();

    // Create prerequisite workout session
    await db.insert(workoutSessionsTable)
      .values({
        user_id: 1,
        routine_id: 1,
        name: 'Morning Push Session'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should create a workout set', async () => {
    const result = await createWorkoutSet(testInput);

    // Basic field validation
    expect(result.session_id).toEqual(1);
    expect(result.exercise_name).toEqual('Bench Press');
    expect(result.set_number).toEqual(1);
    expect(result.reps).toEqual(10);
    expect(result.weight).toEqual(135.5);
    expect(typeof result.weight).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout set to database', async () => {
    const result = await createWorkoutSet(testInput);

    // Query using proper drizzle syntax
    const workoutSets = await db.select()
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.id, result.id))
      .execute();

    expect(workoutSets).toHaveLength(1);
    expect(workoutSets[0].session_id).toEqual(1);
    expect(workoutSets[0].exercise_name).toEqual('Bench Press');
    expect(workoutSets[0].set_number).toEqual(1);
    expect(workoutSets[0].reps).toEqual(10);
    expect(parseFloat(workoutSets[0].weight)).toEqual(135.5);
    expect(workoutSets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle integer weight values correctly', async () => {
    const integerWeightInput: CreateWorkoutSetInput = {
      ...testInput,
      weight: 225
    };

    const result = await createWorkoutSet(integerWeightInput);

    expect(result.weight).toEqual(225);
    expect(typeof result.weight).toBe('number');

    // Verify in database
    const workoutSets = await db.select()
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.id, result.id))
      .execute();

    expect(parseFloat(workoutSets[0].weight)).toEqual(225);
  });

  it('should handle zero weight correctly', async () => {
    const zeroWeightInput: CreateWorkoutSetInput = {
      ...testInput,
      weight: 0
    };

    const result = await createWorkoutSet(zeroWeightInput);

    expect(result.weight).toEqual(0);
    expect(typeof result.weight).toBe('number');

    // Verify in database
    const workoutSets = await db.select()
      .from(workoutSetsTable)
      .where(eq(workoutSetsTable.id, result.id))
      .execute();

    expect(parseFloat(workoutSets[0].weight)).toEqual(0);
  });
});
