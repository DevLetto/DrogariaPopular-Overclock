package com.drogaria.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.drogaria.backend.dto.ProdutoResponse;
import com.drogaria.backend.entity.Categoria;
import com.drogaria.backend.entity.Produto;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.CategoriaRepository;
import com.drogaria.backend.repository.ProdutoRepository;
import com.drogaria.backend.repository.HistoricoPrecoRepository;
import com.drogaria.backend.entity.HistoricoPreco;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ProdutoService {

	private final ProdutoRepository produtoRepository;
	private final CategoriaRepository categoriaRepository;
	private final HistoricoPrecoRepository historicoRepository;

	public ProdutoService(ProdutoRepository produtoRepository, CategoriaRepository categoriaRepository,
			HistoricoPrecoRepository historicoRepository) {
		this.produtoRepository = produtoRepository;
		this.categoriaRepository = categoriaRepository;
		this.historicoRepository = historicoRepository;
	}

	public ProdutoResponse adicionar(Integer idCategoria, String nome, Double preco, String imagemURL,
			Integer necessitaReceita, Integer medicamentoControlado) {

		Produto produto = new Produto();
		if (idCategoria != null) {
			Categoria categoria = categoriaRepository.findById(idCategoria)
					.orElseThrow(() -> new ApiException("Categoria nao encontrada", HttpStatus.NOT_FOUND));
			produto.setCategoria(categoria);
		}
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
				.orElseThrow(() -> new ApiException("Produto nao encontrado", HttpStatus.NOT_FOUND));
		
		return new ProdutoResponse(produto);
		
		
	}

	public List<ProdutoResponse> listar() { return produtoRepository.findAll().stream().map(ProdutoResponse::new).toList(); }
	public List<ProdutoResponse> listarPorCategoria(Integer idCategoria) { return produtoRepository.findByCategoriaId(idCategoria).stream().map(ProdutoResponse::new).toList(); }

	public ProdutoResponse atualizar(Integer idProduto, com.drogaria.backend.dto.ProdutoRequest request) {
		Produto produto = produtoRepository.findById(idProduto).orElseThrow(() -> new ApiException("Produto nao encontrado", HttpStatus.NOT_FOUND));
		if (request.getPrecoProduto() != null && Double.compare(produto.getPrecoProduto(), request.getPrecoProduto()) != 0) {
			HistoricoPreco historico = new HistoricoPreco(); historico.setProduto(produto);
			historico.setPrecoAnterior(BigDecimal.valueOf(produto.getPrecoProduto())); historico.setPrecoNovo(BigDecimal.valueOf(request.getPrecoProduto()));
			historico.setDataAlteracao(LocalDateTime.now()); historicoRepository.save(historico);
			produto.setPrecoProduto(request.getPrecoProduto());
		}
		if (request.getNomeProduto() != null) produto.setNomeProduto(request.getNomeProduto());
		if (request.getImagemURL() != null) produto.setImagemURL(request.getImagemURL());
		return new ProdutoResponse(produtoRepository.save(produto));
	}
	public void excluir(Integer idProduto) { if (!produtoRepository.existsById(idProduto)) throw new ApiException("Produto nao encontrado", HttpStatus.NOT_FOUND); produtoRepository.deleteById(idProduto); }

}
