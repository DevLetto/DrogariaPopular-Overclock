const API_CARRINHO = "http://localhost:8080/api/carrinho"; // ajusta a base URL
const API_PRODUTO = "http://localhost:8080/api/produto";
const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"))
const ID_USUARIO = usuarioLogado?.idUsuario; // ajusta conforme tua auth

const listaComprarEl = document.querySelector(".lista-comprar-agora");
const listaSalvoEl = document.querySelector(".lista-salvo-depois");
const qtdComprarEl = document.getElementById("quantidadeComprar");
const qtdSalvoEl = document.getElementById("quantidadeSalvoDepois");
const subtotalEl = document.querySelector(".subtotal p:last-child");
const descontoEl = document.querySelector(".desconto p:last-child");
const totalEl = document.querySelector(".total-txt-div p:last-child");
const esvaziarBtn = document.querySelector(".esvazia-carrinho");

let carrinhoItens = [];

async function carregarCarrinho() {
  try {
    const res = await fetch(`${API_CARRINHO}/${ID_USUARIO}`);
    if (!res.ok) throw new Error("Erro ao buscar carrinho");
    const itensRaw = await res.json();

    // pra cada item do carrinho, busca os dados do produto correspondente
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
          quantidade: item.quantidade,
          salvoParaDepois: item.salvoParaDepois ?? 0,
          nomeProduto: produto.nomeProduto || "Produto indisponível",
          precoProduto: produto.precoProduto ?? 0,
          imagemURL: produto.imagemURL || null,
        };
      }),
    );

    renderizarCarrinho();
  } catch (err) {
    console.error(err);
  }
}

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderizarCarrinho() {
  const comprarAgora = carrinhoItens.filter((i) => !i.salvoParaDepois);
  const salvosDepois = carrinhoItens.filter((i) => i.salvoParaDepois);

  qtdComprarEl.textContent = `Para comprar agora (${comprarAgora.length} ${comprarAgora.length === 1 ? "item" : "itens"})`;
  qtdSalvoEl.textContent = `Salvos para depois (${salvosDepois.length} ${salvosDepois.length === 1 ? "item" : "itens"})`;

  listaComprarEl.innerHTML =
    comprarAgora.map(criarItemHTML).join("") ||
    `<p class="carrinho-vazio">Seu carrinho está vazio.</p>`;
  listaSalvoEl.innerHTML = salvosDepois.map(criarItemHTML).join("");

  document.querySelectorAll(".item").forEach(bindItemEvents);
  atualizarResumo(comprarAgora);
}

function criarItemHTML(item) {
  const iconeOuImagem = item.imagemURL
    ? `<img src="${item.imagemURL}" alt="${item.nomeProduto}" />`
    : `<span class="material-symbols-outlined">medication</span>`;

  return `
    <div class="item" data-id-produto="${item.idProduto}" data-salvo="${item.salvoParaDepois}">
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
        <label class="salvar-label">
          <input type="checkbox" class="salvar-checkbox" ${item.salvoParaDepois ? "checked" : ""} />
          ${item.salvoParaDepois ? "Mover p/ carrinho" : "Salvar p/ depois"}
        </label>
        <button class="remover-btn" disabled title="Em breve">🗑 Remover</button>
      </div>
    </div>
  `;
}

function bindItemEvents(itemEl) {
  const idProduto = Number(itemEl.dataset.idProduto);
  const salvoAtual = Number(itemEl.dataset.salvo); // 0 ou 1
  const qtdSpan = itemEl.querySelector(".qtd-valor");

  itemEl.querySelector(".mais").addEventListener("click", () => {
    atualizarItem(idProduto, Number(qtdSpan.textContent) + 1, salvoAtual);
  });

  itemEl.querySelector(".menos").addEventListener("click", () => {
    const novaQtd = Number(qtdSpan.textContent) - 1;
    if (novaQtd <= 0) return; // sem função de remover ainda, trava em 1
    atualizarItem(idProduto, novaQtd, salvoAtual);
  });

  itemEl.querySelector(".salvar-checkbox").addEventListener("change", (e) => {
    atualizarItem(
      idProduto,
      Number(qtdSpan.textContent),
      e.target.checked ? 1 : 0,
    );
  });
}

async function atualizarItem(idProduto, quantidade, salvoParaDepois) {
  try {
    const res = await fetch(API_CARRINHO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: ID_USUARIO,
        idProduto,
        quantidade,
        salvoParaDepois,
      }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar item");
    await carregarCarrinho();
  } catch (err) {
    console.error(err);
  }
}

function atualizarResumo(comprarAgora) {
  const subtotal = comprarAgora.reduce(
    (acc, i) => acc + i.precoProduto * i.quantidade,
    0,
  );

  subtotalEl.textContent = `${formatarPreco(subtotal)} (${comprarAgora.length} ${comprarAgora.length === 1 ? "item" : "itens"})`;
  descontoEl.textContent = formatarPreco(0); // sem dado de desconto no back ainda
  totalEl.textContent = formatarPreco(subtotal);
}

esvaziarBtn.addEventListener("click", () => {
  alert("Função de esvaziar carrinho ainda não disponível.");
});

const btnCupom = document.querySelector(".calcular-desconto-div button");
btnCupom.disabled = true;
btnCupom.title = "Em breve";

carregarCarrinho();
