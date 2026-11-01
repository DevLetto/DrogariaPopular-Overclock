package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
  
import com.drogaria.backend.entity.Receita;

public interface ReceitaRepository extends JpaRepository<Receita, Integer> {
    List<Receita> findByClienteId(Integer idCliente);

    Optional<Receita> findByIdAndClienteEmailIgnoreCase(
    Integer id,
    String email
);
}