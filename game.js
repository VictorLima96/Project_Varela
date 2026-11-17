// ========================================================
// VARELA PONG ROGUELIKE - A BATALHA DOS 3 BOSSES (OTIMIZADO)
// ========================================================

// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");

let estado = "menu"; // "menu", "escolha_inicial", "jogando", "escolhendo", "gameover", "vitoria"
let pausado = false;

const dadosBosses = [
  { nome: "Free Fire (Médio)", velocidade: 255, altura: 88, corTema: "#ff8c00" },
  { nome: "Freddy Fazbear (Difícil)", velocidade: 320, altura: 90, corTema: "#8b4513" }
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

// ========================================================
// 2. CARREGAMENTO DE IMAGENS E HELPERS
// ========================================================

const carregarImg = (caminho) => { const img = new Image(); img.src = caminho; return img; };

const imgs = {
  varela: carregarImg("assets/player.png"),
  bosses: [carregarImg("assets/boss_freefire.png"), carregarImg("assets/boss_fred.png")],
  choleraFred: carregarImg("assets/cholera_fred.png"),
  gatoMilitar: carregarImg("assets/gato_militar.png"),
  gelo: carregarImg("assets/Gelo.png"),
  coracao: carregarImg("assets/coracao.png"),
  gameOver: carregarImg("assets/game_over.png")
};

function desenharSprite(img, x, y, w, h, fallbackCor) {
  if (img && img.complete && img.naturalWidth > 0) { ctx.drawImage(img, x, y, w, h); return true; }
  if (fallbackCor) { ctx.fillStyle = fallbackCor; ctx.fillRect(x, y, w, h); }
  return false;
}

const colideAABB = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const limitarY = (entidade) => {
  entidade.y = Math.max(0, Math.min(canvas.height - entidade.altura, entidade.y));
};

const texto = (x, y, str, cor, font = "16px Arial", align = "center") => {
  ctx.fillStyle = cor;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
};


// ========================================================
// 3. ÁUDIO SEQUENCIAL E SINTETIZADOR
// ========================================================

const VOLUME_EFEITOS = 0.6;
const VOLUME_OST = 0.3;

const carregarAudio = (caminho, volume = VOLUME_EFEITOS, loop = false) => {
  const a = new Audio(caminho);
  a.preload = "auto";
  a.volume = volume;
  a.loop = loop;
  a.addEventListener("error", () => console.warn("Áudio não carregou:", caminho), { once: true });
  return a;
};

const faixasOST = [
  "01 - A1 - Mystery Prelude.mp3", "02 - A2 - Car Patrol - Title Sequence.mp3", "03 - A3 - Breathless.mp3",
  "04 - A4 - Breathless - Short Version.mp3", "05 - A5 - Waiting Game.mp3", "06 - A6 - Mystery Moll.mp3",
  "07 - A7 - Mystery Movement.mp3", "08 - A8 - The Heavies.mp3", "09 - A9 - Dirty Scene.mp3",
  "10 - B1 - Study In Fear.mp3", "11 - B2 - Empty Streets.mp3", "12 - B3 - Night Watch.mp3",
  "13 - B4 - Foot Patrol.mp3", "14 - B5 - Quiet Girl.mp3", "15 - B6 - Relaxed Scene.mp3",
  "16 - B7 - Routine Procedure.mp3", "17 - B8 - Quietness Sustained.mp3"
];

const ostMenu = carregarAudio(`Audios/OST/${faixasOST[14]}`, VOLUME_OST, true);
const ostBatalha = faixasOST.filter((_, i) => i !== 14).map(f => carregarAudio(`Audios/OST/${f}`, VOLUME_OST, true));
let ostBatalhaAtual = null;

const sonsGolVarela = [1, 2, 3].map(n => carregarAudio(`Audios/Audios Gol Va/gol${n}.mp3`));
const sonsGolBoss = [1, 2, 3].map(n => carregarAudio(`Audios/Audios Gol En/robogol${n}.mp3`));
const somPerde = carregarAudio("Audios/Audio Perde/fahhhhhhhhhhhhhh.mp3");
const somJumpscare = carregarAudio("Audios/Audios Enemy/Jumpscare.mp3");
const somBeatbox = carregarAudio("Audios/Music Freddy/Beatbox.mp3", VOLUME_OST, true);
const falasVarela = [1, 2].map(n => carregarAudio(`Audios/Audios Varela/Var${n}.mp3`));
const somVar3 = carregarAudio("Audios/Audios Varela/Var3.mp3");
const [somFF1, somFF2, somFF3, somFF4] = [1, 2, 3, 4].map(n => carregarAudio(`Audios/Audios Enemy/FF${n}.mp3`));
const [somFreddy1, somFreddy2] = [1, 2].map(n => carregarAudio(`Audios/Audios Enemy/Freddy${n}.mp3`));
const falasBosses = [[somFF3], [somFreddy1]];
const somTiroFF = carregarAudio("Audios/Audio Poderes/Tiro_FF.mp3");
const somFredito = carregarAudio("Audios/Audio Poderes/Fredditos.mp3");

let somLigado = true;
let proximaFalaVarela = 9;
let proximaFalaBoss = 13;
let falaAtiva = null;

const todosAudiosFala = [
  ...falasVarela, somVar3, ...falasBosses.flat(), somFF1, somFF2, somFF4,
  somFreddy2, somJumpscare, somPerde, somFredito
];

function pararListaAudio(lista) {
  for (const a of lista) { a.pause(); a.currentTime = 0; }
}

const pararFalas = () => {
  pararListaAudio(todosAudiosFala);
  falaAtiva = null;
  freditoPendente = false;
};

function tocarAudio(audio) {
  if (somLigado && audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
}

function tocarAudioAleatorio(lista) {
  if (!somLigado || !lista?.length) return;
  if (falaAtiva && !falaAtiva.paused) return;
  tocarFala(lista[Math.floor(Math.random() * lista.length)]);
}

function tocarFala(audio) {
  if (!somLigado || !audio) return;
  if (falaAtiva && falaAtiva !== audio) {
    falaAtiva.pause();
    falaAtiva.currentTime = 0;
  }
  audio.currentTime = 0;
  falaAtiva = audio;
  audio.play().catch(() => {});
  audio.onended = () => {
    if (falaAtiva === audio) falaAtiva = null;
  };
}

let freditoPendente = false;
function tocarFredito() {
  if (!somLigado) return;
  if (!somFredito.paused) { freditoPendente = true; return; }
  tocarFala(somFredito);
}
somFredito.addEventListener("ended", () => {
  if (freditoPendente) { freditoPendente = false; tocarFala(somFredito); }
});

function sincronizarMusica() {
  const pararOST = () => {
    ostMenu.pause(); ostMenu.currentTime = 0;
    somBeatbox.pause(); somBeatbox.currentTime = 0;
    if (ostBatalhaAtual) { ostBatalhaAtual.pause(); ostBatalhaAtual = null; }
  };
  if (!somLigado) return pararOST();

  if (estado === "menu") {
    if (ostBatalhaAtual) { ostBatalhaAtual.pause(); ostBatalhaAtual = null; }
    somBeatbox.pause(); somBeatbox.currentTime = 0;
    if (ostMenu.paused) ostMenu.play().catch(() => {});
  } else if (estado === "jogando" && bossAtualIndex === 1) {
    ostMenu.pause(); ostMenu.currentTime = 0;
    if (ostBatalhaAtual) { ostBatalhaAtual.pause(); ostBatalhaAtual = null; }
    if (somBeatbox.paused) somBeatbox.play().catch(() => {});
  } else if (estado === "jogando" || estado === "escolha_inicial" || estado === "escolhendo") {
    ostMenu.pause(); ostMenu.currentTime = 0;
    somBeatbox.pause(); somBeatbox.currentTime = 0;
    if (!ostBatalhaAtual) {
      ostBatalhaAtual = ostBatalha[Math.floor(Math.random() * ostBatalha.length)];
      ostBatalhaAtual.currentTime = 0;
    }
    if (ostBatalhaAtual.paused) ostBatalhaAtual.play().catch(() => {});
  } else {
    pararOST();
  }
}

function tocarAudioGol(quem) {
  if (!somLigado) return;
  pararFalas();
  const ehVarela = quem === "varela";
  const lista = ehVarela ? sonsGolVarela : sonsGolBoss;
  const gols = ehVarela ? (MAX_VIDAS_BOSS - vidasBoss) : (MAX_VIDAS_VARELA - vidasVarela);
  const idx = (gols - 1 + lista.length) % lista.length;
  pararListaAudio(lista); // nunca sobrepor o mesmo conjunto
  tocarAudio(lista[idx]);
}


// ========================================================
// 4. LISTA DE POWER-UPS (ROGUELIKE)
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
// 5. CONTROLES (TECLADO)
// ========================================================

const teclas = {};
let mouseX = 0;
let mouseY = 0;
let ultimoToqueCima = 0;
let ultimoToqueBaixo = 0;
let wAbaixada = false;
let sAbaixada = false;
let ultimoTempo = performance.now();
let estadoVisualAnterior = null;

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
// 6. ATUALIZAÇÃO DA LÓGICA E FÍSICA
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
    const lista = (vidasVarela - vidasBoss >= 2) ? [...falasVarela, somVar3] : falasVarela;
    tocarAudioAleatorio(lista);
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
      const golsBoss = MAX_VIDAS_VARELA - vidasVarela;
      if (golsBoss === 1) tocarFala(somFF1);
      else if ((golsBoss === 2 || golsBoss === 3) && golpesConsecutivos < 3) tocarFala(somFF4);
      golpesConsecutivos = 0;
    }

    if (vidasVarela <= 0) { estado = "gameover"; sincronizarMusica(); tocarFala(somPerde); }
    else resetarBola(1);
  }
}


// ========================================================
// 7. RENDERIZAÇÃO E HUD
// ========================================================

function desenhar() {
  if (estadoVisualAnterior !== estado) {
    document.body.classList.toggle("menu-ativo", estado === "menu");
    document.body.classList.toggle("fim-ativo", estado === "vitoria" || estado === "gameover");
    estadoVisualAnterior = estado;
  }
  ctx.save();

  // Fundo Neon
  const gradFundo = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 80, canvas.width / 2, canvas.height / 2, 500);
  gradFundo.addColorStop(0, "#162030");
  gradFundo.addColorStop(1, "#0a0e16");
  ctx.fillStyle = gradFundo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255, 0, 128, 0.25)";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 65, 0, Math.PI * 2);
  ctx.stroke();

  // Gatos Aliados
  for (const g of gatosAliados) {
    desenharSprite(imgs.gatoMilitar, g.x, g.y, g.largura, g.altura, "#34c759");
  }

  // Barreiras nos Gols
  const desenharBarreira = (x, largura, corPreench, corBorda) => {
    ctx.fillStyle = corPreench;
    ctx.fillRect(x, 0, largura, canvas.height);
    ctx.strokeStyle = corBorda;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, 0, largura, canvas.height);
  };
  if (varela.shieldAtivoTimer > 0) desenharBarreira(0, 18, "rgba(175, 82, 222, 0.4)", "#af52de");
  if (bossAtualIndex === 0 && boss.barreiraGeloTimer > 0) desenharBarreira(canvas.width - 20, 20, "rgba(0, 229, 255, 0.45)", "#00e5ff");

  // Varela
  ctx.save();
  if (varela.mortoTimer > 0) ctx.globalAlpha = 0.28;
  if (varela.flashDano > 0 || varela.socoAtivoTimer > 0) {
    ctx.strokeStyle = varela.flashDano > 0 ? "#ff0000" : "#ff3b30";
    ctx.lineWidth = varela.socoAtivoTimer > 0 ? 5 : 4;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 15;
    ctx.strokeRect(varela.x - 3, varela.y - 3, varela.largura + 6, varela.altura + 6);
    ctx.shadowBlur = 0;
  }
  desenharSprite(imgs.varela, varela.x, varela.y, varela.largura, varela.altura, "#00ffea");

  if (varela.mortoTimer > 0) {
    ctx.globalAlpha = 1.0;
    texto(varela.x + varela.largura / 2, varela.y - 8, `💀 ABATIDO (${varela.mortoTimer.toFixed(1)}s)`, "#ff3b30", "bold 13px Arial");
  } else if (temPowerUp("thug_life")) {
    desenharSprite(imgs.varela, varela.x + 2, varela.y + 12, 28, 12);
  }
  ctx.restore();

  // Boss
  const imgBoss = imgs.bosses[bossAtualIndex];
  ctx.save();
  if (boss.flashDano > 0) {
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.strokeRect(boss.x - 3, boss.y - 3, boss.largura + 6, boss.altura + 6);
  }
  if (boss.mortoTimer > 0) ctx.globalAlpha = 0.25;
  desenharSprite(imgBoss, boss.x, boss.y, boss.largura, boss.altura, dadosBosses[bossAtualIndex].corTema);
  ctx.globalAlpha = 1.0;

  if (boss.mortoTimer > 0) {
    texto(boss.x + boss.largura / 2, boss.y - 8, `💀 MORTO (${boss.mortoTimer.toFixed(1)}s)`, "#ff3b30", "bold 14px Arial");
  } else if (boss.congeladoTimer > 0) {
    ctx.fillStyle = "rgba(0, 229, 255, 0.55)";
    ctx.fillRect(boss.x - 4, boss.y - 4, boss.largura + 8, boss.altura + 8);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(boss.x - 4, boss.y - 4, boss.largura + 8, boss.altura + 8);
    texto(boss.x + boss.largura / 2, boss.y - 8, "🧊 CONGELADO!", "#ffffff", "bold 13px Arial");
  }
  ctx.restore();

  // Tiros Free Fire
  ctx.fillStyle = "#ffcc00";
  ctx.shadowColor = "#ff8c00";
  ctx.shadowBlur = 10;
  for (const t of tirosFreeFire) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.raio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Mini Freddies
  for (const mf of miniFreddies) {
    desenharSprite(imgs.bosses[1], mf.x, mf.y, 24, 24, "#8b4513");
  }

  // Power-Up no Mapa
  if (powerUpMapa.ativo) {
    const yOsc = powerUpMapa.y + Math.sin(powerUpMapa.balanco) * 8;
    const estilosPU = {
      mata: ["#ff3b30", "💀 MATA"],
      congela: ["#00ffff", "🧊 GELO"]
    };
    const [corPU, textoPU] = estilosPU[powerUpMapa.tipo] || ["#ffcc00", "POWER"];

    ctx.save();
    ctx.shadowColor = corPU;
    ctx.shadowBlur = 15;
    const geloCarregado = powerUpMapa.tipo === "congela" && imgs.gelo.complete && imgs.gelo.naturalWidth > 0;
    if (geloCarregado) {
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgs.gelo, powerUpMapa.x - powerUpMapa.raio, yOsc - powerUpMapa.raio, powerUpMapa.raio * 2, powerUpMapa.raio * 2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = corPU;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio - 1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = corPU;
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (!geloCarregado) texto(powerUpMapa.x, yOsc + 4, textoPU, "#ffffff", "bold 10px Arial");
    ctx.restore();
  }

  // Bola
  ctx.save();
  ctx.fillStyle = bola.superSoco ? "#ff3b30" : (bola.thugLifeFogo ? "#ffd700" : "#ffffff");
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(bola.x, bola.y, bola.raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore(); // HUD fixa abaixo

  desenharPlacar();
  desenharPainelHabilidades();

  if (jumpscareTimer > 0) {
    ctx.fillStyle = "rgba(180, 0, 0, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    desenharSprite(imgs.choleraFred, canvas.width / 2 - 180, canvas.height / 2 - 180, 360, 360);
    texto(canvas.width / 2, canvas.height / 2 + 180, "FREDDY JUMPSCARE!", "#ffffff", "900 32px Arial");
  }

  if (estado === "menu") desenharTelaMenu();
  else if (estado === "escolha_inicial") desenharTelaEscolha("ESCOLHA SUA HABILIDADE INICIAL!");
  else if (estado === "escolhendo") desenharTelaEscolha("BOSS DERROTADO! ESCOLHA SEU POWER-UP");
  else if (estado === "gameover") desenharTelaGameOver();
  else if (estado === "vitoria") desenharTelaVitoria();
}

function desenharPlacar() {
  const tamCoracao = 24, espaco = 6, y = 14;

  const desenharVidas = (total, atual, xBase, passo) => {
    for (let i = 0; i < total; i++) {
      const x = xBase + i * passo;
      if (i < atual) desenharSprite(imgs.coracao, x, y, tamCoracao, tamCoracao, "#ff3b30");
      else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(x, y, tamCoracao, tamCoracao);
      }
    }
  };

  desenharVidas(MAX_VIDAS_VARELA, vidasVarela, 30, tamCoracao + espaco);

  texto(30, y + tamCoracao + 16, `VARELA (${vidasVarela} / ${MAX_VIDAS_VARELA})`, "#00e5ff", "bold 14px Arial", "left");
  desenharSprite(imgs.varela, 128, y + 2, 24, 18);

  desenharVidas(MAX_VIDAS_BOSS, vidasBoss, canvas.width - 30 - (tamCoracao + espaco), -(tamCoracao + espaco));

  const dados = dadosBosses[bossAtualIndex];
  texto(canvas.width - 30, y + tamCoracao + 16, `${dados.nome.toUpperCase()} (${vidasBoss} / ${MAX_VIDAS_BOSS})`, dados.corTema, "bold 14px Arial", "right");
  desenharSprite(imgs.bosses[bossAtualIndex], canvas.width - 30 - 4 * (tamCoracao + espaco) - 24, y + 2, 24, 18);

  texto(canvas.width / 2, 28, `BOSS ${bossAtualIndex + 1} / ${dadosBosses.length}`, "#ffcc00", "bold 16px Arial");
}

function desenharPainelHabilidades() {
  const y = canvas.height - 24;
  let x = 25;

  const habilidadesHUD = [
    { id: "soco_forte", cd: varela.socoCooldown, cor: "#ff3b30", pronto: "[ESPAÇO] SOCO PRONTO", nome: "SOCO" },
    { id: "shield_gol", cd: varela.shieldCooldown, cor: "#af52de", pronto: `${temPowerUp("soco_forte") ? "[E]" : "[ESPAÇO]"} SHIELD PRONTO`, nome: "SHIELD" },
    { id: "varela_dash", cd: varela.dashCooldown, cor: "#ffcc00", pronto: "[W/S 2X] DASH PRONTO", nome: "DASH" }
  ];

  for (const h of habilidadesHUD) {
    if (temPowerUp(h.id)) {
      texto(x, y, h.cd <= 0 ? h.pronto : `${h.nome} (${h.cd.toFixed(1)}s)`, h.cd <= 0 ? h.cor : "#666", "bold 12px Arial", "left");
      x += 165;
    }
  }

  if (varela.desestabilizadoTimer > 0) {
    texto(canvas.width - 25, y, `⚠️ CONTROLES INVERTIDOS (${varela.desestabilizadoTimer.toFixed(1)}s)`, "#ff3b30", "bold 13px Arial", "right");
  } else if (miniFreddies.some(m => m.grudado)) {
    const qtd = miniFreddies.filter(m => m.grudado).length;
    texto(canvas.width - 25, y, `😱 ${qtd} MINI FREDDIE(S) GRUDADOS! APERTE ESPAÇO!`, "#ffcc00", "bold 13px Arial", "right");
  }
}

function desenharTelaMenu() {
  const tempo = performance.now() / 1000;
  const fundo = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  fundo.addColorStop(0, "rgba(8, 13, 24, 0.97)");
  fundo.addColorStop(1, "rgba(19, 10, 28, 0.97)");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brilho = ctx.createRadialGradient(canvas.width / 2, 185, 15, canvas.width / 2, 185, 260);
  brilho.addColorStop(0, "rgba(0, 229, 255, 0.18)");
  brilho.addColorStop(1, "rgba(0, 229, 255, 0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(120, 0, canvas.width - 240, 430);

  // Cartas decorativas em movimento dão vida ao menu sem competir com o botão.
  [
    { x: 132, y: 306, rot: -0.16, cor: "#00e5ff", nome: "DASH" },
    { x: 728, y: 298, rot: 0.17, cor: "#ff007f", nome: "SMASH" }
  ].forEach((carta, i) => {
    ctx.save();
    ctx.translate(carta.x, carta.y + Math.sin(tempo * 1.6 + i) * 9);
    ctx.rotate(carta.rot);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "rgba(20, 29, 45, 0.9)";
    ctx.fillRect(-57, -74, 114, 148);
    ctx.strokeStyle = carta.cor;
    ctx.lineWidth = 2;
    ctx.shadowColor = carta.cor;
    ctx.shadowBlur = 16;
    ctx.strokeRect(-57, -74, 114, 148);
    ctx.shadowBlur = 0;
    texto(0, 5, carta.nome, carta.cor, "bold 12px Arial");
    ctx.restore();
  });

  ctx.shadowColor = "rgba(0, 229, 255, 0.55)";
  ctx.shadowBlur = 22;
  texto(canvas.width / 2, 151, "VARELONG", "#ffffff", "900 48px Arial");
  ctx.shadowBlur = 0;

  const bossesMenu = [
    { texto: "FREE FIRE", cor: "#ff8c00" },
    { texto: "FREDDY", cor: "#c28a55" }
  ];
  bossesMenu.forEach((bossMenu, i) => {
    const x = canvas.width / 2 - 150 + i * 150;
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(x - 58, 247, 116, 30);
    ctx.strokeStyle = `${bossMenu.cor}99`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 58, 247, 116, 30);
    texto(x, 266, bossMenu.texto, bossMenu.cor, "bold 11px Arial");
  });

  texto(canvas.width / 2, 424, "Clique em JOGAR ou aperte ESPAÇO", "rgba(255, 255, 255, 0.55)", "12px Arial");
  texto(canvas.width / 2, 457, "W / S ou setas · M para som", "rgba(255, 255, 255, 0.35)", "11px Arial");
}

function desenharTelaEscolha(titulo = "ESCOLHA SEU POWER-UP") {
  ctx.fillStyle = "rgba(8, 12, 18, 0.96)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  texto(canvas.width / 2, 55, titulo, "#ffcc00", "bold 28px Arial");
  texto(canvas.width / 2, 85, "Clique em uma carta ou aperte 1, 2 ou 3", "#00e5ff", "14px Arial");

  const larguraCarta = 210, alturaCarta = 265, espaco = 25, yBase = 135;
  const inicioX = (canvas.width - (3 * larguraCarta + 2 * espaco)) / 2;

  for (let i = 0; i < cartasParaEscolha.length; i++) {
    const carta = cartasParaEscolha[i];
    const x = inicioX + i * (larguraCarta + espaco);
    const hover = mouseX >= x && mouseX <= x + larguraCarta &&
      mouseY >= yBase && mouseY <= yBase + alturaCarta;
    const y = hover ? yBase - 12 : yBase;

    const grad = ctx.createLinearGradient(x, y, x + larguraCarta, y + alturaCarta);
    grad.addColorStop(0, "#1d2535");
    grad.addColorStop(1, "#101622");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, larguraCarta, alturaCarta);

    ctx.strokeStyle = carta.corBorda;
    ctx.lineWidth = hover ? 4 : 2;
    if (hover) { ctx.shadowColor = carta.corBorda; ctx.shadowBlur = 15; }
    ctx.strokeRect(x, y, larguraCarta, alturaCarta);
    ctx.shadowBlur = 0;

    texto(x + 14, y + 26, `[${i + 1}]`, carta.corBorda, "bold 13px Arial", "left");
    texto(x + larguraCarta / 2, y + 58, carta.nome, "#ffffff", "bold 15px Arial");

    ctx.strokeStyle = carta.corBorda;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 72);
    ctx.lineTo(x + larguraCarta - 15, y + 72);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "13px Arial";
    desenharTextoQuebrado(carta.descricao, x + larguraCarta / 2, y + 105, larguraCarta - 25, 20);

    ctx.fillStyle = hover ? carta.corBorda : "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(x + 20, y + alturaCarta - 40, larguraCarta - 40, 26);

    texto(x + larguraCarta / 2, y + alturaCarta - 23, "ESCOLHER", hover ? "#000000" : "#ffffff", "bold 12px Arial");
  }
}

function desenharTextoQuebrado(texto, x, y, maxLargura, alturaLinha) {
  let linha = "";
  for (const palavra of texto.split(" ")) {
    const teste = `${linha}${palavra} `;
    if (ctx.measureText(teste).width > maxLargura && linha) {
      ctx.fillText(linha, x, y);
      linha = `${palavra} `;
      y += alturaLinha;
    } else {
      linha = teste;
    }
  }
  ctx.fillText(linha, x, y);
}

function desenharTelaGameOver() {
  ctx.fillStyle = "rgba(8, 12, 18, 0.94)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!desenharSprite(imgs.gameOver, canvas.width / 2 - 180, 110, 360, 110)) {
    texto(canvas.width / 2, 190, "GAME OVER", "#ff3b30", "bold 44px Arial");
  }

  texto(canvas.width / 2, 260, `Você foi derrotado por: ${dadosBosses[bossAtualIndex].nome}`, "#ffffff", "16px Arial");
  texto(canvas.width / 2, 330, "Clique em RECOMEÇAR ou aperte ESPAÇO", "#00e5ff", "bold 18px Arial");
}

function desenharTelaVitoria() {
  ctx.fillStyle = "rgba(8, 12, 18, 0.94)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  texto(canvas.width / 2, 170, "🏆 You Win!", "#ffcc00", "bold 48px Arial");
  texto(canvas.width / 2, 225, "O Varela venceu todos os bosses!", "#ffffff", "18px Arial");
  texto(canvas.width / 2, 275, "Clique em RECOMEÇAR para jogar novamente", "#00ffea", "bold 16px Arial");
}


// ========================================================
// 8. LOOP PRINCIPAL
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