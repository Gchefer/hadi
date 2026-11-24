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
    private String departamento;
    private String subcategoria;
    private String generos;
    private String tamanhos;
    private String tecnologias;
    private String atividades;
    private Double mediaAvaliacoes;
    private long totalAvaliacoes;

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
        dto.departamento = p.getDepartamento();
        dto.subcategoria = p.getSubcategoria();
        dto.generos = p.getGeneros();
        dto.tamanhos = p.getTamanhos();
        dto.tecnologias = p.getTecnologias();
        dto.atividades = p.getAtividades();
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

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getSubcategoria() {
        return subcategoria;
    }

    public void setSubcategoria(String subcategoria) {
        this.subcategoria = subcategoria;
    }

    public String getGeneros() {
        return generos;
    }

    public void setGeneros(String generos) {
        this.generos = generos;
    }

    public String getTamanhos() {
        return tamanhos;
    }

    public void setTamanhos(String tamanhos) {
        this.tamanhos = tamanhos;
    }

    public String getTecnologias() {
        return tecnologias;
    }

    public void setTecnologias(String tecnologias) {
        this.tecnologias = tecnologias;
    }

    public String getAtividades() {
        return atividades;
    }

    public void setAtividades(String atividades) {
        this.atividades = atividades;
    }

    public Double getMediaAvaliacoes() {
        return mediaAvaliacoes;
    }

    public void setMediaAvaliacoes(Double mediaAvaliacoes) {
        this.mediaAvaliacoes = mediaAvaliacoes;
    }

    public long getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public void setTotalAvaliacoes(long totalAvaliacoes) {
        this.totalAvaliacoes = totalAvaliacoes;
    }
}
