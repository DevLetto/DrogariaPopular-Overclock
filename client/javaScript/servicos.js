(function () {

  const API_BASE_URL =
    "http://localhost:8080/api";

  const API_SERVICO =
    `${API_BASE_URL}/servico`;

  const API_LOJA =
    `${API_BASE_URL}/loja`;


  let servicos = [];

  let lojas = [];


  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      inicializar();

    }
  );


  async function inicializar() {

    mostrarCarregando();

    await carregarDados();

  }


  // =========================================================
  // API
  // =========================================================

  async function fetchJson(url) {

    const resposta =
      await fetch(url);


    if (!resposta.ok) {

      throw new Error(
        `Erro ${resposta.status} ao acessar ${url}`
      );

    }


    return resposta.json();

  }


  // =========================================================
  // CARREGAR SERVIÇOS E LOJAS
  // =========================================================

  async function carregarDados() {

    try {

      const [
        servicosApi,
        lojasApi
      ] = await Promise.all([

        fetchJson(API_SERVICO),

        fetchJson(API_LOJA)

      ]);


      servicos =
        Array.isArray(servicosApi)
          ? servicosApi
          : [];


      lojas =
        Array.isArray(lojasApi)
          ? lojasApi
          : [];


      console.log(
        "Serviços carregados:",
        servicos
      );


      console.log(
        "Lojas carregadas:",
        lojas
      );


      renderizarServicos();


    } catch (erro) {

      console.error(
        "Erro ao carregar serviços:",
        erro
      );


      mostrarErro();

    }

  }


  // =========================================================
  // CARREGANDO
  // =========================================================

  function mostrarCarregando() {

    const container =
      document.querySelector(
        "#servicosGrid"
      );


    if (!container) {
      return;
    }


    container.innerHTML = `

      <div
        style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
        "
      >

        <p>
          Carregando serviços...
        </p>

      </div>

    `;

  }


  // =========================================================
  // RENDERIZAR
  // =========================================================

  function renderizarServicos() {

    const container =
      document.querySelector(
        "#servicosGrid"
      );


    if (!container) {

      console.warn(
        "Container #servicosGrid não encontrado."
      );

      return;

    }


    if (
      !Array.isArray(servicos) ||
      servicos.length === 0
    ) {

      container.innerHTML = `

        <div
          style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px;
          "
        >

          <h3>
            Nenhum serviço encontrado
          </h3>

          <p>
            No momento não há serviços cadastrados.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      servicos
        .map(
          criarCardServico
        )
        .join("");


    adicionarEventos();

  }


  // =========================================================
  // CARD DE SERVIÇO
  // =========================================================

  function criarCardServico(
    servico,
    indice
  ) {

    const id =
      servico.id ??
      servico.idServico;


    const nome =
      servico.nome ??
      "Serviço";


    const descricao =
      servico.descricao ??
      "Descrição não informada.";


    const valor =
      Number(
        servico.valor || 0
      );


    const loja =
      encontrarLoja(
        servico.idLoja
      );


    const nomeLoja =
      loja?.nome ||
      null;


    /*
     * Como o backend atualmente não possui
     * informações de tempo, agendamento ou
     * ícone do serviço, usamos apenas dados
     * realmente existentes.
     *
     * Os ícones abaixo são apenas visuais.
     */

    const icone =
      obterIconeServico(
        nome
      );


    const classeIcone =
      indice % 2 === 0
        ? "bg-primaria"
        : "bg-secundaria";


    return `

      <article
        class="servico-card"
        data-servico-id="${id}"
      >

        <div
          class="servico-icon ${classeIcone}"
        >

          <img
            src="${icone}"
            alt="${escaparAtributo(nome)}"
          />

        </div>


        <h3>
          ${escaparHTML(nome)}
        </h3>


        <p>
          ${escaparHTML(descricao)}
        </p>


        ${
          nomeLoja
            ? `
              <span class="badge-agendamento verde">
                ${escaparHTML(nomeLoja)}
              </span>
            `
            : ""
        }


        <div class="servico-footer">

          <span
            class="
              preco
              ${
                valor === 0
                  ? "destaque-verde"
                  : ""
              }
            "
          >

            ${
              valor === 0
                ? "Gratuito"
                : formatarPreco(valor)
            }

          </span>

        </div>


        <button
          type="button"
          class="btn-detalhes"
          data-detalhes
        >

          Ver detalhes

        </button>

      </article>

    `;

  }


  // =========================================================
  // ENCONTRAR LOJA
  // =========================================================

  function encontrarLoja(
    idLoja
  ) {

    if (!idLoja) {
      return null;
    }


    return lojas.find(
      (loja) => {

        const id =
          loja.id ??
          loja.idLoja;

        return (
          String(id) ===
          String(idLoja)
        );

      }
    );

  }


  // =========================================================
  // ÍCONE DO SERVIÇO
  // =========================================================

  function obterIconeServico(
    nome
  ) {

    const texto =
      String(nome)
        .toLowerCase();


    if (
      texto.includes("inje")
    ) {

      return "../img/injecao_icon.png";

    }


    if (
      texto.includes("press")
    ) {

      return "../img/estetoscopio_icon.png";

    }


    if (
      texto.includes("glic")
    ) {

      return "../img/check_icon.png";

    }


    if (
      texto.includes("colesterol")
    ) {

      return "../img/check_icon.png";

    }


    if (
      texto.includes("orelha") ||
      texto.includes("fura")
    ) {

      return "../img/servicos_icon.png";

    }


    if (
      texto.includes("farmac")
    ) {

      return "../img/coracao_icon.png";

    }


    return "../img/servicos_icon.png";

  }


  // =========================================================
  // EVENTOS
  // =========================================================

  function adicionarEventos() {

    const botoes =
      document.querySelectorAll(
        "[data-detalhes]"
      );


    botoes.forEach(
      (botao) => {

        botao.addEventListener(
          "click",
          (event) => {

            event.stopPropagation();


            const card =
              botao.closest(
                ".servico-card"
              );


            if (!card) {
              return;
            }


            const id =
              card.dataset.servicoId;


            if (!id) {
              return;
            }


            abrirDetalhes(id);

          }
        );

      }
    );

  }


  // =========================================================
  // DETALHES
  // =========================================================

  async function abrirDetalhes(
    id
  ) {

    try {

      const servico =
        await fetchJson(
          `${API_SERVICO}/${id}`
        );


      mostrarModal(
        servico
      );


    } catch (erro) {

      console.error(
        "Erro ao buscar detalhes do serviço:",
        erro
      );


      alert(
        "Não foi possível carregar os detalhes do serviço."
      );

    }

  }


  // =========================================================
  // MODAL
  // =========================================================

  function mostrarModal(
    servico
  ) {

    fecharModal();


    const valor =
      Number(
        servico.valor || 0
      );


    const loja =
      encontrarLoja(
        servico.idLoja
      );


    const overlay =
      document.createElement(
        "div"
      );


    overlay.className =
      "modal-overlay";


    overlay.innerHTML = `

      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalServico"
      >

        <div class="modal-header">

          <h2 id="tituloModalServico">
            ${escaparHTML(
              servico.nome ||
              "Serviço"
            )}
          </h2>


          <button
            type="button"
            class="modal-fechar"
            aria-label="Fechar"
          >

            &times;

          </button>

        </div>


        <div class="modal-conteudo">

          <p>
            ${
              servico.descricao
                ? escaparHTML(
                    servico.descricao
                  )
                : "Descrição não informada."
            }
          </p>


          <div
            style="
              margin-top: 20px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            "
          >

            <strong>
              Valor:
            </strong>

            <span>
              ${
                valor === 0
                  ? "Gratuito"
                  : formatarPreco(valor)
              }
            </span>


            ${
              loja
                ? `
                  <strong>
                    Loja:
                  </strong>

                  <span>
                    ${escaparHTML(
                      loja.nome ||
                      "Não informado"
                    )}
                  </span>
                `
                : ""
            }

          </div>

        </div>


        <div class="modal-acoes">

          <button
            type="button"
            class="btn-fechar-modal"
          >

            Fechar

          </button>

        </div>

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    // =======================================================
    // FECHAR
    // =======================================================

    const btnFechar =
      overlay.querySelector(
        ".modal-fechar"
      );


    const btnFecharModal =
      overlay.querySelector(
        ".btn-fechar-modal"
      );


    btnFechar.addEventListener(
      "click",
      fecharModal
    );


    btnFecharModal.addEventListener(
      "click",
      fecharModal
    );


    overlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          overlay
        ) {

          fecharModal();

        }

      }
    );


    document.addEventListener(
      "keydown",
      fecharComEscape
    );

  }


  // =========================================================
  // FECHAR MODAL
  // =========================================================

  function fecharModal() {

    const modal =
      document.querySelector(
        ".modal-overlay"
      );


    if (modal) {

      modal.remove();

    }


    document.removeEventListener(
      "keydown",
      fecharComEscape
    );

  }


  function fecharComEscape(
    event
  ) {

    if (
      event.key === "Escape"
    ) {

      fecharModal();

    }

  }


  // =========================================================
  // PREÇO
  // =========================================================

  function formatarPreco(
    valor
  ) {

    return Number(valor || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );

  }


  // =========================================================
  // ESCAPAR HTML
  // =========================================================

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


  // =========================================================
  // ESCAPAR ATRIBUTO
  // =========================================================

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


  // =========================================================
  // ERRO
  // =========================================================

  function mostrarErro() {

    const container =
      document.querySelector(
        "#servicosGrid"
      );


    if (!container) {
      return;
    }


    container.innerHTML = `

      <div
        style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
        "
      >

        <h3>
          Erro ao carregar serviços
        </h3>

        <p>
          Não foi possível carregar os serviços.
        </p>

        <button
          type="button"
          id="btnTentarNovamente"
          style="
            margin-top: 15px;
            padding: 10px 20px;
            cursor: pointer;
          "
        >
          Tentar novamente
        </button>

      </div>

    `;


    const botao =
      document.querySelector(
        "#btnTentarNovamente"
      );


    if (botao) {

      botao.addEventListener(
        "click",
        () => {

          mostrarCarregando();

          carregarDados();

        }
      );

    }

  }

})();