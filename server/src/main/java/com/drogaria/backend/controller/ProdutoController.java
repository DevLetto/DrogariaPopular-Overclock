package com.drogaria.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.List;

import com.drogaria.backend.dto.ProdutoRequest;
import com.drogaria.backend.dto.ProdutoResponse;
import com.drogaria.backend.service.ProdutoService;

@Controller
@RequestMapping("/api/produto")
public class ProdutoController {
	
	private final ProdutoService produtoService;
	
	public ProdutoController(ProdutoService produtoService) {
		this.produtoService = produtoService;
	}
	
	@GetMapping("/{idProduto}")
	public ResponseEntity<ProdutoResponse> buscar(@PathVariable Integer idProduto){
		return ResponseEntity.ok(produtoService.buscar(idProduto));
	}

	@GetMapping
	public ResponseEntity<List<ProdutoResponse>> listar() { return ResponseEntity.ok(produtoService.listar()); }

	@GetMapping("/categoria/{idCategoria}")
	public ResponseEntity<List<ProdutoResponse>> listarPorCategoria(@PathVariable Integer idCategoria) {
		return ResponseEntity.ok(produtoService.listarPorCategoria(idCategoria));
	}
	
	@PostMapping
	public ResponseEntity<ProdutoResponse> adicionar(@RequestBody ProdutoRequest request){
		
		return ResponseEntity.ok(
				produtoService.adicionar(
						request.getIdCategoria(),
						request.getNomeProduto(),
						request.getPrecoProduto(),
						request.getImagemURL(),
						request.getNecessitaReceita(),
						request.getMedicamentoControlado()
						));
	}

	@PutMapping("/{idProduto}")
	public ResponseEntity<ProdutoResponse> atualizar(@PathVariable Integer idProduto, @RequestBody ProdutoRequest request) {
		return ResponseEntity.ok(produtoService.atualizar(idProduto, request));
	}

	@DeleteMapping("/{idProduto}")
	public ResponseEntity<Void> excluir(@PathVariable Integer idProduto) {
		produtoService.excluir(idProduto); return ResponseEntity.noContent().build();
	}

}
