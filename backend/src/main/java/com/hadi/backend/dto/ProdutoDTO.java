package com.hadi.backend.dto;

import com.hadi.backend.entity.Produto;

import java.math.BigDecimal;

/** Formato de produto trocado com o frontend (requisição e resposta). */
public class ProdutoDTO {

    private Long codigo;
    private String marca;
    private String nome;
    private String descricao;
    private String categoria;
    private BigDecimal preco;
    private BigDecimal precoOriginal;
    private String imagem;
    private boolean destaque;

    public ProdutoDTO() {
    }

    public static ProdutoDTO fromEntity(Produto p) {
        ProdutoDTO dto = new ProdutoDTO();
        dto.codigo = p.getCodigo();
        dto.marca = p.getMarca();
        dto.nome = p.getNome();
        dto.descricao = p.getDescricao();
        dto.categoria = p.getCategoria();
        dto.preco = p.getPreco();
        dto.precoOriginal = p.getPrecoOriginal();
        dto.imagem = p.getImagem();
        dto.destaque = p.isDestaque();
        return dto;
    }

    public Long getCodigo() {
        return codigo;
    }

    public void setCodigo(Long codigo) {
        this.codigo = codigo;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public void setPreco(BigDecimal preco) {
        this.preco = preco;
    }

    public BigDecimal getPrecoOriginal() {
        return precoOriginal;
    }

    public void setPrecoOriginal(BigDecimal precoOriginal) {
        this.precoOriginal = precoOriginal;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public boolean isDestaque() {
        return destaque;
    }

    public void setDestaque(boolean destaque) {
        this.destaque = destaque;
    }
}
