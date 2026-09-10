package com.drogaria.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.HistoricoPreco;

public interface HistoricoPrecoRepository extends JpaRepository<HistoricoPreco, Integer> {
    List<HistoricoPreco> findByProdutoIdProdutoOrderByDataAlteracaoDesc(Integer idProduto);
}