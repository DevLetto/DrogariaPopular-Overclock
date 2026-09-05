package com.drogaria.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
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

	@GetMapping("/{idUsuario}")
	public ResponseEntity<List<CarrinhoResponse>> buscar(@PathVariable Integer idUsuario) {
		return ResponseEntity.ok(carrinhoService.buscar(idUsuario));
	}

	@PostMapping
	public ResponseEntity<CarrinhoResponse> adicionar(@RequestBody CarrinhoRequest request){
		
		return ResponseEntity.ok(
				carrinhoService.adicionar(
						request.getIdUsuario(),
						request.getIdProduto(),
						request.getQuantidade(),
						request.getSalvoParaDepois()
						)
				
				);
	}

	@PutMapping("/{idUsuario}/{idProduto}")
	public ResponseEntity<CarrinhoResponse> editar(@PathVariable Integer idUsuario,
			@PathVariable Integer idProduto, 
			@RequestBody CarrinhoRequest request){
			
		return ResponseEntity.ok(
				carrinhoService.editar(
						idUsuario, 
						idProduto,
						request.getQuantidade(),
						request.getSalvoParaDepois()
						));
		
	}
	
	@DeleteMapping("/{idUsuario}/{idProduto}")
	public ResponseEntity<CarrinhoResponse> deletar(@PathVariable Integer idUsuario,
			@PathVariable Integer idProduto){
		
		return ResponseEntity.ok(
				carrinhoService.deletar(idUsuario, idProduto));
	}
}
