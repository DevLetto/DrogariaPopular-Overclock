(function () {
  const API_BASE_URL = "http://localhost:8080/api";
  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  const grid = document.getElementById("gridFavoritos");
  const contador = document.getElementById("contadorFavoritos");

  document.addEventListener("DOMContentLoaded", inicializar);

  // ---------------------------------------------------------
  // INICIAR
  // ---------------------------------------------------------

  async function inicializar() {
    if (!Favoritos.idCliente()) {
      mostrarVazio(
        "Entre na sua conta",
        "Faça login para ver e gerenciar seus produtos favoritos.",
        "Fazer login",
        "login.html",
      );
      atualizarContador(null);
      return;
    }

    try {
      await Favoritos.carregar();

      const ids = Favoritos.ids();

      if (!ids.length) {
        mostrarVazioPadrao();
        atualizarContador(0);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/produto`);

      if (!res.ok) {
        throw new Error(`Erro ${res.status} ao carregar produtos`);
      }

      const todos = await res.json();
      const porId = new Map(
        (Array.isArray(todos) ? todos : []).map((p) => [
          Number(p.idProduto ?? p.id),
          p,
        ]),
      );

      // mantém a ordem: favoritado mais recente primeiro
      const produtos = ids.map((id) => porId.get(id)).filter(Boolean);

      renderizar(produtos);
    } catch (erro) {
      console.error("Erro ao carregar favoritos:", erro);

      grid.innerHTML = `
        <div class="favoritos-vazio">
          <h3>Não foi possível carregar seus favoritos</h3>
          <p>Tente novamente em instantes.</p>
        </div>`;
      atualizarContador(null);
    }
  }

  // ---------------------------------------------------------
  // RENDERIZAÇÃO
  // ---------------------------------------------------------

  function renderizar(produtos) {
    if (!produtos.length) {
      mostrarVazioPadrao();
      atualizarContador(0);
      return;
    }

    grid.innerHTML = produtos.map(criarCard).join("");
    atualizarContador(produtos.length);

    grid.querySelectorAll("[data-produto-id]").forEach(ligarEventos);
  }

  function criarCard(produto) {
    const id = produto.idProduto ?? produto.id;
    const nome = produto.nomeProduto ?? produto.nome ?? "Produto";
    const preco = Number(produto.precoProduto ?? produto.preco ?? 0);
    const imagem = produto.imagemURL || produto.fotos || ICONE_PADRAO;

    const esgotado = produto.esgotado === true || produto.esgotado === 1;
    const disponivel = produto.disponivel !== false && produto.disponivel !== 0;
    const foraEstoque = esgotado || !disponivel;

    const receita =
      produto.necessitaReceita === true || produto.necessitaReceita === 1;
    const controlado =
      produto.medicamentoControlado === true ||
      produto.medicamentoControlado === 1;

    return `
      <article
        class="product-card"
        data-produto-id="${escaparAtributo(id)}"
        style="cursor:pointer"
      >
        <div class="product-image-container">
          ${receita ? '<span class="badge-prescription">EXIGE RECEITA</span>' : ""}
          ${controlado ? '<span class="badge-controlado">CONTROLADO</span>' : ""}

          <button
            type="button"
            class="btn-fav ativo"
            aria-label="Remover dos favoritos"
            aria-pressed="true"
          >
            <img src="../img/coracao_icon.png" alt="Favorito">
          </button>

          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.onerror=null;this.src='${ICONE_PADRAO}'"
          >
        </div>

        <div class="product-info">
          <span class="stock-status ${foraEstoque ? "gray" : "green"}">
            <span class="status-dot"></span>
            ${foraEstoque ? "ESGOTADO" : "EM ESTOQUE"}
          </span>

          <div class="name-container">
            <h3>${escaparHTML(nome)}</h3>
          </div>

          <div class="price-container">
            <span class="price">${formatarPreco(preco)}</span>
          </div>

          ${
            foraEstoque
              ? '<button type="button" class="btn-notify">Avisar quando chegar</button>'
              : '<button type="button" class="btn-add-cart">Adicionar <img src="../img/carrinho_icon.png" alt=""></button>'
          }
        </div>
      </article>`;
  }

  function ligarEventos(card) {
    const id = card.dataset.produtoId;
    const botaoFav = card.querySelector(".btn-fav");
    const botaoCarrinho = card.querySelector(".btn-add-cart");

    if (botaoFav) {
      botaoFav.addEventListener("click", async (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        await removerFavorito(id, card, botaoFav);
      });
    }

    if (botaoCarrinho) {
      botaoCarrinho.addEventListener("click", async (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        await adicionarAoCarrinho(id, botaoCarrinho);
      });
    }

    card.addEventListener("click", (evento) => {
      if (evento.target.closest(".btn-fav, .btn-add-cart, .btn-notify")) {
        return;
      }

      window.location.href = `item.html?id=${encodeURIComponent(id)}`;
    });
  }

  // ---------------------------------------------------------
  // AÇÕES
  // ---------------------------------------------------------

  async function removerFavorito(idProduto, card, botao) {
    botao.disabled = true;

    try {
      const favoritado = await Favoritos.alternar(idProduto);

      // Na página de favoritos, alternar a partir de um favorito = remover.
      if (!favoritado) {
        card.remove();

        const restantes = grid.querySelectorAll("[data-produto-id]").length;

        atualizarContador(restantes);

        if (!restantes) {
          mostrarVazioPadrao();
        }

        mostrarNotificacao("Removido dos favoritos.");
      }
    } catch (erro) {
      console.error("Erro ao remover favorito:", erro);
      mostrarNotificacao(
        erro.message || "Não foi possível remover dos favoritos.",
        "erro",
      );
      botao.disabled = false;
    }
  }

  async function adicionarAoCarrinho(idProduto, botao) {
    const idCliente = Favoritos.idCliente();

    if (!idCliente) {
      window.location.href = "login.html";
      return;
    }

    const textoOriginal = botao.innerHTML;

    try {
      botao.disabled = true;
      botao.textContent = "Adicionando...";

      const csrf = await Favoritos.obterCsrf();

      const res = await fetch(`${API_BASE_URL}/carrinho`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          idCliente: Number(idCliente),
          idProduto: Number(idProduto),
          quantidade: 1,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro ${res.status}`);
      }

      mostrarNotificacao("Produto adicionado ao carrinho!");
    } catch (erro) {
      console.error("Erro ao adicionar ao carrinho:", erro);
      mostrarNotificacao(
        "Não foi possível adicionar o produto ao carrinho.",
        "erro",
      );
    } finally {
      botao.disabled = false;
      botao.innerHTML = textoOriginal;
    }
  }

  // ---------------------------------------------------------
  // ESTADOS
  // ---------------------------------------------------------

  function mostrarVazioPadrao() {
    mostrarVazio(
      "Você ainda não favoritou nada",
      "Toque no coração de um produto para guardá-lo aqui.",
      "Ver produtos",
      "produtos.html",
    );
  }

  function mostrarVazio(titulo, texto, rotuloBotao, link) {
    grid.innerHTML = `
      <div class="favoritos-vazio">
        <h3>${escaparHTML(titulo)}</h3>
        <p>${escaparHTML(texto)}</p>
        <a href="${escaparAtributo(link)}">${escaparHTML(rotuloBotao)}</a>
      </div>`;
  }

  function atualizarContador(quantidade) {
    if (!contador) return;

    contador.textContent =
      quantidade === null
        ? ""
        : `${quantidade} produto(s) favorito(s)`;
  }

  // ---------------------------------------------------------
  // NOTIFICAÇÕES (mesmo padrão do produtos.js)
  // ---------------------------------------------------------

  function mostrarNotificacao(mensagem, tipo = "sucesso") {
    let container = document.querySelector(".toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;

    const icone = document.createElement("span");
    icone.className = "toast-icone";
    icone.textContent = tipo === "sucesso" ? "✓" : "!";

    const texto = document.createElement("span");
    texto.className = "toast-mensagem";
    texto.textContent = mensagem;

    const fechar = document.createElement("button");
    fechar.className = "toast-fechar";
    fechar.type = "button";
    fechar.textContent = "×";
    fechar.setAttribute("aria-label", "Fechar notificação");

    toast.append(icone, texto, fechar);
    container.appendChild(toast);

    let removido = false;

    function remover() {
      if (removido) return;
      removido = true;
      toast.classList.add("toast-saindo");

      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 250);
    }

    const temporizador = setTimeout(remover, 3500);

    fechar.addEventListener("click", () => {
      clearTimeout(temporizador);
      remover();
    });
  }

  // ---------------------------------------------------------
  // UTILITÁRIOS
  // ---------------------------------------------------------

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

  function escaparAtributo(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();