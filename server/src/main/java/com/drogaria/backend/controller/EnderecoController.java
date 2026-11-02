package com.drogaria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.drogaria.backend.dto.EnderecoRequest;
import com.drogaria.backend.entity.Endereco;
import com.drogaria.backend.service.CarrinhoService;
import com.drogaria.backend.service.EnderecoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/endereco")
public class EnderecoController {

    private final EnderecoService s;
    private final CarrinhoService a;

    public EnderecoController(EnderecoService s, CarrinhoService a) {
        this.s = s;
        this.a = a;
    }

    @PostMapping
    public ResponseEntity<Endereco> salvar(
            @Valid @RequestBody EnderecoRequest r,
            Authentication x) {
        a.validarAcesso(r.getIdCliente(), x);
        return ResponseEntity.status(HttpStatus.CREATED).body(s.salvar(r));
    }

    @GetMapping("/cliente/{id}")
    public List<Endereco> cliente(
            @PathVariable Integer id,
            Authentication x) {
        a.validarAcesso(id, x);
        return s.cliente(id);
    }

    @GetMapping("/{id}")
    public Endereco buscar(
            @PathVariable Integer id,
            Authentication authentication) {
        return s.buscar(id, authentication);
    }

    @PutMapping("/{id}")
    public Endereco atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody EnderecoRequest r,
            Authentication authentication) {
        return s.atualizar(id, r, authentication);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable Integer id,
            Authentication authentication) {
        s.excluir(id, authentication);
        return ResponseEntity.noContent().build();
    }
}