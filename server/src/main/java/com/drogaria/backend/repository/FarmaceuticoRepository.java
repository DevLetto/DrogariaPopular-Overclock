package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Farmaceutico;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FarmaceuticoRepository extends JpaRepository<Farmaceutico, Integer> {
}
