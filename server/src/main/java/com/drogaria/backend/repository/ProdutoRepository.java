
package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    @Override
    @EntityGraph(attributePaths = {"categoria", "medicamentoControlado"})
    Optional<Produto> findById(Integer idProduto);

    @Override
    @EntityGraph(attributePaths = {"categoria", "medicamentoControlado"})
    List<Produto> findAll();

    @EntityGraph(attributePaths = {"categoria", "medicamentoControlado"})
    List<Produto> findByCategoriaId(Integer idCategoria);
}
