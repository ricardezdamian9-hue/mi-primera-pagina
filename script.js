/* ==========================================
   1. RELOJ DE TERMINAL Y BÚSQUEDA DE ELEMENTOS
   ========================================== */
function actualizarReloj() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  const el = document.getElementById('reloj-terminal');
  if (el) el.textContent = `${horas}:${minutos}:${segundos}`;
}
setInterval(actualizarReloj, 1000);
actualizarReloj();


/* ==========================================
   2. VENTANA FLOTANTE DE FRASES (ARRASTRABLE)
   ========================================== */
const frases = [
  { texto: '"No matter where you go, everyone\'s connected."', autor: "— Serial Experiments Lain" },
  { texto: '"The Wired is not an upper layer to the real world."', autor: "— Lain Iwakura" },
  { texto: '"Memory is merely a record. You can rewrite it whenever you want."', autor: "— Cyberpunk Rule #1" },
  { texto: '"Present day, present time! Hahaha!"', autor: "— Navi OS" },
  { texto: '"¿Ya intentaste reiniciar el nodo de red?"', autor: "— Support_Bot" },
  { texto: '"There is no physical reality, only perception."', autor: "— Wired Knowledge" }
];

function nuevaFrase() {
  const txt = document.getElementById('texto-frase');
  const aut = document.getElementById('autor-frase');
  if (txt && aut) {
    const randomIndex = Math.floor(Math.random() * frases.length);
    txt.textContent = frases[randomIndex].texto;
    aut.textContent = frases[randomIndex].autor;
  }
}

function cerrarVentanaFrases() {
  const ventana = document.getElementById('ventana-frases');
  if (ventana) ventana.style.display = 'none';
}


/* ==========================================
   3. SINTETIZADOR DE EFECTOS DE SONIDO RETRO
   ========================================== */
let audioCtx;

function inicializarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function sonarEfecto(frecuenciaInicial, frecuenciaFinal, duracion, tipo = 'sine') {
  inicializarAudio(); // Se asegura de activarse con interacción
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuenciaInicial, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(frecuenciaFinal, audioCtx.currentTime + duracion);
  
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracion);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duracion);
}


/* ==========================================
   4. PLAYLIST Y CONTROL DE AUDIO
   ========================================== */
const listaCanciones = [
  { titulo: "01. Duvet / Lain OST", url: "Lain.mp3" },
  { titulo: "02. Cyberpunk Ambient Track", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { titulo: "03. Días Azules - Ed Maverick", url: "musica/dias_azules.mp3" }
];

let indiceActual = 0;

function cargarPista(index) {
  const audioPlayer = document.getElementById('reproductor-main');
  const tituloPista = document.getElementById('titulo-pista');
  const selectPlaylist = document.getElementById('select-playlist');
  
  if (!audioPlayer) return;

  indiceActual = index;
  audioPlayer.src = listaCanciones[index].url;
  if (tituloPista) tituloPista.textContent = listaCanciones[index].titulo;
  if (selectPlaylist) selectPlaylist.value = index;
}

function alternarPlay() {
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  if (!audioPlayer) return;

  if (audioPlayer.paused) {
    audioPlayer.play();
    if (btnPlay) {
      btnPlay.textContent = "[ PAUSE ]";
      btnPlay.style.color = "#ff0055";
    }
  } else {
    audioPlayer.pause();
    if (btnPlay) {
      btnPlay.textContent = "[ PLAY ]";
      btnPlay.style.color = "#00f0ff";
    }
  }
}

function siguientePista() {
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  indiceActual = (indiceActual + 1) % listaCanciones.length;
  cargarPista(indiceActual);
  if (audioPlayer) audioPlayer.play();
  if (btnPlay) btnPlay.textContent = "[ PAUSE ]";
}

function pistaAnterior() {
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  indiceActual = (indiceActual - 1 + listaCanciones.length) % listaCanciones.length;
  cargarPista(indiceActual);
  if (audioPlayer) audioPlayer.play();
  if (btnPlay) btnPlay.textContent = "[ PAUSE ]";
}

function cambiarPistaDesdeSelect() {
  const selectPlaylist = document.getElementById('select-playlist');
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  if (!selectPlaylist) return;

  const val = parseInt(selectPlaylist.value);
  cargarPista(val);
  if (audioPlayer) audioPlayer.play();
  if (btnPlay) btnPlay.textContent = "[ PAUSE ]";
}


/* ==========================================
   5. INTERACTIVE TERMINAL (CLI)
   ========================================== */
function procesarComando(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('terminal-input');
    const comando = input.value.trim().toLowerCase();
    const historial = document.getElementById('terminal-history');

    if (comando === '') return;

    const lineaUsuario = document.createElement('p');
    lineaUsuario.innerHTML = `<span style="color: #ff0055;">user@wired:~$</span> ${input.value}`;
    historial.appendChild(lineaUsuario);

    let respuesta = '';

    switch (comando) {
      case 'help':
        respuesta = '<span style="color: #00f0ff;">Comandos disponibles:</span><br>• help: Muestra este menú<br>• clear: Limpia la terminal<br>• about: Información sobre el nodo<br>• matrix: ¿Quieres la píldora verde?<br>• socials: Redes de contacto';
        break;

      case 'clear':
        historial.innerHTML = '';
        input.value = '';
        return;

      case 'about':
        respuesta = 'WIRED_NODE OS v3.04. Sistema personal inspirado en interfaces ciberpunk y retro web.';
        break;

      case 'socials':
        respuesta = 'Discord: damian041520 | Steam: tony | Email: ricardezdamian9@gmail.com';
        break;

      case 'matrix':
        document.body.style.backgroundColor = '#001100';
        respuesta = '<span style="color: #00ff66;">[SYSTEM]: Modo Matrix activado.</span>';
        break;

      default:
        respuesta = `<span style="color: #ff0055;">Comando no reconocido: '${comando}'. Escribe 'help'.</span>`;
    }

    const lineaRespuesta = document.createElement('p');
    lineaRespuesta.innerHTML = `> ${respuesta}`;
    lineaRespuesta.style.marginBottom = '8px';
    historial.appendChild(lineaRespuesta);

    historial.scrollTop = historial.scrollHeight;
    input.value = '';
  }
}


/* ==========================================
   6. CONEXIÓN DISCORD (LANYARD)
   ========================================== */
const DISCORD_ID = '546544317599318027';

async function cargarEstadoDiscord() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const data = await response.json();

    if (data.success) {
      const user = data.data;
      const avatarEl = document.getElementById('discord-avatar');
      const userEl = document.getElementById('discord-user');
      const statusEl = document.getElementById('discord-status');
      const actEl = document.getElementById('discord-activity');

      const avatarUrl = user.discord_user.avatar 
        ? `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.discord_user.avatar}.png`
        : 'https://i.imgur.com/83p1Xb1.png';
      
      if (avatarEl) avatarEl.src = avatarUrl;
      if (userEl) userEl.textContent = user.discord_user.username;
      if (statusEl) statusEl.textContent = `● ${user.discord_status.toUpperCase()}`;

      if (actEl) {
        if (user.activities && user.activities.length > 0) {
          const juego = user.activities.find(a => a.type === 0);
          actEl.textContent = juego ? `Playing: ${juego.name}` : 'Sin juego activo';
        } else {
          actEl.textContent = 'Idle / Standby';
        }
      }

      if (user.listening_to_spotify) {
        const musicTrack = document.getElementById('music-track');
        const musicArtist = document.getElementById('music-artist');
        if (musicTrack) musicTrack.textContent = user.spotify.song;
        if (musicArtist) musicArtist.textContent = user.spotify.artist;
      }
    }
  } catch (error) {
    console.log('Error Lanyard:', error);
  }
}


/* ==========================================
   7. INICIALIZACIÓN (CUANDO EL DOM ESTÁ LISTO)
   ========================================== */
window.addEventListener('DOMContentLoaded', () => {
  // Conectar Lanyard
  cargarEstadoDiscord();
  setInterval(cargarEstadoDiscord, 30000);

  // Sonidos en elementos interactivos
  const elementosInteractivos = document.querySelectorAll('a, button, input, select');
  elementosInteractivos.forEach(el => {
    el.addEventListener('mouseenter', () => sonarEfecto(800, 1200, 0.05, 'square'));
    el.addEventListener('click', () => sonarEfecto(400, 1500, 0.08, 'sawtooth'));
  });

  // Arrastre de la ventana flotante de frases
  const ventana = document.getElementById("ventana-frases");
  const header = document.getElementById("ventana-frases-header");
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  if (header && ventana) {
    header.onmousedown = (e) => {
      e = e || window.event;
      e.preventDefault();
      ventana.style.right = 'auto';
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (ev) => {
        ev = ev || window.event;
        ev.preventDefault();
        pos1 = pos3 - ev.clientX;
        pos2 = pos4 - ev.clientY;
        pos3 = ev.clientX;
        pos4 = ev.clientY;
        ventana.style.top = (ventana.offsetTop - pos2) + "px";
        ventana.style.left = (ventana.offsetLeft - pos1) + "px";
      };
    };
  }
});
// ==========================================
// CÓDIGO KONAMI DEFINITIVO (FILTRA TECLAS MODIFICADORAS)
// ==========================================

const patronKonami = [
  'ArrowUp', 'ArrowUp', 
  'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 
  'ArrowLeft', 'ArrowRight', 
  'b', 'a'
];

let indiceKonami = 0;

// Lista de teclas modificadoras que NO deben reiniciar la secuencia
const teclasIgnoradas = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];

window.addEventListener('keydown', (e) => {
  // 1. Si presionas Shift, Alt, Windows, etc., se ignoran por completo
  if (teclasIgnoradas.includes(e.key)) {
    return;
  }

  // 2. Normalizamos la tecla (para que 'B' o 'b' funcionen igual)
  const teclaPresionada = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const teclaEsperada = patronKonami[indiceKonami];

  console.log(`[TECLA DETECTADA]: ${teclaPresionada} (Esperando: ${teclaEsperada})`);

  // 3. Verificación del combo
  if (teclaPresionada === teclaEsperada) {
    indiceKonami++;
    console.log(`>>> ¡Paso correcto! (${indiceKonami}/${patronKonami.length})`);

    // Evita que las flechas muevan el scroll de la página
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }

    // Si completa la secuencia
    if (indiceKonami === patronKonami.length) {
      activarModoKonami();
      indiceKonami = 0;
    }
  } else {
    // Si te equivocas pero la tecla fue Flecha Arriba, reinicia en el paso 1
    if (teclaPresionada === 'ArrowUp') {
      indiceKonami = 1;
      console.log(">>> Reiniciado en paso 1 (1/10)");
      e.preventDefault();
    } else {
      indiceKonami = 0;
      console.log(">>> Secuencia reiniciada");
    }
  }
});

function activarModoKonami() {
  alert("¡CÓDIGO KONAMI ACTIVADO EN LA WIRED!");
  document.body.classList.toggle('modo-hacker');
}