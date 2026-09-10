package com.drogaria.backend.repository;

import com.drogaria.backend.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    List<Pedido> findByClienteIdOrderByDataPedidoDesc(Integer idCliente);
}