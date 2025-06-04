
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, exercisesTable } from '../db/schema';
import { getUserWorkoutRoutines } from '../handlers/get_user_workout_routines';

describe('getUserWorkoutRoutines', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no routines', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    const result = await getUserWorkoutRoutines(user.id);

    expect(result).toEqual([]);
  });

  it('should return workout routines with exercises for a user', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create workout routines
    const [routine1] = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Push Day',
        description: 'Upper body push exercises'
      })
      .returning()
      .execute();

    const [routine2] = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Pull Day',
        description: null
      })
      .returning()
      .execute();

    // Create exercises for routine1
    await db.insert(exercisesTable)
      .values([
        {
          routine_id: routine1.id,
          name: 'Push-ups',
          order_index: 0
        },
        {
          routine_id: routine1.id,
          name: 'Bench Press',
          order_index: 1
        }
      ])
      .execute();

    // Create exercises for routine2
    await db.insert(exercisesTable)
      .values([
        {
          routine_id: routine2.id,
          name: 'Pull-ups',
          order_index: 0
        }
      ])
      .execute();

    const result = await getUserWorkoutRoutines(user.id);

    expect(result).toHaveLength(2);

    // Find routines by name for stable testing
    const pushDay = result.find(r => r.name === 'Push Day');
    const pullDay = result.find(r => r.name === 'Pull Day');

    expect(pushDay).toBeDefined();
    expect(pushDay!.name).toEqual('Push Day');
    expect(pushDay!.description).toEqual('Upper body push exercises');
    expect(pushDay!.user_id).toEqual(user.id);
    expect(pushDay!.exercises).toHaveLength(2);
    expect(pushDay!.exercises[0].name).toEqual('Push-ups');
    expect(pushDay!.exercises[0].order_index).toEqual(0);
    expect(pushDay!.exercises[1].name).toEqual('Bench Press');
    expect(pushDay!.exercises[1].order_index).toEqual(1);

    expect(pullDay).toBeDefined();
    expect(pullDay!.name).toEqual('Pull Day');
    expect(pullDay!.description).toBeNull();
    expect(pullDay!.exercises).toHaveLength(1);
    expect(pullDay!.exercises[0].name).toEqual('Pull-ups');
  });

  it('should return routines without exercises if none exist', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create a routine without exercises
    await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Empty Routine',
        description: 'A routine with no exercises'
      })
      .execute();

    const result = await getUserWorkoutRoutines(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Empty Routine');
    expect(result[0].exercises).toEqual([]);
  });

  it('should only return routines for the specified user', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2'
      })
      .returning()
      .execute();

    // Create routines for both users
    await db.insert(workoutRoutinesTable)
      .values([
        {
          user_id: user1.id,
          name: 'User 1 Routine',
          description: 'Routine for user 1'
        },
        {
          user_id: user2.id,
          name: 'User 2 Routine',
          description: 'Routine for user 2'
        }
      ])
      .execute();

    const user1Result = await getUserWorkoutRoutines(user1.id);
    const user2Result = await getUserWorkoutRoutines(user2.id);

    expect(user1Result).toHaveLength(1);
    expect(user1Result[0].name).toEqual('User 1 Routine');
    expect(user1Result[0].user_id).toEqual(user1.id);

    expect(user2Result).toHaveLength(1);
    expect(user2Result[0].name).toEqual('User 2 Routine');
    expect(user2Result[0].user_id).toEqual(user2.id);
  });

  it('should sort exercises by order_index', async () => {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create a routine
    const [routine] = await db.insert(workoutRoutinesTable)
      .values({
        user_id: user.id,
        name: 'Test Routine',
        description: 'Testing exercise order'
      })
      .returning()
      .execute();

    // Create exercises with different order_index values (inserted out of order)
    await db.insert(exercisesTable)
      .values([
        {
          routine_id: routine.id,
          name: 'Third Exercise',
          order_index: 2
        },
        {
          routine_id: routine.id,
          name: 'First Exercise',
          order_index: 0
        },
        {
          routine_id: routine.id,
          name: 'Second Exercise',
          order_index: 1
        }
      ])
      .execute();

    const result = await getUserWorkoutRoutines(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].exercises).toHaveLength(3);
    expect(result[0].exercises[0].name).toEqual('First Exercise');
    expect(result[0].exercises[0].order_index).toEqual(0);
    expect(result[0].exercises[1].name).toEqual('Second Exercise');
    expect(result[0].exercises[1].order_index).toEqual(1);
    expect(result[0].exercises[2].name).toEqual('Third Exercise');
    expect(result[0].exercises[2].order_index).toEqual(2);
  });
});
