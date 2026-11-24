package com.hadi.backend.repository;

import com.hadi.backend.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByEmail(String email);

    Optional<Cliente> findByEmailAndSenha(String email, String senha);

    boolean existsByEmail(String email);
}
