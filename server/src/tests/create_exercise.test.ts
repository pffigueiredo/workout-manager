
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, exercisesTable } from '../db/schema';
import { type CreateExerciseInput } from '../schema';
import { createExercise } from '../handlers/create_exercise';
import { eq } from 'drizzle-orm';

describe('createExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exercise', async () => {
    // Create prerequisite user and routine
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const routine = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    const testInput: CreateExerciseInput = {
      routine_id: routine[0].id,
      name: 'Push-ups',
      order_index: 1
    };

    const result = await createExercise(testInput);

    expect(result.routine_id).toEqual(routine[0].id);
    expect(result.name).toEqual('Push-ups');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save exercise to database', async () => {
    // Create prerequisite user and routine
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();

    const routine = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    const testInput: CreateExerciseInput = {
      routine_id: routine[0].id,
      name: 'Squats',
      order_index: 2
    };

    const result = await createExercise(testInput);

    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].routine_id).toEqual(routine[0].id);
    expect(exercises[0].name).toEqual('Squats');
    expect(exercises[0].order_index).toEqual(2);
    expect(exercises[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent routine', async () => {
    const testInput: CreateExerciseInput = {
      routine_id: 99999, // Non-existent routine
      name: 'Invalid Exercise',
      order_index: 1
    };

    await expect(createExercise(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
