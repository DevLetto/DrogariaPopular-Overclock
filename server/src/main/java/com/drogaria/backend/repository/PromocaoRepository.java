package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Promocao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromocaoRepository extends JpaRepository<Promocao, Integer> {
    List<Promocao> findByProdutoIdProduto(Integer idProduto);
}