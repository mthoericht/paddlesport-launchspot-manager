import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import { cleanupTestData, createTestUser } from '../helpers/testDb.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Integration Tests', () =>
{
  beforeEach(async () =>
  {
    // Cleanup before each test
    await cleanupTestData();
  });

  afterEach(async () =>
  {
    // Cleanup after each test (success or failure)
    await cleanupTestData();
  });

  afterAll(async () =>
  {
    // Final cleanup after all tests
    await cleanupTestData();
  });

  describe('POST /api/auth/signup', () =>
  {
    it('should create a new user with TEST_ prefix', async () =>
    {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'TEST_newuser@test.com',
          username: 'TEST_newuser',
          password: 'TEST_password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('TEST_newuser@test.com');
      expect(response.body.user.username).toBe('TEST_newuser');
      expect(response.body.user.is_admin).toBe(false);
    });

    it('should reject duplicate email', async () =>
    {
      // Create first user
      await createTestUser({
        email: 'TEST_duplicate@test.com',
        username: 'TEST_user1'
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'TEST_duplicate@test.com',
          username: 'TEST_user2',
          password: 'TEST_password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('bereits vergeben');
    });

    it('should reject duplicate username', async () =>
    {
      // Create first user
      await createTestUser({
        email: 'TEST_user1@test.com',
        username: 'TEST_duplicate'
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'TEST_user2@test.com',
          username: 'TEST_duplicate',
          password: 'TEST_password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('bereits vergeben');
    });

    it('should reject password shorter than 6 characters', async () =>
    {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'TEST_shortpass@test.com',
          username: 'TEST_shortpass',
          password: 'TEST_'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('mindestens 6 Zeichen');
    });

    it('should reject missing fields', async () =>
    {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'TEST_incomplete@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('erforderlich');
    });
  });

  describe('POST /api/auth/login', () =>
  {
    it('should login with correct credentials', async () =>
    {
      // Create test user with unique identifiers
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const testEmail = `TEST_login_${timestamp}_${random}@test.com`;
      const testUsername = `TEST_loginuser_${timestamp}_${random}`;
      
      await createTestUser({
        email: testEmail,
        username: testUsername,
        password: 'TEST_password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'TEST_password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should reject invalid email', async () =>
    {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST_nonexistent@test.com',
          password: 'TEST_password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Ungültige Anmeldedaten');
    });

    it('should reject invalid password', async () =>
    {
      // Create test user with unique identifiers
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const testEmail = `TEST_wrongpass_${timestamp}_${random}@test.com`;
      const testUsername = `TEST_wrongpass_${timestamp}_${random}`;
      
      await createTestUser({
        email: testEmail,
        username: testUsername,
        password: 'TEST_correct123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'TEST_wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Ungültige Anmeldedaten');
    });
  });
});

