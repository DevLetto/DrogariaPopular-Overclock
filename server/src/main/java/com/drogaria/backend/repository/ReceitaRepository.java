package com.drogaria.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
  
import com.drogaria.backend.entity.Receita;

public interface ReceitaRepository extends JpaRepository<Receita, Integer> {
    List<Receita> findByClienteId(Integer idCliente);

    @Query("SELECT r FROM Receita r JOIN FETCH r.cliente")
    List<Receita> findAllWithCliente();

    Optional<Receita> findByIdAndClienteEmailIgnoreCase(
    Integer id,
    String email
    );

    @EntityGraph(attributePaths = "cliente")
    Optional<Receita> findWithClienteById(Integer id);

    boolean existsByClienteIdAndStatusIgnoreCase(Integer idCliente, String status);
}