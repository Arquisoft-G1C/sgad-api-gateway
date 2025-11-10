package com.Gateway.APIGateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("auth-service", r -> r
                .path("/auth/**")
                .uri("http://localhost:3001"))  // cambia por la URL real de tu microservicio
            .route("match-management", r -> r
                .path("/matches/**")
                .uri("http://localhost:8001"))
            .route("referee-management", r -> r
                .path("/referees/**")
                .uri("http://localhost:3004"))
            .route("availability-service", r -> r
                .path("/availability/**")
                .uri("http://localhost:8000"))
            .build();
    }
}
