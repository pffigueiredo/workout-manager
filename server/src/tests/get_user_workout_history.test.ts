
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutRoutinesTable, workoutSessionsTable, workoutSetsTable } from '../db/schema';
import { getUserWorkoutHistory } from '../handlers/get_user_workout_history';

describe('getUserWorkoutHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no workout sessions', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    const result = await getUserWorkoutHistory(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return workout sessions with sets for a user', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create workout routine
    const routines = await db.insert(workoutRoutinesTable)
      .values({
        user_id: users[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    // Create workout session
    const sessions = await db.insert(workoutSessionsTable)
      .values({
        user_id: users[0].id,
        routine_id: routines[0].id,
        name: 'Test Session'
      })
      .returning()
      .execute();

    // Create workout sets
    await db.insert(workoutSetsTable)
      .values([
        {
          session_id: sessions[0].id,
          exercise_name: 'Push-ups',
          set_number: 1,
          reps: 10,
          weight: '0.00'
        },
        {
          session_id: sessions[0].id,
          exercise_name: 'Bench Press',
          set_number: 1,
          reps: 8,
          weight: '135.50'
        }
      ])
      .execute();

    const result = await getUserWorkoutHistory(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(sessions[0].id);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].routine_id).toEqual(routines[0].id);
    expect(result[0].name).toEqual('Test Session');
    expect(result[0].sets).toHaveLength(2);

    // Check first set
    const pushUpSet = result[0].sets.find(set => set.exercise_name === 'Push-ups');
    expect(pushUpSet).toBeDefined();
    expect(pushUpSet!.set_number).toEqual(1);
    expect(pushUpSet!.reps).toEqual(10);
    expect(pushUpSet!.weight).toEqual(0);
    expect(typeof pushUpSet!.weight).toBe('number');

    // Check second set
    const benchPressSet = result[0].sets.find(set => set.exercise_name === 'Bench Press');
    expect(benchPressSet).toBeDefined();
    expect(benchPressSet!.set_number).toEqual(1);
    expect(benchPressSet!.reps).toEqual(8);
    expect(benchPressSet!.weight).toEqual(135.5);
    expect(typeof benchPressSet!.weight).toBe('number');
  });

  it('should return multiple workout sessions with their respective sets', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create workout routine
    const routines = await db.insert(workoutRoutinesTable)
      .values({
        user_id: users[0].id,
        name: 'Test Routine',
        description: 'A test routine'
      })
      .returning()
      .execute();

    // Create two workout sessions
    const sessions = await db.insert(workoutSessionsTable)
      .values([
        {
          user_id: users[0].id,
          routine_id: routines[0].id,
          name: 'Session 1'
        },
        {
          user_id: users[0].id,
          routine_id: routines[0].id,
          name: 'Session 2'
        }
      ])
      .returning()
      .execute();

    // Create sets for first session
    await db.insert(workoutSetsTable)
      .values({
        session_id: sessions[0].id,
        exercise_name: 'Squats',
        set_number: 1,
        reps: 12,
        weight: '185.25'
      })
      .execute();

    // Create sets for second session
    await db.insert(workoutSetsTable)
      .values([
        {
          session_id: sessions[1].id,
          exercise_name: 'Deadlifts',
          set_number: 1,
          reps: 5,
          weight: '225.00'
        },
        {
          session_id: sessions[1].id,
          exercise_name: 'Deadlifts',
          set_number: 2,
          reps: 5,
          weight: '225.00'
        }
      ])
      .execute();

    const result = await getUserWorkoutHistory(users[0].id);

    expect(result).toHaveLength(2);

    // Find sessions by name
    const session1 = result.find(s => s.name === 'Session 1');
    const session2 = result.find(s => s.name === 'Session 2');

    expect(session1).toBeDefined();
    expect(session1!.sets).toHaveLength(1);
    expect(session1!.sets[0].exercise_name).toEqual('Squats');
    expect(session1!.sets[0].weight).toEqual(185.25);

    expect(session2).toBeDefined();
    expect(session2!.sets).toHaveLength(2);
    expect(session2!.sets[0].exercise_name).toEqual('Deadlifts');
    expect(session2!.sets[1].exercise_name).toEqual('Deadlifts');
    expect(session2!.sets[0].weight).toEqual(225);
    expect(session2!.sets[1].weight).toEqual(225);
  });

  it('should only return sessions for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          name: 'User 1'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          name: 'User 2'
        }
      ])
      .returning()
      .execute();

    // Create routines for both users
    const routines = await db.insert(workoutRoutinesTable)
      .values([
        {
          user_id: users[0].id,
          name: 'User 1 Routine',
          description: 'Routine for user 1'
        },
        {
          user_id: users[1].id,
          name: 'User 2 Routine',
          description: 'Routine for user 2'
        }
      ])
      .returning()
      .execute();

    // Create sessions for both users
    await db.insert(workoutSessionsTable)
      .values([
        {
          user_id: users[0].id,
          routine_id: routines[0].id,
          name: 'User 1 Session'
        },
        {
          user_id: users[1].id,
          routine_id: routines[1].id,
          name: 'User 2 Session'
        }
      ])
      .execute();

    const result = await getUserWorkoutHistory(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('User 1 Session');
    expect(result[0].user_id).toEqual(users[0].id);
  });
});
