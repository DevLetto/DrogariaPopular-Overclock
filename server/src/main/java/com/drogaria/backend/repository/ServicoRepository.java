package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Integer> {
    List<Servico> findByLojaId(Integer idLoja);
}