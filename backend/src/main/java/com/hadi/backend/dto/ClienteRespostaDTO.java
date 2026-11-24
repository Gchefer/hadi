package com.hadi.backend.dto;

import com.hadi.backend.entity.Cliente;

/** Resposta pública de cliente — nunca inclui a senha. */
public class ClienteRespostaDTO {

    private Long codigo;
    private String nome;
    private String email;
    private String documento;
    private String telefone;
    private String cep;
    private String endereco;
    private String numero;
    private String complemento;
    private String cidade;
    private String estado;
    private String dataNascimento;
    private String genero;

    public static ClienteRespostaDTO fromEntity(Cliente c) {
        ClienteRespostaDTO dto = new ClienteRespostaDTO();
        dto.codigo = c.getCodigo();
        dto.nome = c.getNome();
        dto.email = c.getEmail();
        dto.documento = c.getDocumento();
        dto.telefone = c.getTelefone();
        dto.cep = c.getCep();
        dto.endereco = c.getEndereco();
        dto.numero = c.getNumero();
        dto.complemento = c.getComplemento();
        dto.cidade = c.getCidade();
        dto.estado = c.getEstado();
        dto.dataNascimento = c.getDataNascimento();
        dto.genero = c.getGenero();
        return dto;
    }

    public Long getCodigo() {
        return codigo;
    }

    public void setCodigo(Long codigo) {
        this.codigo = codigo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        this.complemento = complemento;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(String dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getGenero() {
        return genero;
    }

    public void setGenero(String genero) {
        this.genero = genero;
    }
}
