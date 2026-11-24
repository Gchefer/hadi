package com.hadi.backend.dto;

import com.hadi.backend.entity.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PedidoRespostaDTO {

    private Long codigo;
    private Long clienteCodigo;
    private String clienteNome;
    private List<ItemPedidoDTO> itens;
    private BigDecimal valorTotal;
    private BigDecimal valorFrete;
    private String tipoEntrega;
    private String cepEntrega;
    private String formaPagamento;
    private String status;
    private LocalDateTime dataPedido;

    public static PedidoRespostaDTO fromEntity(Pedido p) {
        PedidoRespostaDTO dto = new PedidoRespostaDTO();
        dto.codigo = p.getCodigo();
        dto.clienteCodigo = p.getCliente() != null ? p.getCliente().getCodigo() : null;
        dto.clienteNome = p.getCliente() != null ? p.getCliente().getNome() : null;
        dto.itens = p.getItens().stream().map(ItemPedidoDTO::fromEntity).collect(Collectors.toList());
        dto.valorTotal = p.getValorTotal();
        dto.valorFrete = p.getValorFrete();
        dto.tipoEntrega = p.getTipoEntrega();
        dto.cepEntrega = p.getCepEntrega();
        dto.formaPagamento = p.getFormaPagamento();
        dto.status = p.getStatus();
        dto.dataPedido = p.getDataPedido();
        return dto;
    }

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

    public String getClienteNome() {
        return clienteNome;
    }

    public void setClienteNome(String clienteNome) {
        this.clienteNome = clienteNome;
    }

    public List<ItemPedidoDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemPedidoDTO> itens) {
        this.itens = itens;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
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

    public LocalDateTime getDataPedido() {
        return dataPedido;
    }

    public void setDataPedido(LocalDateTime dataPedido) {
        this.dataPedido = dataPedido;
    }

    public BigDecimal getValorFrete() {
        return valorFrete;
    }

    public void setValorFrete(BigDecimal valorFrete) {
        this.valorFrete = valorFrete;
    }

    public String getTipoEntrega() {
        return tipoEntrega;
    }

    public void setTipoEntrega(String tipoEntrega) {
        this.tipoEntrega = tipoEntrega;
    }

    public String getCepEntrega() {
        return cepEntrega;
    }

    public void setCepEntrega(String cepEntrega) {
        this.cepEntrega = cepEntrega;
    }
}
