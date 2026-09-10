package com.drogaria.backend.repository;

import com.drogaria.backend.entity.MedicamentoControlado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicamentoControladoRepository extends JpaRepository<MedicamentoControlado, Integer> {
}