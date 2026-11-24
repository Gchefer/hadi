package com.hadi.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Avaliação (review) de um produto feita por um cliente. */
@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long codigo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_codigo", nullable = false)
    private Produto produto;

    /** Cliente que avaliou (opcional: as avaliações de demonstração não têm cliente). */
    @ManyToOne
    @JoinColumn(name = "cliente_codigo")
    private Cliente cliente;

    @Column(nullable = false)
    private String autor;

    /** Nota de 1 a 5 estrelas. */
    @Column(nullable = false)
    private int nota;

    @Column(nullable = false)
    private String titulo;

    @Column(length = 1000)
    private String comentario;

    /** Tamanho que o cliente comprou (ex.: M), opcional. */
    private String tamanhoComprado;

    private boolean recomenda = true;

    @Column(nullable = false)
    private LocalDate data;

    public Avaliacao() {
    }

    public Long getCodigo() { return codigo; }
    public void setCodigo(Long codigo) { this.codigo = codigo; }

    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

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

    public boolean isRecomenda() { return recomenda; }
    public void setRecomenda(boolean recomenda) { this.recomenda = recomenda; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }
}
