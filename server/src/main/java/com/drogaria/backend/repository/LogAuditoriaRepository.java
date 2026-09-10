package com.drogaria.backend.repository;

import com.drogaria.backend.entity.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Integer> {
}