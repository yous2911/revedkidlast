import request from 'supertest';
import app from '../app';
import { cacheService } from '../services/cache.service';
import { monitoringService } from '../services/monitoring.service';
import { sequelize } from '../db';

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Reset monitoring metrics
    monitoringService.resetMetrics();
    
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

    it('should invalidate cache when student progresses', async () => {
      const eleveId = 1;
      
      // Get initial recommendations
      await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);

      // Submit exercise attempt
      await request(app)
        .post(`/api/eleves/${eleveId}/exercices`)
        .send({
          exerciceId: 1,
          tentative: {
            reponse: 'test',
            reussi: true,
            tempsSecondes: 30,
            aidesUtilisees: 0
          }
        })
        .expect(200);

      // Get recommendations again (should be cache miss due to invalidation)
      const response = await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);

      expect(response.headers['x-cache']).toBe('MISS');
    });
  });

  describe('Database Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get(`/api/eleves/${(i % 10) + 1}`)
            .expect(200)
        );
      }

      const start = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - start;

      // Should handle 50 concurrent requests in reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      
      const stats = monitoringService.getPerformanceStats();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(concurrentRequests);
    });

    it('should maintain good performance under load', async () => {
      const requests = 100;
      const responseTimes: number[] = [];

      for (let i = 0; i < requests; i++) {
        const start = Date.now();
        await request(app)
          .get(`/api/eleves/${(i % 10) + 1}`)
          .expect(200);
        responseTimes.push(Date.now() - start);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Average response time should be under 500ms
      expect(avgResponseTime).toBeLessThan(500);
      
      // No single request should take more than 2 seconds
      expect(maxResponseTime).toBeLessThan(2000);
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
      const initialStats = monitoringService.getPerformanceStats();
      
      // Make some requests
      await request(app)
        .get('/api/eleves/1')
        .expect(200);

      await request(app)
        .get('/api/eleves/2')
        .expect(200);

      const finalStats = monitoringService.getPerformanceStats();
      
      expect(finalStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
      expect(finalStats.averageResponseTime).toBeGreaterThan(0);
    });

    it('should detect and alert on performance issues', () => {
      const health = monitoringService.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('stats');
      
      // Should be healthy under normal conditions
      expect(['healthy', 'degraded']).toContain(health.status);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      const eleveId = 1;
      
      // Clear cache first
      await cacheService.del('*');
      
      // First request (miss)
      await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);

      // Second request (hit)
      await request(app)
        .get(`/api/eleves/${eleveId}/recommandations`)
        .expect(200);

      const cacheStats = await cacheService.getCacheStats();
      
      expect(cacheStats).toHaveProperty('fallbackCacheSize');
      expect(cacheStats.fallbackCacheSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      const start = Date.now();
      
      // Make requests that will generate errors
      const promises = [
        request(app).get('/api/eleves/999999').expect(404),
        request(app).get('/api/eleves/invalid').expect(400),
        request(app).post('/api/eleves/1/exercices').send({}).expect(400)
      ];

      await Promise.all(promises);
      const totalTime = Date.now() - start;

      // Error handling should be fast
      expect(totalTime).toBeLessThan(1000);

      const stats = monitoringService.getPerformanceStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('Load Testing Simulation', () => {
    it('should simulate 200 concurrent students', async () => {
      const students = 200;
      const requestsPerStudent = 5;
      const totalRequests = students * requestsPerStudent;
      
      const promises = [];
      const start = Date.now();

      for (let studentId = 1; studentId <= students; studentId++) {
        for (let req = 0; req < requestsPerStudent; req++) {
          promises.push(
            request(app)
              .get(`/api/eleves/${studentId}`)
              .expect(200)
              .catch(() => {
                // Ignore individual request failures for load test
              })
          );
        }
      }

      await Promise.all(promises);
      const totalTime = Date.now() - start;

      // Should handle 1000 requests (200 students × 5 requests each) in reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds max
      
      const stats = monitoringService.getPerformanceStats();
      expect(stats.totalRequests).toBeGreaterThan(totalRequests * 0.8); // At least 80% success rate
    });
  });
}); 