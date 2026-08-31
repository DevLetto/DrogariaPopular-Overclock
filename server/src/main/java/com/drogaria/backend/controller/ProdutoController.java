package com.drogaria.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

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

}
