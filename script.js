// ===========================
//  ESTADO GLOBAL
// ===========================
let lancamentos = JSON.parse(localStorage.getItem('gastos_lancamentos')) || [];
let filtroAtivo = 'todos';

// Mês/ano exibido
const hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();

// ===========================
//  INICIALIZAÇÃO
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Data padrão = hoje
  document.getElementById('data').value = hoje.toISOString().split('T')[0];

  // Navegação de mês
  document.getElementById('btnMesAnterior').addEventListener('click', () => {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    renderTudo();
  });

  document.getElementById('btnMesProximo').addEventListener('click', () => {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    renderTudo();
  });

  // Botão adicionar
  document.getElementById('btnAdicionar').addEventListener('click', adicionarLancamento);

  // Filtros
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      filtroAtivo = btn.dataset.filtro;
      renderLista();
    });
  });

  renderTudo();
});

// ===========================
//  ADICIONAR LANÇAMENTO
// ===========================
function adicionarLancamento() {
  const descricao  = document.getElementById('descricao').value.trim();
  const valor      = parseFloat(document.getElementById('valor').value);
  const tipo       = document.getElementById('tipo').value;
  const categoria  = document.getElementById('categoria').value;
  const data       = document.getElementById('data').value;

  if (!descricao) { toast('Por favor, informe a descrição.'); return; }
  if (!valor || valor <= 0) { toast('Por favor, informe um valor válido.'); return; }
  if (!data) { toast('Por favor, informe a data.'); return; }

  const novo = {
    id: Date.now(),
    descricao,
    valor,
    tipo,
    categoria,
    data
  };

  lancamentos.push(novo);
  salvar();

  // Ajusta o mês exibido para o mês do lançamento adicionado
  const d = new Date(data + 'T00:00:00');
  mesAtual = d.getMonth();
  anoAtual = d.getFullYear();

  renderTudo();
  limparFormulario();
  toast(`Lançamento "${descricao}" adicionado!`);
}

// ===========================
//  REMOVER LANÇAMENTO
// ===========================
function removerLancamento(id) {
  lancamentos = lancamentos.filter(l => l.id !== id);
  salvar();
  renderTudo();
  toast('Lançamento removido.');
}

// ===========================
//  FILTRAR POR MÊS
// ===========================
function lancamentosDoMes() {
  return lancamentos.filter(l => {
    const d = new Date(l.data + 'T00:00:00');
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
}

// ===========================
//  RENDER GERAL
// ===========================
function renderTudo() {
  renderMes();
  renderCards();
  renderLista();
  renderCategorias();
}

// ===========================
//  RENDER MÊS
// ===========================
function renderMes() {
  const label = new Date(anoAtual, mesAtual, 1).toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric'
  });
  document.getElementById('labelMes').textContent = label;
}

// ===========================
//  RENDER CARDS RESUMO
// ===========================
function renderCards() {
  const mes = lancamentosDoMes();

  const totalReceitas  = mes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const totalDespesas  = mes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
  const saldo          = totalReceitas - totalDespesas;

  document.getElementById('totalReceitas').textContent = formatarMoeda(totalReceitas);
  document.getElementById('totalDespesas').textContent = formatarMoeda(totalDespesas);
  document.getElementById('totalSaldo').textContent    = formatarMoeda(Math.abs(saldo));

  const saldoEl = document.getElementById('totalSaldo');
  const statusEl = document.getElementById('saldoStatus');

  if (saldo > 0) {
    saldoEl.style.color = 'var(--receita)';
    statusEl.textContent = '↑ Superávit';
    statusEl.style.color = 'var(--receita)';
  } else if (saldo < 0) {
    saldoEl.style.color = 'var(--despesa)';
    statusEl.textContent = '↓ Déficit';
    statusEl.style.color = 'var(--despesa)';
  } else {
    saldoEl.style.color = 'var(--text)';
    statusEl.textContent = '— Zerado';
    statusEl.style.color = 'var(--text2)';
  }

  // Barras
  const total = totalReceitas + totalDespesas;
  const pctReceita = total > 0 ? (totalReceitas / total * 100) : 0;
  const pctDespesa = total > 0 ? (totalDespesas / total * 100) : 0;

  setTimeout(() => {
    document.getElementById('barReceita').style.width = pctReceita + '%';
    document.getElementById('barDespesa').style.width = pctDespesa + '%';
  }, 50);
}

// ===========================
//  RENDER LISTA
// ===========================
function renderLista() {
  const container = document.getElementById('listaGastos');
  let mes = lancamentosDoMes();

  if (filtroAtivo !== 'todos') {
    mes = mes.filter(l => l.tipo === filtroAtivo);
  }

  // Ordenar por data (mais recente primeiro)
  mes.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (mes.length === 0) {
    container.innerHTML = `
      <div class="lista-vazia">
        <span>◈</span>
        <p>Nenhum lançamento encontrado<br>para este mês ou filtro.</p>
      </div>`;
    return;
  }

  container.innerHTML = mes.map(l => `
    <div class="item">
      <div class="item-dot ${l.tipo}"></div>
      <div class="item-info">
        <div class="item-desc">${escapar(l.descricao)}</div>
        <div class="item-meta">${l.categoria} · ${formatarData(l.data)}</div>
      </div>
      <div class="item-valor ${l.tipo}">
        ${l.tipo === 'receita' ? '+' : '-'} ${formatarMoeda(l.valor)}
      </div>
      <button class="item-delete" onclick="removerLancamento(${l.id})" title="Remover">✕</button>
    </div>
  `).join('');
}

// ===========================
//  RENDER CATEGORIAS
// ===========================
function renderCategorias() {
  const container = document.getElementById('graficoCategorias');
  const despesas = lancamentosDoMes().filter(l => l.tipo === 'despesa');

  if (despesas.length === 0) {
    container.innerHTML = '<p class="lista-vazia-small">Sem despesas para exibir.</p>';
    return;
  }

  // Agrupar por categoria
  const mapa = {};
  despesas.forEach(l => {
    mapa[l.categoria] = (mapa[l.categoria] || 0) + l.valor;
  });

  const total = Object.values(mapa).reduce((s, v) => s + v, 0);
  const ordenado = Object.entries(mapa).sort((a, b) => b[1] - a[1]);

  const cores = [
    '#e05c6e','#e0855c','#e0c05c','#8de05c',
    '#5ce0a8','#5cb8e0','#5c72e0','#a05ce0',
    '#e05cb8'
  ];

  container.innerHTML = ordenado.map(([cat, val], i) => {
    const pct = total > 0 ? (val / total * 100) : 0;
    const cor = cores[i % cores.length];
    return `
      <div class="cat-item">
        <div class="cat-nome">${cat}</div>
        <div class="cat-barra-wrap">
          <div class="cat-barra" style="width:0%; background:${cor}" data-pct="${pct.toFixed(1)}"></div>
        </div>
        <div class="cat-valor">${formatarMoeda(val)}</div>
        <div class="cat-pct">${pct.toFixed(0)}%</div>
      </div>
    `;
  }).join('');

  // Animar barras
  setTimeout(() => {
    container.querySelectorAll('.cat-barra').forEach(b => {
      b.style.width = b.dataset.pct + '%';
    });
  }, 50);
}

// ===========================
//  UTILITÁRIOS
// ===========================
function salvar() {
  localStorage.setItem('gastos_lancamentos', JSON.stringify(lancamentos));
}

function limparFormulario() {
  document.getElementById('descricao').value = '';
  document.getElementById('valor').value = '';
  document.getElementById('tipo').value = 'despesa';
  document.getElementById('categoria').value = 'Alimentação';
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataStr) {
  const d = new Date(dataStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapar(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
