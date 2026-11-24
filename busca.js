/* ==========================================================================
   busca.js — Modal de busca (portado do front P1, branch herofix2).
   Em vez da lista fixa de produtos do P1, consulta o backend:
   GET /api/produto/busca/{termo}  (api.buscarProdutosPorTermo, em api.js)
   "Ver todos" / Enter leva para catalogo.html?q=<termo>.
   ========================================================================== */
(function () {
    const modal = document.getElementById('modal-search');
    if (!modal || typeof api === 'undefined') return;

    const input = document.getElementById('search-input');
    const form = document.getElementById('search-form');
    const start = document.getElementById('search-start');
    const live = document.getElementById('search-live');
    const SUGGESTIONS = ['Jaqueta', 'Fleece', 'Shorts', 'Oakley', 'Nike'];

    const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const img = p => (typeof caminhoImagem === 'function' ? caminhoImagem(p.imagem) : p.imagem) || '';
    const imgFallback = "this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}))";
    const urlResultados = q => 'catalogo.html?q=' + encodeURIComponent(q);

    let timer;
    let reqId = 0; // descarta respostas antigas quando o usuário continua digitando

    function renderEmpty(q) {
        live.innerHTML = `
            <div class="search-empty"><i class="fa-solid fa-magnifying-glass"></i>
                <p>NENHUM RESULTADO PARA "${esc(q.toUpperCase())}".<br>TENTE OUTRO TERMO OU VEJA AS SUGESTÕES:</p>
            </div>
            <div class="search-suggestions" style="justify-content:center">${SUGGESTIONS.map(s => `<button type="button" class="chip" data-q="${s}">${s.toUpperCase()}</button>`).join('')}</div>`;
    }

    function renderResults(q, results) {
        live.innerHTML = `
            <h3 class="search-subtitle">RESULTADOS <small>(${results.length})</small></h3>
            <div class="search-results-list">
                ${results.slice(0, 4).map(p => `
                    <a href="produto.html?codigo=${encodeURIComponent(p.codigo)}" class="search-result-row">
                        <img src="${esc(img(p))}" alt="${esc(p.nome)}" onerror="${imgFallback}">
                        <div class="sr-info"><h4>${esc(p.marca)}</h4><p class="sr-name">${esc(p.nome)}</p></div>
                        <div class="sr-price">${p.precoOriginal ? `<span class="price-old">${fmt(p.precoOriginal)}</span>` : ''}${fmt(p.preco)}</div>
                    </a>`).join('')}
            </div>
            <div class="search-see-all"><a class="btn-full" href="${urlResultados(q)}">VER TODOS OS RESULTADOS (${results.length}) &rarr;</a></div>`;
    }

    async function update() {
        const q = input.value.trim();
        const on = q.length >= 2;
        start.hidden = on;
        live.hidden = !on;
        if (!on) return;

        const meuId = ++reqId;
        try {
            const results = await api.buscarProdutosPorTermo(q);
            if (meuId !== reqId) return;
            if (!results || !results.length) renderEmpty(q);
            else renderResults(q, results);
        } catch (e) {
            if (meuId !== reqId) return;
            live.innerHTML = `<div class="search-empty"><i class="fa-solid fa-triangle-exclamation"></i>
                <p>NÃO FOI POSSÍVEL BUSCAR. VERIFIQUE SE O BACKEND ESTÁ RODANDO EM http://localhost:8080.</p></div>`;
        }
    }

    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 250); });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = input.value.trim();
        if (q) window.location.href = urlResultados(q);
    });
    live.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (chip) { input.value = chip.dataset.q; update(); input.focus(); }
    });
    document.getElementById('btn-search')?.addEventListener('click', () => setTimeout(() => input.focus(), 50));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });
})();
