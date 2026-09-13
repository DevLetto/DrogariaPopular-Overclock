package com.drogaria.backend.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.drogaria.backend.dto.ClienteResponse;
import com.drogaria.backend.dto.ClienteUpdateRequest;
import com.drogaria.backend.service.CarrinhoService;
import com.drogaria.backend.service.ClienteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cliente")
public class ClienteController {

    private final ClienteService s;
    private final CarrinhoService a;

    public ClienteController(
            ClienteService s,
            CarrinhoService a) {

        this.s = s;
        this.a = a;
    }


    @GetMapping
    public List<ClienteResponse> listarTodos() {
        return s.listarTodos();
    }


    @GetMapping("/{id}")
    public ClienteResponse buscar(
            @PathVariable Integer id,
            Authentication x) {

        a.validarAcesso(id, x);

        return s.buscar(id);
    }


    @PutMapping("/{id}")
    public ClienteResponse atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ClienteUpdateRequest r,
            Authentication x) {

        a.validarAcesso(id, x);

        return s.atualizar(id, r);
    }


    @PutMapping("/{id}/aprovacao")
    public ClienteResponse atualizarAprovacao(
            @PathVariable Integer id,
            @RequestParam boolean aprovado) {

        return s.atualizarAprovacao(id, aprovado);
    }


    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Integer id,
            Authentication x) {

        a.validarAcesso(id, x);

        s.excluir(id);
    }

}