package com.drogaria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Lote;

public interface LoteRepository extends JpaRepository<Lote, String> {
}