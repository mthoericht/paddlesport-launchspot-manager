import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import launchPointRoutes from '../../routes/launchPoints.js';
import { cleanupTestData, createTestUser, createTestLaunchPoint } from '../helpers/testDb.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../middleware/auth.js';
import prisma from '../../prisma.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/launch-points', launchPointRoutes);

function getAuthToken(userId: number, email: string, username: string, isAdmin: boolean = false): string
{
  return jwt.sign(
    { id: userId, email, username, is_admin: isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

describe('LaunchPoints Routes Integration Tests', () =>
{
  let testUser: any;
  let authToken: string;

  // Helper function to ensure user exists
  async function ensureUserExists()
  {
    if (!testUser || !testUser.id)
    {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      testUser = await createTestUser({
        email: `TEST_launchpoint_${timestamp}_${random}@test.com`,
        username: `TEST_launchpointuser_${timestamp}_${random}`
      });
      authToken = getAuthToken(
        testUser.id,
        testUser.email,
        testUser.username,
        testUser.isAdmin
      );
      return;
    }
    
    const userInDb = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    
    if (!userInDb)
    {
      // User was deleted, recreate it
      testUser = await createTestUser({
        email: testUser.email,
        username: testUser.username
      });
      authToken = getAuthToken(
        testUser.id,
        testUser.email,
        testUser.username,
        testUser.isAdmin
      );
    }
  }

  beforeEach(async () =>
  {
    // Create test user with unique identifiers to avoid conflicts
    // Note: We don't cleanup before each test to avoid race conditions
    // Cleanup only happens after each test
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    testUser = await createTestUser({
      email: `TEST_launchpoint_${timestamp}_${random}@test.com`,
      username: `TEST_launchpointuser_${timestamp}_${random}`
    });
    
    // Verify user was created successfully
    expect(testUser).toBeDefined();
    expect(testUser.id).toBeDefined();
    
    // Verify user exists in database
    const userCheck = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    expect(userCheck).toBeDefined();
    
    authToken = getAuthToken(
      testUser.id,
      testUser.email,
      testUser.username,
      testUser.isAdmin
    );
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

  describe('POST /api/launch-points', () =>
  {
    it('should create a new launch point with TEST_ prefix', async () =>
    {
      // Verify user exists before creating launch point
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      
      await ensureUserExists();
      
      // Final check - user must exist right before request
      // Retry logic to ensure user exists
      let userExists = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!userExists && attempts < maxAttempts)
      {
        const finalCheck = await prisma.user.findUnique({
          where: { id: testUser.id }
        });
        
        if (finalCheck)
        {
          userExists = true;
          break;
        }
        
        // User was deleted, recreate with new unique ID
        attempts++;
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        testUser = await createTestUser({
          email: `TEST_launchpoint_${timestamp}_${random}@test.com`,
          username: `TEST_launchpointuser_${timestamp}_${random}`
        });
        authToken = getAuthToken(
          testUser.id,
          testUser.email,
          testUser.username,
          testUser.isAdmin
        );
        
        // Small delay to ensure user is committed to database
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify user was actually created
        const verifyUser = await prisma.user.findUnique({
          where: { id: testUser.id }
        });
        
        if (!verifyUser)
        {
          // User creation failed, wait a bit more and retry
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
      }
      
      // Verify user exists one more time right before request
      const preRequestCheck = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      if (!preRequestCheck)
      {
        throw new Error(`User ${testUser.id} does not exist in database before request`);
      }
      
      expect(testUser).toBeDefined();
      expect(testUser.id).toBeDefined();
      
      const response = await request(app)
        .post('/api/launch-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TEST_New Launch Point',
          latitude: 52.5200,
          longitude: 13.4050,
          categories: ['Kajak', 'SUP'],
          opening_hours: '24h'
        });

      if (response.status !== 201)
      {
        console.error('Response body:', response.body);
        console.error('Test user:', testUser);
        const userInDb = await prisma.user.findUnique({
          where: { id: testUser.id }
        });
        console.error('User in DB:', userInDb);
      }

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.message).toContain('erstellt');
      
      // Verify the point was created by fetching it
      if (response.status === 201 && response.body.id)
      {
        const getResponse = await request(app)
          .get(`/api/launch-points/${response.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(getResponse.status).toBe(200);
        expect(getResponse.body.name).toBe('TEST_New Launch Point');
        expect(getResponse.body.categories).toContain('Kajak');
        expect(getResponse.body.categories).toContain('SUP');
      }
    });

    it('should reject request without authentication', async () =>
    {
      const response = await request(app)
        .post('/api/launch-points')
        .send({
          name: 'TEST_Unauthorized Point',
          latitude: 52.5200,
          longitude: 13.4050,
          categories: ['Kajak']
        });

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () =>
    {
      const response = await request(app)
        .post('/api/launch-points')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          name: 'TEST_Invalid Token Point',
          latitude: 52.5200,
          longitude: 13.4050,
          categories: ['Kajak']
        });

      // Auth middleware returns 403 for invalid token, not 401
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/launch-points', () =>
  {
    it('should return all launch points with TEST_ prefix', async () =>
    {
      await ensureUserExists();
      
      // Create test launch points
      await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Point 1',
        categories: ['Kajak']
      });

      await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Point 2',
        categories: ['SUP']
      });

      const response = await request(app)
        .get('/api/launch-points')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Check that all returned points have TEST_ prefix (or filter them)
      const testPoints = response.body.filter((p: any) => p.name.startsWith('TEST_'));
      expect(testPoints.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by category', async () =>
    {
      await ensureUserExists();
      
      await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Kajak Point',
        categories: ['Kajak']
      });

      await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_SUP Point',
        categories: ['SUP']
      });

      const response = await request(app)
        .get('/api/launch-points?categories=Kajak')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const kajakPoints = response.body.filter((p: any) => 
        p.name.startsWith('TEST_') && p.categories.includes('Kajak')
      );
      expect(kajakPoints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/launch-points/:id', () =>
  {
    it('should return a single launch point', async () =>
    {
      await ensureUserExists();
      
      const point = await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Single Point',
        categories: ['Kajak']
      });

      const response = await request(app)
        .get(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(point.id);
      expect(response.body.name).toBe('TEST_Single Point');
    });

    it('should return 404 for non-existent point', async () =>
    {
      await ensureUserExists();
      
      const response = await request(app)
        .get('/api/launch-points/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/launch-points/:id', () =>
  {
    it('should update launch point', async () =>
    {
      await ensureUserExists();
      
      const point = await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Original Point',
        categories: ['Kajak']
      });

      const response = await request(app)
        .put(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TEST_Updated Point',
          latitude: 52.5200,
          longitude: 13.4050,
          categories: ['SUP'],
          opening_hours: '06:00-22:00'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('aktualisiert');
      
      // Verify the update by fetching
      const getResponse = await request(app)
        .get(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe('TEST_Updated Point');
      expect(getResponse.body.categories).toContain('SUP');
    });

    it('should reject update from non-owner', async () =>
    {
      await ensureUserExists();
      
      const otherUser = await createTestUser({
        email: 'TEST_other@test.com',
        username: 'TEST_otheruser'
      });

      const point = await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Owner Point',
        categories: ['Kajak']
      });

      const otherToken = getAuthToken(
        otherUser.id,
        otherUser.email,
        otherUser.username
      );

      const response = await request(app)
        .put(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'TEST_Unauthorized Update',
          latitude: 52.5200,
          longitude: 13.4050,
          categories: ['Kajak']
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/launch-points/:id', () =>
  {
    it('should delete launch point', async () =>
    {
      await ensureUserExists();
      
      const point = await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Delete Point',
        categories: ['Kajak']
      });

      const response = await request(app)
        .delete(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should reject delete from non-owner', async () =>
    {
      await ensureUserExists();
      
      const otherUser = await createTestUser({
        email: 'TEST_deleteother@test.com',
        username: 'TEST_deleteotheruser'
      });

      const point = await createTestLaunchPoint({
        createdById: testUser.id,
        name: 'TEST_Protected Point',
        categories: ['Kajak']
      });

      const otherToken = getAuthToken(
        otherUser.id,
        otherUser.email,
        otherUser.username
      );

      const response = await request(app)
        .delete(`/api/launch-points/${point.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});

