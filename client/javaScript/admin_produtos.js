/**
 * Lógica do painel administrativo de produtos.
 *
 * APIs utilizadas:
 * GET    /api/produto
 * GET    /api/categoria
 * POST   /api/produto
 * PUT    /api/produto/{idProduto}
 * DELETE /api/produto/{idProduto}
 *
 * GET    /api/estoque
 * POST   /api/estoque
 * PUT    /api/estoque/{id}
 * DELETE /api/estoque/{id}
 *
 * GET    /api/promocao
 */

const API_BASE_URL = "http://localhost:8080/api";

const state = {
    produtos: [],
    categorias: [],
    estoques: [],
    promocoes: [],
    filtro: "todos",
    busca: ""
};

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
    configurarEventos();
    await carregarDados();
}

function configurarEventos() {

    document
        .getElementById("btn-novo-produto")
        .addEventListener("click", () => abrirModalProduto());

    document
        .getElementById("input-busca")
        .addEventListener("input", (event) => {

            state.busca = event.target.value
                .trim()
                .toLowerCase();

            renderizarTabela();
        });

    document
        .querySelectorAll(".filter-pills .pill")
        .forEach((botao) => {

            botao.addEventListener("click", () => {

                document
                    .querySelectorAll(".filter-pills .pill")
                    .forEach((b) => b.classList.remove("active"));

                botao.classList.add("active");

                state.filtro = botao.dataset.filtro;

                renderizarTabela();
            });
        });
}

async function carregarDados() {

    setLoading(true);

    try {

        const [
            produtos,
            categorias,
            estoques,
            promocoes
        ] = await Promise.all([

            requisicao("/produto"),

            requisicao("/categoria"),

            requisicao("/estoque"),

            carregarPromocoes()
        ]);

        state.produtos =
            Array.isArray(produtos)
                ? produtos
                : [];

        state.categorias =
            Array.isArray(categorias)
                ? categorias
                : [];

        state.estoques =
            Array.isArray(estoques)
                ? estoques
                : [];

        state.promocoes =
            Array.isArray(promocoes)
                ? promocoes
                : [];

        renderizarTudo();

    } catch (error) {

        console.error(
            "Erro ao carregar dados:",
            error
        );

        mostrarErroTabela(error.message);

        mostrarMensagem(
            "Não foi possível carregar os produtos.",
            "erro"
        );

    } finally {

        setLoading(false);
    }
}

async function carregarPromocoes() {

    try {

        const resposta =
            await requisicao("/promocao");

        return Array.isArray(resposta)
            ? resposta
            : [];

    } catch (error) {

        console.warn(
            "Não foi possível carregar promoções:",
            error
        );

        return [];
    }
}

function renderizarTudo() {

    renderizarTabela();

    atualizarResumo();
}
    
function renderizarTabela() {

    const tbody =
        document.getElementById("produtos-tbody");

    const produtosFiltrados =
        state.produtos.filter((produto) => {

            const estoque =
                obterEstoqueProduto(
                    produto.idProduto
                );

            const status =
                obterStatusEstoque(estoque);

            const textoBusca = [

                produto.nomeProduto,

                obterNomeCategoria(
                    produto.idCategoria,
                    produto.categoria
                )

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const correspondeBusca =
                !state.busca ||
                textoBusca.includes(state.busca);

            let correspondeFiltro = true;

            if (state.filtro === "estoque") {

                correspondeFiltro =
                    estoque &&
                    estoque.quantidade > 0;
            }

            else if (state.filtro === "baixo") {

                correspondeFiltro =
                    status === "baixo";
            }

            else if (state.filtro === "esgotado") {

                correspondeFiltro =
                    status === "esgotado";
            }

            return (
                correspondeBusca &&
                correspondeFiltro
            );
        });

    if (produtosFiltrados.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        produtosFiltrados
            .map((produto) =>
                criarLinhaProduto(produto)
            )
            .join("");

    tbody
        .querySelectorAll("[data-acao='editar']")
        .forEach((botao) => {

            botao.addEventListener(
                "click",
                () => {

                    abrirModalProduto(
                        Number(botao.dataset.id)
                    );
                }
            );
        });

    tbody
        .querySelectorAll("[data-acao='excluir']")
        .forEach((botao) => {

            botao.addEventListener(
                "click",
                () => {

                    excluirProduto(
                        Number(botao.dataset.id)
                    );
                }
            );
        });
}

function criarLinhaProduto(produto) {

    const estoque =
        obterEstoqueProduto(
            produto.idProduto
        );

    const quantidade =
        estoque?.quantidade ?? 0;

    const status =
        obterStatusEstoque(estoque);

    const categoria =
        obterNomeCategoria(
            produto.idCategoria,
            produto.categoria
        );

    const descricao =
        obterDescricaoProduto(produto);

    const imagem =
        produto.imagemURL ||
        "../img/medicamentos_icon.png";

    const statusTexto = {

        ativo: "Ativo",

        baixo: "Estoque baixo",

        esgotado: "Esgotado"

    }[status];

    const statusClasse = {

        ativo: "status-ativo",

        baixo: "status-baixo",

        esgotado: "status-esgotado"

    }[status];

    return `

        <tr>

            <td class="product-cell">

                <div class="product-icon-box">

                    <img
                        src="${escaparAtributo(imagem)}"
                        alt=""
                        onerror="this.src='../img/medicamentos_icon.png'"
                    >

                </div>

                <div class="product-info">

                    <strong>
                        ${escaparHtml(
                            produto.nomeProduto ||
                            "Sem nome"
                        )}
                    </strong>

                    <span>
                        ${escaparHtml(descricao)}
                    </span>

                </div>

            </td>

            <td>
                ${escaparHtml(categoria)}
            </td>

            <td>
                ${formatarMoeda(
                    produto.precoProduto
                )}
            </td>

            <td>

                <span class="badge-stock">
                    ${quantidade}
                </span>

            </td>

            <td>

                <span class="status-badge ${statusClasse}">
                    ${statusTexto}
                </span>

            </td>

            <td class="action-cell">

                <button
                    class="btn-icon"
                    title="Editar"
                    data-acao="editar"
                    data-id="${produto.idProduto}"
                >

                    <img
                        src="../img/edicao_icon.png"
                        alt="Editar"
                    >

                </button>

                <button
                    class="btn-icon"
                    title="Excluir"
                    data-acao="excluir"
                    data-id="${produto.idProduto}"
                >

                    <img
                        src="../img/lixeira_icon.png"
                        alt="Excluir"
                    >

                </button>

            </td>

        </tr>

    `;
}

function atualizarResumo() {

    const total =
        state.produtos.length;

    const baixo =
        state.produtos.filter((produto) => {

            const estoque =
                obterEstoqueProduto(
                    produto.idProduto
                );

            return (
                obterStatusEstoque(estoque) ===
                "baixo"
            );

        }).length;

    const esgotados =
        state.produtos.filter((produto) => {

            const estoque =
                obterEstoqueProduto(
                    produto.idProduto
                );

            return (
                obterStatusEstoque(estoque) ===
                "esgotado"
            );

        }).length;

    const idsEmPromocao =
        new Set(

            state.promocoes
                .map((promocao) =>
                    extrairIdProdutoPromocao(
                        promocao
                    )
                )
                .filter((id) =>
                    id !== null
                )
        );

    document
        .getElementById("total-produtos")
        .textContent = total;

    document
        .getElementById("estoque-baixo")
        .textContent = baixo;

    document
        .getElementById("esgotados")
        .textContent = esgotados;

    document
        .getElementById("total-promocoes")
        .textContent =
            idsEmPromocao.size;
}

function obterEstoqueProduto(idProduto) {

    return state.estoques.find(
        (estoque) => {

            const id =
                estoque.idProduto ??
                estoque.produto?.idProduto ??
                estoque.produto?.id;

            return (
                Number(id) ===
                Number(idProduto)
            );
        }
    );
}

function obterStatusEstoque(estoque) {

    if (!estoque) {
        return "esgotado";
    }

    const quantidade =
        Number(
            estoque.quantidade ?? 0
        );

    const minimo =
        Number(
            estoque.estoqueMinimo ?? 0
        );

    if (quantidade <= 0) {

        return "esgotado";
    }

    if (quantidade <= minimo) {

        return "baixo";
    }

    return "ativo";
}

function obterNomeCategoria(
    idCategoria,
    categoria
) {

    if (categoria?.nome) {

        return categoria.nome;
    }

    if (categoria?.nomeCategoria) {

        return categoria.nomeCategoria;
    }

    const id =
        idCategoria ??
        categoria?.idCategoria ??
        categoria?.id;

    const encontrada =
        state.categorias.find(
            (cat) => {

                const catId =
                    cat.idCategoria ??
                    cat.id;

                return (
                    Number(catId) ===
                    Number(id)
                );
            }
        );

    return (
        encontrada?.nome ??
        encontrada?.nomeCategoria ??
        "Sem categoria"
    );
}

function obterDescricaoProduto(produto) {

    return (

        produto.descricao ??

        produto.descricaoProduto ??

        produto.apresentacao ??

        ""
    );
}

function extrairIdProdutoPromocao(
    promocao
) {

    return (

        promocao.idProduto ??

        promocao.produto?.idProduto ??

        promocao.produto?.id ??

        null
    );
}

async function abrirModalProduto(
    idProduto = null
) {

    const produto =
        idProduto

            ? state.produtos.find(
                (p) =>
                    Number(p.idProduto) ===
                    Number(idProduto)
            )

            : null;

    const estoque =
        produto

            ? obterEstoqueProduto(
                produto.idProduto
            )

            : null;

    const modal =
        document.createElement("div");

    modal.id =
        "modal-produto";

    modal.innerHTML = `

        <div class="modal-overlay">

            <div class="modal-produto-box">

                <div class="modal-header">

                    <div>

                        <h2>
                            ${
                                produto
                                    ? "Editar produto"
                                    : "Novo produto"
                            }
                        </h2>

                        <p>
                            ${
                                produto
                                    ? "Altere os dados do produto."
                                    : "Cadastre um novo produto."
                            }
                        </p>

                    </div>

                    <button
                        type="button"
                        class="modal-fechar"
                        id="fechar-modal"
                    >
                        &times;
                    </button>

                </div>

                <form id="form-produto">

                    <div class="form-grid">

                        <div class="form-group">

                            <label for="produto-nome">
                                Nome
                            </label>

                            <input
                                id="produto-nome"
                                name="nomeProduto"
                                type="text"
                                required
                                value="${escaparAtributo(
                                    produto?.nomeProduto ?? ""
                                )}"
                            >

                        </div>

                        <div class="form-group">

                            <label for="produto-preco">
                                Preço
                            </label>

                            <input
                                id="produto-preco"
                                name="precoProduto"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value="${
                                    produto?.precoProduto ?? ""
                                }"
                            >

                        </div>

                        <div class="form-group">

                            <label for="produto-categoria">
                                Categoria
                            </label>

                            <select
                                id="produto-categoria"
                                name="idCategoria"
                            >

                                <option value="">
                                    Sem categoria
                                </option>

                                ${state.categorias
                                    .map((categoria) => {

                                        const id =
                                            categoria.idCategoria ??
                                            categoria.id;

                                        const nome =
                                            categoria.nome ??
                                            categoria.nomeCategoria ??
                                            "Sem nome";

                                        const selecionada =
                                            Number(id) ===
                                            Number(
                                                produto?.idCategoria ??
                                                produto?.categoria?.idCategoria ??
                                                produto?.categoria?.id
                                            );

                                        return `

                                            <option
                                                value="${id}"
                                                ${
                                                    selecionada
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${escaparHtml(nome)}
                                            </option>

                                        `;

                                    })
                                    .join("")}

                            </select>

                        </div>

                        <div class="form-group">

                            <label for="produto-imagem">
                                URL da imagem
                            </label>

                            <input
                                id="produto-imagem"
                                name="imagemURL"
                                type="url"
                                value="${escaparAtributo(
                                    produto?.imagemURL ?? ""
                                )}"
                                placeholder="https://..."
                            >

                        </div>

                        <div class="form-group">

                            <label for="produto-estoque">
                                Quantidade em estoque
                            </label>

                            <input
                                id="produto-estoque"
                                name="quantidade"
                                type="number"
                                min="0"
                                required
                                value="${
                                    estoque?.quantidade ?? 0
                                }"
                            >

                        </div>

                        <div class="form-group">

                            <label for="produto-minimo">
                                Estoque mínimo
                            </label>

                            <input
                                id="produto-minimo"
                                name="estoqueMinimo"
                                type="number"
                                min="0"
                                required
                                value="${
                                    estoque?.estoqueMinimo ?? 5
                                }"
                            >

                        </div>

                        <div class="form-group">

                            <label for="produto-receita">
                                Necessita receita?
                            </label>

                            <select
                                id="produto-receita"
                                name="necessitaReceita"
                            >

                                <option
                                    value="0"
                                    ${
                                        Number(
                                            produto?.necessitaReceita ??
                                            0
                                        ) === 0
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Não
                                </option>

                                <option
                                    value="1"
                                    ${
                                        Number(
                                            produto?.necessitaReceita ??
                                            0
                                        ) === 1
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Sim
                                </option>

                            </select>

                        </div>

                        <div class="form-group">

                            <label for="produto-controlado">
                                Medicamento controlado?
                            </label>

                            <select
                                id="produto-controlado"
                                name="medicamentoControlado"
                            >

                                <option
                                    value="0"
                                    ${
                                        Number(
                                            produto?.medicamentoControlado ??
                                            0
                                        ) === 0
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Não
                                </option>

                                <option
                                    value="1"
                                    ${
                                        Number(
                                            produto?.medicamentoControlado ??
                                            0
                                        ) === 1
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Sim
                                </option>

                            </select>

                        </div>

                    </div>

                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn-secondary"
                            id="cancelar-modal"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            class="btn-primary"
                            id="salvar-produto"
                        >
                            ${
                                produto
                                    ? "Salvar alterações"
                                    : "Cadastrar produto"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;

    document.body.appendChild(modal);

    adicionarEstiloModalSeNecessario();

    const fechar = () =>
        modal.remove();

    document
        .getElementById("fechar-modal")
        .addEventListener(
            "click",
            fechar
        );

    document
        .getElementById("cancelar-modal")
        .addEventListener(
            "click",
            fechar
        );

    modal
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            (event) => {

                if (
                    event.target.classList
                        .contains("modal-overlay")
                ) {
                    fechar();
                }

            }
        );

    document
        .getElementById("form-produto")
        .addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                try {

                    await salvarProduto(
                        idProduto
                    );

                    fechar();

                    await carregarDados();

                    mostrarMensagem(
                        idProduto
                            ? "Produto atualizado com sucesso."
                            : "Produto cadastrado com sucesso.",
                        "sucesso"
                    );

                } catch (error) {

                    console.error(error);

                    mostrarMensagem(
                        error.message,
                        "erro"
                    );
                }
            }
        );
}

async function salvarProduto(idProduto) {

    const form =
        document.getElementById(
            "form-produto"
        );

    const nomeProduto =
        form.nomeProduto.value.trim();

    const precoProduto =
        Number(
            form.precoProduto.value
        );

    const imagemURL =
        form.imagemURL.value.trim() ||
        null;

    const idCategoria =
        form.idCategoria.value
            ? Number(form.idCategoria.value)
            : null;

    const necessitaReceita =
        Number(
            form.necessitaReceita.value
        );

    const medicamentoControlado =
        Number(
            form.medicamentoControlado.value
        );

    if (!nomeProduto) {

        throw new Error(
            "Informe o nome do produto."
        );
    }

    if (
        !Number.isFinite(precoProduto) ||
        precoProduto < 0
    ) {

        throw new Error(
            "Informe um preço válido."
        );
    }

    const produtoBody = {

        idProduto:
            idProduto ?? null,

        idCategoria,

        nomeProduto,

        precoProduto,

        imagemURL,

        necessitaReceita,

        medicamentoControlado
    };

    let produtoSalvo;

    if (idProduto) {

        produtoSalvo =
            await requisicao(
                `/produto/${idProduto}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            produtoBody
                        )
                }
            );

    } else {

        produtoSalvo =
            await requisicao(
                "/produto",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            produtoBody
                        )
                }
            );
    }

    const produtoId =
        produtoSalvo?.idProduto ??
        produtoSalvo?.id ??
        idProduto;

    if (!produtoId) {

        throw new Error(
            "A API não retornou o ID do produto."
        );
    }

    await salvarEstoque(

        produtoId,

        Number(form.quantidade.value),

        Number(form.estoqueMinimo.value)
    );

    return produtoSalvo;
}

async function salvarEstoque(
    idProduto,
    quantidade,
    estoqueMinimo
) {

    if (
        !Number.isInteger(quantidade) ||
        quantidade < 0
    ) {

        throw new Error(
            "Informe uma quantidade de estoque válida."
        );
    }

    if (
        !Number.isInteger(estoqueMinimo) ||
        estoqueMinimo < 0
    ) {

        throw new Error(
            "Informe um estoque mínimo válido."
        );
    }

    const estoqueAtual =
        obterEstoqueProduto(idProduto);

    const body = {

        quantidade,

        estoqueMinimo,

        idProduto,

        idLoja:
            estoqueAtual?.idLoja ??
            estoqueAtual?.loja?.idLoja ??
            estoqueAtual?.loja?.id ??
            null
    };

    if (
        estoqueAtual?.idEstoque ??
        estoqueAtual?.id
    ) {

        const idEstoque =
            estoqueAtual.idEstoque ??
            estoqueAtual.id;

        await requisicao(
            `/estoque/${idEstoque}`,
            {
                method: "PUT",

                body:
                    JSON.stringify(body)
            }
        );

    } else {

        await requisicao(
            "/estoque",
            {
                method: "POST",

                body:
                    JSON.stringify(body)
            }
        );
    }
}

async function excluirProduto(
    idProduto
) {

    const produto =
        state.produtos.find(
            (p) =>
                Number(p.idProduto) ===
                Number(idProduto)
        );

    const nome =
        produto?.nomeProduto ??
        "este produto";

    const confirmou =
        confirm(
            `Tem certeza que deseja excluir "${nome}"?\n\nEssa operação não poderá ser desfeita.`
        );

    if (!confirmou) {

        return;
    }

    try {

        await requisicao(
            `/produto/${idProduto}`,
            {
                method: "DELETE"
            }
        );

        await carregarDados();

        mostrarMensagem(
            "Produto excluído com sucesso.",
            "sucesso"
        );

    } catch (error) {

        console.error(
            "Erro ao excluir produto:",
            error
        );

        mostrarMensagem(
            `Não foi possível excluir o produto: ${error.message}`,
            "erro"
        );
    }
}

async function requisicao(
    endpoint,
    opcoes = {}
) {

    const configuracao = {

        ...opcoes,

        headers: {

            "Content-Type":
                "application/json",

            ...(opcoes.headers || {})
        }
    };

    const resposta =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            configuracao
        );

    const texto =
        await resposta.text();

    let dados = null;

    if (texto) {

        try {

            dados =
                JSON.parse(texto);

        } catch {

            dados = texto;
        }
    }

    if (!resposta.ok) {

        const mensagem =

            dados?.message ??

            dados?.erro ??

            dados?.error ??

            (
                typeof dados === "string"
                    ? dados
                    : null
            ) ??

            `Erro HTTP ${resposta.status}`;

        throw new Error(mensagem);
    }

    return dados;
}

function setLoading(loading) {

    const botao =
        document.getElementById(
            "btn-novo-produto"
        );

    if (!botao) {

        return;
    }

    botao.disabled =
        loading;
}

function mostrarErroTabela(
    mensagem
) {

    document
        .getElementById(
            "produtos-tbody"
        )
        .innerHTML = `

        <tr>

            <td
                colspan="6"
                style="text-align:center;"
            >

                Erro ao carregar produtos:
                ${escaparHtml(mensagem)}

            </td>

        </tr>

    `;
}

function mostrarMensagem(
    texto,
    tipo
) {

    let elemento =
        document.getElementById(
            "admin-toast"
        );

    if (!elemento) {

        elemento =
            document.createElement(
                "div"
            );

        elemento.id =
            "admin-toast";

        document.body.appendChild(
            elemento
        );
    }

    elemento.className =
        `admin-toast ${tipo}`;

    elemento.textContent =
        texto;

    clearTimeout(
        mostrarMensagem.timer
    );

    mostrarMensagem.timer =
        setTimeout(
            () => {

                elemento.remove();

            },
            3500
        );
}

function formatarMoeda(valor) {

    return Number(
        valor ?? 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function escaparHtml(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escaparAtributo(valor) {

    return escaparHtml(valor);
}

function adicionarEstiloModalSeNecessario() {

    if (
        document.getElementById(
            "admin-produtos-dynamic-style"
        )
    ) {

        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "admin-produtos-dynamic-style";

    style.textContent = `

        .modal-overlay {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.55);
        }

        .modal-produto-box {

            width:
                min(850px, 100%);

            max-height:
                90vh;

            overflow-y:
                auto;

            background:
                #fff;

            border-radius:
                14px;

            padding:
                24px;

            box-shadow:
                0 20px 60px
                rgba(0, 0, 0, 0.25);
        }

        .modal-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap:
                20px;

            margin-bottom:
                24px;
        }

        .modal-header h2 {

            margin:
                0 0 5px;
        }

        .modal-header p {

            margin:
                0;

            opacity:
                0.7;
        }

        .modal-fechar {

            border:
                0;

            background:
                transparent;

            font-size:
                30px;

            cursor:
                pointer;

            line-height:
                1;
        }

        .form-grid {

            display:
                grid;

            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );

            gap:
                16px;
        }

        .form-group {

            display:
                flex;

            flex-direction:
                column;

            gap:
                7px;
        }

        .form-group label {

            font-weight:
                600;
        }

        .form-group input,
        .form-group select {

            width:
                100%;

            box-sizing:
                border-box;

            padding:
                11px 12px;

            border:
                1px solid #d6d6d6;

            border-radius:
                8px;

            font:
                inherit;
        }

        .modal-footer {

            display:
                flex;

            justify-content:
                flex-end;

            gap:
                10px;

            margin-top:
                24px;
        }

        .btn-secondary {

            border:
                1px solid #d6d6d6;

            background:
                #fff;

            padding:
                10px 16px;

            border-radius:
                8px;

            cursor:
                pointer;
        }

        .admin-toast {

            position:
                fixed;

            right:
                24px;

            bottom:
                24px;

            z-index:
                10000;

            max-width:
                360px;

            padding:
                14px 18px;

            border-radius:
                9px;

            background:
                #222;

            color:
                #fff;

            box-shadow:
                0 8px 25px
                rgba(0, 0, 0, 0.2);
        }

        .admin-toast.erro {

            background:
                #b42318;
        }

        .admin-toast.sucesso {

            background:
                #067647;
        }

        @media (max-width: 700px) {

            .form-grid {

                grid-template-columns:
                    1fr;
            }
        }

    `;

    document.head.appendChild(
        style
    );
}