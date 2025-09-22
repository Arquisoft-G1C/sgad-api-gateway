// SGAD API Gateway - Punto de entrada único
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Importar rutas y middleware
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { validateJWT, optionalAuth } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// MIDDLEWARE DE SEGURIDAD Y UTILIDAD
// ================================

// Helmet para headers de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compresión gzip
app.use(compression());

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// CORS configurado para múltiples orígenes
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3007',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Rate limiting estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos de auth por IP
  message: {
    error: 'Demasiados intentos de autenticación, intenta nuevamente en 15 minutos'
  }
});

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// RUTAS DIRECTAS (SIN PROXY)
// ================================

// Health check del gateway
app.use('/health', healthRoutes);

// Rutas de autenticación con rate limiting especial
app.use('/api/auth', authLimiter, authRoutes);

// ================================
// CONFIGURACIÓN DE PROXIES
// ================================

// Configuraciones de servicios
const services = {
  auth: {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: {
      '^/api/auth': '/auth'
    }
  },
  matches: {
    target: process.env.MATCH_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: {
      '^/api/matches': '/matches'
    }
  },
  ingestion: {
    target: process.env.INGESTION_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: {
      '^/api/ingestion': '/ingestion'
    }
  },
  eligibility: {
    target: process.env.ELIGIBILITY_SERVICE_URL || 'http://localhost:3004',
    pathRewrite: {
      '^/api/eligibility': '/eligibility'
    }
  },
  tariffs: {
    target: process.env.TARIFF_SERVICE_URL || 'http://localhost:3005',
    pathRewrite: {
      '^/api/tariffs': '/tariffs'
    }
  },
  billing: {
    target: process.env.BILLING_SERVICE_URL || 'http://localhost:8080',
    pathRewrite: {
      '^/api/billing': '/billing'
    }
  },
  notifications: {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    pathRewrite: {
      '^/api/notifications': '/notifications'
    }
  }
};

// ================================
// PROXY MIDDLEWARE PARA SERVICIOS
// ================================

// Crea un proxy con autenticación opcional
function createAuthenticatedProxy(serviceConfig, requireAuth = false) {
  return [
    requireAuth ? validateJWT : optionalAuth,
    createProxyMiddleware({
      target: serviceConfig.target,
      changeOrigin: true,
      pathRewrite: serviceConfig.pathRewrite,
      timeout: 30000,
      
      // Logging en desarrollo
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
      
      // Headers adicionales
      onProxyReq: (proxyReq, req, res) => {
        // Pasar información de usuario si está autenticado
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
          proxyReq.setHeader('X-User-Email', req.user.email);
        }
        
        // Logging en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Proxy: ${req.method} ${req.originalUrl} → ${serviceConfig.target}${proxyReq.path}`);
        }
      },
      
      // Manejo de errores
      onError: (err, req, res) => {
        console.error(`❌ Proxy error para ${serviceConfig.target}:`, err.message);
        
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Servicio no disponible',
            message: 'El servicio solicitado no está disponible en este momento',
            service: serviceConfig.target
          });
        }
      }
    })
  ];
}

// ================================
// CONFIGURAR RUTAS DE PROXY
// ================================

// Autenticación
app.use('/api/auth', ...createAuthenticatedProxy(services.auth, false));
app.use('/api/matches', ...createAuthenticatedProxy(services.matches, true));
app.use('/api/eligibility', ...createAuthenticatedProxy(services.eligibility, true));
app.use('/api/tariffs', ...createAuthenticatedProxy(services.tariffs, true));
app.use('/api/billing', ...createAuthenticatedProxy(services.billing, true));
app.use('/api/ingestion', ...createAuthenticatedProxy(services.ingestion, false));
app.use('/api/notifications', ...createAuthenticatedProxy(services.notifications, false));

// ================================
// MIDDLEWARE DE DOCUMENTACIÓN API
// ================================

// Endpoint para listar todos los servicios disponibles
app.get('/api', (req, res) => {
  res.json({
    message: 'SGAD API Gateway',
    version: '1.0.0',
    services: {
      auth: {
        url: '/api/auth',
        description: 'Servicio de autenticación y autorización',
        methods: ['POST /login', 'GET /verify', 'POST /logout']
      },
      matches: {
        url: '/api/matches',
        description: 'Gestión de partidos y equipos',
        methods: ['GET /', 'POST /', 'PUT /:id', 'DELETE /:id'],
        auth: 'required'
      },
      eligibility: {
        url: '/api/eligibility',
        description: 'Motor de elegibilidad de árbitros',
        methods: ['POST /check', 'GET /suggestions'],
        auth: 'required'
      },
      tariffs: {
        url: '/api/tariffs',
        description: 'Gestión de tarifas y cálculos',
        methods: ['GET /', 'POST /', 'PUT /:id'],
        auth: 'required'
      },
      billing: {
        url: '/api/billing',
        description: 'Facturación y generación de QR',
        methods: ['GET /invoices', 'POST /generate'],
        auth: 'required'
      },
      ingestion: {
        url: '/api/ingestion',
        description: 'Procesamiento de archivos CSV/Excel',
        methods: ['POST /upload', 'GET /status']
      },
      notifications: {
        url: '/api/notifications',
        description: 'Sistema de notificaciones',
        methods: ['GET /', 'POST /send']
      }
    },
    documentation: 'https://docs.sgad.com/api'
  });
});

// ================================
// MANEJO DE ERRORES
// ================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableEndpoints: [
      '/api',
      '/health',
      '/api/auth/*',
      '/api/matches/*',
      '/api/eligibility/*',
      '/api/tariffs/*',
      '/api/billing/*',
      '/api/ingestion/*',
      '/api/notifications/*'
    ]
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('Error global en API Gateway:', error);
  
  // Error de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'El cuerpo de la petición no es un JSON válido'
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ha ocurrido un error inesperado'
  });
});

// ================================
// INICIO DEL SERVIDOR
// ================================

app.listen(PORT, () => {
  console.log(`🚀 SGAD API Gateway corriendo en puerto ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API docs: http://localhost:${PORT}/api`);
  console.log(`🌐 CORS habilitado para: ${corsOptions.origin.join(', ')}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Mostrar servicios configurados
  console.log('🔗 Servicios configurados:');
  Object.entries(services).forEach(([name, config]) => {
    console.log(`   ${name}: ${config.target}`);
  });
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 API Gateway recibió SIGTERM, cerrando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 API Gateway recibió SIGINT, cerrando...');
  process.exit(0);
});

module.exports = app;