package com.drogaria.backend.controller;
import com.drogaria.backend.dto.*; 
import com.drogaria.backend.service.*; 
import jakarta.validation.Valid; 
import org.springframework.security.core.Authentication;
 import org.springframework.web.bind.annotation.*;
@RestController
 @RequestMapping("/api/cliente") 
 public class ClienteController {
     private final ClienteService s; private final CarrinhoService a; public ClienteController(ClienteService s,CarrinhoService a){this.s=s;this.a=a;}
@GetMapping("/{id}")
 public ClienteResponse buscar(@PathVariable Integer id,Authentication x){
    a.validarAcesso(id,x);return s.buscar(id);}
     
@PutMapping("/{id}") 
public ClienteResponse atualizar(@PathVariable Integer id,@Valid @RequestBody ClienteUpdateRequest r,Authentication x){
    a.validarAcesso(id,x);return s.atualizar(id,r);} @DeleteMapping("/{id}") public void excluir(@PathVariable Integer id,Authentication x){a.validarAcesso(id,x);s.excluir(id);} 
}