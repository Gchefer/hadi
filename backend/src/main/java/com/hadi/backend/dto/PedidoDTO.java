package com.hadi.backend.dto;

import java.util.List;

/** Body enviado pelo frontend para criar/alterar um pedido (ver POST/PUT /api/pedido). */
public class PedidoDTO {

    private Long codigo;
    private Long clienteCodigo;
    private List<ItemDTO> itens;
    private String formaPagamento;
    private String status;
    private String cepEntrega;   // opcional: com CEP, o backend calcula o frete
    private String tipoEntrega;  // PAC (padrão) ou SEDEX

    public Long getCodigo() {
        return codigo;
    }

    public void setCodigo(Long codigo) {
        this.codigo = codigo;
    }

    public Long getClienteCodigo() {
        return clienteCodigo;
    }

    public void setClienteCodigo(Long clienteCodigo) {
        this.clienteCodigo = clienteCodigo;
    }

    public List<ItemDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemDTO> itens) {
        this.itens = itens;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /** Item mínimo enviado pelo carrinho: qual produto e quantas unidades. */
    public String getCepEntrega() {
        return cepEntrega;
    }

    public void setCepEntrega(String cepEntrega) {
        this.cepEntrega = cepEntrega;
    }

    public String getTipoEntrega() {
        return tipoEntrega;
    }

    public void setTipoEntrega(String tipoEntrega) {
        this.tipoEntrega = tipoEntrega;
    }

    public static class ItemDTO {
        private Long produtoCodigo;
        private int quantidade;

        public Long getProdutoCodigo() {
            return produtoCodigo;
        }

        public void setProdutoCodigo(Long produtoCodigo) {
            this.produtoCodigo = produtoCodigo;
        }

        public int getQuantidade() {
            return quantidade;
        }

        public void setQuantidade(int quantidade) {
            this.quantidade = quantidade;
        }
    }
}
