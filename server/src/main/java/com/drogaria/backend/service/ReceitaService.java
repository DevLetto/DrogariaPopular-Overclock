package com.drogaria.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.drogaria.backend.dto.ReceitaRequest;
import com.drogaria.backend.dto.ReceitaResponse;
import com.drogaria.backend.entity.Farmaceutico;
import com.drogaria.backend.entity.Receita;
import com.drogaria.backend.exception.ApiException;
import com.drogaria.backend.repository.ClienteRepository;
import com.drogaria.backend.repository.FarmaceuticoRepository;
import com.drogaria.backend.repository.ReceitaRepository;

@Service
public class ReceitaService {
    private final ReceitaRepository repository;
    private final ClienteRepository clientes;
    private final FarmaceuticoRepository farmaceuticos;
    private final Path storageRoot;
    private static final long MAX_FILE_SIZE = 10L * 1024L * 1024L;

    public ReceitaService(ReceitaRepository repository, ClienteRepository clientes,
            FarmaceuticoRepository farmaceuticos,
            @Value("${app.receitas.storage-dir:${user.dir}/storage/receitas}") String storageDir) {
        this.repository = repository;
        this.clientes = clientes;
        this.farmaceuticos = farmaceuticos;
        this.storageRoot = Path.of(storageDir).toAbsolutePath().normalize();
    }

    public ReceitaResponse enviar(ReceitaRequest request) {
        Receita receita = new Receita();
        receita.setArquivo(request.getArquivo());
        receita.setStatus("PENDENTE");
        receita.setDataEnvio(LocalDate.now());
        receita.setCliente(clientes.findById(request.getIdCliente()).orElseThrow(
                () -> new ApiException("Cliente nao encontrado", HttpStatus.NOT_FOUND)));
        return new ReceitaResponse(repository.save(receita));
    }

    public ReceitaResponse enviarArquivo(MultipartFile file, Integer idClienteIgnorado,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("Autenticacao necessaria", HttpStatus.UNAUTHORIZED);
        }
        if (file == null || file.isEmpty()) {
            throw new ApiException("Informe o arquivo da receita", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException("O arquivo excede o limite de 10 MB", HttpStatus.PAYLOAD_TOO_LARGE);
        }

        String extension = validarTipoEExtensao(file);
        com.drogaria.backend.entity.Cliente cliente = clientes
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ApiException("Cliente nao encontrado", HttpStatus.FORBIDDEN));

        Path clientDirectory;
        try {
            clientDirectory = storageRoot.resolve("clientes")
                    .resolve(String.valueOf(cliente.getId()))
                    .toAbsolutePath().normalize();
            Files.createDirectories(clientDirectory);
        } catch (IOException ex) {
            throw new ApiException("Nao foi possivel preparar o armazenamento da receita",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String logicalName = UUID.randomUUID() + "." + extension;
        Path storedFile = clientDirectory.resolve(logicalName).normalize();
        if (!storedFile.startsWith(clientDirectory)) {
            throw new ApiException("Arquivo invalido", HttpStatus.BAD_REQUEST);
        }

        try (InputStream input = file.getInputStream()) {
            Files.copy(input, storedFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ApiException("Nao foi possivel armazenar o arquivo da receita",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Receita receita = new Receita();
        receita.setArquivo(logicalName);
        receita.setStatus("PENDENTE");
        receita.setDataEnvio(LocalDate.now());
        receita.setCliente(cliente);

        try {
            return new ReceitaResponse(repository.save(receita));
        } catch (RuntimeException ex) {
            try {
                Files.deleteIfExists(storedFile);
            } catch (IOException ignored) {
                // The database save also failed; keep the original persistence error.
            }
            throw ex;
        }
    }

    private String validarTipoEExtensao(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String lowerName = originalName == null ? "" : originalName.toLowerCase(Locale.ROOT);
        String extension;
        int dot = lowerName.lastIndexOf('.');
        if (dot < 0 || dot == lowerName.length() - 1) {
            throw new ApiException("Formato de arquivo invalido", HttpStatus.BAD_REQUEST);
        }
        extension = lowerName.substring(dot + 1);

        String mime = file.getContentType();
        if (mime != null) {
            mime = mime.toLowerCase(Locale.ROOT);
        }
        boolean validMimeAndExtension =
                ("pdf".equals(extension) && "application/pdf".equals(mime)) ||
                ("jpg".equals(extension) && ("image/jpeg".equals(mime) || "image/jpg".equals(mime))) ||
                ("jpeg".equals(extension) && ("image/jpeg".equals(mime) || "image/jpg".equals(mime))) ||
                ("png".equals(extension) && "image/png".equals(mime));
        if (!validMimeAndExtension) {
            throw new ApiException("Aceitos apenas arquivos PDF, JPG ou PNG",
                    HttpStatus.BAD_REQUEST);
        }

        byte[] signature;
        try (InputStream input = file.getInputStream()) {
            signature = input.readNBytes(8);
        } catch (IOException ex) {
            throw new ApiException("Nao foi possivel validar o arquivo", HttpStatus.BAD_REQUEST);
        }

        boolean validSignature =
                ("pdf".equals(extension) &&
                        signature.length >= 5 &&
                        signature[0] == '%' && signature[1] == 'P' &&
                        signature[2] == 'D' && signature[3] == 'F' && signature[4] == '-') ||
                (("jpg".equals(extension) || "jpeg".equals(extension)) &&
                        signature.length >= 3 &&
                        (signature[0] & 0xff) == 0xff && (signature[1] & 0xff) == 0xd8 &&
                        (signature[2] & 0xff) == 0xff) ||
                ("png".equals(extension) &&
                        signature.length >= 8 &&
                        (signature[0] & 0xff) == 0x89 && signature[1] == 'P' &&
                        signature[2] == 'N' && signature[3] == 'G' &&
                        (signature[4] & 0xff) == 0x0d && (signature[5] & 0xff) == 0x0a &&
                        (signature[6] & 0xff) == 0x1a && (signature[7] & 0xff) == 0x0a);
        if (!validSignature) {
            throw new ApiException("Conteudo do arquivo nao corresponde ao formato informado",
                    HttpStatus.BAD_REQUEST);
        }
        return extension;
    }

    public ReceitaResponse buscar(Integer id, Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(
                "Autenticacao necessaria",
                HttpStatus.UNAUTHORIZED
            );
        }

    boolean funcionarioAutorizado = auth.getAuthorities().stream()
        .anyMatch(a ->
            a.getAuthority().equals("ROLE_ADMINISTRADOR") ||
            a.getAuthority().equals("ROLE_FARMACEUTICO")
        );

    Receita receita;

    if (funcionarioAutorizado) {
        receita = repository.findWithClienteById(id)
            .orElseThrow(() -> new ApiException(
                "Receita nao encontrada",
                HttpStatus.NOT_FOUND
            ));
    } else {
        receita = repository.findWithClienteById(id)
            .orElseThrow(() -> new ApiException(
                "Receita nao encontrada",
                HttpStatus.NOT_FOUND
            ));
        if (receita.getCliente() == null ||
                !auth.getName().equalsIgnoreCase(receita.getCliente().getEmail())) {
            throw new ApiException(
                "Receita nao encontrada",
                HttpStatus.NOT_FOUND
            );
        }
    }

    return new ReceitaResponse(receita);
    }       
    
    @Transactional(readOnly = true)
    public List<ReceitaResponse> cliente(Integer idCliente) {
        return repository.findByClienteId(idCliente).stream().map(ReceitaResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public List<ReceitaResponse> listar() {
        return repository.findAllWithCliente().stream()
                .map(ReceitaResponse::new)
                .toList();
    }

    public ResponseEntity<Resource> baixarArquivo(Integer id, Authentication authentication) {
        ReceitaResponse ignored = buscar(id, authentication);
        Receita receita = repository.findWithClienteById(id)
                .orElseThrow(() -> new ApiException("Receita nao encontrada", HttpStatus.NOT_FOUND));

        String logicalName = receita.getArquivo();
        if (logicalName == null || logicalName.contains("/") || logicalName.contains("\\")
                || Path.of(logicalName).getFileName().toString().equals("..")) {
            throw new ApiException("Arquivo da receita indisponivel", HttpStatus.NOT_FOUND);
        }

        Path clientDirectory = storageRoot.resolve("clientes")
                .resolve(String.valueOf(receita.getCliente().getId()))
                .toAbsolutePath().normalize();
        Path file = clientDirectory.resolve(logicalName).normalize();
        if (!file.startsWith(clientDirectory) || !Files.isRegularFile(file)) {
            throw new ApiException("Arquivo da receita nao encontrado", HttpStatus.NOT_FOUND);
        }

        try {
            UrlResource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = logicalName.toLowerCase(Locale.ROOT).endsWith(".pdf")
                        ? MediaType.APPLICATION_PDF_VALUE
                        : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.inline().build().toString())
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new ApiException("Arquivo da receita nao encontrado", HttpStatus.NOT_FOUND);
        } catch (IOException ex) {
            throw new ApiException("Nao foi possivel acessar o arquivo da receita",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ReceitaResponse aprovar(
        Integer id,
        Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(
                "Autenticacao necessaria",
                HttpStatus.UNAUTHORIZED
            );
        }

        boolean autorizado = auth.getAuthorities().stream()
            .anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMINISTRADOR") ||
                a.getAuthority().equals("ROLE_FARMACEUTICO")
            );

        if (!autorizado) {
            throw new ApiException(
                "Voce nao tem permissao para avaliar receitas",
                HttpStatus.FORBIDDEN
            );
        }

    Receita receita = repository.findWithClienteById(id)
        .orElseThrow(() -> new ApiException(
            "Receita nao encontrada",
            HttpStatus.NOT_FOUND
        ));

    if (!"PENDENTE".equalsIgnoreCase(receita.getStatus())) {
        throw new ApiException(
            "Esta receita ja foi processada",
            HttpStatus.CONFLICT
        );
    }

    if (auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_FARMACEUTICO"))) {
        Farmaceutico farmaceutico = farmaceuticos
            .findByEmailIgnoreCase(auth.getName())
            .orElseThrow(() -> new ApiException(
                "Farmaceutico nao encontrado",
                HttpStatus.FORBIDDEN
            ));
        receita.setFarmaceutico(farmaceutico);
    }

    receita.setStatus("APROVADA");
    receita.setDataValidacao(LocalDate.now());
    receita.setMotivoRejeicao(null);

    return new ReceitaResponse(repository.save(receita));
}

    @Transactional
    public ReceitaResponse rejeitar(
        Integer id,
        String motivo,
        Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(
                "Autenticacao necessaria",
                HttpStatus.UNAUTHORIZED
            );
        }

        boolean autorizado = auth.getAuthorities().stream()
            .anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMINISTRADOR") ||
                a.getAuthority().equals("ROLE_FARMACEUTICO")
            );

        if (!autorizado) {
            throw new ApiException(
                "Voce nao tem permissao para avaliar receitas",
                HttpStatus.FORBIDDEN
            );
        }

    if (motivo == null || motivo.isBlank()) {
        throw new ApiException(
            "Informe o motivo da rejeicao",
            HttpStatus.BAD_REQUEST
        );
    }

    Receita receita = repository.findWithClienteById(id)
        .orElseThrow(() -> new ApiException(
            "Receita nao encontrada",
            HttpStatus.NOT_FOUND
        ));

    if (!"PENDENTE".equalsIgnoreCase(receita.getStatus())) {
        throw new ApiException(
            "Esta receita ja foi processada",
            HttpStatus.CONFLICT
        );
    }

    if (auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_FARMACEUTICO"))) {
        Farmaceutico farmaceutico = farmaceuticos
            .findByEmailIgnoreCase(auth.getName())
            .orElseThrow(() -> new ApiException(
                "Farmaceutico nao encontrado",
                HttpStatus.FORBIDDEN
            ));
        receita.setFarmaceutico(farmaceutico);
    }

    receita.setStatus("REJEITADA");
    receita.setDataValidacao(LocalDate.now());
    receita.setMotivoRejeicao(motivo.trim());

    return new ReceitaResponse(repository.save(receita));
    }
}
