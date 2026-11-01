package com.drogaria.backend.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.drogaria.backend.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByClienteIdOrderByDataPedidoDesc(Integer idCliente);

    Optional<Pedido> findByIdAndClienteEmailIgnoreCase(
    Integer id,
    String email
);
}