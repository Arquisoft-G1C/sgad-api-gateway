# ==================================================
# STAGE 1: Compilar el proyecto con Maven
# ==================================================
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de Maven
COPY pom.xml .
COPY src ./src

# Compilar y empaquetar el JAR (sin ejecutar tests)
RUN mvn clean package -DskipTests


# ==================================================
# STAGE 2: Crear imagen ligera de ejecución
# ==================================================
FROM eclipse-temurin:21-jre-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar el JAR compilado desde la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Crear usuario no-root
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# Exponer el puerto donde corre el gateway
EXPOSE 8080

# Comando de inicio
ENTRYPOINT ["java", "-jar", "app.jar"]
