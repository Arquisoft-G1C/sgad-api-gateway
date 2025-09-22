const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// ================================
// MIDDLEWARE: VALIDATE JWT
// ================================

async function validateJWT(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autorización requerido',
        message: 'Debes proporcionar un token válido en el header Authorization'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Opción 1: Validar localmente
    if (JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Crear objeto user básico desde el token
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          refereeId: decoded.refereeId
        };
        
        req.token = token;
        
        // Log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Usuario autenticado: ${req.user.email} (${req.user.role})`);
        }
        
        return next();
        
      } catch (jwtError) {
        // Si falla validación local, intentar con auth service
        console.log('⚠️ Validación JWT local falló, consultando auth service...');
      }
    }
    
    // Opción 2: Validar con auth service
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
      
      if (response.data.success && response.data.data.user) {
        req.user = response.data.data.user;
        req.token = token;
        
        // Log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Usuario verificado por auth service: ${req.user.email} (${req.user.role})`);
        }
        
        return next();
      }
      
      throw new Error('Token inválido según auth service');
      
    } catch (authServiceError) {
      console.error('❌ Error al validar con auth service:', authServiceError.message);
      
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido o ha expirado'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en validateJWT middleware:', error.message);
    
    return res.status(500).json({
      error: 'Error de autenticación',
      message: 'Error interno al validar el token'
    });
  }
}

// ================================
// MIDDLEWARE: OPTIONAL AUTH
// ================================

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Si no hay header, continuar sin autenticación
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    // Intentar validar con JWT local
    if (JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          refereeId: decoded.refereeId
        };
        
        req.token = token;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Usuario opcional autenticado: ${req.user.email}`);
        }
        
        return next();
        
      } catch (jwtError) {
        // Token inválido, continuar sin usuario
        console.log('⚠️ Token opcional inválido, continuando sin autenticación');
      }
    }
    
    // Si falla JWT local, intentar con auth service
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 3000
      });
      
      if (response.data.success && response.data.data.user) {
        req.user = response.data.data.user;
        req.token = token;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Usuario opcional verificado: ${req.user.email}`);
        }
      }
      
    } catch (authServiceError) {
      // Error al verificar, continuar sin usuario
      console.log('⚠️ Error al verificar token opcional, continuando sin autenticación');
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Error en optionalAuth middleware:', error.message);
    // En caso de error, continuar sin autenticación
    next();
  }
}

// ================================
// MIDDLEWARE: REQUIRE ROLE
// ================================

/**
 * @param {string|array} allowedRoles - Rol(es) permitido(s)
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado',
          message: 'Debes estar autenticado para acceder a esta ruta'
        });
      }
      
      // Verificar que el usuario tenga el rol requerido
      if (!roles.includes(req.user.role)) {
        console.log(`⛔ Acceso denegado - Usuario: ${req.user.email}, Rol: ${req.user.role}, Requerido: ${roles.join(' o ')}`);
        
        return res.status(403).json({
          error: 'Permisos insuficientes',
          message: `Se requiere uno de estos roles: ${roles.join(', ')}`,
          userRole: req.user.role,
          requiredRoles: roles
        });
      }
      
      // Log para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Acceso autorizado - Usuario: ${req.user.email}, Rol: ${req.user.role}`);
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Error en requireRole middleware:', error.message);
      
      return res.status(500).json({
        error: 'Error de autorización',
        message: 'Error interno del servidor'
      });
    }
  };
}

// ================================
// MIDDLEWARE: ADMIN ONLY
// ================================

const requireAdmin = requireRole(['administrador', 'presidente']);

// ================================
// MIDDLEWARE: REFEREE OR ADMIN
// ================================

const requireRefereeOrAdmin = requireRole(['arbitro', 'administrador', 'presidente']);

// ================================
// UTILITY: CHECK SERVICE HEALTH
// ================================

/**
 * Verifica si un servicio está disponible
 * @param {string} serviceUrl - URL del servicio
 * @returns {Promise<boolean>} - True si el servicio está disponible
 */
async function checkServiceHealth(serviceUrl) {
  try {
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 3000
    });
    
    return response.status === 200;
    
  } catch (error) {
    console.log(`⚠️ Servicio no disponible: ${serviceUrl}`);
    return false;
  }
}

module.exports = {
  validateJWT,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireRefereeOrAdmin,
  checkServiceHealth
};