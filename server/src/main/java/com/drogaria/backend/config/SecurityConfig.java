
package com.drogaria.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.security.enabled:true}")
    private boolean securityEnabled;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        if (!securityEnabled) {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth ->
                    auth.anyRequest().permitAll()
                );

            return http.build();
        }

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(
                    CookieCsrfTokenRepository.withHttpOnlyFalse()
                )
                .ignoringRequestMatchers(
                    "/api/auth/login",
                    "/api/auth/cadastro"
                )
            )
            .cors(cors -> {})
            .securityContext(context ->
                context.requireExplicitSave(false)
            )
            .authorizeHttpRequests(auth -> auth

                // Autenticação pública
                .requestMatchers(
                    "/api/auth/csrf",
                    "/api/auth/login",
                    "/api/auth/cadastro"
                ).permitAll()

                // Consultas públicas
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/produto/**",
                    "/api/categoria/**",
                    "/api/loja/**",
                    "/api/servico/**",
                    "/api/promocao/**"
                ).permitAll()

                // Gerenciamento de funcionários
                .requestMatchers(
                    "/api/funcionario/**"
                ).hasAuthority("ROLE_ADMINISTRADOR")

                // Gerenciamento administrativo
                .requestMatchers(
                    "/api/estoque/**",
                    "/api/lote/**",
                    "/api/solicitacao-cadastro/**",
                    "/api/log-auditoria/**"
                ).hasAuthority("ROLE_ADMINISTRADOR")

                // Alterações em produtos e promoções
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/produto/**",
                    "/api/promocao/**"
                ).hasAuthority("ROLE_ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/produto/**",
                    "/api/promocao/**"
                ).hasAuthority("ROLE_ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/produto/**",
                    "/api/promocao/**"
                ).hasAuthority("ROLE_ADMINISTRADOR")

                // Aprovação e rejeição de receitas
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/receita/*/aprovar",
                    "/api/receita/*/rejeitar"
                ).hasAuthority("ROLE_FARMACEUTICO")
                
                                // Pedidos: consultas gerais para administrador e atendente
                .requestMatchers(HttpMethod.GET, "/api/pedido")
                    .hasAnyAuthority(
                        "ROLE_ADMINISTRADOR",
                        "ROLE_ATENDENTE"
                    )

                // Atualização de status para administrador e atendente
                .requestMatchers(HttpMethod.PUT, "/api/pedido/*/status")
                    .hasAnyAuthority(
                        "ROLE_ADMINISTRADOR",
                        "ROLE_ATENDENTE"
                    )

                // Receitas: consulta de todas as receitas para os funcionários autorizados
                .requestMatchers(HttpMethod.GET, "/api/receita")
                    .hasAnyAuthority(
                        "ROLE_ADMINISTRADOR",
                        "ROLE_FARMACEUTICO"
                    )

                // Aprovação e rejeição somente por farmacêuticos
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/receita/*/aprovar",
                    "/api/receita/*/rejeitar"
                )
                    .hasAuthority("ROLE_FARMACEUTICO")
                // Demais rotas exigem autenticação
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                })
            );

        return http.build();
    }
}
