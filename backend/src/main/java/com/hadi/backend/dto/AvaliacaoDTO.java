package com.hadi.backend.dto;

import com.hadi.backend.entity.Avaliacao;

import java.time.LocalDate;

/** Avaliação trocada com o frontend (requisição de POST /api/avaliacao e resposta das listagens). */
public class AvaliacaoDTO {

    private Long codigo;
    private Long codigoProduto;
    private Long codigoCliente;   // requisição: cliente logado (opcional)
    private String autor;         // resposta: nome abreviado/mascarado, ex. "M**RCIA J."
    private int nota;
    private String titulo;
    private String comentario;
    private String tamanhoComprado;
    private Boolean recomenda;
    private LocalDate data;

    public AvaliacaoDTO() {
    }

    public static AvaliacaoDTO fromEntity(Avaliacao a) {
        AvaliacaoDTO dto = new AvaliacaoDTO();
        dto.codigo = a.getCodigo();
        dto.codigoProduto = a.getProduto().getCodigo();
        dto.codigoCliente = a.getCliente() != null ? a.getCliente().getCodigo() : null;
        dto.autor = mascararNome(a.getAutor());
        dto.nota = a.getNota();
        dto.titulo = a.getTitulo();
        dto.comentario = a.getComentario();
        dto.tamanhoComprado = a.getTamanhoComprado();
        dto.recomenda = a.isRecomenda();
        dto.data = a.getData();
        return dto;
    }

    /** "Márcia Jardim" -> "M**CIA J." (privacidade: não expõe o nome completo do cliente). */
    static String mascararNome(String nome) {
        if (nome == null || nome.isBlank()) return "CLIENTE HADI";
        String[] partes = nome.trim().toUpperCase().split("\\s+");
        String primeiro = partes[0];
        String mascarado = primeiro.length() <= 3
                ? primeiro.charAt(0) + "*".repeat(primeiro.length() - 1)
                : primeiro.charAt(0) + "**" + primeiro.substring(Math.min(3, primeiro.length() - 1));
        return partes.length > 1 ? mascarado + " " + partes[partes.length - 1].charAt(0) + "." : mascarado;
    }

    public Long getCodigo() { return codigo; }
    public void setCodigo(Long codigo) { this.codigo = codigo; }

    public Long getCodigoProduto() { return codigoProduto; }
    public void setCodigoProduto(Long codigoProduto) { this.codigoProduto = codigoProduto; }

    public Long getCodigoCliente() { return codigoCliente; }
    public void setCodigoCliente(Long codigoCliente) { this.codigoCliente = codigoCliente; }

    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }

    public int getNota() { return nota; }
    public void setNota(int nota) { this.nota = nota; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }

    public String getTamanhoComprado() { return tamanhoComprado; }
    public void setTamanhoComprado(String tamanhoComprado) { this.tamanhoComprado = tamanhoComprado; }

    public Boolean getRecomenda() { return recomenda; }
    public void setRecomenda(Boolean recomenda) { this.recomenda = recomenda; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }
}
