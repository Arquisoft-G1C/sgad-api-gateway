# 🧩 SGAD API Gateway

El **SGAD API Gateway** actúa como el punto de entrada principal para todos los clientes del sistema SGAD.  
Centraliza el enrutamiento hacia los diferentes microservicios, maneja las políticas de acceso, seguridad y control de tráfico, y unifica las peticiones provenientes de aplicaciones web y móviles.

---

## 🚀 Tecnologías utilizadas

- **Java 21**
- **Spring Boot 3**
- **Spring Cloud Gateway**
- **Maven**
- **Docker**

---

## 🏗️ Arquitectura general

El **API Gateway** enruta las peticiones hacia los microservicios correspondientes según el prefijo del path (`/auth/**`, `/matches/**`, `/referees/**`, etc.).

---

## 🧰 Requisitos previos

- [Java 21+](https://adoptium.net/)
- [Maven 3.9+](https://maven.apache.org/)
- (Opcional) [Docker](https://www.docker.com/) para despliegue contenedorizado

---

## ▶️ Ejecución local

### 🔹 1. Compilar y ejecutar con Maven
```bash
mvn clean package
java -jar target/api-gateway-0.0.1-SNAPSHOT.jar
```

El servicio quedará disponible en  
👉 `http://localhost:8080`

---

## 🐳 Ejecución con Docker

### 🔹 1. Construir la imagen
```bash
docker build -t sgad-api-gateway .
```

### 🔹 2. Ejecutar el contenedor
```bash
docker run -d -p 8080:8080 --name api-gateway sgad-api-gateway
```

### 🔹 3. Verificar que funciona
```bash
curl http://localhost:8080/actuator/health
```

---

## ⚡ Rutas principales

| Path | Servicio destino | Puerto |
|------|------------------|--------|
| `/auth/**` | Auth Service | 8000 |
| `/matches/**` | Match Management | 8001 |
| `/referees/**` | Referee Management | 8002 |
| `/availability/**` | Availability Service | 8003 |
| `/web/**` | Frontend Web (React) | 3000 |

---

## 🔐 Seguridad (futuro)

Se planea implementar autenticación con **JWT** y un **filtro global** para validar tokens antes de redirigir solicitudes hacia los microservicios.  
También se considerará **rate limiting** para control de tráfico y protección frente a abusos.

---

## 📦 Estructura del proyecto

```
api-gateway/
├── src/
│   ├── main/
│   │   ├── java/com/sgad/apigateway/
│   │   │   └── ApiGatewayApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── Dockerfile
└── README.md
```

---

## 🤝 Contribuir

1. Clona el repositorio  
   ```bash
   git clone https://github.com/<tu-organizacion>/sgad-api-gateway.git
   ```
2. Crea una rama para tus cambios  
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza commits descriptivos y crea un Pull Request.
