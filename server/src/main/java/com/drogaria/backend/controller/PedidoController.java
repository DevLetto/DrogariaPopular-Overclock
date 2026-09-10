package com.drogaria.backend.controller;

import com.drogaria.backend.dto.PedidoRequest;
import com.drogaria.backend.dto.PedidoResponse;
import com.drogaria.backend.service.CarrinhoService;
import com.drogaria.backend.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pedido")
public class PedidoController {
    private final PedidoService pedidoService;
    private final CarrinhoService carrinhoService;
    public PedidoController(PedidoService pedidoService, CarrinhoService carrinhoService) {
        this.pedidoService = pedidoService; this.carrinhoService = carrinhoService;
    }
    @PostMapping("/{idCliente}")
    public ResponseEntity<PedidoResponse> criar(@PathVariable Integer idCliente, @Valid @RequestBody PedidoRequest request, Authentication auth) {
        carrinhoService.validarAcesso(idCliente, auth); return ResponseEntity.ok(pedidoService.criar(idCliente, request));
    }
    @GetMapping("/{id}") public ResponseEntity<PedidoResponse> buscar(@PathVariable Integer id) { return ResponseEntity.ok(pedidoService.buscar(id)); }
    @GetMapping("/cliente/{idCliente}") public ResponseEntity<List<PedidoResponse>> listar(@PathVariable Integer idCliente, Authentication auth) {
        carrinhoService.validarAcesso(idCliente, auth); return ResponseEntity.ok(pedidoService.listarPorCliente(idCliente));
    }
    @PutMapping("/{id}/status") public PedidoResponse status(@PathVariable Integer id, @RequestParam String valor) {
        return pedidoService.atualizarStatus(id, valor);
    }
    @PutMapping("/{id}/cancelar") public PedidoResponse cancelar(@PathVariable Integer id) {
        return pedidoService.cancelar(id);
    }
}