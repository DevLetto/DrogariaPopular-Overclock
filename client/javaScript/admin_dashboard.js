(function () {

    const API_BASE_URL = "http://localhost:8080/api";

    const ENDPOINTS = {
        PEDIDOS: `${API_BASE_URL}/pedido`,
        CLIENTES: `${API_BASE_URL}/cliente`,
        ESTOQUE: `${API_BASE_URL}/estoque`,
        PRODUTOS: `${API_BASE_URL}/produto`
    };

    let pedidos = [];
    let clientes = [];
    let estoques = [];
    let produtos = [];
    let estadoEndpoints = {
        pedidos: false,
        clientes: false,
        estoques: false,
        produtos: false
    };

    let periodoAtual = "7d";


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    document.addEventListener("DOMContentLoaded", function () {

        inicializar();

    });


    async function inicializar() {

        configurarEventos();

        await carregarDashboard();

    }


    // =========================================================
    // EVENTOS
    // =========================================================

    function configurarEventos() {

        const btnAtualizar =
            document.getElementById("btn-atualizar");

        if (btnAtualizar) {

            btnAtualizar.addEventListener(
                "click",
                carregarDashboard
            );

        }


        // Filtros do gráfico

        const botoesPeriodo =
            document.querySelectorAll(
                ".filter-pills .pill"
            );

        botoesPeriodo.forEach(function (botao) {

            botao.addEventListener(
                "click",
                function () {

                    botoesPeriodo.forEach(
                        function (item) {
                            item.classList.remove("active");
                        }
                    );

                    botao.classList.add("active");

                    periodoAtual =
                        botao.dataset.periodo || "7d";

                    atualizarKPIs();
                    renderizarGrafico();

                }
            );

        });


        // Ações rápidas

        const novoProduto =
            document.getElementById(
                "acao-novo-produto"
            );

        if (novoProduto) {

            novoProduto.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "admin_produtos.html";

                }
            );

        }


        const novaPromocao =
            document.getElementById(
                "acao-nova-promocao"
            );

        if (novaPromocao) {

            novaPromocao.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "admin_promocoes.html";

                }
            );

        }


        const verPedidos =
            document.getElementById(
                "acao-ver-pedidos"
            );

        if (verPedidos) {

            verPedidos.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "admin_pedidos.html";

                }
            );

        }


        const verClientes =
            document.getElementById(
                "acao-ver-clientes"
            );

        if (verClientes) {

            verClientes.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "admin_clientes.html";

                }
            );

        }

    }


    // =========================================================
    // CARREGAR DASHBOARD
    // =========================================================

    async function carregarDashboard() {

        mostrarEstadoCarregando();
        estadoEndpoints = {
            pedidos: false,
            clientes: false,
            estoques: false,
            produtos: false
        };

        const resultados =
            await Promise.allSettled([
                buscar(ENDPOINTS.PEDIDOS),
                buscar(ENDPOINTS.CLIENTES),
                buscar(ENDPOINTS.ESTOQUE),
                buscar(ENDPOINTS.PRODUTOS)
            ]);

        pedidos = resultadoOuVazio(
            resultados[0],
            "pedidos",
            estadoEndpoints
        );
        clientes = resultadoOuVazio(
            resultados[1],
            "clientes",
            estadoEndpoints
        );
        estoques = resultadoOuVazio(
            resultados[2],
            "estoques",
            estadoEndpoints
        );
        produtos = resultadoOuVazio(
            resultados[3],
            "produtos",
            estadoEndpoints
        );

        executarSeguro(atualizarKPIs);
        executarSeguro(renderizarGrafico);
        executarSeguro(renderizarPedidosRecentes);
        executarSeguro(renderizarEstoqueBaixo);

    }


    async function buscar(url) {

        const resposta =
            await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type":
                        "application/json"
                }
            });


        if (!resposta.ok) {

            throw new Error(
                `Erro HTTP ${resposta.status} ao acessar ${url}`
            );

        }


        return await resposta.json();

    }


    function resultadoOuVazio(resultado, chave, estado) {

        if (
            resultado.status === "fulfilled" &&
            Array.isArray(resultado.value)
        ) {
            estado[chave] = true;

            return resultado.value;

        }

        if (resultado.status === "fulfilled") {
            console.error(
                `Resposta inválida em ${chave}: esperado um array.`
            );
            estado[chave] = false;
        } else {
            console.error(
                "Erro em uma requisição:",
                resultado.reason
            );
            estado[chave] = false;
        }

        return [];

    }


    // =========================================================
    // KPIs
    // =========================================================

    function atualizarKPIs() {
        if (!estadoEndpoints.pedidos) {
            definirTexto("kpi-vendas-hoje", "Indisponível");
            definirTexto("kpi-pedidos-hoje", "Indisponível");
            definirTexto("kpi-ticket-medio", "Indisponível");
            definirTexto("kpi-vendas-variacao", "Falha ao carregar pedidos");
            definirTexto("kpi-pedidos-preparo", "Dados indisponíveis");
        } else {

        const hoje =
            inicioDoDia(new Date());

        const ontem =
            new Date(hoje);

        ontem.setDate(
            ontem.getDate() - 1
        );


        const pedidosHoje =
            pedidos.filter(function (pedido) {

                return mesmaData(
                    pedido.dataPedido,
                    hoje
                );

            });


        const pedidosOntem =
            pedidos.filter(function (pedido) {

                return mesmaData(
                    pedido.dataPedido,
                    ontem
                );

            });


        const pedidosHojeValidos =
            pedidosHoje.filter(
                pedidoNaoCancelado
            );


        const pedidosOntemValidos =
            pedidosOntem.filter(
                pedidoNaoCancelado
            );


        // -----------------------------------------------------
        // VENDAS HOJE
        // -----------------------------------------------------

        const vendasHoje =
            pedidosHojeValidos.reduce(
                function (total, pedido) {

                    return (
                        total +
                        numero(
                            pedido.valorTotal
                        )
                    );

                },
                0
            );


        const vendasOntem =
            pedidosOntemValidos.reduce(
                function (total, pedido) {

                    return (
                        total +
                        numero(
                            pedido.valorTotal
                        )
                    );

                },
                0
            );


        definirTexto(
            "kpi-vendas-hoje",
            formatarMoeda(vendasHoje)
        );


        const variacao =
            calcularVariacao(
                vendasHoje,
                vendasOntem
            );


        const elementoVariacao =
            document.getElementById(
                "kpi-vendas-variacao"
            );


        if (elementoVariacao) {

            elementoVariacao.textContent =
                variacao;

            elementoVariacao.classList.remove(
                "text-green"
            );


            if (
                vendasHoje > vendasOntem
            ) {

                elementoVariacao.classList.add(
                    "text-green"
                );

            }

        }


        // -----------------------------------------------------
        // PEDIDOS HOJE
        // -----------------------------------------------------

        definirTexto(
            "kpi-pedidos-hoje",
            pedidosHojeValidos.length
        );


        const pedidosPreparo =
            pedidosHojeValidos.filter(
                pedidoEmPreparo
            ).length;


        definirTexto(
            "kpi-pedidos-preparo",
            pedidosPreparo === 1
                ? "1 em preparo"
                : `${pedidosPreparo} em preparo`
        );


        // -----------------------------------------------------
        // TICKET MÉDIO
        // -----------------------------------------------------

        const ticketMedio =
            pedidosHojeValidos.length > 0
                ? vendasHoje /
                  pedidosHojeValidos.length
                : 0;


        definirTexto(
            "kpi-ticket-medio",
            formatarMoeda(ticketMedio)
        );
        }


        // -----------------------------------------------------
        // CLIENTES NOVOS
        // -----------------------------------------------------

        /*
         * ClienteResponse expõe dataCadastro como
         * uma data real LocalDate.
         */

        if (!estadoEndpoints.clientes) {
            definirTexto("kpi-clientes-novos", "Indisponível");
            definirTexto(
                "kpi-clientes-sub",
                "falha ao carregar clientes"
            );
        } else {
            const diasPeriodo =
                periodoAtual === "30d" ? 30 : 7;
            const inicio =
                new Date(inicioDoDia(new Date()));

            inicio.setDate(
                inicio.getDate() - (diasPeriodo - 1)
            );

            const clientesNovos =
                clientes.filter(function (cliente) {
                    const data =
                        converterData(
                            cliente.dataCadastro
                        );

                    return (
                        data !== 0 &&
                        data >= inicio.getTime() &&
                        data <= Date.now()
                    );
                }).length;

            definirTexto(
                "kpi-clientes-novos",
                clientesNovos
            );
            definirTexto(
                "kpi-clientes-sub",
                `cadastros nos últimos ${diasPeriodo} dias`
            );
        }

    }


    // =========================================================
    // GRÁFICO
    // =========================================================

    function renderizarGrafico() {

        const grafico =
            document.getElementById(
                "grafico-vendas"
            );


        if (!grafico) {
            return;
        }


        grafico.innerHTML = "";
        if (!estadoEndpoints.pedidos) {
            grafico.innerHTML =
                '<div style="width:100%;text-align:center;padding:40px 10px;">Dados de vendas indisponíveis</div>';
            return;
        }


        if (periodoAtual === "30d") {

            renderizarGrafico30Dias(
                grafico
            );

        } else {

            renderizarGrafico7Dias(
                grafico
            );

        }

    }


    function renderizarGrafico7Dias(grafico) {

        const hoje =
            inicioDoDia(new Date());


        const dias = [];


        for (let i = 6; i >= 0; i--) {

            const data =
                new Date(hoje);

            data.setDate(
                data.getDate() - i
            );

            dias.push(data);

        }


        const valores =
            dias.map(function (dia) {

                return calcularVendasDoDia(
                    dia
                );

            });

        if (
            valores.every(function (valor) {
                return valor === 0;
            })
        ) {
            grafico.innerHTML =
                '<div style="width:100%;text-align:center;padding:40px 10px;">Nenhuma venda no período.</div>';
            return;
        }


        const maiorValor =
            Math.max(
                ...valores,
                1
            );


        dias.forEach(
            function (dia, index) {

                const coluna =
                    document.createElement(
                        "div"
                    );

                coluna.className =
                    "bar-chart-col";


                const barra =
                    document.createElement(
                        "div"
                    );

                barra.className = "bar";


                if (
                    mesmaData(
                        dia,
                        hoje
                    )
                ) {

                    barra.classList.add(
                        "bar-hoje"
                    );

                }


                let altura =
                    (
                        valores[index] /
                        maiorValor
                    ) * 100;


                if (
                    valores[index] > 0 &&
                    altura < 8
                ) {

                    altura = 8;

                }


                barra.style.height =
                    `${altura}%`;


                const legenda =
                    document.createElement(
                        "span"
                    );


                if (
                    mesmaData(
                        dia,
                        hoje
                    )
                ) {

                    legenda.textContent =
                        "Hoje";

                } else {

                    legenda.textContent =
                        obterAbreviacaoDia(
                            dia
                        );

                }


                coluna.appendChild(
                    barra
                );

                coluna.appendChild(
                    legenda
                );

                grafico.appendChild(
                    coluna
                );

            }
        );

    }


    function renderizarGrafico30Dias(grafico) {

        const hoje =
            inicioDoDia(new Date());


        const dias = [];


        for (let i = 29; i >= 0; i--) {

            const data =
                new Date(hoje);

            data.setDate(
                data.getDate() - i
            );

            dias.push(data);

        }


        /*
         * Para 30 dias, agrupamos em 7 barras:
         *
         * 1ª semana
         * 2ª semana
         * 3ª semana
         * 4ª semana
         * últimos dias
         */

        const grupos = [];


        for (
            let inicio = 0;
            inicio < dias.length;
            inicio += 5
        ) {

            const grupo =
                dias.slice(
                    inicio,
                    inicio + 5
                );


            const valor =
                grupo.reduce(
                    function (total, dia) {

                        return (
                            total +
                            calcularVendasDoDia(
                                dia
                            )
                        );

                    },
                    0
                );


            grupos.push({
                dias: grupo,
                valor: valor
            });

        }

        if (
            grupos.every(function (grupo) {
                return grupo.valor === 0;
            })
        ) {
            grafico.innerHTML =
                '<div style="width:100%;text-align:center;padding:40px 10px;">Nenhuma venda no período.</div>';
            return;
        }

        const maiorValor =
            Math.max(
                ...grupos.map(
                    grupo => grupo.valor
                ),
                1
            );


        grupos.forEach(
            function (grupo, index) {

                const coluna =
                    document.createElement(
                        "div"
                    );

                coluna.className =
                    "bar-chart-col";


                const barra =
                    document.createElement(
                        "div"
                    );

                barra.className =
                    "bar";


                if (
                    grupo.dias.some(
                        function (dia) {

                            return mesmaData(
                                dia,
                                hoje
                            );

                        }
                    )
                ) {

                    barra.classList.add(
                        "bar-hoje"
                    );

                }


                let altura =
                    (
                        grupo.valor /
                        maiorValor
                    ) * 100;


                if (
                    grupo.valor > 0 &&
                    altura < 8
                ) {

                    altura = 8;

                }


                barra.style.height =
                    `${altura}%`;


                const legenda =
                    document.createElement(
                        "span"
                    );


                legenda.textContent =
                    `Sem ${index + 1}`;


                coluna.appendChild(
                    barra
                );

                coluna.appendChild(
                    legenda
                );

                grafico.appendChild(
                    coluna
                );

            }
        );

    }


    function calcularVendasDoDia(data) {

        return pedidos
            .filter(function (pedido) {

                return (
                    pedidoNaoCancelado(pedido) &&
                    mesmaData(
                        pedido.dataPedido,
                        data
                    )
                );

            })
            .reduce(
                function (total, pedido) {

                    return (
                        total +
                        numero(
                            pedido.valorTotal
                        )
                    );

                },
                0
            );

    }


    // =========================================================
    // PEDIDOS RECENTES
    // =========================================================

    function renderizarPedidosRecentes() {

        const tbody =
            document.getElementById(
                "pedidos-recentes-tbody"
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = "";
        if (!estadoEndpoints.pedidos) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 5;
            td.style.textAlign = "center";
            td.textContent = "Pedidos indisponíveis — falha ao carregar o endpoint.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }


        const recentes =
            [...pedidos]
                .sort(
                    function (a, b) {

                        return (
                            converterData(
                                b.dataPedido
                            ) -
                            converterData(
                                a.dataPedido
                            )
                        );

                    }
                )
                .slice(0, 5);


        if (recentes.length === 0) {

            const tr =
                document.createElement(
                    "tr"
                );


            const td =
                document.createElement(
                    "td"
                );

            td.colSpan = 5;

            td.style.textAlign =
                "center";

            td.textContent =
                "Nenhum pedido encontrado.";


            tr.appendChild(td);

            tbody.appendChild(tr);

            return;

        }


        recentes.forEach(
            function (pedido) {

                const tr =
                    document.createElement(
                        "tr"
                    );


                // Pedido

                const tdPedido =
                    document.createElement(
                        "td"
                    );

                tdPedido.textContent =
                    `#${pedido.id ?? "—"}`;

                const dataPedido =
                    converterData(
                        pedido.dataPedido
                    );

                if (dataPedido) {
                    const data =
                        document.createElement("small");
                    data.style.display = "block";
                    data.textContent =
                        formatarDataHora(
                            pedido.dataPedido
                        );
                    if (data.textContent) {
                        tdPedido.appendChild(data);
                    }
                }


                // Cliente

                const tdCliente =
                    document.createElement(
                        "td"
                    );

                /*
                 * PedidoResponse não possui
                 * informações do cliente.
                 */

                tdCliente.textContent = nomeDoCliente(pedido)


                // Entrega

                const tdEntrega =
                    document.createElement(
                        "td"
                    );

                /*
                 * PedidoResponse também não possui
                 * endereço/tipo de entrega.
                 */

                tdEntrega.textContent = textoEntrega(pedido)


                // Total

                const tdTotal =
                    document.createElement(
                        "td"
                    );

                tdTotal.textContent =
                    formatarMoeda(
                        numero(
                            pedido.valorTotal
                        )
                    );



                

                // Status

                const tdStatus =
                    document.createElement(
                        "td"
                    );


                const status =
                    normalizarStatus(
                        pedido.status
                    );


                const badge =
                    document.createElement(
                        "span"
                    );


                badge.className =
                    "status-badge";


                const classe = classeStatus(status);

                if (classe) {
                    badge.classList.add(classe);
                }


                badge.textContent =
                    textoStatus(status);


                tdStatus.appendChild(
                    badge
                );


                tr.appendChild(
                    tdPedido
                );

                tr.appendChild(
                    tdCliente
                );

                tr.appendChild(
                    tdEntrega
                );

                tr.appendChild(
                    tdTotal
                );

                tr.appendChild(
                    tdStatus
                );


                tbody.appendChild(tr);

            }
        );

    }

        function nomeDoCliente(pedido) {
        if (pedido.nomeCliente) {
            return pedido.nomeCliente;
        }

        const cliente = clientes.find(function (item) {
            return String(item.idCliente ?? item.id) === String(pedido.idCliente);
        });

        return cliente?.nome ?? cliente?.nomeCompleto ?? "—";
    }

    function textoEntrega(pedido) {
        const forma = String(pedido.formaEntrega ?? "").toLowerCase();

        if (forma.includes("retir")) return "Retirada";
        if (forma.includes("entreg")) return "Entrega";

        return "—";
    }

    // =========================================================
    // ESTOQUE BAIXO
    // =========================================================

    function renderizarEstoqueBaixo() {

        const lista =
            document.getElementById(
                "estoque-alerta-lista"
            );


        if (!lista) {
            return;
        }


        lista.innerHTML = "";
        if (!estadoEndpoints.estoques) {
            const li = document.createElement("li");
            li.className = "sem-dados";
            li.textContent = "Estoque indisponível — falha ao carregar o endpoint.";
            lista.appendChild(li);
            return;
        }


        const itens =
            estoques

                .map(function (estoque) {

                    /*
                     * EstoqueResponse real:
                     *
                     * id
                     * quantidade
                     * estoqueMinimo
                     * idProduto
                     */

                    const estoqueProdutoId =
                        estoque.idProduto ??
                        estoque.produto?.idProduto ??
                        estoque.produto?.id;

                    const produto =
                        produtos.find(
                            function (produto) {

                                return (
                                    String(
                                        produto.idProduto
                                    ) ===
                                    String(
                                        estoqueProdutoId
                                    )
                                );

                            }
                        );

                    const quantidade =
                        Number(
                            Number.isFinite(
                                Number(estoque.quantidade)
                            )
                                ? Number(estoque.quantidade)
                                : 0
                        );

                    const estoqueMinimo =
                        Number(
                            Number.isFinite(
                                Number(estoque.estoqueMinimo)
                            )
                                ? Number(estoque.estoqueMinimo)
                                : 0
                        );

                    return {

                        nome:
                            produto
                                ? produto.nomeProduto
                                : `Produto #${estoqueProdutoId ?? "—"}`,

                        quantidade,
                        estoqueMinimo,
                        status:
                            quantidade <= 0
                                ? "esgotado"
                                : quantidade <= estoqueMinimo
                                    ? "baixo"
                                    : "ativo"

                    };

                })


                .filter(function (item) {

                    return (
                        item.status !== "ativo"
                    );

                })


                .sort(function (a, b) {

                    return (
                        a.quantidade -
                        b.quantidade
                    );

                })


                .slice(0, 5);


        if (itens.length === 0) {

            const li =
                document.createElement(
                    "li"
                );


            li.className =
                "sem-dados";


            li.textContent =
                "Nenhum produto com estoque baixo.";


            lista.appendChild(li);

            return;

        }


        itens.forEach(
            function (item) {

                const li =
                    document.createElement(
                        "li"
                    );


                const nome =
                    document.createElement(
                        "span"
                    );


                nome.className =
                    "produto-nome";


                nome.textContent =
                    item.nome;


                const quantidade =
                    document.createElement(
                        "span"
                    );


                quantidade.className =
                    "produto-qtd";


                if (
                    item.quantidade <= 0
                ) {

                    quantidade.classList.add(
                        "esgotado"
                    );


                    quantidade.textContent =
                        "Esgotado";

                } else {

                    quantidade.textContent =
                        `${item.quantidade} un.`;

                }


                li.appendChild(
                    nome
                );

                li.appendChild(
                    quantidade
                );


                lista.appendChild(
                    li
                );

            }
        );

    }

    function executarSeguro(funcao) {
        try {
            funcao();
        } catch (erro) {
            console.error(`Erro em ${funcao.name}:`, erro);
        }
    }

    // =========================================================
    // STATUS
    // =========================================================

    function normalizarStatus(status) {

        if (!status) {
            return "";
        }


        return String(status)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(/[\s_-]+/g, " ");

    }


    function textoStatus(status) {

        switch (status) {

            case "a caminho":
            case "acaminho":
                return "A caminho";


            case "preparando":
            case "em preparo":
            case "empreparo":
                return "Preparando";


            case "entregue":
                return "Entregue";


            case "cancelado":
            case "cancelada":
                return "Cancelado";


            case "pendente":
                return "Pendente";


            default:
                return status
                    ? capitalizar(status)
                    : "—";

        }

    }


    function classeStatus(status) {

        switch (status) {

            case "a caminho":
            case "acaminho":
                return "status-caminho";


            case "preparando":
            case "em preparo":
            case "empreparo":
                return "status-preparando";


            case "entregue":
                return "status-entregue";


            case "cancelado":
            case "cancelada":
                return "status-cancelado";
            case "pendente":
                return "status-pendente";


            default:
                return "";

        }

    }


    function pedidoNaoCancelado(pedido) {

        const status =
            normalizarStatus(
                pedido.status
            );


        return (
            status !== "cancelado" &&
            status !== "cancelada"
        );

    }


    function pedidoEmPreparo(pedido) {

        const status =
            normalizarStatus(
                pedido.status
            );


        return (
            status === "preparando" ||
            status === "em preparo" ||
            status === "empreparo"
        );

    }


    // =========================================================
    // DATAS
    // =========================================================

    function converterData(valor) {

        if (!valor) {
            return 0;
        }

        if (
            typeof valor === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            const partes =
                valor.split("-").map(Number);
            const data =
                new Date(
                    partes[0],
                    partes[1] - 1,
                    partes[2]
                );

            if (
                data.getFullYear() !== partes[0] ||
                data.getMonth() !== partes[1] - 1 ||
                data.getDate() !== partes[2]
            ) {
                return 0;
            }

            return data.getTime();
        }

        const data =
            new Date(valor);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return 0;

        }


        return data.getTime();

    }

    function formatarDataHora(valor) {

        if (!valor) {
            return "";
        }

        const data =
            new Date(valor);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return "";
        }

        const dia =
            String(data.getDate())
                .padStart(2, "0");
        const mes =
            String(data.getMonth() + 1)
                .padStart(2, "0");
        const ano =
            data.getFullYear();
        const hora =
            String(data.getHours())
                .padStart(2, "0");
        const minuto =
            String(data.getMinutes())
                .padStart(2, "0");

        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;

    }


    function inicioDoDia(data) {

        const novaData =
            new Date(data);


        novaData.setHours(
            0,
            0,
            0,
            0
        );


        return novaData;

    }


    function mesmaData(valorOuData, dataReferencia) {

        const data =
            valorOuData instanceof Date
                ? new Date(valorOuData)
                : new Date(valorOuData);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return false;

        }


        return (
            data.getFullYear() ===
                dataReferencia.getFullYear() &&

            data.getMonth() ===
                dataReferencia.getMonth() &&

            data.getDate() ===
                dataReferencia.getDate()
        );

    }


    function obterAbreviacaoDia(data) {

        const dias = [
            "Dom",
            "Seg",
            "Ter",
            "Qua",
            "Qui",
            "Sex",
            "Sáb"
        ];


        return dias[
            data.getDay()
        ];

    }


    // =========================================================
    // FORMATAÇÃO
    // =========================================================

    function numero(valor) {

        const numeroConvertido =
            Number(valor);


        return Number.isFinite(
            numeroConvertido
        )
            ? numeroConvertido
            : 0;

    }


    function formatarMoeda(valor) {

        return new Intl.NumberFormat(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        ).format(
            numero(valor)
        );

    }


    function calcularVariacao(
        atual,
        anterior
    ) {

        if (anterior === 0) {

            if (atual === 0) {
                return "—";
            }

            return "+100% vs. ontem";

        }


        const percentual =
            (
                (
                    atual -
                    anterior
                ) /
                anterior
            ) * 100;


        const sinal =
            percentual >= 0
                ? "+"
                : "";


        return (
            `${sinal}${percentual.toFixed(1)}% vs. ontem`
        );

    }


    function capitalizar(texto) {

        if (!texto) {
            return "";
        }


        return (
            texto.charAt(0).toUpperCase() +
            texto.slice(1)
        );

    }


    // =========================================================
    // UTILITÁRIOS DE DOM
    // =========================================================

    function definirTexto(
        id,
        texto
    ) {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.textContent =
                texto;

        }

    }


    function mostrarEstadoCarregando() {
        definirTexto("kpi-vendas-hoje", "Carregando...");
        definirTexto("kpi-vendas-variacao", "Carregando...");
        definirTexto("kpi-pedidos-hoje", "Carregando...");
        definirTexto("kpi-pedidos-preparo", "Carregando...");
        definirTexto("kpi-ticket-medio", "Carregando...");
        definirTexto("kpi-clientes-novos", "—");
        definirTexto("kpi-clientes-sub", "data de cadastro não disponível");

        const tbody =
            document.getElementById(
                "pedidos-recentes-tbody"
            );


        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        style="text-align:center;"
                    >
                        Carregando pedidos...
                    </td>
                </tr>
            `;

        }


        const lista =
            document.getElementById(
                "estoque-alerta-lista"
            );


        if (lista) {

            lista.innerHTML = `
                <li class="sem-dados">
                    Carregando estoque...
                </li>
            `;

        }

    }

})();   