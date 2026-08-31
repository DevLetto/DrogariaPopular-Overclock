package com.drogaria.backend.service;

import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.ProdutoResponse;
import com.drogaria.backend.entity.Produto;
import com.drogaria.backend.repository.ProdutoRepository;

@Service
public class ProdutoService {

	private final ProdutoRepository produtoRepository;

	public ProdutoService(ProdutoRepository produtoRepository) {
		this.produtoRepository = produtoRepository;
	}

	public ProdutoResponse adicionar(Integer idCategoria, String nome, Double preco, String imagemURL,
			Integer necessitaReceita, Integer medicamentoControlado) {

		Produto produto = new Produto();
		produto.setIdCategoria(idCategoria);
		produto.setNomeProduto(nome);
		produto.setPrecoProduto(preco);
		produto.setImagemURL(imagemURL);
		produto.setNecessitaReceita(necessitaReceita);
		produto.setMedicamentoContolado(medicamentoControlado);

		Produto prodSalvo = produtoRepository.save(produto);

		return new ProdutoResponse(prodSalvo);
	}
	
	public ProdutoResponse buscar(Integer idProduto) {

		
		Produto produto = produtoRepository.findById(idProduto)
				.orElseThrow();
		
		return new ProdutoResponse(produto);
		
		
	}

}
