package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Loja;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LojaRepository extends JpaRepository<Loja, Integer> {
}