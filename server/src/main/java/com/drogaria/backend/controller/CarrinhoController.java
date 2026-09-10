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
		// carrinhoService.validarAcesso(idCliente, authentication);
		return ResponseEntity.ok(carrinhoService.buscar(idCliente));
	}

	@GetMapping("/cliente/{idCliente}")
	public ResponseEntity<List<CarrinhoResponse>> buscarPorCliente(@PathVariable Integer idCliente,
			Authentication authentication) {
		return buscar(idCliente, authentication);
	}

	@PostMapping
	public ResponseEntity<CarrinhoResponse> adicionar(@RequestBody CarrinhoRequest request,
			Authentication authentication) {
		Integer idCliente = resolveIdCliente(null, request);
		Integer idProduto = resolveIdProduto(null, request);

		if (idCliente == null || idProduto == null) {
			throw new IllegalArgumentException("idCliente e idProduto sao obrigatorios");
		}

		// carrinhoService.validarAcesso(idCliente, authentication);
		return ResponseEntity.ok(carrinhoService.adicionar(request.getIdCliente(), request.getIdProduto(), request.getQuantidade()));
	}

	@PutMapping("/{idCliente}/{idProduto}")
	public ResponseEntity<CarrinhoResponse> editar(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto,
			@RequestBody CarrinhoRequest request, Authentication authentication) {
		Integer idClienteResolvido = resolveIdCliente(idCliente, request);
		Integer idProdutoResolvido = resolveIdProduto(idProduto, request);

		// carrinhoService.validarAcesso(idClienteResolvido, authentication);
		CarrinhoResponse resultado = carrinhoService.editar(idClienteResolvido, idProdutoResolvido,
				request.getQuantidade());

		return resultado == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(resultado);
	}

	@PutMapping("/cliente/{idCliente}/produto/{idProduto}")
	public ResponseEntity<CarrinhoResponse> editarPorCliente(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto,
			@RequestBody CarrinhoRequest request, Authentication authentication) {
		return editar(idCliente, idProduto, request, authentication);
	}

	@DeleteMapping("/{idCliente}/{idProduto}")
	public ResponseEntity<Void> deletar(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto, Authentication authentication) {
		// carrinhoService.validarAcesso(idCliente, authentication);
		carrinhoService.deletar(idCliente, idProduto);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/cliente/{idCliente}/produto/{idProduto}")
	public ResponseEntity<Void> deletarPorCliente(@PathVariable Integer idCliente,
			@PathVariable Integer idProduto, Authentication authentication) {
		return deletar(idCliente, idProduto, authentication);
	}

	private Integer resolveIdCliente(Integer idClientePath, CarrinhoRequest request) {
		if (idClientePath != null) {
			return idClientePath;
		}
		if (request == null) {
			return null;
		}
		if (request.getIdCliente() != null) {
			return request.getIdCliente();
		}
		return request.getIdUsuario();
	}

	private Integer resolveIdProduto(Integer idProdutoPath, CarrinhoRequest request) {
		if (idProdutoPath != null) {
			return idProdutoPath;
		}
		if (request == null) {
			return null;
		}
		return request.getIdProduto();
	}
}