
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  name: 'Test User'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login existing user successfully', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(testLoginInput);

    // Verify user data is returned
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toEqual('hashed_password_123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent email', async () => {
    const invalidLogin: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidLogin)).rejects.toThrow(/invalid email or password/i);
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    await db.insert(usersTable)
      .values([
        testUser,
        {
          email: 'another@example.com',
          password_hash: 'different_hash',
          name: 'Another User'
        }
      ])
      .execute();

    const result = await loginUser(testLoginInput);

    // Should return the correct user
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toEqual('hashed_password_123');
  });
});
