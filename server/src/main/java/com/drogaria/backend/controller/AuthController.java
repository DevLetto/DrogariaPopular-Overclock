
package com.drogaria.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.drogaria.backend.dto.AuthResponse;
import com.drogaria.backend.dto.CadastroRequest;
import com.drogaria.backend.dto.LoginRequest;
import com.drogaria.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        return ResponseEntity.ok(
                authService.login(request, httpRequest)
        );
    }

    @PostMapping("/cadastro")
    public ResponseEntity<AuthResponse> cadastro(
            @Valid @RequestBody CadastroRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.cadastrar(request));
    }
}
