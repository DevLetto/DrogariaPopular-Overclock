package com.drogaria.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Farmaceutico;

public interface FarmaceuticoRepository extends JpaRepository<Farmaceutico, Integer> {

    Optional<Farmaceutico> findByEmailIgnoreCase(String email);
}
