(function () {
  const API_BASE_URL = "http://localhost:8080/api";

  // Esse arquivo existe (é o mesmo ícone usado no produtos.js e no menu).
  // O antigo ../img/produto_placeholder.png NÃO existe, e era isso que
  // gerava requisições infinitas.
  const ICONE_PADRAO = "../img/medicamentos_icon.png";

  const USER_STORAGE_KEY = "usuarioLogado";
  const WHATSAPP_NUMERO = "5561996044119";

  let produtoAtual = null;
  let promocoesAtivas = [];

  document.addEventListener("DOMContentLoaded", inicializar);

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function inicializar() {
    configurarBotaoVoltar();
    configurarBusca();
    configurarQuantidade();

    const id = obterIdProdutoDaURL();

    if (!id) {
      mostrarErro("Produto não informado.");
      return;
    }

    await carregarProduto(id);
  }

  function obterIdProdutoDaURL() {
    return new URLSearchParams(window.location.search).get("id");
  }

  /* =========================================================
     VOLTAR E BUSCA
  ========================================================= */

  function configurarBotaoVoltar() {
    const botao = document.querySelector("[data-btn-voltar]");

    if (!botao) return;

    botao.addEventListener("click", () => {
      let veioDoSite = false;

      try {
        veioDoSite =
          document.referrer &&
          new URL(document.referrer).origin === window.location.origin;
      } catch (erro) {
        veioDoSite = false;
      }

      if (veioDoSite) {
        window.history.back();
      } else {
        window.location.href = "produtos.html";
      }
    });
  }

  function configurarBusca() {
    const input = document.querySelector(".search-bar input");
    const botao = document.querySelector(".search-bar button");

    const buscar = () => {
      const termo = input?.value?.trim() || "";

      window.location.href = termo
        ? `produtos.html?busca=${encodeURIComponent(termo)}`
        : "produtos.html";
    };

    if (botao) botao.addEventListener("click", buscar);

    if (input) {
      input.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
          evento.preventDefault();
          buscar();
        }
      });
    }
  }

  /* =========================================================
     FETCH
  ========================================================= */

  async function fetchJson(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status}`);
    }

    return resposta.json();
  }

  async function obterCsrf() {
    const resposta = await fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: "include",
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível obter o token CSRF.");
    }

    const dados = await resposta.json();

    if (!dados?.token || !dados?.headerName) {
      throw new Error("O servidor não retornou os dados CSRF válidos.");
    }

    return dados;
  }

  /* =========================================================
     CARREGAR PRODUTO
  ========================================================= */

  async function carregarProduto(id) {
    try {
      produtoAtual = await fetchJson(`${API_BASE_URL}/produto/${id}`);

      const [promocoes] = await Promise.all([
        carregarPromocoes(),
        window.Favoritos ? Favoritos.carregar() : Promise.resolve(),
      ]);

      promocoesAtivas = promocoes;

      preencherProduto(produtoAtual);
      configurarBotaoCarrinho();
      configurarBotaoFavorito();

      preencherCategoria(produtoAtual);
      carregarProdutosRelacionados(produtoAtual);
    } catch (erro) {
      console.error("Erro ao carregar produto:", erro);
      mostrarErro("Não foi possível carregar este produto.");
    }
  }

  /* =========================================================
     HELPERS DE PRODUTO
  ========================================================= */

  function obterIdProduto(produto) {
    return produto?.idProduto ?? produto?.id ?? null;
  }

  function ehVerdadeiro(valor) {
    return valor === true || valor === 1;
  }

  function estaForaDeEstoque(produto) {
    return (
      ehVerdadeiro(produto.esgotado) ||
      produto.disponivel === false ||
      produto.disponivel === 0
    );
  }

  /* =========================================================
     PROMOÇÕES
  ========================================================= */

  function dataLocalISO() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function obterIdProdutoPromocao(promocao) {
    return (
      promocao?.idProduto ??
      promocao?.produto?.idProduto ??
      promocao?.produto?.id ??
      promocao?.produtoId ??
      null
    );
  }

  function promocaoEstaAtiva(promocao) {
    const hoje = dataLocalISO();
    const inicio = String(promocao?.dataInicio ?? "").slice(0, 10);
    const fim = String(promocao?.dataFim ?? "").slice(0, 10);

    return Boolean(
      inicio &&
        fim &&
        inicio <= hoje &&
        fim >= hoje &&
        obterIdProdutoPromocao(promocao) != null,
    );
  }

  async function carregarPromocoes() {
    try {
      const lista = await fetchJson(`${API_BASE_URL}/promocao`);

      return Array.isArray(lista) ? lista.filter(promocaoEstaAtiva) : [];
    } catch (erro) {
      console.warn("Não foi possível carregar as promoções:", erro);
      return [];
    }
  }

  function obterPromocaoProduto(produto) {
    const id = obterIdProduto(produto);

    if (id == null) return null;

    return (
      promocoesAtivas.find(
        (promocao) => String(obterIdProdutoPromocao(promocao)) === String(id),
      ) || null
    );
  }

  // Devolve o preço promocional só se ele for válido (menor que o normal).
  function precoPromocionalValido(precoNormal, promocao) {
    const preco = Number(promocao?.precoPromocional);

    return Number.isFinite(preco) && preco > 0 && preco < precoNormal
      ? preco
      : null;
  }

  function configurarPromocao(precoNormal, precoPromocional) {
    const badge = document.querySelector("[data-produto-badge-promo]");
    const precoAntigo = document.querySelector("[data-produto-preco-antigo]");

    if (precoPromocional === null) {
      if (badge) {
        badge.hidden = true;
        badge.textContent = "";
      }

      if (precoAntigo) {
        precoAntigo.hidden = true;
        precoAntigo.textContent = "";
      }

      return;
    }

    const percentual = Math.round(
      ((precoNormal - precoPromocional) / precoNormal) * 100,
    );

    if (badge) {
      badge.hidden = false;
      badge.textContent = `-${percentual}%`;
    }

    if (precoAntigo) {
      precoAntigo.hidden = false;
      precoAntigo.textContent = formatarPreco(precoNormal);
    }
  }

  /* =========================================================
     PREENCHER PRODUTO
  ========================================================= */

  function preencherProduto(produto) {
    const nome = produto.nomeProduto ?? "Produto";
    const precoNormal = Number(produto.precoProduto || 0);

    const precoPromocional = precoPromocionalValido(
      precoNormal,
      obterPromocaoProduto(produto),
    );

    const precoAtual = precoPromocional ?? precoNormal;

    document.title = `${nome} · Drogaria Popular Ponte Alta`;

    preencherTexto("[data-produto-nome]", nome);
    preencherTexto("[data-produto-nome-breadcrumb]", nome);
    preencherTexto("[data-produto-preco-atual]", formatarPreco(precoAtual));
    preencherTexto(
      "[data-produto-descricao]",
      produto.descricao || "Descrição não informada.",
    );

    configurarPromocao(precoNormal, precoPromocional);

    const imagemPrincipal = document.querySelector(
      "[data-produto-imagem-principal]",
    );

    definirImagem(imagemPrincipal, produto.imagemURL, nome);

    const id = obterIdProduto(produto);

    preencherTexto("[data-produto-sku]", id ? `#${id}` : "-");

    let tipo = "Produto";

    if (ehVerdadeiro(produto.medicamentoControlado)) {
      tipo = "Medicamento controlado";
    } else if (ehVerdadeiro(produto.necessitaReceita)) {
      tipo = "Exige receita";
    }

    preencherTexto("[data-produto-tipo]", tipo);

    preencherBadges(produto);
    configurarEstoque(produto);
    configurarWhatsapp(nome);
  }

  // Evita o loop infinito de requisições: se a imagem falhar, troca UMA vez
  // pelo ícone padrão e desliga o onerror.
  function definirImagem(imagem, url, alt) {
    if (!imagem) return;

    imagem.alt = alt || "";

    imagem.onerror = () => {
      imagem.onerror = null;
      imagem.src = ICONE_PADRAO;
    };

    imagem.src = url || ICONE_PADRAO;
  }

  function preencherBadges(produto) {
    const container = document.querySelector("[data-produto-badges]");

    if (!container) return;

    const badges = [];

    if (estaForaDeEstoque(produto)) {
      badges.push(`
        <span class="badge badge-esgotado">
          <img src="../img/info_icon.png" alt="" />
          Esgotado
        </span>`);
    } else {
      badges.push(`
        <span class="badge badge-estoque">
          <img src="../img/check_icon.png" alt="" />
          Em estoque
        </span>`);
    }

    if (ehVerdadeiro(produto.necessitaReceita)) {
      badges.push(`
        <span class="badge badge-receita">
          <img src="../img/info_icon.png" alt="" />
          Receita necessária
        </span>`);
    }

    if (ehVerdadeiro(produto.medicamentoControlado)) {
      badges.push(`
        <span class="badge badge-receita">
          <img src="../img/info_icon.png" alt="" />
          Medicamento controlado
        </span>`);
    }

    container.innerHTML = badges.join("");
  }

  function configurarEstoque(produto) {
    if (!estaForaDeEstoque(produto)) return;

    const botao = document.querySelector("[data-btn-add-carrinho]");

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Produto esgotado";
    }
  }

  function configurarWhatsapp(nome) {
    const link = document.querySelector("[data-whats-produto]");

    if (!link) return;

    const mensagem = `Olá, vim pelo site e tenho uma dúvida sobre o produto "${nome}".`;

    link.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    link.target = "_blank";
    link.rel = "noopener";
  }

  /* =========================================================
     CATEGORIA
  ========================================================= */

  async function preencherCategoria(produto) {
    const tag = document.querySelector("[data-produto-categoria]");
    const crumb = document.querySelector("[data-breadcrumb-categoria]");

    if (!produto.idCategoria) {
      if (tag) tag.textContent = "Farmácia";
      return;
    }

    try {
      const categoria = await fetchJson(
        `${API_BASE_URL}/categoria/${produto.idCategoria}`,
      );

      const nome = categoria.nome ?? categoria.nomeCategoria ?? "Farmácia";

      if (tag) tag.textContent = nome;

      if (crumb) {
        crumb.textContent = nome;
        crumb.href = `produtos.html?categoria=${encodeURIComponent(produto.idCategoria)}`;
      }
    } catch (erro) {
      console.warn("Não foi possível carregar a categoria:", erro);

      if (tag) tag.textContent = "Farmácia";
    }
  }

  /* =========================================================
     QUANTIDADE
  ========================================================= */

  function configurarQuantidade() {
    const input = document.querySelector("[data-qty-input]");
    const menos = document.querySelector("[data-qty-menos]");
    const mais = document.querySelector("[data-qty-mais]");

    if (!input) return;

    input.addEventListener("input", () => {
      let valor = parseInt(input.value.replace(/\D/g, ""), 10);

      if (!valor || valor < 1) valor = 1;

      input.value = valor;
    });

    if (menos) {
      menos.addEventListener("click", () => {
        const valor = parseInt(input.value, 10) || 1;

        if (valor > 1) input.value = valor - 1;
      });
    }

    if (mais) {
      mais.addEventListener("click", () => {
        input.value = (parseInt(input.value, 10) || 1) + 1;
      });
    }
  }

  /* =========================================================
     FAVORITAR
  ========================================================= */

  function atualizarEstadoFavorito(botao, favoritado) {
    botao.classList.toggle("ativo", favoritado);
    botao.setAttribute("aria-pressed", String(favoritado));
    botao.setAttribute(
      "aria-label",
      favoritado ? "Remover dos favoritos" : "Favoritar produto",
    );
  }

  function configurarBotaoFavorito() {
    const botao = document.querySelector("[data-btn-favoritar]");

    if (!botao || !window.Favoritos) return;

    const id = obterIdProduto(produtoAtual);

    atualizarEstadoFavorito(botao, Favoritos.eh(id));

    botao.addEventListener("click", async () => {
      botao.disabled = true;

      try {
        const favoritado = await Favoritos.alternar(id);

        atualizarEstadoFavorito(botao, favoritado);

        mostrarNotificacao(
          favoritado ? "Adicionado aos favoritos!" : "Removido dos favoritos.",
        );
      } catch (erro) {
        if (erro.naoLogado) {
          mostrarNotificacao(erro.message, "aviso");
          setTimeout(() => (window.location.href = "login.html"), 1200);
          return;
        }

        console.error("Erro ao atualizar favoritos:", erro);
        mostrarNotificacao("Não foi possível atualizar os favoritos.", "erro");
      } finally {
        botao.disabled = false;
      }
    });
  }

  /* =========================================================
     CARRINHO
  ========================================================= */

  function configurarBotaoCarrinho() {
    const botao = document.querySelector("[data-btn-add-carrinho]");

    if (botao) botao.addEventListener("click", adicionarAoCarrinho);
  }

  function irParaLogin(mensagem) {
    mostrarNotificacao(mensagem, "aviso");
    setTimeout(() => (window.location.href = "login.html"), 1200);
  }

  async function adicionarAoCarrinho() {
    if (!produtoAtual) {
      mostrarNotificacao("Produto ainda não carregado.", "aviso");
      return;
    }

    const usuarioSalvo = localStorage.getItem(USER_STORAGE_KEY);

    if (!usuarioSalvo) {
      irParaLogin(
        "Você precisa estar logado para adicionar produtos ao carrinho.",
      );
      return;
    }

    let usuario;

    try {
      usuario = JSON.parse(usuarioSalvo);
    } catch (erro) {
      console.error("Erro ao ler usuarioLogado:", erro);
      localStorage.removeItem(USER_STORAGE_KEY);
      irParaLogin("Sua sessão é inválida. Faça login novamente.");
      return;
    }

    const idCliente = usuario.idCliente;

    if (!idCliente) {
      mostrarNotificacao("Não foi possível identificar o usuário.", "erro");
      return;
    }

    const idProduto = obterIdProduto(produtoAtual);

    if (!idProduto) {
      mostrarNotificacao("Não foi possível identificar o produto.", "erro");
      return;
    }

    const input = document.querySelector("[data-qty-input]");
    const quantidade = parseInt(input?.value, 10) || 1;

    const botao = document.querySelector("[data-btn-add-carrinho]");
    const textoOriginal = botao ? botao.innerHTML : "";

    try {
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Adicionando...";
      }

      const csrf = await obterCsrf();

      const resposta = await fetch(`${API_BASE_URL}/carrinho`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({
          idCliente: Number(idCliente),
          idProduto: Number(idProduto),
          quantidade,
        }),
      });

      if (!resposta.ok) {
        const texto = await resposta.text();

        console.error("Erro retornado pelo backend:", texto);

        throw new Error(`Erro ${resposta.status}`);
      }

      mostrarNotificacao("Produto adicionado ao carrinho!");
    } catch (erro) {
      console.error("Erro ao adicionar ao carrinho:", erro);

      mostrarNotificacao(
        "Não foi possível adicionar o produto ao carrinho.",
        "erro",
      );
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
      }
    }
  }

  /* =========================================================
     PRODUTOS RELACIONADOS (mesma categoria)
  ========================================================= */

  async function carregarProdutosRelacionados(produto) {
    const secao = document.querySelector("[data-secao-relacionados]");
    const container = document.querySelector("[data-produtos-relacionados]");

    if (!container) return;

    const esconder = () => {
      if (secao) secao.hidden = true;
    };

    if (!produto.idCategoria) {
      esconder();
      return;
    }

    try {
      const produtos = await fetchJson(`${API_BASE_URL}/produto`);

      if (!Array.isArray(produtos)) {
        esconder();
        return;
      }

      const idAtual = obterIdProduto(produto);

      const relacionados = produtos
        .filter((item) => String(obterIdProduto(item)) !== String(idAtual))
        .filter(
          (item) => String(item.idCategoria) === String(produto.idCategoria),
        )
        .slice(0, 4);

      if (!relacionados.length) {
        esconder();
        return;
      }

      container.innerHTML = relacionados.map(criarCardRelacionado).join("");

      container.querySelectorAll("[data-produto-id]").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.dataset.produtoId;

          if (id) {
            window.location.href = `item.html?id=${encodeURIComponent(id)}`;
          }
        });
      });
    } catch (erro) {
      console.error("Erro ao carregar relacionados:", erro);
      esconder();
    }
  }

  function criarCardRelacionado(produto) {
    const id = obterIdProduto(produto);
    const nome = produto.nomeProduto ?? "Produto";
    const precoNormal = Number(produto.precoProduto || 0);

    const precoPromocional = precoPromocionalValido(
      precoNormal,
      obterPromocaoProduto(produto),
    );

    const imagem = produto.imagemURL || ICONE_PADRAO;

    return `
      <article
        class="product-card"
        data-produto-id="${escaparAtributo(id)}"
        style="cursor: pointer;"
      >
        <div class="product-image-container">
          <img
            src="${escaparAtributo(imagem)}"
            alt="${escaparAtributo(nome)}"
            onerror="this.onerror=null;this.src='${ICONE_PADRAO}'"
          />
        </div>

        <div class="product-info">
          <h3>${escaparHTML(nome)}</h3>

          <p class="price">
            ${
              precoPromocional !== null
                ? `<span style="text-decoration:line-through;opacity:.65;margin-right:8px">${formatarPreco(precoNormal)}</span>${formatarPreco(precoPromocional)}`
                : formatarPreco(precoNormal)
            }
          </p>
        </div>
      </article>`;
  }

  /* =========================================================
     UTILIDADES
  ========================================================= */

  function preencherTexto(seletor, valor) {
    const elemento = document.querySelector(seletor);

    if (elemento) elemento.textContent = valor ?? "";
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

  function escaparAtributo(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mostrarErro(mensagem) {
    const main = document.querySelector("main");

    if (!main) return;

    main.innerHTML = `
      <div
        class="section-container"
        style="padding: 80px 20px; text-align: center;"
      >
        <h2>Produto não encontrado</h2>
        <p>${escaparHTML(mensagem)}</p>
        <a href="produtos.html" class="btn-primary">Voltar para produtos</a>
      </div>`;
  }
})();

// =========================================================
// NOTIFICAÇÕES PERSONALIZADAS
// (tipos aceitos: "sucesso", "erro", "aviso")
// =========================================================

function mostrarNotificacao(mensagem, tipo = "sucesso") {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;

  const icones = {
    sucesso: "✓",
    erro: "!",
    aviso: "!",
  };

  const icone = document.createElement("span");
  icone.className = "toast-icone";
  icone.textContent = icones[tipo] || "✓";
  icone.setAttribute("aria-hidden", "true");

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

  function removerNotificacao() {
    if (removido) return;
    removido = true;

    toast.classList.add("toast-saindo");

    setTimeout(() => {
      toast.remove();

      if (container.children.length === 0) {
        container.remove();
      }
    }, 250);
  }

  const temporizador = setTimeout(removerNotificacao, 3500);

  fechar.addEventListener("click", () => {
    clearTimeout(temporizador);
    removerNotificacao();
  });
}