package com.drogaria.backend.controller;

import java.util.List;

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

import com.drogaria.backend.dto.CarrinhoRequest;
import com.drogaria.backend.dto.CarrinhoResponse;
import com.drogaria.backend.service.CarrinhoService;

@RestController
@RequestMapping("/api/carrinho")
public class CarrinhoController {

	private final CarrinhoService carrinhoService;

	public CarrinhoController(CarrinhoService carrinhoService) {
		this.carrinhoService = carrinhoService;
	}

	@GetMapping("/{idCliente}")
	public ResponseEntity<List<CarrinhoResponse>> buscar(@PathVariable Integer idCliente,
			Authentication authentication) {
		carrinhoService.validarAcesso(idCliente, authentication);
		return ResponseEntity.ok(carrinhoService.buscar(idCliente));
	}

	@PostMapping
	public ResponseEntity<CarrinhoResponse> adicionar(@RequestBody CarrinhoRequest request,
			Authentication authentication){
		carrinhoService.validarAcesso(request.getIdCliente(), authentication);
		
		return ResponseEntity.ok(
				carrinhoService.adicionar(
						request.getIdCliente(),
						request.getIdProduto(),
						request.getQuantidade(),
						request.getSalvoParaDepois()
						)
				
				);
	}

	@PutMapping("/{idCliente}/{idProduto}")
	public ResponseEntity<CarrinhoResponse> editar(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto, 
			@RequestBody CarrinhoRequest request, Authentication authentication){
		carrinhoService.validarAcesso(idCliente, authentication);
			
		return ResponseEntity.ok(
				carrinhoService.editar(
						idCliente,
						idProduto,
						request.getQuantidade(),
						request.getSalvoParaDepois()
						));
		
	}
	
	@DeleteMapping("/{idCliente}/{idProduto}")
	public ResponseEntity<CarrinhoResponse> deletar(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto, Authentication authentication){
		carrinhoService.validarAcesso(idCliente, authentication);
		
		return ResponseEntity.ok(
				carrinhoService.deletar(idCliente, idProduto));
	}
}
