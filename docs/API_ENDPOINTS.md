# Documentação das APIs

## AgendamentoController
- POST /api/agendamento
  - Corpo esperado: AgendamentoRequest
  - Campos recebidos: LocalDateTime dataHora, Integer idCliente, Integer idServico, Integer idLoja

- GET /api/agendamento/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/agendamento/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/agendamento/loja/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- PUT /api/agendamento/{id}/cancelar
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## AuthController
- POST /api/auth/login
  - Corpo esperado: LoginRequest
  - Campos recebidos: String identificador, String senha

- POST /api/auth/cadastro
  - Corpo esperado: CadastroRequest
  - Campos recebidos: String nome, String cpf, String telefone, String email, String endereco, String senha


## CarrinhoController
- GET /api/carrinho/{idCliente}
  - Corpo esperado: nenhum
  - Parâmetros: path:idCliente

- POST /api/carrinho
  - Corpo esperado: CarrinhoRequest
  - Campos recebidos: Integer idCliente, Integer idProduto, Integer quantidade, Integer salvoParaDepois

- PUT /api/carrinho/{idCliente}/{idProduto}
  - Corpo esperado: CarrinhoRequest
  - Campos recebidos: Integer idCliente, Integer idProduto, Integer quantidade, Integer salvoParaDepois
  - Parâmetros: path:idCliente, path:idProduto

- DELETE /api/carrinho/{idCliente}/{idProduto}
  - Corpo esperado: nenhum
  - Parâmetros: path:idCliente, path:idProduto


## CategoriaController
- GET /api/categoria
  - Corpo esperado: nenhum

- GET /api/categoria/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/categoria
  - Corpo esperado: CategoriaRequest
  - Campos recebidos: String nome

- PUT /api/categoria/{id}
  - Corpo esperado: CategoriaRequest
  - Campos recebidos: String nome
  - Parâmetros: path:id

- DELETE /api/categoria/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## ClienteController
- GET /api/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- PUT /api/cliente/{id}
  - Corpo esperado: ClienteUpdateRequest
  - Campos recebidos: String nome, String email, String telefone
  - Parâmetros: path:id

- DELETE /api/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## CsrfController
- GET /api/auth/csrf
  - Corpo esperado: nenhum


## CupomController
- GET /api/cupom
  - Corpo esperado: nenhum

- GET /api/cupom/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/cupom/codigo/{codigo}
  - Corpo esperado: nenhum
  - Parâmetros: path:codigo

- POST /api/cupom
  - Corpo esperado: CupomRequest
  - Campos recebidos: String codigo, BigDecimal desconto, String regras, LocalDate validade

- PUT /api/cupom/{id}
  - Corpo esperado: CupomRequest
  - Campos recebidos: String codigo, BigDecimal desconto, String regras, LocalDate validade
  - Parâmetros: path:id

- DELETE /api/cupom/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## EnderecoController
- POST /api/endereco
  - Corpo esperado: EnderecoRequest
  - Campos recebidos: String rua, String numero, String bairro, String cidade, String estado, String cep, Integer idCliente

- GET /api/endereco/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/endereco/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- PUT /api/endereco/{id}
  - Corpo esperado: EnderecoRequest
  - Campos recebidos: String rua, String numero, String bairro, String cidade, String estado, String cep, Integer idCliente
  - Parâmetros: path:id

- DELETE /api/endereco/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## EstoqueController
- GET /api/estoque
  - Corpo esperado: nenhum

- GET /api/estoque/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/estoque
  - Corpo esperado: EstoqueRequest
  - Campos recebidos: Integer quantidade, Integer estoqueMinimo, Integer idProduto, Integer idLoja

- PUT /api/estoque/{id}
  - Corpo esperado: EstoqueRequest
  - Campos recebidos: Integer quantidade, Integer estoqueMinimo, Integer idProduto, Integer idLoja
  - Parâmetros: path:id

- DELETE /api/estoque/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## FavoritoController
- POST /api/favorito
  - Corpo esperado: FavoritoRequest
  - Campos recebidos: Integer idCliente, Integer idProduto

- GET /api/favorito/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- DELETE /api/favorito/{cliente}/{produto}
  - Corpo esperado: nenhum
  - Parâmetros: path:cliente, path:produto


## FuncionarioController
- GET /api/funcionario
  - Corpo esperado: nenhum

- GET /api/funcionario/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/funcionario
  - Corpo esperado: FuncionarioRequest
  - Campos recebidos: String nome, String email, String senha

- PUT /api/funcionario/{id}
  - Corpo esperado: FuncionarioRequest
  - Campos recebidos: String nome, String email, String senha
  - Parâmetros: path:id

- DELETE /api/funcionario/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## LogAuditoriaController
- GET /api/log-auditoria
  - Corpo esperado: nenhum

- POST /api/log-auditoria
  - Corpo esperado: LogAuditoriaRequest
  - Campos recebidos: String acao, Integer idFuncionario


## LojaController
- GET /api/loja
  - Corpo esperado: nenhum

- GET /api/loja/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/loja
  - Corpo esperado: LojaRequest
  - Campos recebidos: String nome, String telefone, String horarioFuncionamento, Float latitude, Float longitude

- PUT /api/loja/{id}
  - Corpo esperado: LojaRequest
  - Campos recebidos: String nome, String telefone, String horarioFuncionamento, Float latitude, Float longitude
  - Parâmetros: path:id

- DELETE /api/loja/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## LoteController
- GET /api/lote
  - Corpo esperado: nenhum

- GET /api/lote/{numeroLote}
  - Corpo esperado: nenhum
  - Parâmetros: path:numeroLote

- POST /api/lote
  - Corpo esperado: LoteRequest
  - Campos recebidos: String numeroLote, LocalDate dataFabricacao, LocalDate dataValidade, Integer quantidade, Integer idEstoque

- PUT /api/lote/{numeroLote}
  - Corpo esperado: LoteRequest
  - Campos recebidos: String numeroLote, LocalDate dataFabricacao, LocalDate dataValidade, Integer quantidade, Integer idEstoque
  - Parâmetros: path:numeroLote

- DELETE /api/lote/{numeroLote}
  - Corpo esperado: nenhum
  - Parâmetros: path:numeroLote


## PagamentoController
- GET /api/pagamento/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/pagamento/pedido/{idPedido}
  - Corpo esperado: nenhum
  - Parâmetros: path:idPedido

- PUT /api/pagamento/{id}/status
  - Corpo esperado: nenhum
  - Parâmetros: String, path:id


## PedidoController
- POST /api/pedido/{idCliente}
  - Corpo esperado: PedidoRequest
  - Campos recebidos: String formaEntrega, Integer idLoja, String codigoCupom, String metodoPagamento
  - Parâmetros: path:idCliente

- GET /api/pedido/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/pedido/cliente/{idCliente}
  - Corpo esperado: nenhum
  - Parâmetros: path:idCliente

- PUT /api/pedido/{id}/status
  - Corpo esperado: nenhum
  - Parâmetros: String, path:id

- PUT /api/pedido/{id}/cancelar
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## ProdutoController
- GET /api/produto/{idProduto}
  - Corpo esperado: nenhum
  - Parâmetros: path:idProduto

- GET /api/produto
  - Corpo esperado: nenhum

- GET /api/produto/categoria/{idCategoria}
  - Corpo esperado: nenhum
  - Parâmetros: path:idCategoria

- POST /api/produto
  - Corpo esperado: ProdutoRequest
  - Campos recebidos: Integer idProduto, Integer idCategoria, String nomeProduto, Double precoProduto, String imagemURL, Integer necessitaReceita, Integer medicamentoControlado

- PUT /api/produto/{idProduto}
  - Corpo esperado: ProdutoRequest
  - Campos recebidos: Integer idProduto, Integer idCategoria, String nomeProduto, Double precoProduto, String imagemURL, Integer necessitaReceita, Integer medicamentoControlado
  - Parâmetros: path:idProduto

- DELETE /api/produto/{idProduto}
  - Corpo esperado: nenhum
  - Parâmetros: path:idProduto


## PromocaoController
- GET /api/promocao
  - Corpo esperado: nenhum

- GET /api/promocao/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/promocao
  - Corpo esperado: PromocaoRequest
  - Campos recebidos: BigDecimal precoPromocional, LocalDate dataInicio, LocalDate dataFim, Integer idProduto

- PUT /api/promocao/{id}
  - Corpo esperado: PromocaoRequest
  - Campos recebidos: BigDecimal precoPromocional, LocalDate dataInicio, LocalDate dataFim, Integer idProduto
  - Parâmetros: path:id

- DELETE /api/promocao/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## ReceitaController
- POST /api/receita
  - Corpo esperado: ReceitaRequest
  - Campos recebidos: String arquivo, Integer idCliente

- GET /api/receita/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- GET /api/receita/cliente/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- PUT /api/receita/{id}/aprovar
  - Corpo esperado: nenhum
  - Parâmetros: Integer, path:id

- PUT /api/receita/{id}/rejeitar
  - Corpo esperado: nenhum
  - Parâmetros: String, path:id


## ServicoController
- GET /api/servico
  - Corpo esperado: nenhum

- GET /api/servico/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id

- POST /api/servico
  - Corpo esperado: ServicoRequest
  - Campos recebidos: String nome, String descricao, BigDecimal valor, Integer idLoja

- PUT /api/servico/{id}
  - Corpo esperado: ServicoRequest
  - Campos recebidos: String nome, String descricao, BigDecimal valor, Integer idLoja
  - Parâmetros: path:id

- DELETE /api/servico/{id}
  - Corpo esperado: nenhum
  - Parâmetros: path:id


## SolicitacaoCadastroController
- GET /api/solicitacao-cadastro
  - Corpo esperado: nenhum

- PUT /api/solicitacao-cadastro/{id}/analisar
  - Corpo esperado: nenhum
  - Parâmetros: String, path:id


