
package com.drogaria.backend.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.drogaria.backend.dto.AuthResponse;
import com.drogaria.backend.dto.CadastroRequest;
import com.drogaria.backend.dto.LoginRequest;
import com.drogaria.backend.entity.Administrador;
import com.drogaria.backend.entity.Atendente;
import com.drogaria.backend.entity.Cliente;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Funcionario;
import com.drogaria.backend.entity.FuncionarioEstoqueLogistica;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.EnderecoRepository;
import com.drogaria.backend.repository.FuncionarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Service
public class AuthService {

    private final ClienteRepository clienteRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final EnderecoRepository enderecoRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(
            ClienteRepository clienteRepository,
            FuncionarioRepository funcionarioRepository,
            EnderecoRepository enderecoRepository,
            BCryptPasswordEncoder passwordEncoder) {

        this.clienteRepository = clienteRepository;
        this.funcionarioRepository = funcionarioRepository;
        this.enderecoRepository = enderecoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(
            LoginRequest request,
            HttpServletRequest httpRequest) {

        String identificador = request.getIdentificador().trim();
        String senha = request.getSenha();

        if (identificador.contains("@")) {

            String email = identificador.toLowerCase();

            Optional<Funcionario> funcionarioOpt =
                    funcionarioRepository.findByEmail(email);

            if (funcionarioOpt.isPresent()) {

                Funcionario funcionario = funcionarioOpt.get();

                validarSenha(senha, funcionario.getSenha());

                String role = identificarRole(funcionario);

                autenticarNaSessao(
                        funcionario.getEmail(),
                        role,
                        httpRequest
                );

                return new AuthResponse(funcionario, role);
            }

            Cliente cliente = clienteRepository.findByEmail(email)
                    .orElseThrow(() -> credenciaisInvalidas());

            validarSenha(senha, cliente.getSenha());

            if (!cliente.isContaAprovada()) {
                throw new ApiException(
                        "Cadastro ainda nao foi aprovado",
                        HttpStatus.FORBIDDEN
                );
            }

            String role = "ROLE_CLIENTE";

            autenticarNaSessao(
                    cliente.getEmail(),
                    role,
                    httpRequest
            );

            return new AuthResponse(cliente, role);
        }

        String cpf = identificador.replaceAll("\\D", "");

        Cliente cliente = clienteRepository.findByCpf(cpf)
                .orElseThrow(() -> credenciaisInvalidas());

        validarSenha(senha, cliente.getSenha());

        if (!cliente.isContaAprovada()) {
            throw new ApiException(
                    "Cadastro ainda nao foi aprovado",
                    HttpStatus.FORBIDDEN
            );
        }

        String role = "ROLE_CLIENTE";

        autenticarNaSessao(
                cliente.getEmail(),
                role,
                httpRequest
        );

        return new AuthResponse(cliente, role);
    }

    @Transactional
    public AuthResponse cadastrar(CadastroRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String cpf = request.getCpf().trim();

        if (clienteRepository.existsByEmail(email)) {
            throw new ApiException(
                    "Ja existe uma conta com esse e-mail",
                    HttpStatus.CONFLICT
            );
        }

        if (funcionarioRepository.existsByEmail(email)) {
            throw new ApiException(
                    "Ja existe uma conta com esse e-mail",
                    HttpStatus.CONFLICT
            );
        }

        if (clienteRepository.existsByCpf(cpf)) {
            throw new ApiException(
                    "Ja existe uma conta com esse CPF",
                    HttpStatus.CONFLICT
            );
        }

        Cliente cliente = new Cliente();

        cliente.setNome(request.getNome().trim());
        cliente.setCpf(cpf);
        cliente.setEmail(email);
        cliente.setTelefone(request.getTelefone().trim());

        cliente.setSenha(
                passwordEncoder.encode(request.getSenha())
        );

        cliente.setDataCadastro(
                java.time.LocalDate.now()
        );

        cliente.setContaAprovada(false);

        cliente = clienteRepository.save(cliente);

        return new AuthResponse(cliente, "ROLE_CLIENTE");
    }

    private void validarSenha(String senhaInformada, String senhaBanco) {

        if (!passwordEncoder.matches(senhaInformada, senhaBanco)) {
            throw credenciaisInvalidas();
        }
    }

    private ApiException credenciaisInvalidas() {
        return new ApiException(
                "E-mail/CPF ou senha invalidos",
                HttpStatus.UNAUTHORIZED
        );
    }

    private String identificarRole(Funcionario funcionario) {

        if (funcionario instanceof Administrador) {
            return "ROLE_ADMINISTRADOR";
        }

        if (funcionario instanceof Farmaceutico) {
            return "ROLE_FARMACEUTICO";
        }

        if (funcionario instanceof Atendente) {
            return "ROLE_ATENDENTE";
        }

        if (funcionario instanceof FuncionarioEstoqueLogistica) {
            return "ROLE_FUNCIONARIO_ESTOQUE_LOGISTICA";
        }

        throw new ApiException(
                "Tipo de funcionario nao reconhecido",
                HttpStatus.FORBIDDEN
        );
    }

    private void autenticarNaSessao(
            String email,
            String role,
            HttpServletRequest httpRequest) {

        HttpSession session = httpRequest.getSession(false);

        if (session != null) {
            httpRequest.changeSessionId();
        } else {
            session = httpRequest.getSession(true);
        }

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        java.util.List.of(
                                new SimpleGrantedAuthority(role)
                        )
                );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);

        SecurityContextHolder.setContext(context);

        session.setAttribute(
                "SPRING_SECURITY_CONTEXT",
                context
        );
    }
}
