const express = require('express');
const axios = require('axios');

const router = express.Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// ================================
// PROXY DIRECTO PARA AUTENTICACIÓN (auth)
// ================================

router.post('/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, req.body, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SGAD-API-Gateway/1.0'
      }
    });
    
    // Log exitoso
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Login exitoso via gateway - ${req.body.email}`);
    }
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Error en proxy login:', error.message);
    
    if (error.response) {
      // Error del auth service
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      // Servicio no disponible
      res.status(503).json({
        error: 'Servicio de autenticación no disponible',
        message: 'El servicio de autenticación no está disponible en este momento'
      });
    } else if (error.code === 'TIMEOUT') {
      // Timeout
      res.status(504).json({
        error: 'Timeout',
        message: 'El servicio de autenticación tardó demasiado en responder'
      });
    } else {
      // Error genérico
      res.status(500).json({
        error: 'Error interno',
        message: 'Error al procesar la solicitud de login'
      });
    }
  }
});

router.get('/verify', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Error en proxy verify:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'No se puede verificar el token en este momento'
      });
    }
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/refresh`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Error en proxy refresh:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'No se puede refrescar el token en este momento'
      });
    }
  }
});

router.post('/logout', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/logout`, req.body, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Logout exitoso via gateway');
    }
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Error en proxy logout:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'No se puede cerrar sesión en este momento'
      });
    }
  }
});

router.get('/profile', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/profile`, {
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ Error en proxy profile:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        error: 'Servicio no disponible',
        message: 'No se puede obtener el perfil en este momento'
      });
    }
  }
});

module.exports = router;