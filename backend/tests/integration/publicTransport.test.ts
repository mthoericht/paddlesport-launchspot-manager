import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import publicTransportRoutes from '../../routes/publicTransport.js';
import { cleanupTestData, createTestPublicTransportPoint } from '../helpers/testDb.js';
import prisma from '../../prisma.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/public-transport', publicTransportRoutes);

describe('PublicTransport Routes Integration Tests', () =>
{
  beforeEach(async () =>
  {
    // Cleanup before each test to ensure clean state
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

  describe('GET /api/public-transport', () =>
  {
    it('should return all public transport points', async () =>
    {
      // Create test public transport points
      await createTestPublicTransportPoint({
        name: 'TEST_Station 1',
        latitude: 52.5200,
        longitude: 13.4050,
        types: ['sbahn'],
        lines: 'S1,S2'
      });

      await createTestPublicTransportPoint({
        name: 'TEST_Station 2',
        latitude: 52.5100,
        longitude: 13.4000,
        types: ['ubahn'],
        lines: 'U5'
      });

      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Check that returned points have TEST_ prefix (or filter them)
      const testPoints = response.body.filter((p: { name: string }) => p.name.startsWith('TEST_'));
      expect(testPoints.length).toBeGreaterThanOrEqual(2);
    });

    it('should return public transport points with correct structure', async () =>
    {
      await createTestPublicTransportPoint({
        name: 'TEST_Test Station',
        latitude: 52.5200,
        longitude: 13.4050,
        types: ['sbahn', 'tram'],
        lines: 'S1,S2,M10'
      });

      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const testPoint = response.body.find((p: { name: string }) => p.name === 'TEST_Test Station');
      expect(testPoint).toBeDefined();
      expect(testPoint).toHaveProperty('id');
      expect(testPoint).toHaveProperty('name');
      expect(testPoint).toHaveProperty('latitude');
      expect(testPoint).toHaveProperty('longitude');
      expect(testPoint).toHaveProperty('lines');
      expect(testPoint).toHaveProperty('types');
      expect(testPoint.name).toBe('TEST_Test Station');
      expect(testPoint.latitude).toBe(52.5200);
      expect(testPoint.longitude).toBe(13.4050);
      expect(testPoint.lines).toBe('S1,S2,M10');
      expect(Array.isArray(testPoint.types)).toBe(true);
      expect(testPoint.types).toContain('sbahn');
      expect(testPoint.types).toContain('tram');
    });

    it('should return empty array when no public transport points exist', async () =>
    {
      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Filter out any non-TEST points that might exist
      const testPoints = response.body.filter((p: { name: string }) => p.name.startsWith('TEST_'));
      expect(testPoints.length).toBe(0);
    });

    it('should handle multiple types correctly', async () =>
    {
      await createTestPublicTransportPoint({
        name: 'TEST_Multi Type Station',
        latitude: 52.5200,
        longitude: 13.4050,
        types: ['train', 'sbahn', 'ubahn', 'tram'],
        lines: 'ICE,S1,U5,M10'
      });

      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      const testPoint = response.body.find((p: { name: string }) => p.name === 'TEST_Multi Type Station');
      expect(testPoint).toBeDefined();
      expect(testPoint.types.length).toBe(4);
      expect(testPoint.types).toContain('train');
      expect(testPoint.types).toContain('sbahn');
      expect(testPoint.types).toContain('ubahn');
      expect(testPoint.types).toContain('tram');
    });

    it('should handle stations without lines', async () =>
    {
      // Create point with null lines by not providing lines parameter
      const point = await createTestPublicTransportPoint({
        name: 'TEST_No Lines Station',
        latitude: 52.5200,
        longitude: 13.4050,
        types: ['sbahn']
      });
      
      // Manually update to set lines to null
      await prisma.publicTransportPoint.update({
        where: { id: point.id },
        data: { lines: null }
      });

      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      const testPoint = response.body.find((p: { name: string }) => p.name === 'TEST_No Lines Station');
      expect(testPoint).toBeDefined();
      expect(testPoint.lines).toBe('');
    });

    it('should not require authentication', async () =>
    {
      await createTestPublicTransportPoint({
        name: 'TEST_Public Station',
        latitude: 52.5200,
        longitude: 13.4050,
        types: ['sbahn']
      });

      // Request without authentication header
      const response = await request(app)
        .get('/api/public-transport');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
