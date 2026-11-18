// ========================================================
// VARELONG - VISUAL (SPRITES E RENDERIZAÇÃO)
// ========================================================

const carregarImg = (caminho) => { const img = new Image(); img.src = caminho; return img; };

const imgs = {
  varela: carregarImg("assets/player.png"),
  bosses: [carregarImg("assets/boss_freefire.png"), carregarImg("assets/boss_fred.png")],
  choleraFred: carregarImg("assets/cholera_fred.png"),
  gatoMilitar: carregarImg("assets/gato_militar.png"),
  gelo: carregarImg("assets/Gelo.png"),
  morto: carregarImg("assets/Morto.png"),
  dash: carregarImg("assets/dash.png"),
  smash: carregarImg("assets/smash.jpg"),
  coracao: carregarImg("assets/coracao.png"),
  gameOver: carregarImg("assets/game_over.png")
};

let estadoVisualAnterior = null;

function desenharSprite(img, x, y, w, h, fallbackCor) {
  if (img && img.complete && img.naturalWidth > 0) { ctx.drawImage(img, x, y, w, h); return true; }
  if (fallbackCor) { ctx.fillStyle = fallbackCor; ctx.fillRect(x, y, w, h); }
  return false;
}

const texto = (x, y, str, cor, font = "16px Arial", align = "center") => {
  ctx.fillStyle = cor;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
};

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
      mata: { cor: "#ff3b30", img: imgs.morto, texto: "💀 MATA" },
      congela: { cor: "#00ffff", img: imgs.gelo, texto: "🧊 GELO" }
    };
    const estilo = estilosPU[powerUpMapa.tipo] || { cor: "#ffcc00", img: null, texto: "POWER" };
    const imgCarregada = estilo.img && estilo.img.complete && estilo.img.naturalWidth > 0;

    ctx.save();
    ctx.shadowColor = estilo.cor;
    ctx.shadowBlur = 15;
    if (imgCarregada) {
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(estilo.img, powerUpMapa.x - powerUpMapa.raio, yOsc - powerUpMapa.raio, powerUpMapa.raio * 2, powerUpMapa.raio * 2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = estilo.cor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio - 1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = estilo.cor;
      ctx.beginPath();
      ctx.arc(powerUpMapa.x, yOsc, powerUpMapa.raio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (!imgCarregada) texto(powerUpMapa.x, yOsc + 4, estilo.texto, "#ffffff", "bold 10px Arial");
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
    { x: 132, y: 306, rot: -0.16, cor: "#00e5ff", img: imgs.dash, nome: "DASH" },
    { x: 728, y: 298, rot: 0.17, cor: "#ff007f", img: imgs.smash, nome: "SMASH" }
  ].forEach((carta, i) => {
    ctx.save();
    ctx.translate(carta.x, carta.y + Math.sin(tempo * 1.6 + i) * 9);
    ctx.rotate(carta.rot);
    ctx.globalAlpha = 0.88;

    ctx.fillStyle = "rgba(20, 29, 45, 0.9)";
    ctx.fillRect(-57, -74, 114, 148);

    const img = carta.img;
    if (img && img.complete && img.naturalWidth > 0) {
      const maxW = 92, maxH = 118;
      const escala = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const w = img.naturalWidth * escala;
      const h = img.naturalHeight * escala;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      texto(0, 5, carta.nome, carta.cor, "bold 12px Arial");
    }

    ctx.strokeStyle = carta.cor;
    ctx.lineWidth = 2;
    ctx.shadowColor = carta.cor;
    ctx.shadowBlur = 16;
    ctx.strokeRect(-57, -74, 114, 148);
    ctx.shadowBlur = 0;

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