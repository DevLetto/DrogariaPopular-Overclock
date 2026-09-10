package com.drogaria.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drogaria.backend.dto.CarrinhoResponse;
import com.drogaria.backend.entity.Carrinho;
import com.drogaria.backend.entity.Cliente;
import com.drogaria.backend.entity.ItemCarrinho;
import com.drogaria.backend.entity.Produto;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.CarrinhoRepository;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.ItemCarrinhoRepository;
import com.drogaria.backend.repository.ProdutoRepository;

@Service
public class CarrinhoService {

    private final CarrinhoRepository carrinhoRepository;
    private final ItemCarrinhoRepository itemRepository;
    private final ClienteRepository clienteRepository;
    private final ProdutoRepository produtoRepository;

    public CarrinhoService(CarrinhoRepository carrinhoRepository, ItemCarrinhoRepository itemRepository,
            ClienteRepository clienteRepository, ProdutoRepository produtoRepository) {
        this.carrinhoRepository = carrinhoRepository;
        this.itemRepository = itemRepository;
        this.clienteRepository = clienteRepository;
        this.produtoRepository = produtoRepository;
    }

    public void validarAcesso(Integer idCliente, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("Autenticacao necessaria", HttpStatus.UNAUTHORIZED);
        }
        boolean proprietario = clienteRepository.findById(idCliente)
                .map(cliente -> cliente.getEmail().equalsIgnoreCase(authentication.getName()))
                .orElse(false);
        if (!proprietario) {
            throw new ApiException("Acesso nao permitido", HttpStatus.FORBIDDEN);
        }
    }

    public List<CarrinhoResponse> buscar(Integer idCliente) {
        return itemRepository.findByCarrinhoClienteId(idCliente).stream()
                .map(CarrinhoResponse::new)
                .toList();
    }

    @Transactional
    public CarrinhoResponse adicionar(Integer idCliente, Integer idProduto, Integer quantidade,
            Integer salvoParaDepois) {
        if (quantidade == null || quantidade <= 0) {
            throw new ApiException("Quantidade deve ser maior que zero", HttpStatus.BAD_REQUEST);
        }
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND));
        Produto produto = produtoRepository.findById(idProduto)
                .orElseThrow(() -> new ApiException("Produto nao encontrado", HttpStatus.NOT_FOUND));
        Carrinho carrinho = carrinhoRepository.findByClienteId(idCliente).orElseGet(() -> {
            Carrinho novo = new Carrinho();
            novo.setCliente(cliente);
            return carrinhoRepository.save(novo);
        });
        ItemCarrinho item = itemRepository.findByCarrinhoClienteIdAndProdutoIdProduto(idCliente, idProduto)
                .orElseGet(() -> {
                    ItemCarrinho novo = new ItemCarrinho();
                    novo.setCarrinho(carrinho);
                    novo.setProduto(produto);
                    novo.setQuantidade(0);
                    novo.setPrecoUnitario(BigDecimal.valueOf(produto.getPrecoProduto()));
                    return novo;
                });
        item.setQuantidade(item.getQuantidade() + quantidade);
        return new CarrinhoResponse(itemRepository.save(item));
    }

    @Transactional
    public CarrinhoResponse editar(Integer idCliente, Integer idProduto, Integer quantidade,
            Integer salvoParaDepois) {
        ItemCarrinho item = itemRepository.findByCarrinhoClienteIdAndProdutoIdProduto(idCliente, idProduto)
                .orElseThrow(() -> new ApiException("Item nao encontrado", HttpStatus.NOT_FOUND));

        if (quantidade == null || quantidade == 0) {
            return new CarrinhoResponse(item);
        }

        int novaQuantidade = item.getQuantidade() + quantidade;
        if (novaQuantidade <= 0) {
            itemRepository.delete(item);
            return new CarrinhoResponse(item);
        }

        item.setQuantidade(novaQuantidade);
        return new CarrinhoResponse(itemRepository.save(item));
    }

    @Transactional
    public CarrinhoResponse deletar(Integer idCliente, Integer idProduto) {
        ItemCarrinho item = itemRepository.findByCarrinhoClienteIdAndProdutoIdProduto(idCliente, idProduto)
                .orElseThrow(() -> new ApiException("Item nao encontrado", HttpStatus.NOT_FOUND));
        itemRepository.delete(item);
        return new CarrinhoResponse(item);
    }
}
