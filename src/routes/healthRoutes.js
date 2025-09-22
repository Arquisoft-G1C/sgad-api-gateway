const express = require('express');
const { checkServiceHealth } = require('../middleware/authMiddleware');

const router = express.Router();

// URLs de servicios
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  matches: process.env.MATCH_SERVICE_URL || 'http://localhost:3002',
  ingestion: process.env.INGESTION_SERVICE_URL || 'http://localhost:3003',
  eligibility: process.env.ELIGIBILITY_SERVICE_URL || 'http://localhost:3004',
  tariffs: process.env.TARIFF_SERVICE_URL || 'http://localhost:3005',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:8080',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006'
};

// ================================
// HEALTH CHECK DEL GATEWAY
// ================================

router.get('/', (req, res) => {
  res.status(200).json({
    service: 'sgad-api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      detailed: '/health/detailed',
      services: '/health/services'
    }
  });
});

// ================================
// HEALTH CHECK DETALLADO
// ================================

router.get('/detailed', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.status(200).json({
    service: 'sgad-api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(uptime),
      human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  });
});

// ================================
// HEALTH CHECK DE SERVICIOS
// ================================

router.get('/services', async (req, res) => {
  const serviceStatus = {};
  const checks = [];
  
  // Crear promesas para verificar todos los servicios
  Object.entries(services).forEach(([name, url]) => {
    checks.push(
      checkServiceHealth(url)
        .then(isHealthy => {
          serviceStatus[name] = {
            url,
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
          };
        })
        .catch(error => {
          serviceStatus[name] = {
            url,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        })
    );
  });
  
  // Esperar todas las verificaciones (máximo 5 segundos)
  try {
    await Promise.allSettled(checks);
    
    // Contar servicios saludables
    const healthyServices = Object.values(serviceStatus).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(serviceStatus).length;
    const isOverallHealthy = healthyServices > 0; // Al menos un servicio debe estar saludable
    
    res.status(isOverallHealthy ? 200 : 503).json({
      gateway: 'healthy',
      services: serviceStatus,
      summary: {
        total: totalServices,
        healthy: healthyServices,
        unhealthy: totalServices - healthyServices,
        overallStatus: isOverallHealthy ? 'healthy' : 'degraded'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      gateway: 'healthy',
      services: serviceStatus,
      error: 'Error al verificar servicios',
      timestamp: new Date().toISOString()
    });
  }
});

// ================================
// HEALTH CHECK DE SERVICIO ESPECÍFICO
// ================================

router.get('/service/:serviceName', async (req, res) => {
  const serviceName = req.params.serviceName;
  const serviceUrl = services[serviceName];
  
  if (!serviceUrl) {
    return res.status(404).json({
      error: 'Servicio no encontrado',
      availableServices: Object.keys(services),
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const isHealthy = await checkServiceHealth(serviceUrl);
    
    res.status(isHealthy ? 200 : 503).json({
      service: serviceName,
      url: serviceUrl,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      url: serviceUrl,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;