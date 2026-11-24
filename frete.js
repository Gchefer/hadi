/* ==========================================================================
   frete.js — Consulta de CEP e cálculo de frete via backend
   GET /api/frete/{cep}?subtotal=X  -> endereço (ViaCEP) + opções PAC/SEDEX
   Usado em: página de produto (CALCULAR), carrinho (CALCULE O FRETE) e checkout.
   O último CEP consultado fica salvo no navegador para preencher os outros campos.
   ========================================================================== */
const CHAVE_CEP = 'hadi_cep';
const freteEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mascaraCep = v => String(v || '').replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
const cepSalvo = () => { try { return localStorage.getItem(CHAVE_CEP) || ''; } catch { return ''; } };
const salvarCep = cep => { try { localStorage.setItem(CHAVE_CEP, mascaraCep(cep)); } catch { /* sem storage */ } };
const precoDoTexto = txt => Number(String(txt || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

function mensagemErroFrete(err) {
    if (!err.status) return 'NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR.';
    return (err.message || 'NÃO FOI POSSÍVEL CALCULAR O FRETE.').toUpperCase();
}

function enderecoTexto(e) {
    if (!e) return '';
    const local = [e.cidade, e.uf].filter(Boolean).join('/');
    return [e.logradouro, e.bairro, local].filter(Boolean).join(' - ');
}

/** Cards de PAC/SEDEX (mesmo visual do checkout). */
function opcoesFreteHTML(dados, nomeRadio) {
    const end = enderecoTexto(dados.endereco);
    return (end ? `<p class="frete-endereco"><i class="fa-solid fa-location-dot"></i> ${freteEsc(end.toUpperCase())}</p>` : '') +
        dados.opcoes.map((o, i) => `
            <label class="radio-card"><input type="radio" name="${nomeRadio}" value="${o.tipo.toLowerCase()}" ${i === 0 ? 'checked' : ''}>
                <div class="card-content">
                    <div class="radio-header"><span>${o.tipo}</span><span>${Number(o.valor) === 0 ? 'GRÁTIS' : formatarPreco(o.valor)}</span></div>
                    <p class="desc">ATÉ ${o.prazoDiasUteis} DIAS ÚTEIS</p>
                </div>
            </label>`).join('') +
        `<p class="help-text">FRETE GRÁTIS (PAC) EM COMPRAS ACIMA DE ${formatarPreco(dados.freteGratisAPartirDe)}.</p>`;
}

/** Liga um campo de CEP + botão a uma área de resultado. getSubtotal() devolve o valor da compra. */
function ligarCalculoFrete({ input, botao, resultado, nomeRadio, getSubtotal }) {
    if (!input || !botao || !resultado || typeof api === 'undefined' || !api.calcularFrete) return;
    if (!input.value) input.value = cepSalvo();
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('maxlength', '9');
    input.addEventListener('input', () => { input.value = mascaraCep(input.value); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); botao.click(); } });

    botao.addEventListener('click', async () => {
        const cep = input.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            resultado.innerHTML = '<p class="form-error">DIGITE UM CEP VÁLIDO (00000-000).</p>';
            input.focus();
            return;
        }
        resultado.innerHTML = '<p class="help-text">CONSULTANDO CEP...</p>';
        botao.disabled = true;
        try {
            const dados = await api.calcularFrete(cep, getSubtotal());
            salvarCep(cep);
            resultado.innerHTML = opcoesFreteHTML(dados, nomeRadio);
        } catch (err) {
            resultado.innerHTML = `<p class="form-error">${freteEsc(mensagemErroFrete(err))}</p>`;
        } finally {
            botao.disabled = false;
        }
    });
}

// ---------------- CHECKOUT: frete no resumo e no pedido ----------------
let freteCheckout = null; // resposta de /api/frete para o CEP do checkout

let subtotalDoFrete = null; // subtotal usado na última consulta (frete grátis depende dele)
let reconsultarFreteCheckout = null;

function atualizarTotalCheckout() {
    const subtotal = Number(window.subtotalCheckout) || 0;
    // O resumo do carrinho terminou de carregar depois da consulta: recalcula com o subtotal certo
    if (freteCheckout && subtotalDoFrete !== subtotal && reconsultarFreteCheckout) { reconsultarFreteCheckout(); return; }
    const tipo = (document.querySelector('input[name="entrega"]:checked')?.value || 'pac').toUpperCase();
    const opcao = freteCheckout?.opcoes.find(o => o.tipo === tipo);
    const valorFrete = opcao ? Number(opcao.valor) : 0;
    const freteEl = document.getElementById('checkout-frete');
    if (freteEl) freteEl.textContent = !opcao ? 'INFORME O CEP' : valorFrete === 0 ? 'GRÁTIS' : formatarPreco(valorFrete);
    const totalEl = document.getElementById('checkout-total');
    if (totalEl) totalEl.textContent = formatarPreco(subtotal + valorFrete);
}

function atualizarOpcoesCheckout() {
    (freteCheckout?.opcoes || []).forEach(o => {
        const card = document.querySelector(`input[name="entrega"][value="${o.tipo.toLowerCase()}"]`)?.closest('.radio-card');
        if (!card) return;
        card.querySelector('.price').textContent = Number(o.valor) === 0 ? 'GRÁTIS' : formatarPreco(o.valor);
        card.querySelector('.desc').textContent = `ATÉ ${o.prazoDiasUteis} DIAS ÚTEIS`;
    });
    atualizarTotalCheckout();
}

document.addEventListener('DOMContentLoaded', () => {
    // Página de produto: CEP + CALCULAR
    ligarCalculoFrete({
        input: document.getElementById('cep-input'),
        botao: document.getElementById('btn-calcular-frete'),
        resultado: document.getElementById('frete-resultado'),
        nomeRadio: 'frete-opcao',
        getSubtotal: () => precoDoTexto(document.getElementById('detail-price')?.textContent)
            * (Number(document.querySelector('.add-to-cart-row .qty-value')?.textContent) || 1),
    });

    // Carrinho lateral (todas as páginas): CALCULE O FRETE
    const cartShipping = document.querySelector('.cart-shipping');
    if (cartShipping) {
        let res = cartShipping.querySelector('.cart-shipping-result');
        if (!res) {
            res = document.createElement('div');
            res.className = 'cart-shipping-result frete-resultado';
            cartShipping.appendChild(res);
        }
        ligarCalculoFrete({
            input: cartShipping.querySelector('input'),
            botao: cartShipping.querySelector('button'),
            resultado: res,
            nomeRadio: 'frete-carrinho',
            getSubtotal: () => Number(window.subtotalCarrinho) || 0,
        });
    }

    // "Não sabe o seu CEP?" -> busca dos Correios
    document.querySelectorAll('#cep-help a, .input-group a.help-text').forEach(a => {
        if (/cep/i.test(a.textContent)) {
            a.href = 'https://buscacepinter.correios.com.br/app/endereco/index.php';
            a.target = '_blank';
            a.rel = 'noopener';
        }
    });

    // Checkout: ao digitar o CEP, preenche o endereço e calcula PAC/SEDEX
    const cepCheckout = document.getElementById('checkout-cep');
    if (cepCheckout && typeof api !== 'undefined' && api.calcularFrete) {
        const endInput = document.getElementById('checkout-endereco');
        let hint = document.getElementById('checkout-cep-hint');
        if (!hint) {
            hint = document.createElement('span');
            hint.id = 'checkout-cep-hint';
            hint.className = 'field-hint';
            cepCheckout.insertAdjacentElement('afterend', hint);
        }
        let ultimo = '';
        let enderecoAutomatico = '';
        async function consultar() {
            const cep = cepCheckout.value.replace(/\D/g, '');
            if (cep.length !== 8) {
                if (cep !== ultimo) { freteCheckout = null; atualizarTotalCheckout(); hint.textContent = ''; }
                ultimo = cep;
                return;
            }
            if (cep === ultimo) return;
            ultimo = cep;
            hint.className = 'field-hint ok';
            hint.textContent = 'CONSULTANDO CEP...';
            try {
                subtotalDoFrete = Number(window.subtotalCheckout) || 0;
                freteCheckout = await api.calcularFrete(cep, subtotalDoFrete);
                salvarCep(cep);
                const end = enderecoTexto(freteCheckout.endereco);
                hint.textContent = freteCheckout.endereco ? `${freteCheckout.endereco.cidade} / ${freteCheckout.endereco.uf} ✔` : 'CEP OK (ENDEREÇO INDISPONÍVEL NO MOMENTO)';
                // Só sobrescreve o endereço se estiver vazio ou se foi preenchido automaticamente antes
                if (end && endInput && (!endInput.value.trim() || endInput.value === enderecoAutomatico)) {
                    endInput.value = end;
                    enderecoAutomatico = end;
                    if (freteCheckout.endereco.logradouro) endInput.placeholder = 'Complete com o número e o complemento';
                }
            } catch (err) {
                freteCheckout = null;
                hint.className = 'field-hint bad';
                hint.textContent = mensagemErroFrete(err) + ' ✘';
            }
            atualizarOpcoesCheckout();
        }
        reconsultarFreteCheckout = () => { ultimo = ''; consultar(); };
        cepCheckout.addEventListener('input', () => { cepCheckout.value = mascaraCep(cepCheckout.value); consultar(); });
        document.querySelectorAll('input[name="entrega"]').forEach(r => r.addEventListener('change', atualizarTotalCheckout));
        // O CEP pode vir da conta do cliente ou do último CEP consultado no site
        setTimeout(() => {
            if (!cepCheckout.value && cepSalvo()) cepCheckout.value = cepSalvo();
            consultar();
        }, 600);
    }
});
