
package com.drogaria.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drogaria.backend.dto.ProdutoRequest;
import com.drogaria.backend.dto.ProdutoResponse;
import com.drogaria.backend.entity.Categoria;
import com.drogaria.backend.entity.HistoricoPreco;
import com.drogaria.backend.entity.MedicamentoControlado;
import com.drogaria.backend.entity.Produto;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.CategoriaRepository;
import com.drogaria.backend.repository.HistoricoPrecoRepository;
import com.drogaria.backend.repository.ProdutoRepository;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final HistoricoPrecoRepository historicoRepository;

    public ProdutoService(
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            HistoricoPrecoRepository historicoRepository) {

        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional
    public ProdutoResponse adicionar(ProdutoRequest request) {

        Produto produto = new Produto();

        Categoria categoria = categoriaRepository
                .findById(request.getIdCategoria())
                .orElseThrow(() -> new ApiException(
                        "Categoria nao encontrada",
                        HttpStatus.NOT_FOUND
                ));

        produto.setCategoria(categoria);
        produto.setNomeProduto(request.getNomeProduto());
        produto.setPrecoProduto(request.getPrecoProduto());
        produto.setImagemURL(request.getImagemURL());
        produto.setDescricao(request.getDescricao());

        produto.setNecessitaReceita(
                Boolean.TRUE.equals(request.getNecessitaReceita())
        );

        Produto salvo = produtoRepository.saveAndFlush(produto);

        configurarMedicamentoControlado(salvo, request, true);

        return new ProdutoResponse(
                produtoRepository.saveAndFlush(salvo)
        );
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscar(Integer idProduto) {

        Produto produto = produtoRepository.findById(idProduto)
                .orElseThrow(() -> new ApiException(
                        "Produto nao encontrado",
                        HttpStatus.NOT_FOUND
                ));

        return new ProdutoResponse(produto);
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {

        return produtoRepository.findAll()
                .stream()
                .map(ProdutoResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listarPorCategoria(Integer idCategoria) {

        return produtoRepository.findByCategoriaId(idCategoria)
                .stream()
                .map(ProdutoResponse::new)
                .toList();
    }

    @Transactional
    public ProdutoResponse atualizar(
            Integer idProduto,
            ProdutoRequest request) {

        Produto produto = produtoRepository.findById(idProduto)
                .orElseThrow(() -> new ApiException(
                        "Produto nao encontrado",
                        HttpStatus.NOT_FOUND
                ));

        if (request.getPrecoProduto() != null
                && Double.compare(
                        produto.getPrecoProduto(),
                        request.getPrecoProduto()
                ) != 0) {

            HistoricoPreco historico = new HistoricoPreco();

            historico.setProduto(produto);

            historico.setPrecoAnterior(
                    BigDecimal.valueOf(produto.getPrecoProduto())
            );

            historico.setPrecoNovo(
                    BigDecimal.valueOf(request.getPrecoProduto())
            );

            historico.setDataAlteracao(LocalDateTime.now());

            historicoRepository.save(historico);

            produto.setPrecoProduto(request.getPrecoProduto());
        }

        if (request.getNomeProduto() != null) {
            produto.setNomeProduto(request.getNomeProduto());
        }

        if (request.getImagemURL() != null) {
            produto.setImagemURL(request.getImagemURL());
        }

        if (request.getDescricao() != null) {
            produto.setDescricao(request.getDescricao());
        }

        if (request.getIdCategoria() != null) {

            Categoria categoria = categoriaRepository
                    .findById(request.getIdCategoria())
                    .orElseThrow(() -> new ApiException(
                            "Categoria nao encontrada",
                            HttpStatus.NOT_FOUND
                    ));

            produto.setCategoria(categoria);
        }

        if (request.getNecessitaReceita() != null) {
            produto.setNecessitaReceita(
                    request.getNecessitaReceita()
            );
        }

        if (request.getMedicamentoControlado() != null) {
            configurarMedicamentoControlado(
                    produto,
                    request,
                    false
            );
        }

        return new ProdutoResponse(
                produtoRepository.saveAndFlush(produto)
        );
    }

    private void configurarMedicamentoControlado(
            Produto produto,
            ProdutoRequest request,
            boolean novoProduto) {

        boolean controlado = Boolean.TRUE.equals(
                request.getMedicamentoControlado()
        );

        if (!controlado) {
            produto.setMedicamentoControlado(null);
            return;
        }

        MedicamentoControlado medicamento =
                produto.getMedicamentoControlado();

        if (medicamento == null) {
            medicamento = new MedicamentoControlado();
        }

        String categoriaControle = request.getCategoriaControle();

        if (categoriaControle != null) {

            if (categoriaControle.isBlank()) {
                throw new ApiException(
                        "A categoria de controle nao pode ficar vazia",
                        HttpStatus.BAD_REQUEST
                );
            }

            medicamento.setCategoriaControle(categoriaControle);

        } else if (novoProduto || medicamento.getCategoriaControle() == null) {

            throw new ApiException(
                    "Informe a categoria de controle",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (request.getLimiteQuantidadePorCliente() != null) {
            medicamento.setLimiteQuantidadePorCliente(
                    request.getLimiteQuantidadePorCliente()
            );
        }

        produto.setMedicamentoControlado(medicamento);
    }

    @Transactional
    public void excluir(Integer idProduto) {

        if (!produtoRepository.existsById(idProduto)) {
            throw new ApiException(
                    "Produto nao encontrado",
                    HttpStatus.NOT_FOUND
            );
        }

        produtoRepository.deleteById(idProduto);
    }
}
