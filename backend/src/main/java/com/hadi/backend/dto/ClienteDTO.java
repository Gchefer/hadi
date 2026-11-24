package com.hadi.backend.dto;

import com.hadi.backend.entity.Cliente;

/** Body de cadastro/alteração de cliente (inclui senha, nunca é usado como resposta). */
public class ClienteDTO {

    private Long codigo;
    private String nome;
    private String email;
    private String senha;
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

    public ClienteDTO() {
    }

    /** Atualização parcial: só copia campos enviados (não nulos), para não apagar dados já gravados. */
    public void copyToEntity(Cliente c) {
        if (nome != null) c.setNome(nome);
        if (email != null) c.setEmail(email);
        // A senha NÃO é copiada aqui: o controller aplica o hash BCrypt antes de gravar.
        if (documento != null) c.setDocumento(documento);
        if (telefone != null) c.setTelefone(telefone);
        if (cep != null) c.setCep(cep);
        if (endereco != null) c.setEndereco(endereco);
        if (numero != null) c.setNumero(numero);
        if (complemento != null) c.setComplemento(complemento);
        if (cidade != null) c.setCidade(cidade);
        if (estado != null) c.setEstado(estado);
        if (dataNascimento != null) c.setDataNascimento(dataNascimento);
        if (genero != null) c.setGenero(genero);
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

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
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
