package com.drogaria.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Estoque;

public interface EstoqueRepository extends JpaRepository<Estoque, Integer> {
    Optional<Estoque> findByProdutoIdProduto(Integer idProduto);
}