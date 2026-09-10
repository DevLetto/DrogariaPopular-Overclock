package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Receita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReceitaRepository extends JpaRepository<Receita, Integer> {
    List<Receita> findByClienteId(Integer idCliente);
}