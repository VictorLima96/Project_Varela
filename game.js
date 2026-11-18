// ========================================================
// VARELONG - LÓGICA DO JOGO (ESTADO, FÍSICA E CONTROLES)
// ========================================================

const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");

let estado = "menu"; // "menu", "escolha_inicial", "jogando", "escolhendo", "gameover", "vitoria"
let pausado = false;

const dadosBosses = [
  { nome: "Free Fire", velocidade: 255, altura: 88, corTema: "#ff8c00" },
  { nome: "Freddy Fazbear", velocidade: 320, altura: 90, corTema: "#8b4513" }
];

let bossAtualIndex = 0;
let vidasVarela = 3;
const MAX_VIDAS_VARELA = 3;
let vidasBoss = 4;
const MAX_VIDAS_BOSS = 4;

const varela = {
  x: 25,
  y: 215,
  largura: 32,
  alturaPadrao: 95,
  altura: 95,
  velocidadePadrao: 380,
  velocidade: 380,
  mortoTimer: 0,
  desestabilizadoTimer: 0,
  dashCooldown: 0,
  socoCooldown: 0,
  socoAtivoTimer: 0,
  shieldCooldown: 0,
  shieldAtivoTimer: 0,
  flashDano: 0
};

const boss = { x: 803, y: 215, largura: 32, altura: 95, velocidade: 200, mortoTimer: 0, congeladoTimer: 0, barreiraGeloTimer: 0, cooldownHab1: 4.0, cooldownHab2: 7.0, flashDano: 0 };

const bola = { x: 430, y: 260, raio: 10, velocidadeBase: 310, velX: 310, velY: 140, superSoco: false, thugLifeFogo: false };

let tempoSaque = 0;
let tirosFreeFire = [];
let miniFreddies = [];
let cooldownLevaFreddies = 6.0;
let freddy2Timer = 0;
let acertosFreddles = 0;
let golpesConsecutivos = 0;
let jumpscareTimer = 0;
let gatosAliados = [];

let proximaFalaVarela = 9;
let proximaFalaBoss = 13;

const powerUpMapa = {
  ativo: false,
  x: 430,
  y: 260,
  raio: 24,
  tipo: "",
  tempoParaSpawn: 15.0,
  balanco: 0
};

let powerUpsVarela = [];
let cartasParaEscolha = [];

const colideAABB = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const limitarY = (entidade) => {
  entidade.y = Math.max(0, Math.min(canvas.height - entidade.altura, entidade.y));
};

// ========================================================
// POWER-UPS (ROGUELIKE)
// ========================================================

const todosPowerUps = [
  { id: "varela_rapido", nome: "Varela Turbo", descricao: "Sua velocidade aumenta permanentemente em +40%.", corBorda: "#00ffea", aplicar() { varela.velocidadePadrao *= 1.4; varela.velocidade = varela.velocidadePadrao; } },
  { id: "soco_forte", nome: "Super Soco [ESPAÇO]", descricao: "Aperte ESPAÇO para ativar super soco flamejante (10s recarga).", corBorda: "#ff3b30", aplicar() {} },
  { id: "inimigo_menor", nome: "Inimigo Nanico", descricao: "A raquete do Boss encolhe 35%, facilitando furar a defesa.", corBorda: "#ff007f", aplicar() { boss.altura *= 0.65; } },
  { id: "varela_dash", nome: "Dash Relâmpago", descricao: "Toque duas vezes rápido W ou S (ou Setas) para dar um dash veloz!", corBorda: "#ffcc00", aplicar() {} },
  { id: "shield_gol", nome: "Barreira de Escudo [E]", descricao: "Aperte E para erguer uma barreira no seu gol por 4s (20s recarga).", corBorda: "#af52de", aplicar() {} },
  { id: "exercito_gatos", nome: "Exército de Gatos 🐱", descricao: "Invoca 2 gatos soldados no meio da quadra que rebatem a bola pro Boss!", corBorda: "#34c759", aplicar() { gatosAliados = [{ x: 260, y: 150, largura: 36, altura: 44, velY: 80, direcao: 1 }, { x: 260, y: 340, largura: 36, altura: 44, velY: 80, direcao: -1 }]; } },
  { id: "thug_life", nome: "Thug Life Crítico 🕶️", descricao: "Rebater na ponta da raquete solta um smash crítico supersônico!", corBorda: "#ffd700", aplicar() {} }
];

const temPowerUp = (id) => powerUpsVarela.some(p => p.id === id);

function sortearCartasEscolha() {
  let disponiveis = todosPowerUps.filter(p => !temPowerUp(p.id));
  if (!disponiveis.length) disponiveis = [...todosPowerUps];
  cartasParaEscolha = disponiveis.sort(() => Math.random() - 0.5).slice(0, 3);
}

function prepararEscolhaInicial() {
  cartasParaEscolha = [todosPowerUps[0], todosPowerUps[1], todosPowerUps[3]];
  estado = "escolha_inicial";
  sincronizarMusica();
}

function escolherPowerUp(idx) {
  const escolhida = cartasParaEscolha[idx];
  if (!escolhida) return;

  powerUpsVarela.push(escolhida);
  escolhida.aplicar();

  if (estado === "escolha_inicial") {
    iniciarBatalhaBoss();
  } else {
    bossAtualIndex++;
    if (bossAtualIndex >= dadosBosses.length) { estado = "vitoria"; sincronizarMusica(); }
    else iniciarBatalhaBoss();
  }
}

// ========================================================
// CONTROLES (TECLADO E MOUSE)
// ========================================================

const teclas = {};
let mouseX = 0;
let mouseY = 0;
let ultimoToqueCima = 0;
let ultimoToqueBaixo = 0;
let wAbaixada = false;
let sAbaixada = false;
let ultimoTempo = performance.now();

const botaoJogar = document.getElementById("btn-play");
botaoJogar.addEventListener("click", () => {
  if (estado === "menu") prepararEscolhaInicial();
});

const botaoRecomecar = document.getElementById("btn-restart");
botaoRecomecar.addEventListener("click", () => {
  reiniciarJogoCompleto();
});

function ativarShield() {
  if (temPowerUp("shield_gol") && varela.shieldCooldown <= 0 && varela.mortoTimer <= 0) {
    varela.shieldAtivoTimer = 4.0;
    varela.shieldCooldown = 20.0;
  }
}

function executarDash(deltaY) {
  varela.y += deltaY;
  limitarY(varela);
  varela.dashCooldown = 1.8;
}

window.addEventListener("load", sincronizarMusica);
window.addEventListener("pointerdown", sincronizarMusica);

canvas.addEventListener("mousemove", (e) => {
  const ret = canvas.getBoundingClientRect();
  mouseX = (e.clientX - ret.left) * canvas.width / ret.width;
  mouseY = (e.clientY - ret.top) * canvas.height / ret.height;
});

window.addEventListener("keydown", (e) => {
  sincronizarMusica();
  if (e.repeat) return;
  teclas[e.key] = true;

  if (e.code === "Space") {
    if (estado === "menu") return prepararEscolhaInicial();
    if (estado === "gameover" || estado === "vitoria") return reiniciarJogoCompleto();

    if (estado === "jogando") {
      if (miniFreddies.some(m => m.grudado)) {
        miniFreddies = miniFreddies.filter(m => !m.grudado);
      }

      if (temPowerUp("soco_forte") && varela.socoCooldown <= 0 && varela.mortoTimer <= 0) {
        varela.socoAtivoTimer = 2.5;
        varela.socoCooldown = 10.0;
      } else if (!temPowerUp("soco_forte")) {
        ativarShield();
      }
    }
  }

  if ((e.key === "e" || e.key === "E") && estado === "jogando") ativarShield();

  if (e.key === "m" || e.key === "M") {
    somLigado = !somLigado;
    pararTodosAudios();
    sincronizarMusica();
  }

  if ((e.key === "p" || e.key === "P") && estado === "jogando") pausado = !pausado;

  if (temPowerUp("varela_dash") && estado === "jogando" && varela.dashCooldown <= 0 && varela.mortoTimer <= 0) {
    const agora = performance.now();
    if ((e.key === "w" || e.key === "W" || e.key === "ArrowUp") && !wAbaixada) {
      if (agora - ultimoToqueCima < 360) executarDash(-120);
      ultimoToqueCima = agora;
      wAbaixada = true;
    }
    if ((e.key === "s" || e.key === "S" || e.key === "ArrowDown") && !sAbaixada) {
      if (agora - ultimoToqueBaixo < 360) executarDash(120);
      ultimoToqueBaixo = agora;
      sAbaixada = true;
    }
  }

  if (estado === "escolhendo" || estado === "escolha_inicial") {
    if (e.key === "1") escolherPowerUp(0);
    if (e.key === "2") escolherPowerUp(1);
    if (e.key === "3") escolherPowerUp(2);
  }
});

window.addEventListener("keyup", (e) => {
  teclas[e.key] = false;
  if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") wAbaixada = false;
  if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") sAbaixada = false;
});

canvas.addEventListener("click", (e) => {
  sincronizarMusica();
  if (estado === "menu") return;
  if (estado !== "escolhendo" && estado !== "escolha_inicial") return;

  const ret = canvas.getBoundingClientRect();
  mouseX = (e.clientX - ret.left) * canvas.width / ret.width;
  mouseY = (e.clientY - ret.top) * canvas.height / ret.height;
  const larguraCarta = 210, espaco = 25, yBase = 135, alturaCarta = 265;
  const inicioX = (canvas.width - (3 * larguraCarta + 2 * espaco)) / 2;
  for (let i = 0; i < cartasParaEscolha.length; i++) {
    const x = inicioX + i * (larguraCarta + espaco);
    if (mouseX >= x && mouseX <= x + larguraCarta && mouseY >= yBase && mouseY <= yBase + alturaCarta) {
      escolherPowerUp(i);
      break;
    }
  }
});

// ========================================================
// ATUALIZAÇÃO DA LÓGICA E FÍSICA
// ========================================================

function reiniciarJogoCompleto() {
  bossAtualIndex = 0;
  powerUpsVarela = [];
  varela.velocidadePadrao = 380;
  varela.velocidade = 380;
  varela.altura = varela.alturaPadrao;
  gatosAliados = [];
  prepararEscolhaInicial();
}

function iniciarBatalhaBoss() {
  vidasVarela = MAX_VIDAS_VARELA;
  vidasBoss = MAX_VIDAS_BOSS;
  pausado = false;

  const dados = dadosBosses[bossAtualIndex];
  Object.assign(boss, {
    velocidade: dados.velocidade,
    altura: temPowerUp("inimigo_menor") ? dados.altura * 0.65 : dados.altura,
    mortoTimer: 0,
    congeladoTimer: 0,
    barreiraGeloTimer: 0,
    cooldownHab1: 4.0,
    cooldownHab2: 7.0
  });

  Object.assign(varela, {
    mortoTimer: 0,
    desestabilizadoTimer: 0,
    socoCooldown: 0,
    socoAtivoTimer: 0,
    shieldCooldown: 0,
    shieldAtivoTimer: 0,
    dashCooldown: 0
  });

  tirosFreeFire = [];
  miniFreddies = [];
  jumpscareTimer = 0;
  cooldownLevaFreddies = 6.0;
  freddy2Timer = 0;
  acertosFreddles = 0;
  golpesConsecutivos = 0;
  powerUpMapa.ativo = false;
  powerUpMapa.tempoParaSpawn = 15.0;

  proximaFalaVarela = 4 + Math.random() * 5;
  proximaFalaBoss = 3 + Math.random() * 5;

  resetarBola(1);
  estado = "jogando";
  sincronizarMusica();
}

function resetarBola(direcao = 1) {
  bola.x = canvas.width / 2;
  bola.y = canvas.height / 2;
  bola.superSoco = false;
  bola.thugLifeFogo = false;
  tempoSaque = 0.6;
  bola.velX = bola.velocidadeBase * direcao;
  bola.velY = (Math.random() * 140 - 70) || 50;
}

function atualizar(dt) {
  if (estado !== "jogando" || pausado) return;

  // Falas periódicas
  proximaFalaVarela -= dt;
  proximaFalaBoss -= dt;
  if (proximaFalaVarela <= 0 && varela.mortoTimer <= 0) {
    tocarAudioAleatorio(falasVarela);
    proximaFalaVarela = 11 + Math.random() * 12;
  }
  if (proximaFalaBoss <= 0 && boss.mortoTimer <= 0) {
    tocarAudioAleatorio(falasBosses[bossAtualIndex]);
    proximaFalaBoss = 13 + Math.random() * 14;
  }

  // Decremento de timers
  const dec = (obj, keys) => keys.forEach(k => { if (obj[k] > 0) obj[k] = Math.max(0, obj[k] - dt); });
  dec(varela, ["flashDano", "socoCooldown", "socoAtivoTimer", "shieldCooldown", "shieldAtivoTimer", "dashCooldown", "mortoTimer", "desestabilizadoTimer"]);
  dec(boss, ["flashDano", "mortoTimer", "congeladoTimer", "barreiraGeloTimer"]);
  if (jumpscareTimer > 0) jumpscareTimer = Math.max(0, jumpscareTimer - dt);
  if (freddy2Timer > 0) freddy2Timer = Math.max(0, freddy2Timer - dt);

  varela.velocidade = varela.velocidadePadrao;
  const dirMov = varela.desestabilizadoTimer > 0 ? -1 : 1;

  // Movimento do Varela
  if (varela.mortoTimer <= 0 && jumpscareTimer <= 0) {
    if (teclas["w"] || teclas["W"] || teclas["ArrowUp"]) varela.y -= varela.velocidade * dirMov * dt;
    if (teclas["s"] || teclas["S"] || teclas["ArrowDown"]) varela.y += varela.velocidade * dirMov * dt;
    if (varela.desestabilizadoTimer > 0) varela.y += (Math.random() - 0.5) * 6;
    limitarY(varela);
  }

  // IA e Habilidades do Boss
  boss.cooldownHab1 -= dt;
  boss.cooldownHab2 -= dt;

  if (boss.mortoTimer <= 0 && boss.congeladoTimer <= 0) {
    const diff = bola.y - (boss.y + boss.altura / 2);
    if (Math.abs(diff) > 14) boss.y += Math.sign(diff) * boss.velocidade * dt;
    limitarY(boss);

    if (bossAtualIndex === 0) {
      if (boss.cooldownHab1 <= 0) {
        boss.barreiraGeloTimer = 3.0;
        boss.cooldownHab1 = 10.0;
        tocarFala(somFF2);
      }
      if (boss.cooldownHab2 <= 0) {
        [20, boss.altura - 20].forEach((offset, idx) => {
          const alvoY = idx === 0 ? varela.y + 25 : varela.y + varela.altura - 25;
          tirosFreeFire.push({
            x: boss.x - 20,
            y: boss.y + offset,
            velX: -360,
            velY: (alvoY - (boss.y + offset)) * 0.65,
            raio: 6
          });
        });
        boss.cooldownHab2 = 9.5;
        tocarAudio(somTiroFF);
      }
    } else if (bossAtualIndex === 1) {
      if (boss.cooldownHab1 <= 0) {
        varela.desestabilizadoTimer = 4.0;
        boss.cooldownHab1 = 10.0;
      }
      cooldownLevaFreddies -= dt;
      if (cooldownLevaFreddies <= 0) {
        for (let i = 0; i < 3; i++) {
          miniFreddies.push({
            x: boss.x - 30,
            y: 80 + i * (canvas.height - 160) / 2,
            velX: -130,
            grudado: false,
            offsetY: 0
          });
        }
        cooldownLevaFreddies = 16.0;
        freddy2Timer = 16.0;
        acertosFreddles = 0;
        tocarFredito();
        tocarFala(somFreddy2);
      }
    }
  }

  const boxVarela = { x: varela.x, y: varela.y, w: varela.largura, h: varela.altura };

  // Tiros Free Fire
  tirosFreeFire = tirosFreeFire.filter(t => {
    t.x += t.velX * dt;
    t.y += t.velY * dt;
    if (colideAABB({ x: t.x - t.raio, y: t.y - t.raio, w: t.raio * 2, h: t.raio * 2 }, boxVarela)) {
      varela.mortoTimer = 3.0;
      golpesConsecutivos++;
      return false;
    }
    if (t.x < -50) golpesConsecutivos = 0;
    return t.x >= -50;
  });

  // Mini Freddies
  let freddiesGrudados = 0;
  miniFreddies = miniFreddies.filter(mf => {
    if (!mf.grudado) {
      mf.x += mf.velX * dt;
      mf.y += Math.sign((varela.y + varela.altura / 2) - mf.y) * 40 * dt;
      if (colideAABB({ x: mf.x, y: mf.y, w: 24, h: 24 }, boxVarela)) {
        mf.grudado = true;
        mf.offsetY = mf.y - varela.y;
        acertosFreddles++;
      }
      return mf.x >= -50;
    }
    mf.x = varela.x + 10;
    mf.y = varela.y + mf.offsetY;
    if (Math.hypot(bola.x - mf.x, bola.y - mf.y) < bola.raio + 20) {
      return false;
    }
    freddiesGrudados++;
    return true;
  });

  if (freddiesGrudados >= 3 && jumpscareTimer <= 0) {
    jumpscareTimer = 1.8;
    miniFreddies = [];
    if (acertosFreddles >= 3) tocarFala(somJumpscare);
  }

  // Gatos Aliados
  for (const g of gatosAliados) {
    g.y += g.velY * g.direcao * dt;
    if (g.y < 80) { g.y = 80; g.direcao = 1; }
    if (g.y + g.altura > canvas.height - 80) { g.y = canvas.height - 80 - g.altura; g.direcao = -1; }

    if (bola.velX < 0 && colideAABB({ x: bola.x - bola.raio, y: bola.y - bola.raio, w: bola.raio * 2, h: bola.raio * 2 }, { x: g.x, y: g.y, w: g.largura, h: g.altura })) {
      bola.x = g.x + g.largura + bola.raio;
      bola.velX = Math.abs(bola.velX) * 1.15;
    }
  }

  // Power-up do Mapa
  if (!powerUpMapa.ativo) {
    powerUpMapa.tempoParaSpawn -= dt;
    if (powerUpMapa.tempoParaSpawn <= 0) {
      powerUpMapa.ativo = true;
      powerUpMapa.x = canvas.width / 2 + (Math.random() * 80 - 40);
      powerUpMapa.y = 90 + Math.random() * (canvas.height - 180);
      powerUpMapa.tipo = ["mata", "congela"][Math.floor(Math.random() * 2)];
      powerUpMapa.tempoParaSpawn = 15.0;
    }
  } else {
    powerUpMapa.balanco += dt * 4;
    if (Math.hypot(bola.x - powerUpMapa.x, bola.y - powerUpMapa.y) < bola.raio + powerUpMapa.raio) {
      if (powerUpMapa.tipo === "mata") {
        if (bola.velX > 0) varela.mortoTimer = 3.0;
        else boss.mortoTimer = 3.0;
      } else {
        boss.congeladoTimer = 5.0;
      }
      powerUpMapa.ativo = false;
    }
  }

  // Bola
  if (tempoSaque > 0) {
    tempoSaque -= dt;
    return;
  }

  bola.x += bola.velX * dt;
  bola.y += bola.velY * dt;

  // Quique nas bordas superior/inferior
  if (bola.y - bola.raio <= 0 || bola.y + bola.raio >= canvas.height) {
    bola.y = bola.y - bola.raio <= 0 ? bola.raio : canvas.height - bola.raio;
    bola.velY = -bola.velY;
  }

  // Colisão com Varela
  if (varela.mortoTimer <= 0 && bola.velX < 0 && bola.x - bola.raio <= varela.x + varela.largura && bola.x + bola.raio >= varela.x && bola.y >= varela.y && bola.y <= varela.y + varela.altura) {
    bola.x = varela.x + varela.largura + bola.raio;
    const pontoRel = (bola.y - (varela.y + varela.altura / 2)) / (varela.altura / 2);
    const angulo = pontoRel * (Math.PI / 3);
    let velTotal = Math.hypot(bola.velX, bola.velY) * 1.05;

    if (varela.socoAtivoTimer > 0) {
      velTotal *= 1.6;
      bola.superSoco = true;
      varela.socoAtivoTimer = 0;
    } else if (temPowerUp("thug_life") && Math.abs(pontoRel) > 0.65) {
      velTotal *= 1.45;
      bola.thugLifeFogo = true;
    } else {
      bola.superSoco = false;
      bola.thugLifeFogo = false;
    }

    bola.velX = Math.abs(Math.cos(angulo) * velTotal);
    bola.velY = Math.sin(angulo) * velTotal;
  }

  // Colisão com Boss
  if (boss.mortoTimer <= 0 && bola.velX > 0 && bola.x + bola.raio >= boss.x && bola.x - bola.raio <= boss.x + boss.largura && bola.y >= boss.y && bola.y <= boss.y + boss.altura) {
    bola.x = boss.x - bola.raio;
    const pontoRel = (bola.y - (boss.y + boss.altura / 2)) / (boss.altura / 2);
    const angulo = pontoRel * (Math.PI / 3);
    const velTotal = Math.hypot(bola.velX, bola.velY) * 1.05;

    bola.velX = -Math.abs(Math.cos(angulo) * velTotal);
    bola.velY = Math.sin(angulo) * velTotal;
    bola.superSoco = false;
    bola.thugLifeFogo = false;
  }

  // Barreiras de Gol
  if (bossAtualIndex === 0 && boss.barreiraGeloTimer > 0 && bola.x + bola.raio >= canvas.width - 18 && bola.velX > 0) {
    bola.x = canvas.width - 18 - bola.raio;
    bola.velX = -Math.abs(bola.velX);
  }

  if (varela.shieldAtivoTimer > 0 && bola.x - bola.raio <= 16 && bola.velX < 0) {
    bola.x = 16 + bola.raio;
    bola.velX = Math.abs(bola.velX);
  }

  // Gols
  if (bola.x + bola.raio >= canvas.width) {
    vidasBoss--;
    boss.flashDano = 0.5;
    tocarAudioGol("varela");

    if (vidasBoss <= 0) {
      if (bossAtualIndex >= dadosBosses.length - 1) {
        estado = "vitoria";
      } else {
        sortearCartasEscolha();
        estado = "escolhendo";
      }
      sincronizarMusica();
    } else {
      resetarBola(-1);
    }
  } else if (bola.x - bola.raio <= 0) {
    vidasVarela--;
    varela.flashDano = 0.5;
    tocarAudioGol("boss");
    if (bossAtualIndex === 0) {
      tocarFala(somFF2);
      golpesConsecutivos = 0;
    }

    if (vidasVarela <= 0) { estado = "gameover"; sincronizarMusica(); tocarFala(somPerde); }
    else resetarBola(1);
  }
}

// ========================================================
// LOOP PRINCIPAL
// ========================================================

function loop(tempoAtual) {
  const dt = Math.min((tempoAtual - ultimoTempo) / 1000, 0.1);
  ultimoTempo = tempoAtual;

  atualizar(dt);
  desenhar();

  requestAnimationFrame(loop);
}

requestAnimationFrame((tempo) => {
  ultimoTempo = tempo;
  loop(tempo);
});