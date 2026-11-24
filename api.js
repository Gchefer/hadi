/* ==========================================================================
   api.js — Integração do frontend HADI (projeto P1) com o backend Spring Boot
   (projeto P2: hado-backend). Ver hado-backend/README.md para subir a API.

   Todas as funções aqui retornam Promises. Em caso de falha de rede (backend
   fora do ar), elas rejeitam a Promise — quem chama decide o que mostrar.
   ========================================================================== */

// Ajuste aqui se o backend estiver rodando em outra porta/host.
const API_BASE_URL = 'http://localhost:8080/api';

async function apiRequest(path, options = {}) {
    const response = await fetch(API_BASE_URL + path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
        const msg = typeof body === 'string' ? body : (body.message || 'Erro na requisição');
        const erro = new Error(msg);
        erro.status = response.status; // distingue erro da API (4xx/5xx) de falha de rede (sem status)
        throw erro;
    }
    return body;
}

const api = {
    // --- PRODUTO ---
    listarProdutos: () => apiRequest('/produtos'),
    buscarVitrine: () => apiRequest('/produto/vitrine'),
    buscarProdutoPorCodigo: (codigo) => apiRequest(`/produto/${codigo}`),
    buscarProdutosPorTermo: (termo) => apiRequest(`/produto/busca/${encodeURIComponent(termo)}`),

    // --- PRODUTO (painel admin: exige a chave X-Admin-Key) ---
    cadastrarProduto: (dados, chave) => apiRequest('/produto', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': chave }, body: JSON.stringify(dados) }),
    alterarProduto: (dados, chave) => apiRequest('/produto', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': chave }, body: JSON.stringify(dados) }),
    excluirProduto: (codigo, chave) => apiRequest(`/produto/${codigo}`, { method: 'DELETE', headers: { 'X-Admin-Key': chave } }),
    enviarImagemProduto: (arquivo, chave) => { const fd = new FormData(); fd.append('arquivo', arquivo); return apiRequest('/produto/imagem', { method: 'POST', headers: { 'X-Admin-Key': chave }, body: fd }); },

    // --- CLIENTE ---
    cadastrarCliente: (dados) => apiRequest('/cliente', { method: 'POST', body: JSON.stringify(dados) }),
    alterarCliente: (dados) => apiRequest('/cliente', { method: 'PUT', body: JSON.stringify(dados) }),
    buscarClientePorCodigo: (codigo) => apiRequest(`/cliente/${codigo}`),
    login: (email, senha) => apiRequest('/cliente/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    resetarSenha: (email) => apiRequest('/cliente/resetarSenha', { method: 'PATCH', body: JSON.stringify({ email }) }),
    alterarSenha: (email, documento, senha) => apiRequest('/cliente/alterarSenha', { method: 'PATCH', body: JSON.stringify({ email, documento, senha }) }),

    // --- PEDIDO ---
    criarPedido: (dados) => apiRequest('/pedido', { method: 'POST', body: JSON.stringify(dados) }),
    buscarPedidosDoCliente: (codigoCliente) => apiRequest(`/pedido/cliente/${codigoCliente}`),
};

/* ---------- Sessão do cliente logado (localStorage) ---------- */
const sessao = {
    salvar(cliente) {
        localStorage.setItem('hadi_cliente', JSON.stringify(cliente));
        // Ao entrar na conta, o que foi colocado no carrinho sem login passa para o carrinho da conta.
        if (cliente && cliente.codigo) carrinho.mesclarAnonimo();
    },
    obter() {
        try {
            const raw = localStorage.getItem('hadi_cliente');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    limpar() {
        localStorage.removeItem('hadi_cliente');
    },
    /**
     * Confere no backend se a conta da sessão ainda existe e é a mesma (e-mail igual) e atualiza os
     * dados salvos com os do banco. Sessão inválida é descartada (retorna null). Backend fora do ar:
     * mantém a sessão local como está.
     */
    async validar() {
        const s = sessao.obter();
        if (!s || !s.codigo) return null;
        let c;
        try {
            c = await api.buscarClientePorCodigo(s.codigo);
        } catch {
            return s;
        }
        const mesmoEmail = !s.email || !c || !c.email || s.email.toLowerCase() === c.email.toLowerCase();
        if (!c || !c.codigo || !mesmoEmail) {
            sessao.limpar();
            return null;
        }
        const atual = { ...s, ...c };
        localStorage.setItem('hadi_cliente', JSON.stringify(atual));
        return atual;
    },
};
// Validação única por carregamento de página; script.js, conta.js e o checkout aguardam esta Promise.
const sessaoPronta = sessao.validar();

/* ---------- Carrinho (localStorage): [{ codigo, quantidade }] ---------- */
// Cada conta tem o próprio carrinho (hadi_carrinho_<codigo>); sem login, usa hadi_carrinho_anon.
// Ao sair da conta, o carrinho dela fica guardado e volta no próximo login.
const CHAVE_CARRINHO_ANON = 'hadi_carrinho_anon';
const carrinho = {
    chave() {
        const c = sessao.obter();
        return c && c.codigo ? 'hadi_carrinho_' + c.codigo : CHAVE_CARRINHO_ANON;
    },
    ler(chave) {
        try {
            const raw = localStorage.getItem(chave);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },
    obter() {
        return carrinho.ler(carrinho.chave());
    },
    salvar(itens) {
        localStorage.setItem(carrinho.chave(), JSON.stringify(itens));
    },
    mesclarAnonimo() {
        // Migra o carrinho antigo (chave única, versões anteriores) para o anônimo.
        const legado = carrinho.ler('hadi_carrinho');
        const anon = carrinho.ler(CHAVE_CARRINHO_ANON).concat(legado);
        if (legado.length) {
            localStorage.setItem(CHAVE_CARRINHO_ANON, JSON.stringify(anon));
            localStorage.removeItem('hadi_carrinho');
        }
        if (anon.length === 0 || carrinho.chave() === CHAVE_CARRINHO_ANON) return;
        const itens = carrinho.obter();
        anon.forEach(({ codigo, quantidade }) => {
            const existente = itens.find((i) => i.codigo === codigo);
            if (existente) existente.quantidade += quantidade;
            else itens.push({ codigo, quantidade });
        });
        carrinho.salvar(itens);
        localStorage.removeItem(CHAVE_CARRINHO_ANON);
    },
    adicionar(codigo, quantidade = 1) {
        const itens = carrinho.obter();
        const existente = itens.find((i) => i.codigo === codigo);
        if (existente) {
            existente.quantidade += quantidade;
        } else {
            itens.push({ codigo, quantidade });
        }
        carrinho.salvar(itens);
    },
    remover(codigo) {
        carrinho.salvar(carrinho.obter().filter((i) => i.codigo !== codigo));
    },
    atualizarQuantidade(codigo, quantidade) {
        const itens = carrinho.obter();
        const item = itens.find((i) => i.codigo === codigo);
        if (item) {
            item.quantidade = Math.max(1, quantidade);
            carrinho.salvar(itens);
        }
    },
    limpar() {
        localStorage.removeItem(carrinho.chave());
    },
};

/* ---------- Helpers de formatação ---------- */
function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function caminhoImagem(nomeArquivo) {
    // Imagens enviadas pelo painel admin ficam no backend (uploads/...); as demais, em img/ do frontend.
    if (nomeArquivo && /^https?:\/\//.test(nomeArquivo)) return nomeArquivo;
    if (nomeArquivo && nomeArquivo.startsWith('uploads/')) return API_BASE_URL.replace(/\/api$/, '') + '/' + nomeArquivo;
    return 'img/' + (nomeArquivo || 'placeholder.png');
}

// Migra o carrinho da versão antiga (chave única) assim que a página carrega.
try { carrinho.mesclarAnonimo(); } catch { /* localStorage indisponível */ }
