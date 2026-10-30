package com.drogaria.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.drogaria.backend.dto.ProdutoRequest;
import com.drogaria.backend.dto.ProdutoResponse;
import com.drogaria.backend.service.ProdutoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/produto")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @PostMapping
    public ResponseEntity<ProdutoResponse> adicionar(
            @Valid @RequestBody ProdutoRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(produtoService.adicionar(request));
    }

    @GetMapping
    public List<ProdutoResponse> listar() {
        return produtoService.listar();
    }

    @GetMapping("/{id}")
    public ProdutoResponse buscar(@PathVariable Integer id) {
        return produtoService.buscar(id);
    }

    @GetMapping("/categoria/{idCategoria}")
    public List<ProdutoResponse> listarPorCategoria(
            @PathVariable Integer idCategoria) {

        return produtoService.listarPorCategoria(idCategoria);
    }

    @PutMapping("/{id}")
    public ProdutoResponse atualizar(
            @PathVariable Integer id,
            @RequestBody ProdutoRequest request) {

        return produtoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {

        produtoService.excluir(id);

        return ResponseEntity.noContent().build();
    }
}