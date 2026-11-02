package com.drogaria.backend.controller;
import com.drogaria.backend.dto.PagamentoResponse; import com.drogaria.backend.service.PagamentoService; import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController
@RequestMapping("/api/pagamento")
public class PagamentoController {
    private final PagamentoService s;

    public PagamentoController(PagamentoService s) {
        this.s = s;
    }

    @GetMapping("/{id}")
    public PagamentoResponse buscar(
            @PathVariable Integer id,
            Authentication authentication) {
        return s.buscar(id, authentication);
    }

    @GetMapping("/pedido/{idPedido}")
    public PagamentoResponse pedido(
            @PathVariable Integer idPedido,
            Authentication authentication) {
        return s.pedido(idPedido, authentication);
    }

    @PutMapping("/{id}/status")
    public PagamentoResponse status(
            @PathVariable Integer id,
            @RequestParam String valor,
            Authentication authentication) {
        return s.status(id, valor, authentication);
    }
}