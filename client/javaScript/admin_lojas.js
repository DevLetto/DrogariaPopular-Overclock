const API_LOJA = "http://localhost:8080/api/loja";

let lojas = [];
let lojaEditando = null;


// ==========================================
// ELEMENTOS
// ==========================================

const tabelaLojas = document.getElementById("tabelaLojas");

const btnNovaLoja = document.getElementById("btnNovaLoja");

const modalLoja = document.getElementById("modalLoja");

const btnFecharModal = document.getElementById("btnFecharModal");

const btnCancelar = document.getElementById("btnCancelar");

const formLoja = document.getElementById("formLoja");

const tituloModal = document.getElementById("tituloModal");

const nomeLoja = document.getElementById("nomeLoja");

const telefoneLoja = document.getElementById("telefoneLoja");

const horarioLoja = document.getElementById("horarioLoja");

const latitudeLoja = document.getElementById("latitudeLoja");

const longitudeLoja = document.getElementById("longitudeLoja");


// ==========================================
// CARREGAR LOJAS
// ==========================================

async function carregarLojas() {

    try {

        const resposta = await fetch(API_LOJA);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar lojas.");
        }

        lojas = await resposta.json();

        renderizarLojas();

    } catch (erro) {

        console.error("Erro:", erro);

        tabelaLojas.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align: center;"
                >
                    Não foi possível carregar as lojas.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// RENDERIZAR LOJAS
// ==========================================

function renderizarLojas() {

    tabelaLojas.innerHTML = "";


    if (lojas.length === 0) {

        tabelaLojas.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align: center;"
                >
                    Nenhuma loja cadastrada.
                </td>
            </tr>
        `;

        return;
    }


    lojas.forEach(loja => {

        const linha = document.createElement("tr");


        const localizacao =
            loja.latitude != null && loja.longitude != null
                ? `${loja.latitude}, ${loja.longitude}`
                : "Não informada";


        linha.innerHTML = `

            <td>
                <strong>
                    ${escaparHTML(loja.nome || "-")}
                </strong>
            </td>


            <td>
                ${escaparHTML(loja.telefone || "-")}
            </td>


            <td>
                ${escaparHTML(
                    loja.horarioFuncionamento || "-"
                )}
            </td>


            <td>
                ${escaparHTML(localizacao)}
            </td>


            <td class="action-cell">

                <button
                    type="button"
                    class="btn-icon"
                    title="Editar"
                    onclick="abrirEdicao(${loja.id})"
                >

                    <img
                        src="../img/edicao_icon.png"
                        alt="Editar"
                    >

                </button>


                <button
                    type="button"
                    class="btn-icon btn-excluir"
                    title="Excluir"
                    onclick="excluirLoja(${loja.id})"
                >

                    🗑️

                </button>

            </td>

        `;


        tabelaLojas.appendChild(linha);

    });
}


// ==========================================
// ABRIR MODAL - NOVA LOJA
// ==========================================

btnNovaLoja.addEventListener(
    "click",
    abrirNovaLoja
);


function abrirNovaLoja() {

    lojaEditando = null;

    tituloModal.textContent = "Nova loja";

    formLoja.reset();

    modalLoja.style.display = "flex";

    nomeLoja.focus();
}


// ==========================================
// ABRIR MODAL - EDITAR
// ==========================================

function abrirEdicao(id) {

    const loja = lojas.find(
        loja => loja.id === id
    );


    if (!loja) {
        return;
    }


    lojaEditando = id;


    tituloModal.textContent = "Editar loja";


    nomeLoja.value =
        loja.nome || "";


    telefoneLoja.value =
        loja.telefone || "";


    horarioLoja.value =
        loja.horarioFuncionamento || "";


    latitudeLoja.value =
        loja.latitude ?? "";


    longitudeLoja.value =
        loja.longitude ?? "";


    modalLoja.style.display = "flex";

    nomeLoja.focus();
}


// ==========================================
// FECHAR MODAL
// ==========================================

function fecharModal() {

    modalLoja.style.display = "none";

    lojaEditando = null;

    formLoja.reset();
}


btnFecharModal.addEventListener(
    "click",
    fecharModal
);


btnCancelar.addEventListener(
    "click",
    fecharModal
);


// Fechar clicando fora do modal

modalLoja.addEventListener(
    "click",
    function (evento) {

        if (evento.target === modalLoja) {
            fecharModal();
        }

    }
);


// ==========================================
// SALVAR / ATUALIZAR
// ==========================================

formLoja.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const dados = {

            nome: nomeLoja.value.trim(),

            telefone: telefoneLoja.value.trim(),

            horarioFuncionamento:
                horarioLoja.value.trim(),

            latitude:
                latitudeLoja.value.trim() === ""
                    ? null
                    : Number(latitudeLoja.value),

            longitude:
                longitudeLoja.value.trim() === ""
                    ? null
                    : Number(longitudeLoja.value)

        };


        if (!dados.nome) {

            alert(
                "Informe o nome da loja."
            );

            nomeLoja.focus();

            return;
        }


        try {

            let resposta;


            // ==============================
            // ATUALIZAR
            // ==============================

            if (lojaEditando !== null) {

                resposta = await fetch(
                    `${API_LOJA}/${lojaEditando}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(dados)
                    }
                );

            }

            // ==============================
            // CRIAR
            // ==============================

            else {

                resposta = await fetch(
                    API_LOJA,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(dados)
                    }
                );

            }


            if (!resposta.ok) {

                const erro = await resposta.text();

                console.error(
                    "Erro da API:",
                    erro
                );

                throw new Error(
                    lojaEditando !== null
                        ? "Não foi possível atualizar a loja."
                        : "Não foi possível cadastrar a loja."
                );
            }


            fecharModal();

            await carregarLojas();


            alert(
                lojaEditando !== null
                    ? "Loja atualizada com sucesso!"
                    : "Loja cadastrada com sucesso!"
            );


        } catch (erro) {

            console.error(
                "Erro:",
                erro
            );

            alert(
                erro.message
            );
        }

    }
);


// ==========================================
// EXCLUIR LOJA
// ==========================================

async function excluirLoja(id) {

    const loja = lojas.find(
        loja => loja.id === id
    );


    if (!loja) {
        return;
    }


    const confirmar = confirm(
        `Deseja realmente excluir a loja "${loja.nome}"?`
    );


    if (!confirmar) {
        return;
    }


    try {

        const resposta = await fetch(
            `${API_LOJA}/${id}`,
            {
                method: "DELETE"
            }
        );


        if (!resposta.ok) {

            const erro = await resposta.text();

            console.error(
                "Erro da API:",
                erro
            );

            throw new Error(
                "Não foi possível excluir a loja."
            );
        }


        await carregarLojas();


        alert(
            "Loja excluída com sucesso!"
        );


    } catch (erro) {

        console.error(
            "Erro:",
            erro
        );

        alert(
            erro.message
        );
    }
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

carregarLojas();