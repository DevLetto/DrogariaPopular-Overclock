package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Promocao;

public interface PromocaoRepository extends JpaRepository<Promocao, Integer> {
    @Override
    @EntityGraph(attributePaths = {"produto", "produto.categoria"})
    List<Promocao> findAll();

    @Override
    @EntityGraph(attributePaths = {"produto", "produto.categoria"})
    Optional<Promocao> findById(Integer id);

    @EntityGraph(attributePaths = {"produto", "produto.categoria"})
    List<Promocao> findByProdutoIdProduto(Integer idProduto);
}