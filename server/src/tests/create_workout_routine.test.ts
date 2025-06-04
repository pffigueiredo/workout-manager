
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable } from '../db/schema';
import { type CreateWorkoutRoutineInput } from '../schema';
import { createWorkoutRoutine } from '../handlers/create_workout_routine';
import { eq } from 'drizzle-orm';

describe('createWorkoutRoutine', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  it('should create a workout routine with description', async () => {
    const testInput: CreateWorkoutRoutineInput = {
      user_id: testUserId,
      name: 'Push Day Routine',
      description: 'Upper body push exercises'
    };

    const result = await createWorkoutRoutine(testInput);

    // Basic field validation
    expect(result.name).toEqual('Push Day Routine');
    expect(result.description).toEqual('Upper body push exercises');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a workout routine without description', async () => {
    const testInput: CreateWorkoutRoutineInput = {
      user_id: testUserId,
      name: 'Pull Day Routine'
    };

    const result = await createWorkoutRoutine(testInput);

    // Basic field validation
    expect(result.name).toEqual('Pull Day Routine');
    expect(result.description).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout routine to database', async () => {
    const testInput: CreateWorkoutRoutineInput = {
      user_id: testUserId,
      name: 'Leg Day Routine',
      description: 'Lower body exercises'
    };

    const result = await createWorkoutRoutine(testInput);

    // Query using proper drizzle syntax
    const routines = await db.select()
      .from(workoutRoutinesTable)
      .where(eq(workoutRoutinesTable.id, result.id))
      .execute();

    expect(routines).toHaveLength(1);
    expect(routines[0].name).toEqual('Leg Day Routine');
    expect(routines[0].description).toEqual('Lower body exercises');
    expect(routines[0].user_id).toEqual(testUserId);
    expect(routines[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint for invalid user_id', async () => {
    const testInput: CreateWorkoutRoutineInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Invalid Routine',
      description: 'This should fail'
    };

    expect(createWorkoutRoutine(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
