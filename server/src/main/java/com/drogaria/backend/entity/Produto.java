
package com.drogaria.backend.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "produto")
public class Produto {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer idProduto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    @Column(name = "nome")
    private String nomeProduto;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "preco")
    private Double precoProduto;

    @Column(name = "fotos", columnDefinition = "LONGTEXT")
    private String fotos;

    @Column(name = "necessita_receita", nullable = false)
    private boolean necessitaReceita;

    @Column(name = "disponivel", nullable = false)
    private boolean disponivel = true;

    @Column(name = "esgotado", nullable = false)
    private boolean esgotado;

    @Column(name = "retirada_somente_loja", nullable = false)
    private boolean retiradaSomenteLoja;

    @OneToOne(
        mappedBy = "produto",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private MedicamentoControlado medicamentoControlado;

    public Integer getIdProduto() {
        return idProduto;
    }

    public void setIdProduto(Integer idProduto) {
        this.idProduto = idProduto;
    }

    public Integer getIdCategoria() {
        return categoria == null ? null : categoria.getId();
    }

    public void setIdCategoria(Integer idCategoria) {
        if (categoria == null) {
            categoria = new Categoria();
        }

        categoria.setId(idCategoria);
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getNomeProduto() {
        return nomeProduto;
    }

    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public double getPrecoProduto() {
        return precoProduto;
    }

    public void setPrecoProduto(double precoProduto) {
        this.precoProduto = precoProduto;
    }

    // Converte o JSON armazenado no banco para uma URL simples.
    public String getImagemURL() {

        if (fotos == null || fotos.isBlank()) {
            return null;
        }

        try {
            String[] imagens = objectMapper.readValue(
                fotos,
                String[].class
            );

            return imagens.length > 0 ? imagens[0] : null;

        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                "Erro ao converter fotos do produto",
                e
            );
        }
    }

    // Converte a URL recebida em um array JSON válido.
    public void setImagemURL(String imagemURL) {

        if (imagemURL == null || imagemURL.isBlank()) {
            this.fotos = null;
            return;
        }

        try {
            this.fotos = objectMapper.writeValueAsString(
                new String[]{imagemURL}
            );

        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                "Erro ao converter URL da imagem",
                e
            );
        }
    }

    public String getFotos() {
        return fotos;
    }

    public void setFotos(String fotos) {
        this.fotos = fotos;
    }

    public boolean isNecessitaReceita() {
        return necessitaReceita;
    }

    public void setNecessitaReceita(boolean necessitaReceita) {
        this.necessitaReceita = necessitaReceita;
    }

    public boolean isDisponivel() {
        return disponivel;
    }

    public void setDisponivel(boolean disponivel) {
        this.disponivel = disponivel;
    }

    public boolean isEsgotado() {
        return esgotado;
    }

    public void setEsgotado(boolean esgotado) {
        this.esgotado = esgotado;
    }

    public boolean isRetiradaSomenteLoja() {
        return retiradaSomenteLoja;
    }

    public void setRetiradaSomenteLoja(boolean retiradaSomenteLoja) {
        this.retiradaSomenteLoja = retiradaSomenteLoja;
    }

    public MedicamentoControlado getMedicamentoControlado() {
        return medicamentoControlado;
    }

    public void setMedicamentoControlado(
            MedicamentoControlado medicamentoControlado) {

        this.medicamentoControlado = medicamentoControlado;

        if (medicamentoControlado != null) {
            medicamentoControlado.setProduto(this);
        }
    }
}
