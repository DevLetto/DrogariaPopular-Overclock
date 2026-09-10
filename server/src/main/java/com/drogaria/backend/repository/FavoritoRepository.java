package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoritoRepository extends JpaRepository<Favorito, Integer> {
    List<Favorito> findByClienteId(Integer idCliente);
    Optional<Favorito> findByClienteIdAndProdutoIdProduto(Integer idCliente, Integer idProduto);
}