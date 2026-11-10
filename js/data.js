/**
 * ============================================================================
 * PASSO SEGURO · DADOS SIMPLIFICADOS POR PRODUTO -> MARCAS/TIPOS
 * - Estrutura hierárquica simples: O usuário escolhe uma opção simples
 *   (ex: "Leite", "Feijão", "Arroz", "Pão", "Caixa") e vê as marcas e tipos.
 * ============================================================================
 */

window.GRID_COLS = 16;
window.GRID_ROWS = 12;
window.STEPS_PER_CELL = 3;

window.CELL = {
  FREE: 0,
  WALL: 1,
  SHELF: 2,
  OBSTACLE: 3
};

window.DIRS = [
  { id: "N", name: "Frente da Loja (Norte)", dx: 0, dy: -1, angle: 0 },
  { id: "E", name: "Lado Direito (Leste)", dx: 1, dy: 0, angle: 90 },
  { id: "S", name: "Entrada / Caixas (Sul)", dx: 0, dy: 1, angle: 180 },
  { id: "W", name: "Lado Esquerdo (Oeste)", dx: -1, dy: 0, angle: 270 }
];

window.SHELF_HEIGHT_DESC = {
  "baixa": "prateleira baixa (altura dos joelhos)",
  "média": "prateleira do meio (altura do peito)",
  "alta": "prateleira alta (altura dos olhos)"
};

window.ENVIRONMENTS = {
  // ==========================================================================
  // 1. SUPERMERCADO BOM PREÇO (PADRÃO)
  // ==========================================================================
  supermercado: {
    id: "supermercado",
    name: "Supermercado Bom Preço",
    subtitle: "Escolha o produto, a marca e toque em Começar",
    startPose: { x: 2, y: 10, dirIdx: 0 },
    zones: [
      { id: "z-entrada", name: "Entrada", type: CELL.FREE, x1: 1, y1: 10, x2: 3, y2: 10, color: "#19376D" },
      { id: "z-horti", name: "Hortifrúti", type: CELL.SHELF, x1: 1, y1: 4, x2: 2, y2: 8, color: "#1B5E20" },
      { id: "z-padaria", name: "Padaria", type: CELL.SHELF, x1: 1, y1: 1, x2: 5, y2: 2, color: "#8D4E1F" },
      { id: "z-acougue", name: "Açougue", type: CELL.SHELF, x1: 7, y1: 1, x2: 12, y2: 2, color: "#7F1D1D" },
      { id: "z-c1", name: "Corredor 1", type: CELL.SHELF, x1: 4, y1: 4, x2: 5, y2: 8, color: "#002A5C" },
      { id: "z-c2", name: "Corredor 2", type: CELL.SHELF, x1: 7, y1: 4, x2: 8, y2: 8, color: "#002A5C" },
      { id: "z-c3", name: "Corredor 3", type: CELL.SHELF, x1: 10, y1: 4, x2: 11, y2: 8, color: "#002A5C" },
      { id: "z-c4", name: "Corredor 4", type: CELL.SHELF, x1: 13, y1: 4, x2: 14, y2: 8, color: "#002A5C" },
      { id: "z-caixas", name: "Caixas", type: CELL.SHELF, x1: 5, y1: 10, x2: 11, y2: 10, color: "#5B2C6F" },
      { id: "z-banheiros", name: "Banheiros", type: CELL.SHELF, x1: 13, y1: 10, x2: 14, y2: 10, color: "#0E6251" }
    ],
    aisleLabels: [
      { name: "Corredor do Hortifrúti", x: 3, y1: 4, y2: 8 },
      { name: "Corredor 1 (Arroz, Feijão e Óleo)", x: 6, y1: 4, y2: 8 },
      { name: "Corredor 2 (Massas e Molhos)", x: 9, y1: 4, y2: 8 },
      { name: "Corredor 3 (Leites, Café e Bebidas)", x: 12, y1: 4, y2: 8 },
      { name: "Corredor 4 (Limpeza e Higiene)", x: 15, y1: 4, y2: 8 }
    ],
    // Grupos Simples (Botões Grandes Iniciais)
    groups: [
      { id: "leite", icon: "🥛", title: "Leite", subtitle: "Desnatado, Integral, Zero Lactose" },
      { id: "feijao", icon: "🫘", title: "Feijão", subtitle: "Carioca, Preto, Fradinho" },
      { id: "arroz", icon: "🍚", title: "Arroz", subtitle: "Branco, Parboilizado, Integral" },
      { id: "pao", icon: "🥖", title: "Pão e Padaria", subtitle: "Francês, Forma, Queijo e Frios" },
      { id: "macarrao", icon: "🍝", title: "Macarrão e Molho", subtitle: "Espaguete, Parafuso, Molhos" },
      { id: "frutas", icon: "🍌", title: "Frutas e Verduras", subtitle: "Banana, Maçã, Tomate" },
      { id: "carne", icon: "🥩", title: "Carnes e Frango", subtitle: "Bovina, Frango, Peixaria" },
      { id: "limpeza", icon: "🧼", title: "Limpeza e Higiene", subtitle: "Sabão, Detergente, Shampoo" },
      { id: "caixa", icon: "💳", title: "Caixas e Saída", subtitle: "Preferencial, Rápido, Banheiro" }
    ],
    // Marcas e Tipos dentro de cada opção simples
    items: [
      // LEITE
      {
        id: "leite-italac-desn",
        groupId: "leite",
        name: "Leite Desnatado Italac (1 Litro)",
        brand: "Italac · Caixa Azul",
        category: "Leite",
        aisle: "Corredor 3",
        side: "direita",
        height: "média",
        x: 9, y: 6, shelfX: 10, shelfY: 6,
        price: "R$ 5,19"
      },
      {
        id: "leite-ninho-int",
        groupId: "leite",
        name: "Leite Integral Ninho (1 Litro)",
        brand: "Nestlé Ninho · Tampa de Rosca",
        category: "Leite",
        aisle: "Corredor 3",
        side: "direita",
        height: "média",
        x: 9, y: 5, shelfX: 10, shelfY: 5,
        price: "R$ 6,49"
      },
      {
        id: "leite-piracanjuba-zero",
        groupId: "leite",
        name: "Leite Zero Lactose Piracanjuba (1 Litro)",
        brand: "Piracanjuba · Caixa Laranja",
        category: "Leite",
        aisle: "Corredor 3",
        side: "direita",
        height: "alta",
        x: 9, y: 4, shelfX: 10, shelfY: 4,
        price: "R$ 5,89"
      },

      // FEIJÃO
      {
        id: "feijao-kicaldo-carioca",
        groupId: "feijao",
        name: "Feijão Carioca Kicaldo (1kg)",
        brand: "Kicaldo · Tipo 1",
        category: "Feijão",
        aisle: "Corredor 1",
        side: "direita",
        height: "média",
        x: 6, y: 6, shelfX: 5, shelfY: 6,
        price: "R$ 7,89"
      },
      {
        id: "feijao-camil-preto",
        groupId: "feijao",
        name: "Feijão Preto Camil (1kg)",
        brand: "Camil · Grãos Selecionados",
        category: "Feijão",
        aisle: "Corredor 1",
        side: "direita",
        height: "baixa",
        x: 6, y: 7, shelfX: 5, shelfY: 7,
        price: "R$ 8,29"
      },
      {
        id: "feijao-turquesa-carioca",
        groupId: "feijao",
        name: "Feijão Carioca Turquesa (1kg)",
        brand: "Turquesa · Econômico",
        category: "Feijão",
        aisle: "Corredor 1",
        side: "direita",
        height: "alta",
        x: 6, y: 5, shelfX: 5, shelfY: 5,
        price: "R$ 6,99"
      },

      // ARROZ
      {
        id: "arroz-camil-branco",
        groupId: "arroz",
        name: "Arroz Branco Camil (5kg)",
        brand: "Camil · Pacote 5kg",
        category: "Arroz",
        aisle: "Corredor 1",
        side: "direita",
        height: "baixa",
        x: 6, y: 8, shelfX: 5, shelfY: 8,
        price: "R$ 26,90"
      },
      {
        id: "arroz-tiojoao-parb",
        groupId: "arroz",
        name: "Arroz Parboilizado Tio João (1kg)",
        brand: "Tio João · Pacote 1kg",
        category: "Arroz",
        aisle: "Corredor 1",
        side: "direita",
        height: "média",
        x: 6, y: 4, shelfX: 5, shelfY: 4,
        price: "R$ 6,79"
      },

      // PÃO E PADARIA
      {
        id: "pao-frances",
        groupId: "pao",
        name: "Pão Francês Quentinho (Balcão)",
        brand: "Padaria Própria · Fornada Fresca",
        category: "Pão e Padaria",
        aisle: "Padaria",
        side: "esquerda",
        height: "média",
        x: 2, y: 3, shelfX: 2, shelfY: 2,
        price: "R$ 14,90/kg"
      },
      {
        id: "pao-plusvita-forma",
        groupId: "pao",
        name: "Pão de Forma Tradicional Plusvita",
        brand: "Plusvita · Fatiado Macio",
        category: "Pão e Padaria",
        aisle: "Padaria",
        side: "esquerda",
        height: "alta",
        x: 3, y: 3, shelfX: 3, shelfY: 2,
        price: "R$ 7,99"
      },
      {
        id: "pao-queijo-mussarela",
        groupId: "pao",
        name: "Queijo Mussarela e Presunto Sadia (200g)",
        brand: "Sadia · Bandeja Fatiada",
        category: "Pão e Padaria",
        aisle: "Padaria e Frios",
        side: "esquerda",
        height: "baixa",
        x: 5, y: 3, shelfX: 5, shelfY: 2,
        price: "R$ 8,90"
      },

      // MACARRÃO E MOLHO
      {
        id: "mac-vitarella-espag",
        groupId: "macarrao",
        name: "Macarrão Espaguete Vitarella (500g)",
        brand: "Vitarella · Sêmola",
        category: "Macarrão e Molho",
        aisle: "Corredor 2",
        side: "esquerda",
        height: "média",
        x: 9, y: 5, shelfX: 8, shelfY: 5,
        price: "R$ 4,29"
      },
      {
        id: "mac-barilla-parafuso",
        groupId: "macarrao",
        name: "Macarrão Parafuso Barilla (500g)",
        brand: "Barilla · Caixa de Papelão",
        category: "Macarrão e Molho",
        aisle: "Corredor 2",
        side: "esquerda",
        height: "alta",
        x: 9, y: 4, shelfX: 8, shelfY: 4,
        price: "R$ 6,90"
      },
      {
        id: "molho-pomarola",
        groupId: "macarrao",
        name: "Molho de Tomate Tradicional Pomarola",
        brand: "Pomarola · Sachê 300g",
        category: "Macarrão e Molho",
        aisle: "Corredor 2",
        side: "esquerda",
        height: "baixa",
        x: 9, y: 7, shelfX: 8, shelfY: 7,
        price: "R$ 2,99"
      },

      // FRUTAS E VERDURAS
      {
        id: "fruta-banana-prata",
        groupId: "frutas",
        name: "Banana Prata Selecionada",
        brand: "Hortifrúti · Banca Central",
        category: "Frutas e Verduras",
        aisle: "Hortifrúti",
        side: "esquerda",
        height: "média",
        x: 3, y: 7, shelfX: 2, shelfY: 7,
        price: "R$ 6,90/kg"
      },
      {
        id: "fruta-maca-gala",
        groupId: "frutas",
        name: "Maçã Gala Nacional",
        brand: "Hortifrúti · Cesto Superior",
        category: "Frutas e Verduras",
        aisle: "Hortifrúti",
        side: "esquerda",
        height: "alta",
        x: 3, y: 6, shelfX: 2, shelfY: 6,
        price: "R$ 9,50/kg"
      },
      {
        id: "fruta-tomate-batata",
        groupId: "frutas",
        name: "Tomate, Batata e Cebola",
        brand: "Hortifrúti · Banca Baixa",
        category: "Frutas e Verduras",
        aisle: "Hortifrúti",
        side: "esquerda",
        height: "baixa",
        x: 3, y: 5, shelfX: 2, shelfY: 5,
        price: "R$ 5,49/kg"
      },

      // CARNES E FRANGO
      {
        id: "carne-bovina-acougue",
        groupId: "carne",
        name: "Carne Bovina Moída e Alcatra (Balcão)",
        brand: "Friboi · Atendimento no Açougue",
        category: "Carnes e Frango",
        aisle: "Açougue",
        side: "direita",
        height: "média",
        x: 8, y: 3, shelfX: 8, shelfY: 2,
        price: "R$ 36,90/kg"
      },
      {
        id: "carne-frango-sadia",
        groupId: "carne",
        name: "Filé de Peito de Frango Sadia (1kg)",
        brand: "Sadia · Pacote Zip Congelado",
        category: "Carnes e Frango",
        aisle: "Açougue",
        side: "direita",
        height: "baixa",
        x: 11, y: 3, shelfX: 11, shelfY: 2,
        price: "R$ 21,90"
      },

      // LIMPEZA E HIGIENE
      {
        id: "limp-omo-sabao",
        groupId: "limpeza",
        name: "Sabão Líquido Omo Lavagem Perfeita (3L)",
        brand: "Omo · Garrafa Azul com Alça",
        category: "Limpeza e Higiene",
        aisle: "Corredor 4",
        side: "direita",
        height: "baixa",
        x: 12, y: 6, shelfX: 13, shelfY: 6,
        price: "R$ 34,90"
      },
      {
        id: "limp-ype-detergente",
        groupId: "limpeza",
        name: "Detergente Neutro Ypê (500ml)",
        brand: "Ypê · Frasco Transparente",
        category: "Limpeza e Higiene",
        aisle: "Corredor 4",
        side: "direita",
        height: "média",
        x: 12, y: 5, shelfX: 13, shelfY: 5,
        price: "R$ 2,39"
      },
      {
        id: "limp-colgate-dove",
        groupId: "limpeza",
        name: "Creme Dental Colgate e Sabonete Dove",
        brand: "Colgate / Dove · Caixa com Braille",
        category: "Limpeza e Higiene",
        aisle: "Corredor 4",
        side: "direita",
        height: "alta",
        x: 12, y: 4, shelfX: 13, shelfY: 4,
        price: "R$ 6,50"
      },

      // CAIXAS E SAÍDA
      {
        id: "cx-pref",
        groupId: "caixa",
        name: "Caixa Preferencial 01 (PCD / Idosos)",
        brand: "Atendimento Prioritário com Braille",
        category: "Caixas e Saída",
        aisle: "Frente de Caixa",
        side: "esquerda",
        height: "média",
        x: 6, y: 9, shelfX: 6, shelfY: 10,
        price: "Sem Fila"
      },
      {
        id: "cx-auto",
        groupId: "caixa",
        name: "Caixa Rápido de Autoatendimento (Com Voz)",
        brand: "Self-Checkout Acessível",
        category: "Caixas e Saída",
        aisle: "Frente de Caixa",
        side: "esquerda",
        height: "média",
        x: 11, y: 9, shelfX: 11, shelfY: 10,
        price: "Rápido"
      },
      {
        id: "wc-acessivel",
        groupId: "caixa",
        name: "Banheiro Acessível e Saída",
        brand: "Adaptado com Barras e Braille",
        category: "Caixas e Saída",
        aisle: "Ala Direita",
        side: "direita",
        height: "média",
        x: 13, y: 9, shelfX: 13, shelfY: 10,
        price: "Gratuito"
      }
    ]
  },

  // ==========================================================================
  // 2. CLÍNICA LUCILO ÁVILA
  // ==========================================================================
  hospital: {
    id: "hospital",
    name: "Clínica Lucilo Ávila",
    subtitle: "Escolha o setor médico e toque em Começar",
    startPose: { x: 2, y: 10, dirIdx: 0 },
    zones: [
      { id: "h-rec", name: "Recepção", type: CELL.SHELF, x1: 4, y1: 10, x2: 8, y2: 10, color: "#1B4F72" },
      { id: "h-cons", name: "Consultórios", type: CELL.SHELF, x1: 1, y1: 4, x2: 3, y2: 8, color: "#145A32" },
      { id: "h-exames", name: "Exames", type: CELL.SHELF, x1: 6, y1: 4, x2: 9, y2: 7, color: "#4A235A" },
      { id: "h-farm", name: "Farmácia", type: CELL.SHELF, x1: 12, y1: 4, x2: 14, y2: 8, color: "#7E5109" },
      { id: "h-wc", name: "Banheiros", type: CELL.SHELF, x1: 12, y1: 10, x2: 14, y2: 10, color: "#0E6251" }
    ],
    aisleLabels: [
      { name: "Corredor de Consultórios", x: 4, y1: 4, y2: 8 },
      { name: "Corredor de Exames e Farmácia", x: 10, y1: 4, y2: 8 }
    ],
    groups: [
      { id: "h-grp-rec", icon: "🏥", title: "Recepção e Triagem", subtitle: "Ficha, Pulseira Braille" },
      { id: "h-grp-med", icon: "🩺", title: "Consultórios Médicos", subtitle: "Oftalmologia, Clínica Geral" },
      { id: "h-grp-rem", icon: "💊", title: "Farmácia e Exames", subtitle: "Retirar Remédios, Coleta de Sangue" }
    ],
    items: [
      { id: "h-triagem", groupId: "h-grp-rec", name: "Balcão de Recepção Prioritária", brand: "Triagem com Pulseira em Braille", category: "Recepção", aisle: "Entrada", side: "direita", height: "média", x: 5, y: 9, shelfX: 5, shelfY: 10, price: "Guichê 01" },
      { id: "h-oftalmo", groupId: "h-grp-med", name: "Consultório 02 - Oftalmologia", brand: "Médico de Visão e Baixa Visão", category: "Consultórios", aisle: "Corredor Oeste", side: "esquerda", height: "média", x: 4, y: 6, shelfX: 3, shelfY: 6, price: "Sala 02" },
      { id: "h-farmacia", groupId: "h-grp-rem", name: "Farmácia Gratuita (Etiquetas em Braille)", brand: "Entrega de Colírios e Medicamentos", category: "Farmácia", aisle: "Corredor Leste", side: "direita", height: "média", x: 11, y: 6, shelfX: 12, shelfY: 6, price: "Bloco C" }
    ]
  },

  // ==========================================================================
  // 3. FACULDADE SENAC RECIFE
  // ==========================================================================
  faculdade: {
    id: "faculdade",
    name: "Faculdade SENAC Recife",
    subtitle: "Escolha a sala ou setor acadêmico",
    startPose: { x: 2, y: 10, dirIdx: 0 },
    zones: [
      { id: "f-sec", name: "Secretaria", type: CELL.SHELF, x1: 4, y1: 10, x2: 8, y2: 10, color: "#1F3A60" },
      { id: "f-bib", name: "Biblioteca", type: CELL.SHELF, x1: 1, y1: 4, x2: 4, y2: 8, color: "#512E5F" },
      { id: "f-lab", name: "Laboratórios", type: CELL.SHELF, x1: 7, y1: 4, x2: 10, y2: 8, color: "#117864" },
      { id: "f-aud", name: "Auditório", type: CELL.SHELF, x1: 2, y1: 1, x2: 12, y2: 2, color: "#7D6608" }
    ],
    aisleLabels: [
      { name: "Corredor da Biblioteca", x: 5, y1: 4, y2: 8 },
      { name: "Corredor dos Laboratórios", x: 11, y1: 4, y2: 8 }
    ],
    groups: [
      { id: "f-grp-bib", icon: "📚", title: "Biblioteca e Braille", subtitle: "Acervo Braille, Audiolivros" },
      { id: "f-grp-aula", icon: "💻", title: "Salas e Laboratórios", subtitle: "Informática NVDA, Auditório" },
      { id: "f-grp-sec", icon: "🎓", title: "Secretaria do Aluno", subtitle: "Matrícula e Atendimento" }
    ],
    items: [
      { id: "f-braille", groupId: "f-grp-bib", name: "Cabine de Estudo Braille e Lupas", brand: "Biblioteca Central · Térreo", category: "Biblioteca", aisle: "Corredor Oeste", side: "esquerda", height: "média", x: 5, y: 6, shelfX: 4, shelfY: 6, price: "Livre" },
      { id: "f-labinfo", groupId: "f-grp-aula", name: "Laboratório de Informática Acessível", brand: "Computadores com NVDA e JAWS", category: "Laboratórios", aisle: "Corredor Central", side: "direita", height: "média", x: 6, y: 5, shelfX: 7, shelfY: 5, price: "Sala 104" },
      { id: "f-secretaria", groupId: "f-grp-sec", name: "Secretaria Acadêmica Prioritária", brand: "Atendimento ao Estudante", category: "Atendimento", aisle: "Entrada", side: "direita", height: "média", x: 6, y: 9, shelfX: 6, shelfY: 10, price: "Mesa 01" }
    ]
  }
};

window.NEARBY_PLACES = [
  {
    envKey: "supermercado",
    name: "Supermercado Bom Preço",
    distance: "A 40 metros (Você está aqui)",
    rating: "4.9 ★ Acessibilidade Completa",
    features: "Piso tátil, balizas sonoras nos corredores e caixas com Braille.",
    address: "Av. Conde da Boa Vista, 450 · Recife"
  },
  {
    envKey: "hospital",
    name: "Clínica Lucilo Ávila",
    distance: "A 280 metros (4 min caminhando)",
    rating: "4.8 ★ Exames de Imagem & Piso Tátil",
    features: "Triagem com pulseira Braille e atendimento prioritário guiado.",
    address: "Av. Rui Barbosa · Graças, Recife"
  },
  {
    envKey: "faculdade",
    name: "SENAC Recife",
    distance: "A 520 metros (7 min caminhando)",
    rating: "5.0 ★ Tecnologia Assistiva",
    features: "Biblioteca Braille, laboratório NVDA e apoio para cão-guia.",
    address: "Av. Visconde de Suassuna, 500 · Santo Amaro"
  }
];

window.INITIAL_COMMUNITY_POSTS = [
  {
    id: "post-1",
    author: "Mariana Silva (Cega · Usuária de Cão-Guia)",
    time: "Há 15 minutos",
    place: "Supermercado Bom Preço",
    message: "Pessoal, o Caixa Preferencial 01 do Supermercado Bom Preço está excelente! A maquininha tem teclado em Braille e o piso tátil leva direto até o corredor do arroz e feijão.",
    likes: 14
  },
  {
    id: "post-2",
    author: "Carlos Eduardo (Baixa Visão · Bengala Verde)",
    time: "Há 1 hora",
    place: "Supermercado Bom Preço",
    message: "Dica: no Corredor 3, o Leite Desnatado Italac fica na prateleira do meio, na altura do peito, lado direito. Muito fácil de pegar sozinho!",
    likes: 11
  },
  {
    id: "post-3",
    author: "Fernanda Costa (Estudante com Deficiência Visual)",
    time: "Há 3 horas",
    place: "SENAC Recife",
    message: "A Biblioteca do SENAC liberou cabines novas com linha Braille e lupas eletrônicas de alto contraste.",
    likes: 19
  }
];
