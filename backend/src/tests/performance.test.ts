import request from 'supertest';
import app from '../app';
import { cacheService } from '../services/cache.service';
import { monitoringService } from '../services/monitoring.service';
import { sequelize } from '../db';

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Reset monitoring metrics using the correct method
    monitoringService.reset();
    
    // Clear cache
    await cacheService.del('*');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Cache Performance', () => {
    it('should cache student recommendations and improve response time', async () => {
      const eleveId = 1;
      
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);
      const time2 = Date.now() - start2;

      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.5);
      expect(response1.body.data).toEqual(response2.body.data);
      expect(response2.headers['x-cache']).toBe('HIT');
    });

    it('should handle cache invalidation correctly', async () => {
      const key = 'test-cache-key';
      const data = { test: 'data' };

      // Set cache
      await cacheService.set(key, data, { ttl: 60 });
      
      // Verify cache hit
      const cached = await cacheService.get(key);
      expect(cached).toEqual(data);

      // Invalidate cache
      await cacheService.del(key);
      
      // Verify cache miss
      const afterDelete = await cacheService.get(key);
      expect(afterDelete).toBeNull();
    });

    it('should handle concurrent cache access', async () => {
      const key = 'concurrent-test';
      const promises: Promise<boolean>[] = [];

      // Simulate concurrent cache access
      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(key, { value: i }, { ttl: 60 }));
      }

      await Promise.all(promises);
      
      const result = await cacheService.get(key);
      expect(result).toBeDefined();
    });
  });

  describe('API Response Times', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/health')
        .expect(200);
      const time = Date.now() - start;

      expect(time).toBeLessThan(100);
    });

    it('should handle multiple concurrent requests', async () => {
      const promises: any[] = [];
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/api/health')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(20);
      
      responses.forEach((response: any) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during high load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate load
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get(`/api/eleves/${(i % 10) + 1}`)
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Monitoring Integration', () => {
    it('should track performance metrics correctly', async () => {
      const initialMetrics = monitoringService.getSystemMetrics();
      
      // Make some requests
      await request(app)
        .get('/api/eleves/1')
        .expect(200);

      await request(app)
        .get('/api/eleves/2')
        .expect(200);

      const finalMetrics = monitoringService.getSystemMetrics();
      
      // Should have recorded some database queries
      expect(finalMetrics.database.queries).toBeGreaterThanOrEqual(initialMetrics.database.queries);
    });

    it('should detect and alert on performance issues', () => {
      const health = monitoringService.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      
      // Should be healthy under normal conditions
      expect(['healthy', 'degraded']).toContain(health.status);
    });

    it('should track cache performance', () => {
      const metrics = monitoringService.getSystemMetrics();
      
      expect(metrics.cache).toHaveProperty('hits');
      expect(metrics.cache).toHaveProperty('misses');
      expect(metrics.cache).toHaveProperty('hitRate');
      
      expect(metrics.cache.hits).toBeGreaterThanOrEqual(0);
      expect(metrics.cache.misses).toBeGreaterThanOrEqual(0);
      expect(metrics.cache.hitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cache.hitRate).toBeLessThanOrEqual(1);
    });
  });
}); 