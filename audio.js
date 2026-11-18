// ========================================================
// VARELONG - ÁUDIO (MÚSICA, FALAS E EFEITOS)
// ========================================================

const VOLUME_EFEITOS = 0.4;
const VOLUME_OST = 0.3;
const VOLUME_JUMPSCARE = 0.9;

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

const somGolVarela = carregarAudio("Audios/Audios Gol Va/gol1.mp3");
const somGolBoss = carregarAudio("Audios/Audios Gol En/robogol1.mp3");
const somPerde = carregarAudio("Audios/Audio Perde/fahhhhhhhhhhhhhh.mp3");
const somJumpscare = carregarAudio("Audios/Audios Enemy/Jumpscare.mp3", VOLUME_JUMPSCARE);
const somBeatbox = carregarAudio("Audios/Music Freddy/Beatbox.mp3", VOLUME_OST, true);
const falasVarela = [carregarAudio("Audios/Audios Varela/Var1.mp3")];
const somFF2 = carregarAudio("Audios/Audios Enemy/FF2.mp3");
const somFreddy2 = carregarAudio("Audios/Audios Enemy/Freddy2.mp3");
const falasBosses = [[somFF2], [somFreddy2]];
const somTiroFF = carregarAudio("Audios/Audio Poderes/Tiro_FF.mp3");
const somFredito = carregarAudio("Audios/Audio Poderes/Fredditos.mp3");

let somLigado = true;
let falaAtiva = null;
let freditoPendente = false;

const todosAudiosFala = [
  ...falasVarela, ...falasBosses.flat(),
  somJumpscare, somPerde, somFredito
];

const todosAudios = [
  ostMenu, ...ostBatalha, somBeatbox, somGolVarela, somGolBoss, somTiroFF, ...todosAudiosFala
];

function pararListaAudio(lista) {
  for (const a of lista) { a.pause(); a.currentTime = 0; }
}

function pararTodosAudios() {
  pararListaAudio(todosAudios);
  ostBatalhaAtual = null;
  falaAtiva = null;
  freditoPendente = false;
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
  tocarAudio(quem === "varela" ? somGolVarela : somGolBoss);
}