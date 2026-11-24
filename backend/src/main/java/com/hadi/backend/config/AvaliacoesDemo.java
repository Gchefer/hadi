package com.hadi.backend.config;

import com.hadi.backend.entity.Avaliacao;
import com.hadi.backend.entity.Produto;
import com.hadi.backend.repository.AvaliacaoRepository;
import com.hadi.backend.repository.ProdutoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Avaliações de demonstração (só são gravadas quando a tabela de avaliações está vazia).
 * Cada tipo de produto tem seu próprio conjunto de comentários; cada produto recebe
 * de 3 a 5 deles, com autores e datas diferentes, para o site parecer usado de verdade.
 */
final class AvaliacoesDemo {

    private AvaliacoesDemo() {
    }

    /** nota, título, comentário, tamanho comprado (ou null), recomenda */
    private record Texto(int nota, String titulo, String comentario, String tamanho, boolean recomenda) {
    }

    private static final List<String> AUTORES = List.of(
            "Márcia Jardim", "João Carvalho", "Nicole Martins", "Paulo Souza", "Fernanda Lima",
            "Rafael Oliveira", "Camila Rocha", "Bruno Almeida", "Juliana Costa", "Thiago Ribeiro",
            "Larissa Mendes", "Diego Fernandes", "Aline Barbosa", "Lucas Pereira", "Beatriz Gomes",
            "Gabriel Santos", "Patrícia Nunes", "Rodrigo Teixeira", "Vanessa Araújo", "Felipe Moreira");

    private static final Map<String, List<Texto>> POR_SUBCATEGORIA = Map.of(
            "Jaquetas", List.of(
                    new Texto(5, "A JAQUETA É MARAVILHOSA!", "Usei numa travessia de 3 dias com chuva forte e não molhou nada por dentro. Vale cada centavo.", "M", true),
                    new Texto(2, "TAMANHO FICOU GRANDE DEMAIS..", "O material é ótimo, mas a modelagem é bem larga. Recomendo pegar um número abaixo do que você usa.", "G", false),
                    new Texto(5, "MATERIAL ÓTIMO", "Acabamento impecável, zíperes firmes e o capuz regula muito bem. Leve para o que entrega.", "M", true),
                    new Texto(4, "ENTREGA RÁPIDA E BEM EMBALADA", "Chegou antes do prazo. A jaqueta é excelente, só achei o bolso interno pequeno.", "P", true),
                    new Texto(5, "PERFEITA PARA O FRIO", "Usei no inverno de Campos do Jordão e segurou bem o vento. Muito confortável no corpo.", "GG", true),
                    new Texto(4, "BOA, MAS ESQUENTA NA SUBIDA", "Protege muito bem, mas em subida forte esquenta um pouco. Abrir as ventilações resolve.", "M", true)),
            "Calças", List.of(
                    new Texto(5, "QUENTINHA E NÃO PINICA", "Usei por baixo da calça de neve e também sozinha na trilha. Tecido macio e não pinica.", "40", true),
                    new Texto(4, "VESTE BEM", "Ficou certinha na cintura, só o comprimento ficou um pouco longo para mim.", "42", true),
                    new Texto(3, "BOA, MAS ESPERAVA MAIS", "É confortável, mas para o preço esperava bolsos com zíper.", "38", false),
                    new Texto(5, "MELHOR CALÇA TÉRMICA QUE JÁ TIVE", "Seca rápido e mantém o calor mesmo úmida. Já quero outra cor.", "40", true)),
            "Camisetas", List.of(
                    new Texto(5, "CONFORTÁVEL DEMAIS", "Tecido leve, não marca suor e o caimento é ótimo. Uso no dia a dia e na trilha.", "M", true),
                    new Texto(4, "ÓTIMO CUSTO-BENEFÍCIO", "Com o desconto saiu muito em conta. Só encolheu um pouquinho na primeira lavagem.", "G", true),
                    new Texto(5, "ESTAMPA NÃO DESBOTA", "Já lavei várias vezes e o logo continua perfeito.", "P", true),
                    new Texto(3, "TAMANHO JUSTO", "Gostei do tecido, mas é bem mais justa do que eu imaginava. Pegue um número acima.", "M", true)),
            "Shorts e Bermudas", List.of(
                    new Texto(5, "LEVE E SECA RÁPIDO", "Corri uma prova de 21km com ele e nem senti. O bolso traseiro segura bem o celular.", "M", true),
                    new Texto(4, "MUITO BOM PARA TRILHA", "Tecido resistente e confortável. O cordão de ajuste poderia ser um pouco maior.", "G", true),
                    new Texto(5, "VIROU MEU FAVORITO", "Uso para correr, para a praia e para o dia a dia. Comprei mais um.", "P", true),
                    new Texto(2, "FORRO INCOMODOU", "O tecido é bom, mas o forro interno ficou desconfortável para mim em corridas longas.", "M", false),
                    new Texto(4, "BONITO E PRÁTICO", "A cor é linda pessoalmente. Só achei o comprimento um pouco curto.", "PP", true)),
            "Mochilas e Bolsas", List.of(
                    new Texto(5, "CABE MAIS DO QUE PARECE", "Levo carteira, celular, garrafa e um corta-vento. Ajusta bem no corpo e não balança.", null, true),
                    new Texto(4, "PRÁTICA PARA O DIA A DIA", "Uso para trabalhar de bicicleta. Só queria um bolso externo a mais.", null, true),
                    new Texto(5, "MATERIAL MUITO RESISTENTE", "Já peguei chuva com ela e nada molhou. Zíperes de ótima qualidade.", null, true)),
            "Óculos", List.of(
                    new Texto(5, "LENTE INCRÍVEL", "A nitidez da lente é outro nível. Não embaça na corrida e fica firme no rosto.", null, true),
                    new Texto(4, "BONITO E LEVE", "Muito leve, quase não sinto no rosto. Achei o case que acompanha simples.", null, true),
                    new Texto(5, "VALEU O INVESTIMENTO", "Uso na bike e no ski. Protege bem do sol e do vento.", null, true),
                    new Texto(3, "APERTA UM POUCO", "Ótima qualidade, mas para quem tem rosto largo aperta um pouco nas têmporas.", null, false)),
            "Headwear", List.of(
                    new Texto(5, "QUENTE E LINDO", "Usei na neve e manteve a cabeça aquecida o dia inteiro. O bordado é muito caprichado.", null, true),
                    new Texto(4, "BOM, MAS É CURTO", "Tecido ótimo, mas não cobre muito as orelhas. Para o frio daqui é perfeito.", null, true),
                    new Texto(5, "PRESENTE ACERTADO", "Comprei de presente e a pessoa amou. Chegou muito bem embalado.", null, true))
    );

    static void popular(ProdutoRepository produtoRepository, AvaliacaoRepository avaliacaoRepository) {
        LocalDate hoje = LocalDate.now();
        int sequencia = 0;
        for (Produto produto : produtoRepository.findByAtivoTrue()) {
            List<Texto> textos = POR_SUBCATEGORIA.get(produto.getSubcategoria());
            if (textos == null) continue; // produtos cadastrados pelo admin começam sem avaliações
            int id = produto.getCodigo().intValue();
            int quantidade = 3 + id % 3; // 3, 4 ou 5 avaliações por produto
            for (int i = 0; i < quantidade && i < textos.size(); i++) {
                Texto texto = textos.get((id + i) % textos.size());
                Avaliacao a = new Avaliacao();
                a.setProduto(produto);
                a.setAutor(AUTORES.get((id * 7 + i * 3) % AUTORES.size()));
                a.setNota(texto.nota());
                a.setTitulo(texto.titulo());
                a.setComentario(texto.comentario());
                a.setTamanhoComprado(tamanhoValido(texto.tamanho(), produto.getTamanhos()));
                a.setRecomenda(texto.recomenda());
                a.setData(hoje.minusDays(3 + (sequencia++ * 11L) % 170));
                avaliacaoRepository.save(a);
            }
        }
    }

    /** Usa o tamanho do texto só se o produto tiver esse tamanho; senão, o primeiro disponível. */
    private static String tamanhoValido(String tamanho, String tamanhosDoProduto) {
        if (tamanhosDoProduto == null || tamanhosDoProduto.isBlank()) return null;
        List<String> lista = List.of(tamanhosDoProduto.split(","));
        return tamanho != null && lista.contains(tamanho) ? tamanho : lista.get(lista.size() / 2);
    }
}
