/* Dados de exemplo (fictícios) usados na primeira abertura do protótipo. */
(function () {
  'use strict';

  var STEPS = [
    { key: 'recebido', label: 'Recebido', desc: 'Veículo cadastrado na recepção' },
    { key: 'diagnostico', label: 'Diagnóstico', desc: 'Mecânico avaliando o veículo' },
    { key: 'aprovacao', label: 'Aguardando aprovação', desc: 'Orçamento enviado ao cliente' },
    { key: 'servico', label: 'Em serviço', desc: 'Peças e serviços em execução' },
    { key: 'testes', label: 'Testes finais', desc: 'Teste de rodagem e conferência' },
    { key: 'pronto', label: 'Pronto para retirada', desc: 'Pode buscar o carro' },
    { key: 'entregue', label: 'Entregue', desc: 'Serviço concluído' }
  ];

  var MECANICOS = ['Carlos', 'Diego', 'Fábio', 'Jonas', 'Marcos', 'Rafael'];
  var ELEVADORES = 5;
  var OFICINA = {
    whatsapp: '554130000000',
    endereco: 'Rua Fictícia, 100 · Curitiba/PR',
    google: 'https://www.google.com/search?q=Auto+Center+Veloz+avalia%C3%A7%C3%B5es'
  };

  function minutesAgo(m) { return Date.now() - m * 60000; }

  /* Fotos reais (Wikimedia Commons, licenças livres). Créditos em CREDITOS e no README. */
  var IMG = 'assets/img/';
  var CREDITOS = [
    { arquivo: 'hero.webp', uso: 'Capa', autor: 'Shixart1985', licenca: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Car_repair_in_an_auto_shop_with_tools_and_equipment_present_on_the_floor_and_a_partially_disassembled_vehicle_on_a_lift.jpg' },
    { arquivo: 'mecanico.webp', uso: 'Mecânico', autor: 'Shixart1985', licenca: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Car_mechanic_worker_repairing_suspension_of_lifted_automobile_at_auto_repair_garage_shop.jpg' },
    { arquivo: 'elevador.webp', uso: 'Recepção / elevador', autor: 'Shixart1985', licenca: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Car_lift_in_an_auto_repair_shop_with_vehicles_and_tools_present.jpg' },
    { arquivo: 'pastilha.webp', uso: 'Pastilha de freio', autor: 'Riley from Christchurch, New Zealand', licenca: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Alarm_bells!_(25681917701).jpg' },
    { arquivo: 'palheta.webp', uso: 'Palheta do limpador', autor: 'cogdogblog', licenca: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Or_none_at_all._My_wiper_blades_have_not_moved_in_weeks_and_are_good_at_trapping_pine_needles._(2982646061).jpg' },
    { arquivo: 'bateria.webp', uso: 'Teste de bateria', autor: 'Azorbli', licenca: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Car_battery.jpg' },
    { arquivo: 'amortecedor.webp', uso: 'Amortecedor', autor: 'Bukk', licenca: 'Domínio público', url: 'https://commons.wikimedia.org/wiki/File:Federbein_Seicento.JPG' }
  ];

  /* Item que o mecânico encontra durante o tour guiado. */
  var TOUR_ITEM = {
    desc: 'Pastilhas de freio dianteiras', valor: 260,
    obs: 'Pastilhas com 2 mm, abaixo do limite de segurança (3 mm). Trocar evita danificar o disco.',
    foto: IMG + 'pastilha.webp'
  };

  function seed() {
    return {
      version: 1,
      orders: [
        {
          id: 'OS-1039', placa: 'FRT1A22', modelo: 'Hyundai HB20 1.0 2020', cliente: 'Lucas Ferreira',
          telefone: '41999990006', elevador: null, mecanico: 'Rafael', step: 6,
          entrada: minutesAgo(1500), stepSince: minutesAgo(1100), previsao: 'Entregue',
          itens: [
            { id: 'i1', desc: 'Troca do kit de embreagem', valor: 1450, status: 'aprovado', obs: 'Disco no limite de desgaste.', foto: null }
          ],
          timeline: [
            { t: minutesAgo(1500), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(1380), msg: 'Cliente aprovou 1 item(ns) pelo app' },
            { t: minutesAgo(1100), msg: 'Veículo entregue ao cliente' }
          ],
          avaliacao: { nota: 5, comentario: 'Aprovei pelo celular no meio de uma reunião. Muito prático!', t: minutesAgo(1080) }
        },
        {
          id: 'OS-1040', placa: 'GHI5B67', modelo: 'Renault Sandero 1.6 2017', cliente: 'Camila Rocha',
          telefone: '41999990007', elevador: null, mecanico: 'Marcos', step: 6,
          entrada: minutesAgo(1400), stepSince: minutesAgo(980), previsao: 'Entregue',
          itens: [
            { id: 'i1', desc: 'Revisão 60.000 km', valor: 760, status: 'aprovado', obs: '', foto: null }
          ],
          timeline: [
            { t: minutesAgo(1400), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(980), msg: 'Veículo entregue ao cliente' }
          ],
          avaliacao: { nota: 4, comentario: 'Gostei de ver as fotos das peças antes de aprovar.', t: minutesAgo(970) }
        },
        {
          id: 'OS-1042', placa: 'BRA2E19', modelo: 'VW Gol 1.0 2019', cliente: 'Mariana Souza',
          telefone: '41999990001', elevador: 1, mecanico: 'Carlos', step: 2,
          entrada: minutesAgo(210), stepSince: minutesAgo(95), previsao: 'Hoje, 17h30',
          itens: [
            { id: 'i1', desc: 'Troca de óleo e filtro', valor: 189.9, status: 'aprovado', obs: 'Revisão preventiva solicitada na entrada.', foto: null },
            { id: 'i2', desc: 'Pastilhas de freio dianteiras', valor: 260, status: 'pendente', obs: 'Pastilhas com 2 mm, abaixo do limite de segurança (3 mm). Trocar evita danificar o disco.', foto: IMG + 'pastilha.webp' },
            { id: 'i3', desc: 'Palheta do limpador', valor: 79.9, status: 'pendente', obs: 'Borracha ressecada, deixa marcas no vidro. Opcional.', foto: IMG + 'palheta.webp' }
          ],
          timeline: [
            { t: minutesAgo(210), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(180), msg: 'Carlos iniciou o diagnóstico no elevador 1' },
            { t: minutesAgo(95), msg: 'Orçamento enviado para aprovação (2 itens novos)' }
          ]
        },
        {
          id: 'OS-1043', placa: 'QTX4B21', modelo: 'Fiat Argo 1.3 2021', cliente: 'Paulo Henrique Lima',
          telefone: '41999990002', elevador: 2, mecanico: 'Diego', step: 3,
          entrada: minutesAgo(300), stepSince: minutesAgo(60), previsao: 'Hoje, 16h00',
          itens: [
            { id: 'i1', desc: 'Alinhamento e balanceamento', valor: 150, status: 'aprovado', obs: '', foto: null },
            { id: 'i2', desc: 'Amortecedores traseiros (par)', valor: 890, status: 'aprovado', obs: 'Vazamento de óleo no amortecedor esquerdo.', foto: IMG + 'amortecedor.webp' }
          ],
          timeline: [
            { t: minutesAgo(300), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(240), msg: 'Diego iniciou o diagnóstico no elevador 2' },
            { t: minutesAgo(150), msg: 'Orçamento enviado para aprovação' },
            { t: minutesAgo(62), msg: 'Cliente aprovou 2 itens pelo app' },
            { t: minutesAgo(60), msg: 'Serviço iniciado' }
          ]
        },
        {
          id: 'OS-1044', placa: 'RHN7C33', modelo: 'Toyota Corolla 2.0 2020', cliente: 'Ana Beatriz Costa',
          telefone: '41999990003', elevador: 3, mecanico: 'Fábio', step: 5,
          entrada: minutesAgo(420), stepSince: minutesAgo(25), previsao: 'Pronto',
          itens: [
            { id: 'i1', desc: 'Revisão 40.000 km', valor: 980, status: 'aprovado', obs: '', foto: null },
            { id: 'i2', desc: 'Filtro de ar-condicionado', valor: 95, status: 'aprovado', obs: 'Filtro saturado.', foto: null },
            { id: 'i3', desc: 'Higienização do ar-condicionado', valor: 120, status: 'recusado', obs: 'Opcional.', foto: null }
          ],
          timeline: [
            { t: minutesAgo(420), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(380), msg: 'Fábio iniciou o diagnóstico no elevador 3' },
            { t: minutesAgo(330), msg: 'Orçamento enviado para aprovação' },
            { t: minutesAgo(318), msg: 'Cliente aprovou 2 itens e recusou 1 pelo app' },
            { t: minutesAgo(70), msg: 'Testes finais concluídos' },
            { t: minutesAgo(25), msg: 'Veículo pronto para retirada' }
          ]
        },
        {
          id: 'OS-1045', placa: 'MXZ0D45', modelo: 'Honda HR-V 1.8 2018', cliente: 'Roberto Alves',
          telefone: '41999990004', elevador: 4, mecanico: 'Jonas', step: 1,
          entrada: minutesAgo(40), stepSince: minutesAgo(30), previsao: 'Amanhã, 12h00',
          itens: [
            { id: 'i1', desc: 'Diagnóstico de ruído na suspensão', valor: 0, status: 'aprovado', obs: 'Sem custo.', foto: null }
          ],
          timeline: [
            { t: minutesAgo(40), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(30), msg: 'Jonas iniciou o diagnóstico no elevador 4' }
          ]
        },
        {
          id: 'OS-1046', placa: 'KLB3F88', modelo: 'Chevrolet Onix 1.0 2022', cliente: 'Juliana Martins',
          telefone: '41999990005', elevador: null, mecanico: 'Marcos', step: 2,
          entrada: minutesAgo(260), stepSince: minutesAgo(185), previsao: 'A definir',
          itens: [
            { id: 'i1', desc: 'Bateria 60 Ah', valor: 520, status: 'pendente', obs: 'Teste de carga reprovado (9,8 V na partida).', foto: IMG + 'bateria.webp' }
          ],
          timeline: [
            { t: minutesAgo(260), msg: 'Veículo recebido pela recepção' },
            { t: minutesAgo(230), msg: 'Marcos iniciou o diagnóstico' },
            { t: minutesAgo(185), msg: 'Orçamento enviado para aprovação. Veículo liberou o elevador e aguarda no pátio' }
          ]
        }
      ]
    };
  }

  /* Cenário do tour: o Gol da Mariana ainda em diagnóstico, sem itens extras. */
  function tourScenario(state) {
    var o = state.orders.filter(function (x) { return x.id === 'OS-1042'; })[0];
    o.step = 1; o.stepSince = minutesAgo(20); o.elevador = 1; o.previsao = 'Hoje, 17h30';
    o.itens = [{ id: 'i1', desc: 'Troca de óleo e filtro', valor: 189.9, status: 'aprovado', obs: 'Revisão preventiva solicitada na entrada.', foto: null }];
    o.timeline = [
      { t: minutesAgo(120), msg: 'Veículo recebido pela recepção. Link enviado por WhatsApp' },
      { t: minutesAgo(20), msg: 'Carlos iniciou o diagnóstico no elevador 1' }
    ];
    delete o.avaliacao;
    return state;
  }

  window.VELOZ_DATA = { STEPS: STEPS, MECANICOS: MECANICOS, ELEVADORES: ELEVADORES, OFICINA: OFICINA, seed: seed,
    IMG: IMG, CREDITOS: CREDITOS, TOUR_ITEM: TOUR_ITEM, tourScenario: tourScenario };
})();
