package com.Gateway.APIGateway;

import org.springframework.cloud.gateway.server.mvc.filter.FilterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.filter.FilterFunctions.setPath;

@Configuration
public class GatewayConfig {

    @Bean
    public RouterFunction<ServerResponse> gatewayRoutes() {
        return route("auth-service")
                .route(RequestPredicates.path("/auth/**"), HandlerFunctions.http("http://auth-service:3001"))
                .filter(FilterFunctions.stripPrefix(0))
                .build()
            .and(route("match-management")
                .route(RequestPredicates.path("/matches/**"), HandlerFunctions.http("http://match-service:8000"))
                .filter(FilterFunctions.stripPrefix(0))
                .build())
            .and(route("referee-management")
                .route(RequestPredicates.path("/referees/**"), HandlerFunctions.http("http://referee-service:3004"))
                .filter(FilterFunctions.stripPrefix(0))
                .build())
            .and(route("availability-service")
                .route(RequestPredicates.path("/availability/**"), HandlerFunctions.http("http://availability-service:8000"))
                .filter(FilterFunctions.stripPrefix(0))
                .build());
    }
}
