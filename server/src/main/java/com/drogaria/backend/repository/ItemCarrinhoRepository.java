package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.ItemCarrinho;

public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinho, Integer> {
    List<ItemCarrinho> findByCarrinhoClienteId(Integer idCliente);
    Optional<ItemCarrinho> findByCarrinhoClienteIdAndProdutoIdProduto(Integer idCliente, Integer idProduto);
}