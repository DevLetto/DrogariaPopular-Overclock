package com.drogaria.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        if (!securityEnabled) {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

            return http.build();
        }

        http
                .csrf(csrf -> csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .ignoringRequestMatchers("/api/auth/login", "/api/auth/cadastro"))
                .cors(cors -> {})
                .securityContext(context -> context.requireExplicitSave(false))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/cadastro").permitAll()
                        .requestMatchers("GET", "/api/produto/**").permitAll()
                        .requestMatchers("GET", "/api/loja/**", "/api/servico/**", "/api/promocao/**").permitAll()
                        .requestMatchers("/api/funcionario/**", "/api/estoque/**", "/api/lote/**",
                            "/api/categoria/**", "/api/promocao/**", "/api/solicitacao-cadastro/**",
                            "/api/log-auditoria/**", "/api/produto/**")
                            .hasAuthority("ROLE_ADMINISTRADOR")
                        .requestMatchers("PUT", "/api/receita/*/aprovar", "/api/receita/*/rejeitar")
                            .hasAuthority("ROLE_FARMACEUTICO")
                        .anyRequest().authenticated())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"));

        return http.build();
    }
}