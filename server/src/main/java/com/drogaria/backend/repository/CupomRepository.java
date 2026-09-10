package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Cupom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CupomRepository extends JpaRepository<Cupom, Integer> {
    Optional<Cupom> findByCodigo(String codigo);
}