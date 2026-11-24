package com.hadi.backend.util;

/** Validação de CPF pelos dígitos verificadores (mesma regra usada no frontend). */
public final class CpfValidator {

    private CpfValidator() {
    }

    public static boolean isValido(String valor) {
        if (valor == null) return false;
        String c = valor.replaceAll("\\D", "");
        if (c.length() != 11 || c.chars().distinct().count() == 1) return false;
        return digito(c, 9) == c.charAt(9) - '0' && digito(c, 10) == c.charAt(10) - '0';
    }

    private static int digito(String c, int n) {
        int soma = 0;
        for (int i = 0; i < n; i++) {
            soma += (c.charAt(i) - '0') * (n + 1 - i);
        }
        int r = (soma * 10) % 11;
        return r == 10 ? 0 : r;
    }
}
