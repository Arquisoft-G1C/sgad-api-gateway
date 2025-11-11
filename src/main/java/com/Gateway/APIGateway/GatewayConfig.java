package com.Gateway.APIGateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${AUTH_SERVICE_URL:http://localhost:3001}")
    private String authServiceUrl;

    @Value("${MATCH_SERVICE_URL:http://localhost:8001}")
    private String matchServiceUrl;

    @Value("${REFEREE_SERVICE_URL:http://localhost:3004}")
    private String refereeServiceUrl;

    @Value("${AVAILABILITY_SERVICE_URL:http://localhost:8000}")
    private String availabilityServiceUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("auth-service", r -> r
                .path("/auth/**")
                .uri(authServiceUrl))
            .route("match-management", r -> r
                .path("/matches/**")
                .uri(matchServiceUrl))
            .route("referee-management", r -> r
                .path("/referees/**")
                .uri(refereeServiceUrl))
            .route("availability-service", r -> r
                .path("/availability/**")
                .uri(availabilityServiceUrl))
            .build();
    }
}