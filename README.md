# SGAD API Gateway

Punto de entrada único para el Sistema de Gestión de Árbitros Deportivos.

## ¿Qué hace?

* Punto de entrada centralizado para todos los servicios
* Proxy inteligente a microservicios
* Rate limiting y seguridad
* Autenticación centralizada
* Health checks de servicios

## ¿Cómo usar?

1. Asegúrate que `sgad-auth-service` esté corriendo
2. Instala dependencias: `npm install`
3. Copia `.env.example` a `.env` y ajusta configuración
4. Ejecuta: `npm start`

## Endpoints Principales

* `GET /health` - Estado del gateway
* `GET /api` - Documentación de servicios
* `POST /api/auth/login` - Login (proxy a auth-service)
* `GET /api/auth/verify` - Verificar token
* `GET /health/services` - Estado de todos los servicios

## Servicios Configurados

* Auth Service: puerto 3001
* Match Service: puerto 3002
* Ingestion Service: puerto 3003
* Billing Service: puerto 8080

## Testing

Prueba con:

```
GET http://localhost:3000/health
GET http://localhost:3000/api
POST http://localhost:3000/api/auth/login
```

## Puerto

Corre en: `localhost:3000`
