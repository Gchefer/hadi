package com.hadi.backend.dto;

import com.hadi.backend.entity.ItemPedido;

import java.math.BigDecimal;

public class ItemPedidoDTO {

    private Long produtoCodigo;
    private String produtoNome;
    private String produtoImagem;
    private int quantidade;
    private BigDecimal precoUnitario;

    public static ItemPedidoDTO fromEntity(ItemPedido item) {
        ItemPedidoDTO dto = new ItemPedidoDTO();
        dto.produtoCodigo = item.getProduto().getCodigo();
        dto.produtoNome = item.getProduto().getNome();
        dto.produtoImagem = item.getProduto().getImagem();
        dto.quantidade = item.getQuantidade();
        dto.precoUnitario = item.getPrecoUnitario();
        return dto;
    }

    public Long getProdutoCodigo() {
        return produtoCodigo;
    }

    public void setProdutoCodigo(Long produtoCodigo) {
        this.produtoCodigo = produtoCodigo;
    }

    public String getProdutoNome() {
        return produtoNome;
    }

    public void setProdutoNome(String produtoNome) {
        this.produtoNome = produtoNome;
    }

    public String getProdutoImagem() {
        return produtoImagem;
    }

    public void setProdutoImagem(String produtoImagem) {
        this.produtoImagem = produtoImagem;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(int quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }

    public void setPrecoUnitario(BigDecimal precoUnitario) {
        this.precoUnitario = precoUnitario;
    }
}
