const API_BASE = "http://localhost:8080/api";
const STORAGE_USUARIO = "usuarioLogado";

// =========================================================
// USUÁRIO
// =========================================================

let clienteLogado = null;

try {
  clienteLogado = JSON.parse(localStorage.getItem(STORAGE_USUARIO));
} catch (erro) {
  console.error("Erro ao ler usuarioLogado:", erro);
}

const ID_CLIENTE = clienteLogado?.idCliente ?? clienteLogado?.idUsuario;

// =========================================================
// ELEMENTOS
// =========================================================

const listaPedidosEl = document.getElementById("listaPedidos");
const avisoEl = document.getElementById("avisoPedido");
const btnVoltarLoja = document.getElementById("btnVoltarLoja");

if (btnVoltarLoja) {
  btnVoltarLoja.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// =========================================================
// STATUS
// Ajuste ALIAS_ETAPA conforme os status reais usados no banco.
// =========================================================

const ETAPAS = ["Pedido feito", "Em preparo", "A caminho", "Entregue"];

const ALIAS_ETAPA = {
  PENDENTE: 0,
  PREPARANDO: 1,
  A_CAMINHO: 2,
  ENTREGUE: 3,
};

function normalizarStatus(status) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function infoStatus(status) {
  const chave = normalizarStatus(status);
  const etapa = chave in ALIAS_ETAPA ? ALIAS_ETAPA[chave] : -1;
  const cancelado = chave.startsWith("CANCEL");

  let classe = "andamento";
  if (cancelado) classe = "cancelado";
  else if (etapa === 0) classe = "pendente";
  else if (etapa === 3) classe = "concluido";

  return {
    chave,
    etapa,
    cancelado,
    classe,
    texto: cancelado ? "Cancelado" : String(status ?? "").trim() || "Indefinido",
  };
}

// =========================================================
// CSRF
// =========================================================

async function obterCsrf() {
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });

  if (!res.ok) {
    throw new Error("Não foi possível obter o token de segurança.");
  }

  const dados = await res.json();

  if (!dados?.token || !dados?.headerName) {
    throw new Error("O servidor não retornou os dados CSRF válidos.");
  }

  return dados;
}

// =========================================================
// CARREGAR
// =========================================================

async function carregarPedidos() {
  if (!ID_CLIENTE) {
    alert("Você precisa estar logado para ver seus pedidos.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/pedido/cliente/${ID_CLIENTE}`, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      throw new Error("Não foi possível carregar seus pedidos.");
    }

    const pedidos = await res.json();

    renderizarPedidos(Array.isArray(pedidos) ? pedidos : []);
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);

    listaPedidosEl.innerHTML = `<p class="carrinho-vazio">${escaparHTML(
      erro.message,
    )}</p>`;
  }
}

// =========================================================
// RENDERIZAR
// =========================================================

let idDestaque = null;

function renderizarPedidos(pedidos) {
  if (!pedidos.length) {
    listaPedidosEl.innerHTML = `
      <p class="carrinho-vazio">
        Você ainda não fez nenhum pedido.
      </p>`;
    return;
  }

  listaPedidosEl.innerHTML = pedidos.map(criarPedidoHTML).join("");
}

function criarTimelineHTML(info) {
  if (info.cancelado || info.etapa < 0) {
    return "";
  }

  return `
    <div class="timeline">
      ${ETAPAS.map((rotulo, i) => {
        const classes = [
          "timeline-etapa",
          i <= info.etapa ? "feita" : "",
          i === info.etapa ? "atual" : "",
        ].join(" ");

        return `
          <div class="${classes}">
            <div class="timeline-ponto">${i < info.etapa ? "✓" : ""}</div>
            ${rotulo}
          </div>`;
      }).join("")}
    </div>`;
}

function criarDetalhesHTML(pedido) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  const frete = Number(pedido.valorFrete || 0);

  const recebimento = pedido.formaEntrega
    ? normalizarStatus(pedido.formaEntrega) === "ENTREGA"
      ? "Entrega em casa"
      : "Retirada na loja"
    : null;

  const listaItens = itens.length
    ? `<ul>${itens
        .map(
          (item) => `
          <li>
            <span>${Number(item.quantidade || 0)}x ${escaparHTML(
              item.nomeProduto,
            )}</span>
            <span>${formatarPreco(
              Number(item.quantidade || 0) * Number(item.precoUnitario || 0),
            )}</span>
          </li>`,
        )
        .join("")}</ul>`
    : '<p class="carrinho-vazio">Itens indisponíveis.</p>';

  return `
    ${listaItens}
    ${
      recebimento
        ? `<div class="pedido-linha"><span>Recebimento</span><span>${recebimento}</span></div>`
        : ""
    }
    <div class="pedido-linha">
      <span>Frete</span>
      <span>${frete > 0 ? formatarPreco(frete) : "Grátis"}</span>
    </div>
    <div class="pedido-linha total">
      <span>Total</span>
      <span>${formatarPreco(pedido.valorTotal)}</span>
    </div>`;
}

function criarPedidoHTML(pedido) {
  const info = infoStatus(pedido.status);
  const podeCancelar = info.etapa === 0 && !info.cancelado;
  const destaque = pedido.id === idDestaque ? "destaque" : "";

  return `
    <article class="pedido-card ${destaque}" data-id="${pedido.id}">
      <div class="pedido-topo">
        <div>
          <div class="pedido-numero">Pedido #${pedido.id}</div>
          <div class="pedido-data">${formatarData(pedido.dataPedido)}</div>
        </div>

        <span class="pedido-status ${info.classe}">${escaparHTML(info.texto)}</span>

        <div class="pedido-total">${formatarPreco(pedido.valorTotal)}</div>
      </div>

      ${criarTimelineHTML(info)}

      <div class="pedido-acoes">
        <button type="button" class="btn-detalhes" data-acao="detalhes">
          Ver detalhes
        </button>

        ${
          podeCancelar
            ? '<button type="button" class="btn-cancelar-pedido" data-acao="cancelar">Cancelar pedido</button>'
            : ""
        }
      </div>

      <div class="pedido-detalhes" hidden>
        ${criarDetalhesHTML(pedido)}
      </div>
    </article>`;
}

// =========================================================
// EVENTOS (delegação)
// =========================================================

listaPedidosEl.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;

  const card = botao.closest(".pedido-card");
  const id = Number(card?.dataset.id);

  if (botao.dataset.acao === "detalhes") {
    const detalhes = card.querySelector(".pedido-detalhes");
    detalhes.hidden = !detalhes.hidden;
    botao.textContent = detalhes.hidden ? "Ver detalhes" : "Ocultar detalhes";
    return;
  }

  if (botao.dataset.acao === "cancelar") {
    cancelarPedido(id, botao);
  }
});

// =========================================================
// CANCELAR
// =========================================================

async function cancelarPedido(id, botao) {
  if (!confirm(`Deseja cancelar o pedido #${id}?`)) {
    return;
  }

  botao.disabled = true;

  try {
    const csrf = await obterCsrf();

    const res = await fetch(`${API_BASE}/pedido/${id}/cancelar`, {
      method: "PUT",
      credentials: "include",
      headers: { [csrf.headerName]: csrf.token },
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.mensagem || `Erro ao cancelar (${res.status}).`);
    }

    await carregarPedidos();
  } catch (erro) {
    console.error("Erro ao cancelar pedido:", erro);
    alert(erro.message || "Não foi possível cancelar o pedido.");
    botao.disabled = false;
  }
}

// =========================================================
// UTILITÁRIOS
// =========================================================

function formatarData(valor) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function escaparHTML(valor) {
  const div = document.createElement("div");
  div.textContent = valor ?? "";
  return div.innerHTML;
}

// =========================================================
// INICIAR
// =========================================================

(function iniciar() {
  // Vindo do checkout: destaca o pedido recém-criado.
  try {
    const salvo = sessionStorage.getItem("pedidoFinalizado");

    if (salvo) {
      const pedido = JSON.parse(salvo);
      idDestaque = pedido?.id ?? null;

      if (idDestaque && avisoEl) {
        avisoEl.textContent = `Pedido #${idDestaque} confirmado! Acompanhe o andamento abaixo.`;
        avisoEl.hidden = false;
      }

      sessionStorage.removeItem("pedidoFinalizado");
    }
  } catch (erro) {
    console.warn("Não foi possível ler pedidoFinalizado:", erro);
  }

  carregarPedidos();
})();