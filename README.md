# SGAD – API Gateway

Punto de entrada único para el **Sistema de Gestión de Árbitros y Designaciones (SGAD)**.  
El API Gateway recibe todas las solicitudes del **frontend** y las redirige a los microservicios correspondientes, añadiendo seguridad y organización al sistema.

---

## 📖 ¿Qué hace?

- Punto de entrada centralizado para todos los servicios.  
- Proxy inteligente hacia los microservicios.  
- Rate limiting y seguridad básica.  
- Autenticación centralizada (integra con `sgad-auth-service`).  
- Health checks de los servicios internos.  

---

## 🖼️ Tecnologías Utilizadas

- **Node.js** – entorno de ejecución.  
- **Express.js** – framework web para manejar rutas.  
- **Middleware personalizado** – seguridad, logging, validación.  
- **Docker** – despliegue contenerizado.  

---

## 📂 Estructura del Proyecto

```
sgad-api-gateway/
│── package.json           # Dependencias del proyecto
│── Dockerfile             # Imagen de Docker
│── .env.example           # Configuración de variables de entorno
│
└── src/
    ├── app.js             # Punto de entrada
    ├── routes/            # Definición de rutas hacia microservicios
    ├── middleware/        # Middleware (autenticación, logs, etc.)
    └── config/            # Configuración de servicios y endpoints
```

---

## ⚙️ Requisitos

- **Node.js 18+**
- **npm** como gestor de paquetes
- Docker (opcional, para despliegue contenerizado)

Instalar dependencias:

```bash
npm install
```

---

## ▶️ ¿Cómo usar?

1. Asegúrate de que `sgad-auth-service` esté corriendo.  
2. Copia `.env.example` a `.env` y ajusta configuración.  
3. Instala dependencias:  
   ```bash
   npm install
   ```  
4. Ejecuta el gateway:  
   ```bash
   npm start
   ```

El servicio quedará disponible en:  
```
http://localhost:3000
```

---

## 🔗 Endpoints Principales

- `GET /health` → Estado del gateway.  
- `GET /api` → Documentación de servicios configurados.  
- `POST /api/auth/login` → Login (proxy a auth-service).  
- `GET /api/auth/verify` → Verificar token.  
- `GET /health/services` → Estado de todos los microservicios.  

---

## 📡 Servicios Configurados

- **Auth Service**: puerto 3001  
- **Match Service**: puerto 3002  
- **Referee Service** (o Ingestion según la configuración actual): puerto 3003  
- **Billing Service** (opcional, futuro): puerto 8080  

*(Los puertos pueden ajustarse según la configuración del `.env` y del `docker-compose.yml` en `sgad-main`)*

---

## 🧪 Testing

Puedes probar el API Gateway con:  

```bash
GET http://localhost:3000/health
GET http://localhost:3000/api
POST http://localhost:3000/api/auth/login
```

---

## 🐳 Despliegue con Docker

1. Crear la imagen:
   ```bash
   docker build -t sgad-api-gateway .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -d -p 3000:3000 --env-file .env sgad-api-gateway
   ```

---

## 📡 Integración con SGAD

- El **API Gateway** es el **único punto de entrada** para el frontend.  
- Redirige tráfico hacia:  
  - `sgad-match-management` (gestión de partidos).  
  - `sgad-referee-management` (gestión de árbitros).  
  - `sgad-auth-service` (autenticación).  
- Se despliega junto con el resto de microservicios en el **docker-compose de `sgad-main`**.  

---

