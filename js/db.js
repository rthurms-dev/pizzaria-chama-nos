/*
  PizzariaDB — lógica compartilhada entre pizzaria_banco.html e pizzaria_pedido.html
  Guarda o banco SQLite (sql.js) serializado no localStorage do navegador,
  para que as duas páginas leiam e escrevam no MESMO banco.
*/
const PizzariaDB = (function () {
  const KEY = "pizzaria_chama_nos_db_v2";

  function save(db) {
    const data = db.export();
    let binary = "";
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
    localStorage.setItem(KEY, btoa(binary));
  }

  function load(SQL) {
    const b64 = localStorage.getItem(KEY);
    if (!b64) return null;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new SQL.Database(bytes);
  }

  function buildSchema(db) {
    db.run(`
      CREATE TABLE Cliente (id_cliente INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, telefone TEXT, endereco TEXT);
      CREATE TABLE Funcionario (id_funcionario INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, funcao TEXT NOT NULL);
      CREATE TABLE Sabor (id_sabor INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, categoria TEXT NOT NULL, preco REAL NOT NULL);
      CREATE TABLE Ingrediente (id_ingrediente INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, peso_saquinho_padrao REAL NOT NULL, quantidade_saquinhos_estoque INTEGER NOT NULL);
      CREATE TABLE ComposicaoSabor (id_composicao INTEGER PRIMARY KEY AUTOINCREMENT, id_sabor INTEGER NOT NULL, id_ingrediente INTEGER NOT NULL, qtd_saquinhos_usados INTEGER NOT NULL);
      CREATE TABLE Pedido (id_pedido INTEGER PRIMARY KEY AUTOINCREMENT, id_cliente INTEGER NOT NULL, data_hora TEXT NOT NULL, tipo TEXT NOT NULL, status TEXT NOT NULL, valor_total REAL);
      CREATE TABLE ItemPedido (id_item INTEGER PRIMARY KEY AUTOINCREMENT, id_pedido INTEGER NOT NULL, id_sabor INTEGER NOT NULL, tamanho TEXT NOT NULL, quantidade INTEGER NOT NULL, preco_unitario REAL NOT NULL);
      CREATE TABLE Entrega (id_entrega INTEGER PRIMARY KEY AUTOINCREMENT, id_pedido INTEGER NOT NULL UNIQUE, id_funcionario INTEGER NOT NULL, horario_saida TEXT, horario_chegada TEXT, endereco_entrega TEXT);
      CREATE TABLE Pagamento (id_pagamento INTEGER PRIMARY KEY AUTOINCREMENT, id_pedido INTEGER NOT NULL UNIQUE, forma_pagamento TEXT NOT NULL, valor_pago REAL NOT NULL, data_pagamento TEXT);
    `);
  }

  // Ingredientes: [nome, peso do saquinho/porção em gramas, saquinhos em estoque]
  // 200g = ingredientes "comuns" | 120g = ingredientes "caros" (camarão, carnes nobres)
  // pesos menores (30-50g) = coberturas usadas em pouca quantidade (azeitona, orégano, ovo, granulado)
  const INGREDIENTES = [
    ["Mussarela", 200, 600], ["Calabresa", 200, 400], ["Frango", 200, 350],
    ["Presunto", 200, 300], ["Bacon", 200, 300], ["Milho", 200, 250],
    ["Ervilha", 200, 250], ["Cebola", 200, 250], ["Champignon", 200, 200],
    ["Palmito", 200, 200], ["Provolone", 200, 200], ["Parmesão", 200, 200],
    ["Tomate", 200, 200],
    ["Camarão", 120, 150], ["Carne Seca", 120, 150], ["Filé Mignon", 120, 150], ["Atum", 120, 150],
    ["Catupiry", 150, 300], ["Azeitona", 30, 300], ["Orégano", 30, 200], ["Ovo", 50, 200],
    ["Chocolate", 200, 250], ["Granulado", 30, 150], ["Leite Condensado", 150, 150],
    ["Morango", 120, 120], ["Banana", 150, 150], ["Coco Ralado", 100, 120], ["Goiabada", 150, 150],
  ];

  // Sabores: [nome, categoria, preço, [[ingrediente, qtd_saquinhos], ...]]
  const SABORES = [
    ["Calabresa", "salgada", 38.00, [["Calabresa", 2], ["Mussarela", 2], ["Cebola", 1]]],
    ["Mussarela", "salgada", 35.00, [["Mussarela", 3]]],
    ["Frango com Catupiry", "salgada", 42.00, [["Frango", 1], ["Catupiry", 2], ["Mussarela", 1]]],
    ["Portuguesa", "salgada", 44.00, [["Presunto", 1], ["Mussarela", 2], ["Ovo", 1], ["Ervilha", 1], ["Cebola", 1], ["Azeitona", 1]]],
    ["Carne Seca", "salgada", 48.00, [["Carne Seca", 2], ["Mussarela", 1], ["Cebola", 1], ["Catupiry", 1]]],
    ["Camarão", "salgada", 52.00, [["Camarão", 2], ["Mussarela", 2], ["Catupiry", 1]]],
    ["Quatro Queijos", "salgada", 46.00, [["Mussarela", 2], ["Catupiry", 1], ["Provolone", 1], ["Parmesão", 1]]],
    ["Napolitana", "salgada", 36.00, [["Mussarela", 2], ["Tomate", 1], ["Orégano", 1]]],
    ["Baiana", "salgada", 40.00, [["Calabresa", 2], ["Mussarela", 1], ["Cebola", 1]]],
    ["À Moda da Casa", "salgada", 45.00, [["Bacon", 1], ["Milho", 1], ["Ervilha", 1], ["Mussarela", 2]]],
    ["Palmito", "salgada", 44.00, [["Palmito", 2], ["Mussarela", 1]]],
    ["Atum", "salgada", 46.00, [["Atum", 1], ["Mussarela", 2], ["Cebola", 1]]],
    ["Filé Mignon com Catupiry", "salgada", 50.00, [["Filé Mignon", 2], ["Catupiry", 1], ["Mussarela", 1]]],
    ["Chocolate", "doce", 38.00, [["Chocolate", 3], ["Granulado", 1]]],
    ["Banana com Canela", "doce", 36.00, [["Banana", 3], ["Chocolate", 1]]],
    ["Prestígio", "doce", 40.00, [["Chocolate", 2], ["Coco Ralado", 1], ["Leite Condensado", 1]]],
    ["Romeu e Julieta", "doce", 38.00, [["Goiabada", 2], ["Mussarela", 2]]],
    ["Morango com Chocolate", "doce", 42.00, [["Morango", 2], ["Chocolate", 2], ["Leite Condensado", 1]]],
  ];

  const NOMES = ["Ana","Bruno","Carla","Daniel","Elaine","Felipe","Gabriela","Henrique","Isabela","João",
  "Karina","Lucas","Mariana","Nicolas","Otavio","Patricia","Rafael","Sabrina","Thiago","Vanessa",
  "Camila","Diego","Eduarda","Fabio","Giovanna","Hugo","Ingrid","Jonas","Larissa","Mateus"];
  const SOBRENOMES = ["Silva","Souza","Oliveira","Santos","Pereira","Costa","Rodrigues","Almeida","Nascimento","Lima",
  "Araujo","Fernandes","Carvalho","Gomes","Martins","Rocha","Ribeiro","Alves","Monteiro","Cardoso"];
  const RUAS = ["Rua das Flores","Av. Brasil","Rua Sete de Setembro","Rua XV de Novembro","Av. Paulista",
  "Rua dos Pinheiros","Rua Barão do Rio Branco","Av. Getúlio Vargas","Rua São João","Rua Marechal Deodoro"];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function nomeFicticio() { return `${pick(NOMES)} ${pick(SOBRENOMES)}`; }
  function telefoneFicticio() { return `(11) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`; }
  function enderecoFicticio() { return `${pick(RUAS)}, ${randInt(10, 999)}`; }
  function pad(n) { return n.toString().padStart(2, "0"); }
  function dataAleatoria() {
    const dia = randInt(1, 26), hora = randInt(18, 23), min = randInt(0, 59);
    return `2026-08-${pad(dia)} ${pad(hora)}:${pad(min)}:00`;
  }

  function lastId(db) {
    return db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  }

  function seedData(db) {
    db.run(`INSERT INTO Funcionario (nome, funcao) VALUES
      ('Marcos Silva','motoboy'), ('Renato Costa','motoboy'),
      ('Patricia Gomes','atendente'), ('Bruno Tavares','cozinheiro');`);

    INGREDIENTES.forEach(([nome, peso, qtd]) => {
      db.run(`INSERT INTO Ingrediente (nome, peso_saquinho_padrao, quantidade_saquinhos_estoque) VALUES (?,?,?);`, [nome, peso, qtd]);
    });

    const idIngrediente = {};
    const res = db.exec("SELECT id_ingrediente, nome FROM Ingrediente");
    res[0].values.forEach(([id, nome]) => { idIngrediente[nome] = id; });

    const idSabor = {};
    SABORES.forEach(([nome, categoria, preco, composicao]) => {
      db.run(`INSERT INTO Sabor (nome, categoria, preco) VALUES (?,?,?);`, [nome, categoria, preco]);
      const id = lastId(db);
      idSabor[nome] = id;
      composicao.forEach(([ingNome, qtd]) => {
        db.run(`INSERT INTO ComposicaoSabor (id_sabor, id_ingrediente, qtd_saquinhos_usados) VALUES (?,?,?);`,
          [id, idIngrediente[ingNome], qtd]);
      });
    });

    const saboresLista = SABORES.map(([nome, , preco]) => [idSabor[nome], preco]);
    const tamanhos = ["broto", "medio", "grande"];
    const formasPagamento = ["pix", "cartao", "dinheiro"];

    function criarClientePedido(tipo) {
      const nome = nomeFicticio();
      const telefone = telefoneFicticio();
      const endereco = tipo === "delivery" ? enderecoFicticio() : null;
      db.run(`INSERT INTO Cliente (nome, telefone, endereco) VALUES (?,?,?);`, [nome, telefone, endereco]);
      const idCliente = lastId(db);

      const dataHora = dataAleatoria();
      const status = Math.random() < 0.95 ? "entregue" : "cancelado";
      db.run(`INSERT INTO Pedido (id_cliente, data_hora, tipo, status, valor_total) VALUES (?,?,?,?,0);`,
        [idCliente, dataHora, tipo, status]);
      const idPedido = lastId(db);

      let total = 0;
      const nItens = randInt(1, 3);
      for (let i = 0; i < nItens; i++) {
        const [idSab, preco] = pick(saboresLista);
        const tamanho = pick(tamanhos);
        db.run(`INSERT INTO ItemPedido (id_pedido, id_sabor, tamanho, quantidade, preco_unitario) VALUES (?,?,?,1,?);`,
          [idPedido, idSab, tamanho, preco]);
        total += preco;
      }
      db.run(`UPDATE Pedido SET valor_total=? WHERE id_pedido=?;`, [total, idPedido]);

      const forma = pick(formasPagamento);
      db.run(`INSERT INTO Pagamento (id_pedido, forma_pagamento, valor_pago, data_pagamento) VALUES (?,?,?,?);`,
        [idPedido, forma, total, dataHora]);

      if (tipo === "delivery") {
        const idFunc = randInt(1, 2);
        db.run(`INSERT INTO Entrega (id_pedido, id_funcionario, horario_saida, horario_chegada, endereco_entrega) VALUES (?,?,?,?,?);`,
          [idPedido, idFunc, dataHora, dataHora, endereco]);
      }
    }

    for (let i = 0; i < 80; i++) criarClientePedido("delivery");
    for (let i = 0; i < 100; i++) criarClientePedido("retirada");

    db.run(`
      UPDATE Ingrediente SET quantidade_saquinhos_estoque = quantidade_saquinhos_estoque - (
        SELECT COALESCE(SUM(cs.qtd_saquinhos_usados * ip.quantidade),0)
        FROM ItemPedido ip
        JOIN ComposicaoSabor cs ON ip.id_sabor = cs.id_sabor
        JOIN Pedido pe ON ip.id_pedido = pe.id_pedido
        WHERE cs.id_ingrediente = Ingrediente.id_ingrediente AND pe.status='entregue'
      );
    `);
  }

  return { KEY, save, load, buildSchema, seedData, pick, randInt };
})();
