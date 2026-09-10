package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Integer> {
    List<Agendamento> findByClienteId(Integer idCliente);
    List<Agendamento> findByLojaId(Integer idLoja);
    boolean existsByLojaIdAndDataHora(Integer idLoja, LocalDateTime dataHora);
}