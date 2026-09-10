const API_CARRINHO = "http://localhost:8080/api/carrinho";
const API_PRODUTO = "http://localhost:8080/api/produto";
const clienteLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
const ID_CLIENTE = clienteLogado?.idCliente ?? clienteLogado?.idUsuario;

const listaComprarEl = document.querySelector(".lista-comprar-agora");
const listaSalvoEl = document.querySelector(".lista-salvo-depois");
const qtdComprarEl = document.getElementById("quantidadeComprar");
const qtdSalvoEl = document.getElementById("quantidadeSalvoDepois");
const subtotalEl = document.querySelector(".subtotal p:last-child");
const descontoEl = document.querySelector(".desconto p:last-child");
const totalEl = document.querySelector(".total-txt-div p:last-child");
const esvaziarBtn = document.querySelector(".esvazia-carrinho");

let carrinhoItens = [];

function csrfHeaders() {
  const token = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  return token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {};
}

async function carregarCarrinho() {
  if (!ID_CLIENTE) {
    listaComprarEl.innerHTML = '<p class="carrinho-vazio">Faça login para ver o carrinho.</p>';
    if (qtdComprarEl) qtdComprarEl.textContent = "Para comprar agora (0 itens)";
    if (qtdSalvoEl) qtdSalvoEl.textContent = "Salvos para depois (0 itens)";
    return;
  }

  try {
    const res = await fetch(`${API_CARRINHO}/${ID_CLIENTE}`, {
      credentials: "include",
      headers: csrfHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      throw new Error("Erro ao buscar carrinho");
    }

    const itensRaw = await res.json();

    carrinhoItens = await Promise.all(
      itensRaw.map(async (item) => {
        let produto = {};
        try {
          const resProduto = await fetch(`${API_PRODUTO}/${item.idProduto}`);
          if (resProduto.ok) produto = await resProduto.json();
        } catch {
          produto = {};
        }

        return {
          id: item.id,
          idProduto: item.idProduto,
          quantidade: Number(item.quantidade || 0),
          salvoParaDepois: Number(item.salvoParaDepois ?? 0),
          nomeProduto: produto.nomeProduto || "Produto indisponível",
          precoProduto: Number(produto.precoProduto ?? 0),
          imagemURL: produto.imagemURL || null,
        };
      }),
    );

    renderizarCarrinho();
  } catch (err) {
    console.error(err);
    listaComprarEl.innerHTML = `<p class="carrinho-vazio">${err.message}</p>`;
  }
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderizarCarrinho() {
  const comprarAgora = carrinhoItens.filter((item) => !item.salvoParaDepois);
  const salvosDepois = []; 

  qtdComprarEl.textContent = `Para comprar agora (${comprarAgora.length} ${comprarAgora.length === 1 ? "item" : "itens"})`;
  qtdSalvoEl.textContent = `Salvos para depois (0 itens)`;

  listaComprarEl.innerHTML =
    comprarAgora.map(criarItemHTML).join("") ||
    '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
  listaSalvoEl.innerHTML = "";

  document.querySelectorAll(".item").forEach(bindItemEvents);
  atualizarResumo(comprarAgora);
}

function criarItemHTML(item) {
  const iconeOuImagem = item.imagemURL
    ? `<img src="${item.imagemURL}" alt="${item.nomeProduto}" />`
    : `<span class="material-symbols-outlined">medication</span>`;

  return `
    <div class="item" data-id-produto="${item.idProduto}">
      <div class="item-icon">${iconeOuImagem}</div>
      <div class="item-info">
        <p class="item-nome">${item.nomeProduto}</p>
        <p class="item-preco-unit">${formatarPreco(item.precoProduto)} cada</p>
      </div>
      <div class="item-qtd">
        <button class="qtd-btn menos" aria-label="Diminuir">-</button>
        <span class="qtd-valor">${item.quantidade}</span>
        <button class="qtd-btn mais" aria-label="Aumentar">+</button>
      </div>
      <div class="item-precos">
        <p class="item-preco-total">${formatarPreco(item.precoProduto * item.quantidade)}</p>
      </div>
      <div class="item-acoes">
        <button class="remover-btn" title="Remover item">🗑 Remover</button>
      </div>
    </div>
  `;
}

function bindItemEvents(itemEl) {
  const idProduto = Number(itemEl.dataset.idProduto);
  const qtdSpan = itemEl.querySelector(".qtd-valor");

  itemEl.querySelector(".mais").addEventListener("click", () => {
    atualizarItem(idProduto, 1);
  });

  itemEl.querySelector(".menos").addEventListener("click", () => {
    const novaQtd = Number(qtdSpan.textContent) - 1;
    if (novaQtd <= 0) {
      deletarItem(idProduto);
      return;
    }
    atualizarItem(idProduto, -1);
  });

  itemEl.querySelector(".remover-btn").addEventListener("click", () => {
    deletarItem(idProduto);
  });
}

async function atualizarItem(idProduto, quantidade) {
  try {
    const res = await fetch(`${API_CARRINHO}/${ID_CLIENTE}/${idProduto}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ quantidade, salvoParaDepois: 0 }),
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.mensagem || "Erro ao atualizar item");
    }

    await carregarCarrinho();
  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao atualizar item do carrinho.");
  }
}

async function deletarItem(idProduto) {
  try {
    const res = await fetch(`${API_CARRINHO}/${ID_CLIENTE}/${idProduto}`, {
      method: "DELETE",
      credentials: "include",
      headers: csrfHeaders(),
    });

    if (!res.ok) throw new Error("Erro ao remover item do carrinho");
    await carregarCarrinho();
  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao remover item do carrinho.");
  }
}

async function esvaziarCarrinho() {
  if (!carrinhoItens.length) return;

  try {
    for (const item of carrinhoItens) {
      const res = await fetch(`${API_CARRINHO}/${ID_CLIENTE}/${item.idProduto}`, {
        method: "DELETE",
        credentials: "include",
        headers: csrfHeaders(),
      });
      if (!res.ok) throw new Error("Erro ao esvaziar o carrinho");
    }
    await carregarCarrinho();
  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao esvaziar o carrinho.");
  }
}

function atualizarResumo(comprarAgora) {
  const subtotal = comprarAgora.reduce(
    (acc, item) => acc + Number(item.precoProduto || 0) * Number(item.quantidade || 0),
    0,
  );

  subtotalEl.textContent = `${formatarPreco(subtotal)} (${comprarAgora.length} ${comprarAgora.length === 1 ? "item" : "itens"})`;
  descontoEl.textContent = formatarPreco(0);
  totalEl.textContent = formatarPreco(subtotal);
}

esvaziarBtn.addEventListener("click", () => {
  esvaziarCarrinho();
});

const btnCupom = document.querySelector(".calcular-desconto-div button");
if (btnCupom) {
  btnCupom.disabled = true;
  btnCupom.title = "Em breve";
}

carregarCarrinho();
