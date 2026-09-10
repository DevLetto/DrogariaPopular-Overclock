package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Integer> {
    Optional<Pagamento> findByPedidoId(Integer idPedido);
}