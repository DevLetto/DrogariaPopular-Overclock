package com.drogaria.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class CsrfController {

    private final CookieCsrfTokenRepository csrfTokenRepository;

    public CsrfController() {
        this.csrfTokenRepository =
                CookieCsrfTokenRepository.withHttpOnlyFalse();
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(
            HttpServletRequest request,
            HttpServletResponse response) {

        System.out.println("CSRF CONTROLLER FOI CHAMADO");

        CsrfToken token =
                csrfTokenRepository.loadToken(request);

        if (token == null) {
            token =
                    csrfTokenRepository.generateToken(request);

            csrfTokenRepository.saveToken(
                    token,
                    request,
                    response
            );

            System.out.println(
                    "NOVO TOKEN CSRF GERADO: "
                    + token.getToken()
            );
        } else {
            System.out.println(
                    "TOKEN CSRF EXISTENTE: "
                    + token.getToken()
            );
        }

        Map<String, String> resposta =
                new HashMap<>();

        resposta.put(
                "token",
                token.getToken()
        );

        resposta.put(
                "parameterName",
                token.getParameterName()
        );

        resposta.put(
                "headerName",
                token.getHeaderName()
        );

        return resposta;
    }
}