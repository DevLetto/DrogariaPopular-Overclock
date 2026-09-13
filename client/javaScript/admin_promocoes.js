const API_BASE_URL = "http://localhost:8080/api";

const estado = {
    promocoes: [],
    produtos: []
};


document.addEventListener("DOMContentLoaded", () => {
    inicializar();
});


async function inicializar() {

    configurarEventos();

    await carregarProdutos();
    await carregarPromocoes();

}


/* ================================
   EVENTOS
================================ */

function configurarEventos() {

    const botaoNovaPromocao =
        document.querySelector("#btnNovaPromocao");

    if (botaoNovaPromocao) {

        botaoNovaPromocao.addEventListener(
            "click",
            () => abrirFormulario()
        );

    }

}


/* ================================
   REQUISIÇÃO
================================ */

async function requisicao(endpoint, opcoes = {}) {

    const resposta = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(opcoes.headers || {})
            },
            ...opcoes
        }
    );


    if (!resposta.ok) {

        let mensagem =
            `Erro HTTP ${resposta.status}`;

        try {

            const erro =
                await resposta.json();

            mensagem =
                erro.message ||
                erro.mensagem ||
                erro.error ||
                mensagem;

        } catch (_) {}

        throw new Error(mensagem);
    }


    if (resposta.status === 204) {
        return null;
    }


    const texto =
        await resposta.text();

    if (!texto) {
        return null;
    }


    try {

        return JSON.parse(texto);

    } catch (_) {

        return texto;

    }

}


/* ================================
   PRODUTOS
================================ */

async function carregarProdutos() {

    try {

        const produtos =
            await requisicao("/produto");

        estado.produtos =
            Array.isArray(produtos)
                ? produtos
                : [];

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar os produtos: ${erro.message}`,
            "erro"
        );

    }

}


/* ================================
   PROMOÇÕES
================================ */

async function carregarPromocoes() {

    try {

        const promocoes =
            await requisicao("/promocao");

        estado.promocoes =
            Array.isArray(promocoes)
                ? promocoes
                : [];

        renderizarTabela();

    } catch (erro) {

        console.error(
            "Erro ao carregar promoções:",
            erro
        );

        mostrarToast(
            `Não foi possível carregar as promoções: ${erro.message}`,
            "erro"
        );

    }

}


/* ================================
   TABELA
================================ */

function renderizarTabela() {

    const tabela =
        document.querySelector(
            "#tabelaPromocoes"
        );


    if (!tabela) {
        return;
    }


    tabela.innerHTML = "";


    if (estado.promocoes.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align: center; padding: 30px;"
                >
                    Nenhuma promoção cadastrada.
                </td>
            </tr>
        `;

        return;
    }


    estado.promocoes.forEach(
        (promocao) => {

            const linha =
                criarLinhaPromocao(promocao);

            tabela.appendChild(linha);

        }
    );


    adicionarEventosTabela();

}


/* ================================
   LINHA DA TABELA
================================ */

function criarLinhaPromocao(promocao) {

    const tr =
        document.createElement("tr");


    const produto =
        promocao.produto;


    const nomeProduto =
        produto?.nomeProduto ||
        promocao.nomeProduto ||
        "Produto";


    const precoOriginal =
        obterPrecoOriginal(produto);


    const precoPromocional =
        Number(
            promocao.precoPromocional || 0
        );


    const desconto =
        calcularDesconto(
            precoOriginal,
            precoPromocional
        );


    const dataFim =
        promocao.dataFim;


    const status =
        obterStatusPromocao(
            promocao
        );


    const classeStatus =
        obterClasseStatusPromocao(
            status
        );


    tr.innerHTML = `

        <td>
            <strong>
                ${escaparHTML(nomeProduto)}
            </strong>
        </td>


        <td>
            ${formatarMoeda(precoOriginal)}
        </td>


        <td>
            ${desconto}%
        </td>


        <td>
            <strong>
                ${formatarMoeda(precoPromocional)}
            </strong>
        </td>


        <td>
            ${formatarDataCurta(dataFim)}
        </td>


        <td>
            <span class="${classeStatus}">
                ${status}
            </span>
        </td>


        <td class="action-cell">

            <button
                type="button"
                class="btn-icon btn-editar-promocao"
                title="Editar"
                data-id="${promocao.idPromocao ?? promocao.id}"
            >

                <img
                    src="../img/edicao_icon.png"
                    alt="Editar"
                >

            </button>


            <button
                type="button"
                class="btn-icon btn-excluir-promocao"
                title="Excluir"
                data-id="${promocao.idPromocao ?? promocao.id}"
            >

                <img
                    src="../img/lixeira_icon.png"
                    alt="Excluir"
                >

            </button>

        </td>

    `;


    return tr;

}


/* ================================
   EVENTOS DA TABELA
================================ */

function adicionarEventosTabela() {

    const botoesEditar =
        document.querySelectorAll(
            ".btn-editar-promocao"
        );


    botoesEditar.forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                async () => {

                    const id =
                        botao.dataset.id;

                    await editarPromocao(id);

                }
            );

        }
    );


    const botoesExcluir =
        document.querySelectorAll(
            ".btn-excluir-promocao"
        );


    botoesExcluir.forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                async () => {

                    const id =
                        botao.dataset.id;

                    await excluirPromocao(id);

                }
            );

        }
    );

}


/* ================================
   NOVA / EDITAR
================================ */

function abrirFormulario(promocao = null) {

    const modalExistente =
        document.querySelector(
            ".modal-promocao"
        );


    if (modalExistente) {
        modalExistente.remove();
    }


    const editando =
        promocao !== null;


    const modal =
        document.createElement("div");


    modal.className =
        "modal-promocao";


    const produtoSelecionado =
        promocao?.produto?.idProduto ??
        promocao?.produto?.id ??
        promocao?.idProduto ??
        "";


    const dataInicio =
        promocao?.dataInicio ||
        "";


    const dataFim =
        promocao?.dataFim ||
        "";


    const precoPromocional =
        promocao?.precoPromocional ??
        "";


    const opcoesProdutos =
        estado.produtos.map(
            (produto) => {

                const id =
                    produto.idProduto ??
                    produto.id;


                const nome =
                    produto.nomeProduto ||
                    produto.nome ||
                    "Produto";


                const selecionado =
                    String(id) ===
                    String(produtoSelecionado)
                        ? "selected"
                        : "";


                return `
                    <option
                        value="${id}"
                        ${selecionado}
                    >
                        ${escaparHTML(nome)}
                    </option>
                `;

            }
        ).join("");


    modal.innerHTML = `

        <div class="modal-overlay"></div>


        <div class="modal-promocao-conteudo">

            <div class="modal-promocao-header">

                <div>

                    <h2>
                        ${
                            editando
                                ? "Editar promoção"
                                : "Nova promoção"
                        }
                    </h2>

                    <span>
                        Preencha os dados da promoção.
                    </span>

                </div>


                <button
                    type="button"
                    class="modal-promocao-fechar"
                >
                    ×
                </button>

            </div>


            <form id="formPromocao">

                <div class="campo-formulario">

                    <label for="promocaoProduto">
                        Produto
                    </label>

                    <select
                        id="promocaoProduto"
                        required
                    >

                        <option value="">
                            Selecione um produto
                        </option>

                        ${opcoesProdutos}

                    </select>

                </div>


                <div class="campo-formulario">

                    <label for="promocaoPreco">
                        Preço promocional
                    </label>

                    <input
                        type="number"
                        id="promocaoPreco"
                        min="0"
                        step="0.01"
                        value="${precoPromocional}"
                        placeholder="Ex.: 6.90"
                        required
                    >

                </div>


                <div class="campos-data">

                    <div class="campo-formulario">

                        <label for="promocaoInicio">
                            Data de início
                        </label>

                        <input
                            type="date"
                            id="promocaoInicio"
                            value="${dataInicio}"
                            required
                        >

                    </div>


                    <div class="campo-formulario">

                        <label for="promocaoFim">
                            Data de término
                        </label>

                        <input
                            type="date"
                            id="promocaoFim"
                            value="${dataFim}"
                            required
                        >

                    </div>

                </div>


                <div class="modal-promocao-acoes">

                    <button
                        type="button"
                        class="btn-cancelar-promocao"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        ${
                            editando
                                ? "Salvar alterações"
                                : "Criar promoção"
                        }
                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(modal);


    const fechar =
        modal.querySelector(
            ".modal-promocao-fechar"
        );


    const cancelar =
        modal.querySelector(
            ".btn-cancelar-promocao"
        );


    const overlay =
        modal.querySelector(
            ".modal-overlay"
        );


    fechar.addEventListener(
        "click",
        () => modal.remove()
    );


    cancelar.addEventListener(
        "click",
        () => modal.remove()
    );


    overlay.addEventListener(
        "click",
        () => modal.remove()
    );


    const form =
        modal.querySelector(
            "#formPromocao"
        );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const idProduto =
                Number(
                    document.querySelector(
                        "#promocaoProduto"
                    ).value
                );


            const preco =
                Number(
                    document.querySelector(
                        "#promocaoPreco"
                    ).value
                );


            const inicio =
                document.querySelector(
                    "#promocaoInicio"
                ).value;


            const fim =
                document.querySelector(
                    "#promocaoFim"
                ).value;


            if (!idProduto) {

                mostrarToast(
                    "Selecione um produto.",
                    "erro"
                );

                return;

            }


            if (!preco || preco <= 0) {

                mostrarToast(
                    "Informe um preço promocional válido.",
                    "erro"
                );

                return;

            }


            if (!inicio || !fim) {

                mostrarToast(
                    "Informe as datas da promoção.",
                    "erro"
                );

                return;

            }


            if (fim < inicio) {

                mostrarToast(
                    "A data de término não pode ser anterior à data de início.",
                    "erro"
                );

                return;

            }


            const dados = {

                precoPromocional: preco,

                dataInicio: inicio,

                dataFim: fim,

                idProduto: idProduto

            };


            try {

                const botao =
                    form.querySelector(
                        "button[type='submit']"
                    );


                botao.disabled = true;


                if (editando) {

                    await requisicao(
                        `/promocao/${promocao.idPromocao ?? promocao.id}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(dados)
                        }
                    );


                    mostrarToast(
                        "Promoção atualizada com sucesso!",
                        "sucesso"
                    );

                } else {

                    await requisicao(
                        "/promocao",
                        {
                            method: "POST",
                            body: JSON.stringify(dados)
                        }
                    );


                    mostrarToast(
                        "Promoção criada com sucesso!",
                        "sucesso"
                    );

                }


                modal.remove();

                await carregarPromocoes();

            } catch (erro) {

                console.error(
                    "Erro ao salvar promoção:",
                    erro
                );


                mostrarToast(
                    `Não foi possível salvar a promoção: ${erro.message}`,
                    "erro"
                );


            } finally {

                const botao =
                    form.querySelector(
                        "button[type='submit']"
                    );


                if (botao) {
                    botao.disabled = false;
                }

            }

        }
    );


    adicionarEstilosModal();

}


/* ================================
   EDITAR
================================ */

async function editarPromocao(id) {

    try {

        const promocao =
            await requisicao(
                `/promocao/${id}`
            );


        abrirFormulario(promocao);

    } catch (erro) {

        console.error(
            "Erro ao buscar promoção:",
            erro
        );


        mostrarToast(
            `Não foi possível carregar a promoção: ${erro.message}`,
            "erro"
        );

    }

}


/* ================================
   EXCLUIR
================================ */

async function excluirPromocao(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta promoção?"
        );


    if (!confirmar) {
        return;
    }


    try {

        await requisicao(
            `/promocao/${id}`,
            {
                method: "DELETE"
            }
        );


        mostrarToast(
            "Promoção excluída com sucesso!",
            "sucesso"
        );


        await carregarPromocoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir promoção:",
            erro
        );


        mostrarToast(
            `Não foi possível excluir a promoção: ${erro.message}`,
            "erro"
        );

    }

}


/* ================================
   STATUS
================================ */

function obterStatusPromocao(promocao) {

    const hoje =
        new Date();


    hoje.setHours(
        0,
        0,
        0,
        0
    );


    const inicio =
        converterDataLocal(
            promocao.dataInicio
        );


    const fim =
        converterDataLocal(
            promocao.dataFim
        );


    if (!inicio || !fim) {
        return "Indefinida";
    }


    if (hoje < inicio) {
        return "Agendada";
    }


    if (hoje > fim) {
        return "Expirada";
    }


    return "Ativa";

}


function obterClasseStatusPromocao(status) {

    const mapa = {

        "Ativa":
            "status-promo-ativa",

        "Expirada":
            "status-promo-expirada",

        "Agendada":
            "status-promo-agendada"

    };


    return mapa[status] ||
        "status-promo-expirada";

}


/* ================================
   PREÇO / DESCONTO
================================ */

function obterPrecoOriginal(produto) {

    if (!produto) {
        return 0;
    }


    return Number(
        produto.precoProduto ??
        produto.preco ??
        produto.valor ??
        0
    );

}


function calcularDesconto(
    precoOriginal,
    precoPromocional
) {

    if (
        precoOriginal <= 0 ||
        precoPromocional >= precoOriginal
    ) {
        return 0;
    }


    const desconto =
        (
            1 -
            (
                precoPromocional /
                precoOriginal
            )
        ) * 100;


    return Math.round(
        desconto
    );

}


/* ================================
   DATAS
================================ */

function converterDataLocal(valor) {

    if (!valor) {
        return null;
    }


    const partes =
        String(valor).split("-");


    if (partes.length !== 3) {
        return null;
    }


    const ano =
        Number(partes[0]);


    const mes =
        Number(partes[1]) - 1;


    const dia =
        Number(partes[2]);


    return new Date(
        ano,
        mes,
        dia
    );

}


function formatarDataCurta(valor) {

    const data =
        converterDataLocal(valor);


    if (!data) {
        return "-";
    }


    return data.toLocaleDateString(
        "pt-BR"
    );

}


/* ================================
   UTILIDADES
================================ */

function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}


function escaparHTML(valor) {

    const div =
        document.createElement("div");


    div.textContent =
        valor ?? "";


    return div.innerHTML;

}


/* ================================
   TOAST
================================ */

function mostrarToast(
    mensagem,
    tipo = "sucesso"
) {

    const toastExistente =
        document.querySelector(
            ".toast-promocao"
        );


    if (toastExistente) {
        toastExistente.remove();
    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast-promocao ${tipo}`;


    toast.textContent =
        mensagem;


    document.body.appendChild(toast);


    adicionarEstilosToast();


    setTimeout(
        () => toast.remove(),
        3500
    );

}


/* ================================
   ESTILOS DO MODAL
================================ */

function adicionarEstilosModal() {

    if (
        document.querySelector(
            "#estilos-modal-promocao"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "estilos-modal-promocao";


    style.textContent = `

        .modal-promocao {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }


        .modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
        }


        .modal-promocao-conteudo {
            position: relative;
            z-index: 1;
            width: min(550px, 90%);
            background: white;
            border-radius: 14px;
            padding: 25px;
            box-shadow:
                0 20px 50px
                rgba(0, 0, 0, 0.25);
        }


        .modal-promocao-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
        }


        .modal-promocao-header h2 {
            margin: 0 0 5px;
        }


        .modal-promocao-header span {
            color: #777;
        }


        .modal-promocao-fechar {
            border: none;
            background: transparent;
            font-size: 30px;
            cursor: pointer;
            line-height: 1;
        }


        .campo-formulario {
            display: flex;
            flex-direction: column;
            gap: 7px;
            margin-bottom: 18px;
        }


        .campo-formulario label {
            font-size: 13px;
            font-weight: 600;
        }


        .campo-formulario input,
        .campo-formulario select {
            width: 100%;
            box-sizing: border-box;
            padding: 11px 12px;
            border: 1px solid #ddd;
            border-radius: 7px;
            font-size: 14px;
        }


        .campos-data {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }


        .modal-promocao-acoes {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 25px;
        }


        .btn-cancelar-promocao {
            padding: 10px 18px;
            border: 1px solid #ddd;
            border-radius: 7px;
            background: white;
            cursor: pointer;
        }


        .btn-cancelar-promocao:hover {
            background: #f5f5f5;
        }


        .modal-promocao-acoes .btn-primary {
            border: none;
            cursor: pointer;
        }


        .status-promo-agendada {
            color: #b26a00;
        }


        .toast-promocao {
            position: fixed;
            right: 25px;
            bottom: 25px;
            z-index: 10000;
            padding: 14px 20px;
            border-radius: 8px;
            background: #222;
            color: white;
            font-size: 14px;
            box-shadow:
                0 5px 20px
                rgba(0, 0, 0, 0.2);
        }


        .toast-promocao.erro {
            background: #c62828;
        }


        .toast-promocao.sucesso {
            background: #2e7d32;
        }


        @media (max-width: 600px) {

            .campos-data {
                grid-template-columns: 1fr;
                gap: 0;
            }

        }

    `;


    document.head.appendChild(style);

}


/* ================================
   ESTILOS DO TOAST
================================ */

function adicionarEstilosToast() {

    if (
        document.querySelector(
            "#estilos-toast-promocao"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "estilos-toast-promocao";


    style.textContent = `

        @keyframes aparecerToastPromocao {

            from {
                opacity: 0;
                transform: translateY(10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }

        }


        .toast-promocao {
            animation:
                aparecerToastPromocao
                0.2s ease;
        }

    `;


    document.head.appendChild(style);

}