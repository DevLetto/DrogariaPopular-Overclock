const API_CARRINHO =
  "http://localhost:8080/api/carrinho";

const API_PRODUTO =
  "http://localhost:8080/api/produto";

const STORAGE_USUARIO =
  "usuarioLogado";

const STORAGE_CHECKOUT =
  "checkoutCarrinho";


/*
 * =========================================================
 * USUÁRIO
 * =========================================================
 */

let clienteLogado = null;

try {

  clienteLogado =
    JSON.parse(
      localStorage.getItem(
        STORAGE_USUARIO
      )
    );

} catch (erro) {

  console.error(
    "Erro ao ler usuarioLogado:",
    erro
  );

}


const ID_CLIENTE =
  clienteLogado?.idCliente ??
  clienteLogado?.idUsuario;


/*
 * =========================================================
 * ELEMENTOS
 * =========================================================
 */

const listaComprarEl =
  document.querySelector(
    ".lista-comprar-agora"
  );


const listaSalvoEl =
  document.querySelector(
    ".lista-salvo-depois"
  );


const qtdComprarEl =
  document.getElementById(
    "quantidadeComprar"
  );


const qtdSalvoEl =
  document.getElementById(
    "quantidadeSalvoDepois"
  );


const subtotalEl =
  document.querySelector(
    ".subtotal p:last-child"
  );


const descontoEl =
  document.querySelector(
    ".desconto p:last-child"
  );


const totalEl =
  document.querySelector(
    ".total-txt-div p:last-child"
  );


const esvaziarBtn =
  document.querySelector(
    ".esvazia-carrinho"
  );


const btnContinuarCheckout =
  document.getElementById(
    "btnContinuarCheckout"
  );


const btnIrCheckoutTopo =
  document.getElementById(
    "btnIrCheckoutTopo"
  );


/*
 * =========================================================
 * ESTADO
 * =========================================================
 */

let carrinhoItens = [];

let descontoAtual = 0;


/*
 * =========================================================
 * CSRF
 * =========================================================
 */

function csrfHeaders() {

  const token =
    document.cookie
      .split("; ")
      .find(
        (cookie) =>
          cookie.startsWith(
            "XSRF-TOKEN="
          )
      )
      ?.split("=")[1];


  return token
    ? {
        "X-XSRF-TOKEN":
          decodeURIComponent(token)
      }
    : {};

}


/*
 * =========================================================
 * CARREGAR CARRINHO
 * =========================================================
 */

async function carregarCarrinho() {

  if (!ID_CLIENTE) {

    listaComprarEl.innerHTML =
      '<p class="carrinho-vazio">Faça login para ver o carrinho.</p>';


    if (qtdComprarEl) {

      qtdComprarEl.textContent =
        "Para comprar agora (0 itens)";

    }


    if (qtdSalvoEl) {

      qtdSalvoEl.textContent =
        "Salvos para depois (0 itens)";

    }


    atualizarResumo([]);

    return;

  }


  try {

    const res =
      await fetch(
        `${API_CARRINHO}/${ID_CLIENTE}`,
        {
          credentials: "include",
          headers: csrfHeaders()
        }
      );


    if (!res.ok) {

      if (
        res.status === 401 ||
        res.status === 403
      ) {

        throw new Error(
          "Sessão expirada. Faça login novamente."
        );

      }


      throw new Error(
        "Erro ao buscar carrinho"
      );

    }


    const itensRaw =
      await res.json();


    if (!Array.isArray(itensRaw)) {

      carrinhoItens = [];

      renderizarCarrinho();

      return;

    }


    carrinhoItens =
      await Promise.all(

        itensRaw.map(
          async (item) => {

            let produto = {};


            try {

              const resProduto =
                await fetch(
                  `${API_PRODUTO}/${item.idProduto}`
                );


              if (resProduto.ok) {

                produto =
                  await resProduto.json();

              }

            } catch (erro) {

              console.error(
                "Erro ao buscar produto:",
                item.idProduto,
                erro
              );

            }


            return {

              id:
                item.id,

              idProduto:
                item.idProduto,

              quantidade:
                Number(
                  item.quantidade || 0
                ),

              salvoParaDepois:
                Number(
                  item.salvoParaDepois ?? 0
                ),

              nomeProduto:
                produto.nomeProduto ||
                "Produto indisponível",

              precoProduto:
                Number(
                  produto.precoProduto ?? 0
                ),

              imagemURL:
                produto.imagemURL ||
                null

            };

          }
        )

      );


    renderizarCarrinho();


  } catch (err) {

    console.error(err);


    listaComprarEl.innerHTML =
      `<p class="carrinho-vazio">
        ${escaparHTML(err.message)}
      </p>`;

  }

}


/*
 * =========================================================
 * RENDERIZAR
 * =========================================================
 */

function renderizarCarrinho() {

  const comprarAgora =
    carrinhoItens.filter(
      (item) =>
        !item.salvoParaDepois
    );


  const salvosDepois =
    carrinhoItens.filter(
      (item) =>
        Boolean(item.salvoParaDepois)
    );


  /*
   * QUANTIDADES
   */

  if (qtdComprarEl) {

    qtdComprarEl.textContent =
      `Para comprar agora (${comprarAgora.length} ${
        comprarAgora.length === 1
          ? "item"
          : "itens"
      })`;

  }


  if (qtdSalvoEl) {

    qtdSalvoEl.textContent =
      `Salvos para depois (${salvosDepois.length} ${
        salvosDepois.length === 1
          ? "item"
          : "itens"
      })`;

  }


  /*
   * COMPRAR AGORA
   */

  listaComprarEl.innerHTML =
    comprarAgora
      .map(criarItemHTML)
      .join("") ||
    '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';


  /*
   * SALVOS
   */

  listaSalvoEl.innerHTML =
    salvosDepois
      .map(criarItemHTML)
      .join("") ||
    "";


  /*
   * EVENTOS
   */

  document
    .querySelectorAll(".item")
    .forEach(bindItemEvents);


  /*
   * RESUMO
   */

  atualizarResumo(
    comprarAgora
  );

}


/*
 * =========================================================
 * CRIAR ITEM
 * =========================================================
 */

function criarItemHTML(item) {

  const iconeOuImagem =
    item.imagemURL

      ? `
        <img
          src="${escaparAtributo(item.imagemURL)}"
          alt="${escaparAtributo(item.nomeProduto)}"
          onerror="this.onerror=null; this.src='../img/medicamentos_icon.png';"
        />
      `

      : `
        <span class="material-symbols-outlined">
          medication
        </span>
      `;


  return `

    <div
      class="item"
      data-id-produto="${item.idProduto}"
    >

      <div class="item-icon">

        ${iconeOuImagem}

      </div>


      <div class="item-info">

        <p class="item-nome">
          ${escaparHTML(item.nomeProduto)}
        </p>

        <p class="item-preco-unit">
          ${formatarPreco(item.precoProduto)}
          cada
        </p>

      </div>


      <div class="item-qtd">

        <button
          type="button"
          class="qtd-btn menos"
          aria-label="Diminuir quantidade"
        >
          -
        </button>


        <span class="qtd-valor">
          ${item.quantidade}
        </span>


        <button
          type="button"
          class="qtd-btn mais"
          aria-label="Aumentar quantidade"
        >
          +
        </button>

      </div>


      <div class="item-precos">

        <p class="item-preco-total">

          ${formatarPreco(
            item.precoProduto *
            item.quantidade
          )}

        </p>

      </div>


      <div class="item-acoes">

        <button
          type="button"
          class="remover-btn"
          title="Remover item"
        >
          🗑 Remover
        </button>

      </div>

    </div>

  `;

}


/*
 * =========================================================
 * EVENTOS DOS ITENS
 * =========================================================
 */

function bindItemEvents(itemEl) {

  const idProduto =
    Number(
      itemEl.dataset.idProduto
    );


  const qtdSpan =
    itemEl.querySelector(
      ".qtd-valor"
    );


  const botaoMais =
    itemEl.querySelector(
      ".mais"
    );


  const botaoMenos =
    itemEl.querySelector(
      ".menos"
    );


  const botaoRemover =
    itemEl.querySelector(
      ".remover-btn"
    );


  if (botaoMais) {

    botaoMais.addEventListener(
      "click",
      () => {

        atualizarItem(
          idProduto,
          1
        );

      }
    );

  }


  if (botaoMenos) {

    botaoMenos.addEventListener(
      "click",
      () => {

        const novaQtd =
          Number(
            qtdSpan.textContent
          ) - 1;


        if (novaQtd <= 0) {

          deletarItem(
            idProduto
          );

          return;

        }


        atualizarItem(
          idProduto,
          -1
        );

      }
    );

  }


  if (botaoRemover) {

    botaoRemover.addEventListener(
      "click",
      () => {

        deletarItem(
          idProduto
        );

      }
    );

  }

}


/*
 * =========================================================
 * ATUALIZAR ITEM
 * =========================================================
 */

async function atualizarItem(
  idProduto,
  quantidade
) {

  try {

    const res =
      await fetch(
        `${API_CARRINHO}/${ID_CLIENTE}/${idProduto}`,
        {
          method: "PUT",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            ...csrfHeaders()
          },

          body: JSON.stringify({

            quantidade:
              quantidade,

            salvoParaDepois:
              0

          })

        }
      );


    if (!res.ok) {

      const erro =
        await res
          .json()
          .catch(
            () => ({})
          );


      throw new Error(
        erro.mensagem ||
        "Erro ao atualizar item"
      );

    }


    await carregarCarrinho();


  } catch (err) {

    console.error(err);


    alert(
      err.message ||
      "Erro ao atualizar item do carrinho."
    );

  }

}


/*
 * =========================================================
 * DELETAR ITEM
 * =========================================================
 */

async function deletarItem(
  idProduto
) {

  try {

    const res =
      await fetch(
        `${API_CARRINHO}/${ID_CLIENTE}/${idProduto}`,
        {
          method: "DELETE",

          credentials: "include",

          headers:
            csrfHeaders()

        }
      );


    if (!res.ok) {

      throw new Error(
        "Erro ao remover item do carrinho"
      );

    }


    await carregarCarrinho();


  } catch (err) {

    console.error(err);


    alert(
      err.message ||
      "Erro ao remover item do carrinho."
    );

  }

}


/*
 * =========================================================
 * ESVAZIAR
 * =========================================================
 */

async function esvaziarCarrinho() {

  if (!carrinhoItens.length) {

    return;

  }


  try {

    for (
      const item
      of carrinhoItens
    ) {

      const res =
        await fetch(
          `${API_CARRINHO}/${ID_CLIENTE}/${item.idProduto}`,
          {
            method: "DELETE",

            credentials: "include",

            headers:
              csrfHeaders()

          }
        );


      if (!res.ok) {

        throw new Error(
          "Erro ao esvaziar o carrinho"
        );

      }

    }


    descontoAtual = 0;

    await carregarCarrinho();


  } catch (err) {

    console.error(err);


    alert(
      err.message ||
      "Erro ao esvaziar o carrinho."
    );

  }

}


/*
 * =========================================================
 * RESUMO
 * =========================================================
 */

function atualizarResumo(
  comprarAgora
) {

  const subtotal =
    comprarAgora.reduce(
      (acc, item) => {

        return (
          acc +
          Number(
            item.precoProduto || 0
          ) *
          Number(
            item.quantidade || 0
          )
        );

      },
      0
    );


  const desconto =
    Number(
      descontoAtual || 0
    );


  const total =
    Math.max(
      0,
      subtotal - desconto
    );


  if (subtotalEl) {

    subtotalEl.textContent =
      `${formatarPreco(subtotal)} (${comprarAgora.length} ${
        comprarAgora.length === 1
          ? "item"
          : "itens"
      })`;

  }


  if (descontoEl) {

    descontoEl.textContent =
      formatarPreco(
        desconto
      );

  }


  if (totalEl) {

    totalEl.textContent =
      formatarPreco(
        total
      );

  }

}


/*
 * =========================================================
 * IR PARA CHECKOUT
 * =========================================================
 */

function irParaCheckout() {

  const comprarAgora =
    carrinhoItens.filter(
      (item) =>
        !item.salvoParaDepois
    );


  if (
    comprarAgora.length === 0
  ) {

    alert(
      "Seu carrinho está vazio."
    );

    return;

  }


  /*
   * Salva uma cópia local para
   * o checkout ter acesso imediato.
   */

  sessionStorage.setItem(
    STORAGE_CHECKOUT,
    JSON.stringify(
      comprarAgora
    )
  );


  window.location.href =
    "checkout.html";

}


/*
 * =========================================================
 * CUPOM
 * =========================================================
 */

const btnCupom =
  document.querySelector(
    "#btnAplicarCupom"
  );


const inputCupom =
  document.querySelector(
    "#inputCupom"
  );


if (btnCupom) {

  btnCupom.addEventListener(
    "click",
    () => {

      const cupom =
        inputCupom?.value
          ?.trim()
          ?.toUpperCase();


      if (!cupom) {

        alert(
          "Digite um cupom."
        );

        return;

      }


      /*
       * Ainda não existe endpoint
       * de cupom informado.
       */

      alert(
        "A aplicação de cupons será integrada ao backend."
      );

    }
  );

}


/*
 * =========================================================
 * BOTÃO CONTINUAR
 * =========================================================
 */

if (btnContinuarCheckout) {

  btnContinuarCheckout.addEventListener(
    "click",
    irParaCheckout
  );

}


/*
 * =========================================================
 * BOTÃO CHECKOUT DO TOPO
 * =========================================================
 */

if (btnIrCheckoutTopo) {

  btnIrCheckoutTopo.addEventListener(
    "click",
    irParaCheckout
  );

}


/*
 * =========================================================
 * ESVAZIAR
 * =========================================================
 */

if (esvaziarBtn) {

  esvaziarBtn.addEventListener(
    "click",
    () => {

      if (!carrinhoItens.length) {

        return;

      }


      const confirmar =
        confirm(
          "Tem certeza que deseja esvaziar o carrinho?"
        );


      if (confirmar) {

        esvaziarCarrinho();

      }

    }
  );

}


/*
 * =========================================================
 * UTILITÁRIOS
 * =========================================================
 */

function formatarPreco(
  valor
) {

  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


function escaparHTML(
  valor
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    valor ?? "";


  return div.innerHTML;

}


function escaparAtributo(
  valor
) {

  return String(
    valor ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );

}


/*
 * =========================================================
 * INICIAR
 * =========================================================
 */

carregarCarrinho();