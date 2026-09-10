package com.drogaria.backend.service;

import com.drogaria.backend.dto.PedidoRequest;
import com.drogaria.backend.dto.PedidoResponse;
import com.drogaria.backend.entity.*;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PedidoService {
    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final CarrinhoRepository carrinhoRepository;
    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final EstoqueRepository estoqueRepository;
    private final CupomRepository cupomRepository;
    private final LojaRepository lojaRepository;
    private final PagamentoRepository pagamentoRepository;

    public PedidoService(PedidoRepository pedidoRepository, ClienteRepository clienteRepository,
            CarrinhoRepository carrinhoRepository, ItemCarrinhoRepository itemCarrinhoRepository,
            EstoqueRepository estoqueRepository, CupomRepository cupomRepository, LojaRepository lojaRepository,
            PagamentoRepository pagamentoRepository) {
        this.pedidoRepository = pedidoRepository; this.clienteRepository = clienteRepository;
        this.carrinhoRepository = carrinhoRepository; this.itemCarrinhoRepository = itemCarrinhoRepository;
        this.estoqueRepository = estoqueRepository; this.cupomRepository = cupomRepository; this.lojaRepository = lojaRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    @Transactional
    public PedidoResponse criar(Integer idCliente, PedidoRequest request) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND));
        List<ItemCarrinho> itens = itemCarrinhoRepository.findByCarrinhoClienteId(idCliente);
        if (itens.isEmpty()) throw new ApiException("Carrinho vazio", HttpStatus.BAD_REQUEST);
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente); pedido.setStatus("PENDENTE"); pedido.setFormaEntrega(request.getFormaEntrega());
        pedido.setValorFrete(request.getValorFrete()); pedido.setDataPedido(LocalDateTime.now());
        if (request.getIdLoja() != null) pedido.setLoja(lojaRepository.findById(request.getIdLoja())
                .orElseThrow(() -> new ApiException("Loja nao encontrada", HttpStatus.NOT_FOUND)));
        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemCarrinho item : itens) {
            Estoque estoque = estoqueRepository.findByProdutoIdProduto(item.getProduto().getIdProduto())
                    .orElseThrow(() -> new ApiException("Estoque nao encontrado", HttpStatus.CONFLICT));
            if (estoque.getQuantidade() < item.getQuantidade())
                throw new ApiException("Estoque insuficiente para o produto " + item.getProduto().getNomeProduto(), HttpStatus.CONFLICT);
            ItemPedido itemPedido = new ItemPedido(); itemPedido.setPedido(pedido); itemPedido.setProduto(item.getProduto());
            itemPedido.setQuantidade(item.getQuantidade()); itemPedido.setPrecoUnitario(item.getPrecoUnitario());
            pedido.getItens().add(itemPedido); subtotal = subtotal.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
            estoque.setQuantidade(estoque.getQuantidade() - item.getQuantidade()); estoqueRepository.save(estoque);
        }
        if (request.getCodigoCupom() != null && !request.getCodigoCupom().isBlank()) {
            Cupom cupom = cupomRepository.findByCodigo(request.getCodigoCupom().trim())
                    .orElseThrow(() -> new ApiException("Cupom invalido", HttpStatus.BAD_REQUEST));
            if (cupom.getValidade().isBefore(LocalDate.now())) throw new ApiException("Cupom expirado", HttpStatus.BAD_REQUEST);
            pedido.getCupons().add(cupom); subtotal = subtotal.subtract(cupom.getDesconto()).max(BigDecimal.ZERO);
        }
        pedido.setValorTotal(subtotal.add(request.getValorFrete()));
        Pedido salvo = pedidoRepository.save(pedido);
        Pagamento pagamento = new Pagamento(); pagamento.setPedido(salvo); pagamento.setMetodo(request.getMetodoPagamento());
        pagamento.setValor(salvo.getValorTotal()); pagamento.setStatus("PENDENTE"); pagamentoRepository.save(pagamento);
        itemCarrinhoRepository.deleteAll(itens);
        return new PedidoResponse(salvo);
    }

    public List<PedidoResponse> listarPorCliente(Integer idCliente) {
        return pedidoRepository.findByClienteIdOrderByDataPedidoDesc(idCliente).stream().map(PedidoResponse::new).toList();
    }
    public PedidoResponse buscar(Integer id) { return new PedidoResponse(pedidoRepository.findById(id)
            .orElseThrow(() -> new ApiException("Pedido nao encontrado", HttpStatus.NOT_FOUND))); }

    @Transactional
    public PedidoResponse atualizarStatus(Integer id, String status) {
        Pedido pedido = pedidoRepository.findById(id).orElseThrow(
                () -> new ApiException("Pedido nao encontrado", HttpStatus.NOT_FOUND));
        if (status == null || status.isBlank()) {
            throw new ApiException("Status invalido", HttpStatus.BAD_REQUEST);
        }
        pedido.setStatus(status.trim().toUpperCase());
        return new PedidoResponse(pedidoRepository.save(pedido));
    }

    public PedidoResponse cancelar(Integer id) {
        return atualizarStatus(id, "CANCELADO");
    }
}