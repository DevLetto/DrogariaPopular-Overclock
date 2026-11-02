package com.drogaria.backend.service;
import com.drogaria.backend.dto.PagamentoResponse; import com.drogaria.backend.entity.Pagamento; import com.drogaria.backend.exception.ApiException; import com.drogaria.backend.repository.PagamentoRepository; import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PagamentoService {
    private final PagamentoRepository r;

    public PagamentoService(PagamentoRepository r) {
        this.r = r;
    }

    public PagamentoResponse buscar(
            Integer id,
            Authentication authentication) {
        Pagamento pagamento = buscarComControleDeAcesso(id, authentication);
        return new PagamentoResponse(pagamento);
    }

    public PagamentoResponse pedido(
            Integer idPedido,
            Authentication authentication) {
        Pagamento pagamento;

        if (isFuncionarioOperacionalOuAdministrador(authentication)) {
            pagamento = r.findByPedidoId(idPedido).orElseThrow(() ->
                    new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        } else {
            pagamento = r.findByPedidoIdAndPedidoClienteEmailIgnoreCase(
                            idPedido,
                            authentication.getName())
                    .orElseThrow(() ->
                            new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        }

        return new PagamentoResponse(pagamento);
    }

    @Transactional
    public PagamentoResponse status(
            Integer id,
            String novoStatus,
            Authentication authentication) {
        if (!hasAuthority(authentication, "ROLE_ADMINISTRADOR")
                && !hasAuthority(authentication, "ROLE_ATENDENTE")) {
            throw new ApiException("Acesso nao permitido", HttpStatus.FORBIDDEN);
        }

        if (novoStatus == null || novoStatus.isBlank()) {
            throw new ApiException("Status invalido", HttpStatus.BAD_REQUEST);
        }

        String statusNormalizado = novoStatus.trim().toUpperCase();
        if (!"PENDENTE".equals(statusNormalizado)
                && !"CANCELADO".equals(statusNormalizado)) {
            throw new ApiException("Status invalido", HttpStatus.BAD_REQUEST);
        }

        Pagamento pagamento = r.findById(id).orElseThrow(() ->
                new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        String statusAtual = pagamento.getStatus();

        if ("CANCELADO".equalsIgnoreCase(statusAtual)
                && !"CANCELADO".equals(statusNormalizado)) {
            throw new ApiException(
                    "Pagamento cancelado nao pode ter outro status",
                    HttpStatus.CONFLICT);
        }

        pagamento.setStatus(statusNormalizado);
        return new PagamentoResponse(r.save(pagamento));
    }

    private Pagamento buscarComControleDeAcesso(
            Integer id,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("Autenticacao necessaria", HttpStatus.UNAUTHORIZED);
        }

        if (isFuncionarioOperacionalOuAdministrador(authentication)) {
            return r.findById(id).orElseThrow(() ->
                    new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        }

        if (!hasAuthority(authentication, "ROLE_CLIENTE")) {
            throw new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND);
        }

        return r.findByIdAndPedidoClienteEmailIgnoreCase(
                        id,
                        authentication.getName())
                .orElseThrow(() ->
                        new ApiException("Pagamento nao encontrado", HttpStatus.NOT_FOUND));
    }

    private boolean isFuncionarioOperacionalOuAdministrador(
            Authentication authentication) {
        return hasAuthority(authentication, "ROLE_ADMINISTRADOR")
                || hasAuthority(authentication, "ROLE_ATENDENTE");
    }

    private boolean hasAuthority(
            Authentication authentication,
            String authority) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(item -> authority.equals(item.getAuthority()));
    }
}