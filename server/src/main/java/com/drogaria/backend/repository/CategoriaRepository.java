package com.drogaria.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
}