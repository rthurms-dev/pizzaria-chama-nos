Pizzaria Chama Nós — Sistema de Banco de Dados

Sistema de pedidos de uma pizzaria com banco de dados relacional rodando inteiramente no navegador, sem servidor e sem instalar nada. Trabalho de banco de dados da faculdade (Análise e Desenvolvimento de Sistemas — UNICID).

🔗 Demo: https://rthurms-dev.github.io/pizzaria-chama-nos/

O que o sistema faz
Tela do cliente (pizzaria_pedido.html) — cardápio, montagem do pedido e fechamento da compra.
Painel do administrador (pizzaria_banco.html) — acompanhamento dos pedidos, controle de estoque e console de SQL.
As duas telas ficam sincronizadas em tempo real: um pedido feito pelo cliente aparece no painel do administrador na hora, sem recarregar a página.
Modelo de dados

Banco relacional com 9 tabelas:

Tabela	Descrição
Cliente	Dados do cliente e endereço
Funcionario	Funcionários e suas funções
Sabor	Sabores, categoria e preço
Ingrediente	Ingredientes, peso do saquinho padrão e estoque
ComposicaoSabor	Relação N:N entre sabor e ingrediente
Pedido	Pedido, tipo, status e valor total
ItemPedido	Itens do pedido (sabor, tamanho, quantidade, preço)
Entrega	Entrega vinculada ao pedido e ao entregador
Pagamento	Forma de pagamento, valor pago e data

O ponto central da modelagem é a tabela ComposicaoSabor, que resolve a relação muitos-para-muitos entre sabor e ingrediente: um sabor usa vários ingredientes e um ingrediente aparece em vários sabores. É ela que permite calcular o consumo de estoque de cada pedido.

Funcionalidades técnicas
SQLite real no navegador via sql.js (WebAssembly). O banco é serializado e persistido no localStorage, então os dados continuam lá depois de fechar a aba.
Baixa automática de estoque: quando um pedido é marcado como entregue, o sistema percorre os itens, identifica os ingredientes de cada sabor pela ComposicaoSabor e desconta as quantidades usadas. Há uma tela de reposição manual para repor o estoque.
Console de SQL com consultas prontas: vendas por período, sabor mais pedido, consumo por ingrediente e formas de pagamento mais usadas. Também aceita consultas livres.
Seed de dados fictícios para o banco já nascer com clientes, pedidos e histórico, permitindo testar os relatórios sem cadastrar nada à mão.
Sincronização entre abas usando eventos do navegador, o que mantém cliente e administrador vendo o mesmo estado.
Como rodar

Não precisa de servidor, banco instalado nem build.

bash
git clone https://github.com/rthurms-dev/pizzaria-chama-nos.git
cd pizzaria-chama-nos

Abra pizzaria_pedido.html e pizzaria_banco.html no navegador (de preferência em duas abas, para ver a sincronização). Ou acesse direto pela demo publicada no GitHub Pages.

Para zerar tudo, use o botão Resetar banco no painel do administrador.

Stack

JavaScript · SQL · SQLite (sql.js / WebAssembly) · HTML5 · CSS3 · localStorage · GitHub Pages

Limitações conhecidas

Este é um protótipo acadêmico. O banco vive no localStorage de cada navegador, ou seja, os dados não são compartilhados entre máquinas ou usuários diferentes — cliente e administrador só se enxergam se estiverem no mesmo navegador. A escolha foi proposital: o objetivo do trabalho era a modelagem relacional e as consultas SQL, não a infraestrutura. Uma evolução natural seria trocar a camada de persistência por um banco PostgreSQL com API.
