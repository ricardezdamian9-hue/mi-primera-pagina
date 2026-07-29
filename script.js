// Función para ejecutar código de forma segura una vez que el DOM esté listo
function alCargarDOM(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    // Si el DOM ya cargó, ejecutamos la función inmediatamente
    callback();
  }
}

/* ==========================================
   0. UTILIDADES Y SONIDOS (Agregado para evitar errores)
   ========================================== */
function sonarEfecto(frecuencia, duracion, volumen = 0.05, tipo = 'sine') {
  if (localStorage.getItem('sonido_off') === 'true') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = frecuencia;
    gain.gain.setValueAtTime(volumen, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duracion);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracion);
  } catch(e) {}
}

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

// Iniciar el reloj para que avance automáticamente
setInterval(actualizarReloj, 1000);
actualizarReloj(); // Llamada inicial para que no espere 1 segundo en aparecer

setInterval(() => {
  const cpuText = document.getElementById('cpu-percent');
  if (cpuText) {
    cpuText.textContent = `CPU: ${Math.floor(Math.random() * 20 + 40)}%`;
  }
}, 1000);

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
   4. PLAYLIST Y CONTROL DE AUDIO (PRINCIPAL SUPERIOR)
   ========================================== */
const listaCanciones = [
  { titulo: "01. Duvet / Lain OST", url: "Lain.mp3" },
  { titulo: "02. Cyberpunk Ambient Track", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { titulo: "03. Días Azules - Ed Maverick", url: "https://www.youtube.com/watch?v=atfpEXIzV40&list=RDatfpEXIzV40&start_radio=1" }
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

function formatearTiempo(segundos) {
  if (!isFinite(segundos) || isNaN(segundos)) return '0:00';
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${min}:${seg}`;
}

function inicializarBarraProgreso() {
  const audioPlayer = document.getElementById('reproductor-main');
  const barra = document.getElementById('barra-progreso');
  const tiempoActualEl = document.getElementById('tiempo-actual');
  const tiempoTotalEl = document.getElementById('tiempo-total');
  const volumen = document.getElementById('control-volumen');
  if (!audioPlayer) return;

  // Volumen inicial
  if (volumen) audioPlayer.volume = volumen.value / 100;

  audioPlayer.addEventListener('loadedmetadata', () => {
    if (barra) barra.max = audioPlayer.duration || 0;
    if (tiempoTotalEl) tiempoTotalEl.textContent = formatearTiempo(audioPlayer.duration);
  });

  audioPlayer.addEventListener('timeupdate', () => {
    if (barra && !barra.dataset.arrastrando) barra.value = audioPlayer.currentTime;
    if (tiempoActualEl) tiempoActualEl.textContent = formatearTiempo(audioPlayer.currentTime);
    if (barra && barra.max > 0) {
      const porcentaje = (audioPlayer.currentTime / barra.max) * 100;
      barra.style.setProperty('--progreso', `${porcentaje}%`);
    }
  });

  audioPlayer.addEventListener('ended', () => siguientePista());

  if (barra) {
    barra.addEventListener('input', () => {
      barra.dataset.arrastrando = 'true';
      if (tiempoActualEl) tiempoActualEl.textContent = formatearTiempo(barra.value);
    });
    barra.addEventListener('change', () => {
      audioPlayer.currentTime = barra.value;
      delete barra.dataset.arrastrando;
    });
  }

  if (volumen) {
    volumen.addEventListener('input', () => {
      audioPlayer.volume = volumen.value / 100;
    });
  }
}

function actualizarEcualizador(sonando) {
  const eq = document.querySelector('.equilizer-bars');
  if (eq) {
    if (sonando) {
      eq.classList.add('reproduciendo');
    } else {
      eq.classList.remove('reproduciendo');
    }
  }
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
    actualizarEcualizador(true);
  } else {
    audioPlayer.pause();
    if (btnPlay) {
      btnPlay.textContent = "[ PLAY ]";
      btnPlay.style.color = "#00f0ff";
    }
    actualizarEcualizador(false);
  }
}

function siguientePista() {
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  indiceActual = (indiceActual + 1) % listaCanciones.length;
  cargarPista(indiceActual);
  if (audioPlayer) {
    audioPlayer.play();
    actualizarEcualizador(true);
  }
  if (btnPlay) {
    btnPlay.textContent = "[ PAUSE ]";
    btnPlay.style.color = "#ff0055";
  }
}

function pistaAnterior() {
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  indiceActual = (indiceActual - 1 + listaCanciones.length) % listaCanciones.length;
  cargarPista(indiceActual);
  if (audioPlayer) {
    audioPlayer.play();
    actualizarEcualizador(true);
  }
  if (btnPlay) {
    btnPlay.textContent = "[ PAUSE ]";
    btnPlay.style.color = "#ff0055";
  }
}

function cambiarPistaDesdeSelect() {
  const selectPlaylist = document.getElementById('select-playlist');
  const audioPlayer = document.getElementById('reproductor-main');
  const btnPlay = document.getElementById('btn-play');
  if (!selectPlaylist) return;

  const val = parseInt(selectPlaylist.value);
  cargarPista(val);
  if (audioPlayer) {
    audioPlayer.play();
    actualizarEcualizador(true);
  }
  if (btnPlay) {
    btnPlay.textContent = "[ PAUSE ]";
    btnPlay.style.color = "#ff0055";
  }
}

/* ==========================================
   5. PROCESADOR DE COMANDOS CLI (TERMINAL)
   ========================================== */
function imprimirEnTerminal(texto, esComando = false) {
  const historial = document.querySelector('.terminal-historial');
  if (!historial) return;

  const linea = document.createElement('div');
  linea.style.marginBottom = '4px';

  if (esComando) {
    linea.style.color = '#00f0ff';
    linea.textContent = `> ${texto}`;
  } else {
    linea.style.color = '#00ff66';
    linea.style.whiteSpace = 'pre-wrap'; 
    linea.textContent = texto;
  }

  historial.appendChild(linea);
  historial.scrollTop = historial.scrollHeight; 
}

function ejecutarComandoCLI(cmdInput) {
  const inputLimpio = cmdInput.trim();
  if (!inputLimpio) return;

  imprimirEnTerminal(inputLimpio, true);

  const partes = inputLimpio.toLowerCase().split(' ');
  const comando = partes[0];
  const parametro = partes[1];

  switch (comando) {
    case 'help':
    case '?':
      imprimirEnTerminal(
`COMANDOS DISPONIBLES:
  help           - Muestra esta lista
  clear          - Limpia la terminal
  about          - Info del nodo NAVI OS
  theme <col>    - Cambia tema (cyan, green, amber, purple)
  play / pause   - Control de música
  next           - Siguiente pista
  status         - Diagnóstico de red y sistema
  quote          - Transmisión de la Wired
  sudo <cmd>     - Elevar privilegios`
      );
      break;

    case 'clear':
    case 'cls':
      const historial = document.querySelector('.terminal-historial');
      if (historial) historial.innerHTML = '';
      break;

    case 'about':
    case 'whoami':
      imprimirEnTerminal("NAVI OS v3.04 // Personal Wired Node\nEspecializado en desarrollo web, herramientas FOSS y estética retro.");
      break;

    case 'theme':
      if (['cyan', 'green', 'amber', 'purple'].includes(parametro)) {
        cambiarTema(parametro);
        imprimirEnTerminal(`[OK] Esquema de color cambiado a: ${parametro.toUpperCase()}`);
      } else {
        imprimirEnTerminal("Sintaxis incorrecta. Uso: theme [cyan | green | amber | purple]");
      }
      break;

    case 'play':
    case 'pause':
      alternarPlay();
      imprimirEnTerminal("[OK] Estado del reproductor alterado.");
      break;

    case 'next':
      siguientePista();
      imprimirEnTerminal("[OK] Reproduciendo siguiente pista.");
      break;

    case 'status':
    case 'sys':
      imprimirEnTerminal("ESTADO DEL NODO: EN LÍNEA\nLATENCIA: 14ms\nSCANLINES: ACTIVAS\nMEMORIA: NORMAL");
      break;

    case 'quote':
      const quoteList = [
        '"Present day, present time! Hahaha!"',
        '"No matter where you go, everyone\'s always connected."',
        '"The Wired is not an upper layer to the real world."',
        '"God is here with us in the Wired."'
      ];
      const aleatoria = quoteList[Math.floor(Math.random() * quoteList.length)];
      imprimirEnTerminal(aleatoria);
      break;

    case 'sudo':
      imprimirEnTerminal("ACCESO DENEGADO: El usuario actual no posee privilegios de administrador de la Wired.");
      break;

    case 'date':
    case 'time':
      imprimirEnTerminal(`TIMESTAMP ACTUAL: ${new Date().toLocaleString()}`);
      break;

    default:
      imprimirEnTerminal(`Comando no reconocido: "${comando}". Escribe 'help' para ver la lista de comandos.`);
      break;
  }
}

/* ==========================================
   6. CONEXIÓN DISCORD (LANYARD)
   ========================================== */
const DISCORD_ID = '546544317599318027';

async function cargarEstadoDiscord() {
  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
    } else {
      throw new Error('Lanyard: success=false');
    }
  } catch (error) {
    console.log('Error Lanyard:', error);
    const userEl = document.getElementById('discord-user');
    const statusEl = document.getElementById('discord-status');
    if (userEl) userEl.textContent = 'Sin conexión';
    if (statusEl) statusEl.textContent = 'No se pudo cargar Discord';
  }
}

/* ==========================================
   7. INICIALIZACIÓN (CUANDO EL DOM ESTÁ LISTO)
   ========================================== */
alCargarDOM(() => {
  // 7.1 Ocultar Pantalla de Carga (Boot Screen)
  setTimeout(() => {
    const boot = document.getElementById('boot-screen');
    if (boot) {
      boot.style.opacity = '0';
      boot.style.visibility = 'hidden';
      setTimeout(() => {
        boot.style.display = 'none';
      }, 500);
    }
  }, 1500);

  // 7.2 Discord Status (Lanyard)
  cargarEstadoDiscord();
  setInterval(cargarEstadoDiscord, 30000);

  // 7.2b Barra de progreso / volumen del reproductor
  inicializarBarraProgreso();

  // 7.3 Preferencias de Scanlines
  if (localStorage.getItem('scanlines_off') === 'true') {
    document.body.classList.add('no-scanlines');
  }

  // 7.4 Sonidos interactivos globales
  const elementosInteractivos = document.querySelectorAll('a, button, input, select');
  elementosInteractivos.forEach(el => {
    el.addEventListener('mouseenter', () => sonarEfecto(880, 0.03, 0.05, 'sine'));
    el.addEventListener('click', () => sonarEfecto(330, 0.06, 0.08, 'square'));
  });

  // 7.5 Ventana de frases arrastrable
  const ventanaFrases = document.getElementById("ventana-frases");
  const headerFrases = document.getElementById("ventana-frases-header");
  if (headerFrases && ventanaFrases) {
    hacerArrastrable(ventanaFrases, headerFrases);
  }

  // 7.6 Evento Enter en la Terminal CLI
  const inputTerminal = document.getElementById('terminal-input');
  if (inputTerminal) {
    inputTerminal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        ejecutarComandoCLI(inputTerminal.value);
        inputTerminal.value = '';
      }
    });
  }

  // 7.7 Modo lectura (recuerda preferencia guardada)
  if (localStorage.getItem('modo_lectura') === 'true') {
    document.body.classList.add('modo-lectura');
  }

  // 7.8 Sonido global, dial-up, typing effect y buscador
  actualizarBotonMute();
  reproducirDialUp();
  iniciarEfectoTyping();
  inicializarBuscadorBitacora();
});

/* ==========================================
   8. CÓDIGO KONAMI
   ========================================== */
const patronKonami = [
  'ArrowUp', 'ArrowUp', 
  'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 
  'ArrowLeft', 'ArrowRight', 
  'b', 'a'
];
let indiceKonami = 0;
const teclasIgnoradas = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];

window.addEventListener('keydown', (e) => {
  if (teclasIgnoradas.includes(e.key)) return;
  const teclaPresionada = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const teclaEsperada = patronKonami[indiceKonami];

  if (teclaPresionada === teclaEsperada) {
    indiceKonami++;
    if (e.key.startsWith('Arrow')) e.preventDefault();
    if (indiceKonami === patronKonami.length) {
      activarModoKonami();
      indiceKonami = 0;
    }
  } else {
    if (teclaPresionada === 'ArrowUp') {
      indiceKonami = 1;
      e.preventDefault();
    } else {
      indiceKonami = 0;
    }
  }
});

function activarModoKonami() {
  alert("¡CÓDIGO KONAMI ACTIVADO EN LA WIRED!");
  document.body.classList.toggle('modo-hacker');
}

/* ==========================================
   9. SCANLINES, DESCARGAS, TEMAS Y LIGHTBOX
   ========================================== */
function alternarScanlines() {
  document.body.classList.toggle('no-scanlines');
  const desactivado = document.body.classList.contains('no-scanlines');
  localStorage.setItem('scanlines_off', desactivado);
}

function descargarDibujo() {
  const canvasRed = document.getElementById('canvas-red-wired');
  if(!canvasRed) return;
  const enlace = document.createElement('a');
  enlace.download = 'wired_drawing.png';
  enlace.href = canvasRed.toDataURL('image/png');
  enlace.click();
}

function cambiarTema(tema) {
  if (tema === 'cyan') document.body.style.filter = 'none';
  else if (tema === 'green') document.body.style.filter = 'hue-rotate(80deg)';
  else if (tema === 'amber') document.body.style.filter = 'hue-rotate(180deg)';
  else if (tema === 'purple') document.body.style.filter = 'hue-rotate(270deg)';
}

document.addEventListener('DOMContentLoaded', () => {
  const imagenesGaleria = document.querySelectorAll('#galeria img');
  imagenesGaleria.forEach(img => {
    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.id = 'img-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(3, 3, 5, 0.92); display: flex; flex-direction: column;
        align-items: center; justify-content: center; z-index: 10000;
        cursor: pointer; backdrop-filter: blur(4px);
      `;
      modal.innerHTML = `
        <div style="position: relative; text-align: center;">
          <img src="${img.src}" alt="Zoom" style="max-width: 85vw; max-height: 80vh; border: 2px solid #00f0ff; box-shadow: 0 0 25px rgba(0, 240, 255, 0.5); display: block; margin: 0 auto;">
          <p style="color: #00ff66; font-family: 'Courier New', monospace; font-size: 0.8rem; margin-top: 10px; letter-spacing: 1px;">[ CLICK EN CUALQUIER LUGAR PARA CERRAR ]</p>
        </div>
      `;
      modal.onclick = () => modal.remove();
      document.body.appendChild(modal);
    });
  });
});

// Fluctuación de CPU/RAM de UI
setInterval(() => {
  const cpu = Math.floor(Math.random() * 35) + 20; 
  const ramBar = Math.floor(Math.random() * 15) + 25;
  const cpuVal = document.getElementById('cpu-val');
  const cpuBar = document.getElementById('cpu-bar');
  const ramBarEl = document.getElementById('ram-bar');

  if (cpuVal) cpuVal.textContent = `${cpu}%`;
  if (cpuBar) cpuBar.style.width = `${cpu}%`;
  if (ramBarEl) ramBarEl.style.width = `${ramBar}%`;
}, 2000);

/* ==========================================
   10. CANVA BACKGROUND
   ========================================== */
const canvas = document.getElementById('canvas-red-wired');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let part = [];
  const numPart = 65;
  let mouse = { x: null, y: null, radius: 150 };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  for (let i = 0; i < numPart; i++) {
    part.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 1.5 + 1
    });
  }

  function animarRed() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < part.length; i++) {
      let p = part[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.fill();

      for (let j = i + 1; j < part.length; j++) {
        let p2 = part[j];
        let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 120})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        let distMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (distMouse < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 255, 102, ${1 - distMouse / mouse.radius})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animarRed);
  }
  animarRed();
}

/* ==========================================
   11. SISTEMA DE ARRASTRE Y VENTANAS
   ========================================== */
function hacerArrastrable(elemento, barraTitulo) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  if (barraTitulo) barraTitulo.onmousedown = iniciarArrastre;
  else elemento.onmousedown = iniciarArrastre;

  function iniciarArrastre(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    elemento.style.right = 'auto';
    document.onmouseup = detenerArrastre;
    document.onmousemove = moverElemento;
  }

  function moverElemento(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elemento.style.top = (elemento.offsetTop - pos2) + "px";
    elemento.style.left = (elemento.offsetLeft - pos1) + "px";
  }

  function detenerArrastre() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function cerrarVentana(idVentana) {
  const ventana = document.getElementById(idVentana);
  if (ventana) ventana.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  const listaVentanas = [
    ['ventana-contador', 'ventana-contador-header'],
    ['ventana-notas',    'ventana-notas-header'],
    ['ventana-snake',    'ventana-snake-header'],
    ['ventana-status',   'ventana-status-header'],
    ['ventana-reloj',    'ventana-reloj-header'],
    ['ventana-lluvia',   'ventana-lluvia-header'],
    ['ventana-clima',    'ventana-clima-header']
  ];

  listaVentanas.forEach(([idVentana, idHeader]) => {
    const ventana = document.getElementById(idVentana);
    const header = document.getElementById(idHeader);
    if (ventana && header) hacerArrastrable(ventana, header);
  });
});

/* ==========================================
   12. NOTAS (MEMO) Y SNAKE
   ========================================== */
window.addEventListener('DOMContentLoaded', () => {
  const memo = document.getElementById('texto-memo');
  if (memo) {
    memo.value = localStorage.getItem('navi_memo') || '';
    memo.addEventListener('input', () => {
      localStorage.setItem('navi_memo', memo.value);
    });
  }
});

let snakeInterval = null;
function iniciarSnake() {
  const canvas = document.getElementById('snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const grid = 10;
  let score = 0;
  let snake = [{x: 100, y: 100}];
  let dx = grid, dy = 0;
  let food = {x: 50, y: 50};

  if (snakeInterval) clearInterval(snakeInterval);

  document.onkeydown = (e) => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -grid; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = grid; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -grid; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = grid; dy = 0; }
  };

  snakeInterval = setInterval(() => {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      clearInterval(snakeInterval);
      alert('GAME OVER - Score: ' + score);
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      document.getElementById('snake-score').textContent = score;
      food = {
        x: Math.floor(Math.random() * (canvas.width / grid)) * grid,
        y: Math.floor(Math.random() * (canvas.height / grid)) * grid
      };
    } else {
      snake.pop();
    }

    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0055'; 
    ctx.fillRect(food.x, food.y, grid - 1, grid - 1);
    ctx.fillStyle = '#00ff66'; 
    snake.forEach(part => ctx.fillRect(part.x, part.y, grid - 1, grid - 1));
  }, 100);
}

/* ==========================================
   SISTEMA DE LIBRO DE VISITAS GLOBAL (SUPABASE)
   ========================================== */

// 1. Inicializar cliente de Supabase de forma segura
const SUPABASE_URL = 'https://txyovdetsxlgenimgmdn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xwLLjhfJFoMlfzccO-yWYA_3l6Yh6FC';
let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.addEventListener('DOMContentLoaded', actualizarContadorVisitas);
} else {
  console.warn('[WIRED_OS] Supabase no estuvo disponible al inicializar.');
}

/* ==========================================
   CONTADOR DE VISITAS (SUPABASE)
   ========================================== */
async function actualizarContadorVisitas() {
  const elFlotante = document.getElementById('hit-counter');
  const elFooter = document.querySelector('.contador');
  if (!supabaseClient) return;

  // Si esta pestaña/sesión ya sumó una visita, solo mostramos el valor actual
  // sin volver a incrementar (evita que F5 / recargas infle el contador).
  const yaContadoEstaSesion = sessionStorage.getItem('visita_contada') === 'true';

  try {
    if (yaContadoEstaSesion) {
      // Solo leer y mostrar, sin sumar
      const { data: actual, error: errorLectura } = await supabaseClient
        .from('site_counter')
        .select('visits')
        .eq('id', 1)
        .single();

      if (errorLectura) throw errorLectura;

      const formateado = String(actual?.visits || 0).padStart(6, '0');
      if (elFlotante) elFlotante.textContent = formateado;
      if (elFooter) elFooter.textContent = `Visitas: [ ${formateado.split('').join(' ')} ]`;
      return;
    }

    // 1. Leer el valor actual
    const { data: actual, error: errorLectura } = await supabaseClient
      .from('site_counter')
      .select('visits')
      .eq('id', 1)
      .single();

    if (errorLectura) throw errorLectura;

    const nuevoValor = (actual?.visits || 0) + 1;

    // 2. Sumar 1 y guardar
    const { error: errorUpdate } = await supabaseClient
      .from('site_counter')
      .update({ visits: nuevoValor })
      .eq('id', 1);

    if (errorUpdate) throw errorUpdate;

    // Marcar esta sesión como ya contada (se resetea al cerrar el navegador/pestaña)
    sessionStorage.setItem('visita_contada', 'true');

    // 3. Mostrarlo en pantalla, con ceros a la izquierda (6 dígitos)
    const formateado = String(nuevoValor).padStart(6, '0');
    if (elFlotante) elFlotante.textContent = formateado;
    if (elFooter) elFooter.textContent = `Visitas: [ ${formateado.split('').join(' ')} ]`;
  } catch (error) {
    console.warn('[WIRED_OS] No se pudo actualizar el contador de visitas:', error);
  }
}

/* ==========================================
   13. SONIDO GLOBAL (MUTE) Y DIAL-UP
   ========================================== */
function actualizarBotonMute() {
  const btn = document.getElementById('btn-mute');
  if (!btn) return;
  const apagado = localStorage.getItem('sonido_off') === 'true';
  btn.textContent = apagado ? '[ 🔇 SONIDO ]' : '[ 🔊 SONIDO ]';
}

function alternarSonidoGlobal() {
  const apagado = localStorage.getItem('sonido_off') === 'true';
  localStorage.setItem('sonido_off', (!apagado).toString());
  actualizarBotonMute();
}

function reproducirDialUp() {
  if (localStorage.getItem('sonido_off') === 'true') return;
  if (sessionStorage.getItem('dialup_reproducido') === 'true') return;
  sessionStorage.setItem('dialup_reproducido', 'true');

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tonos = [420, 620, 300, 900, 500, 750];
    tonos.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }, i * 150);
    });
  } catch (e) {}
}

/* ==========================================
   14. EFECTO DE ESCRITURA (TYPING) EN EL TÍTULO
   ========================================== */
function iniciarEfectoTyping() {
  const titulo = document.querySelector('.glitch-title');
  if (!titulo) return;
  const textoFinal = titulo.textContent;
  titulo.textContent = '';
  let i = 0;
  const intervalo = setInterval(() => {
    titulo.textContent += textoFinal[i];
    i++;
    if (i >= textoFinal.length) {
      clearInterval(intervalo);
      iniciarGlitchAleatorio(titulo);
    }
  }, 60);
}

/* ==========================================
   15. GLITCH ALEATORIO DEL TÍTULO
   ========================================== */
function iniciarGlitchAleatorio(titulo) {
  setInterval(() => {
    titulo.classList.add('glitch-activo');
    setTimeout(() => titulo.classList.remove('glitch-activo'), 250);
  }, 4000 + Math.random() * 4000);
}

/* ==========================================
   16. MODO LECTURA
   ========================================== */
function alternarModoLectura() {
  document.body.classList.toggle('modo-lectura');
  localStorage.setItem('modo_lectura', document.body.classList.contains('modo-lectura'));
}

/* ==========================================
   17. BUSCADOR DE BITÁCORA
   ========================================== */
function inicializarBuscadorBitacora() {
  const input = document.getElementById('buscador-bitacora');
  const vacio = document.getElementById('buscador-vacio');
  if (!input) return;

  input.addEventListener('input', () => {
    const termino = input.value.trim().toLowerCase();
    const posts = document.querySelectorAll('#entradas .post');
    let visibles = 0;

    posts.forEach(post => {
      const texto = post.textContent.toLowerCase();
      const coincide = texto.includes(termino);
      post.style.display = coincide ? '' : 'none';
      if (coincide) visibles++;
    });

    if (vacio) vacio.style.display = (visibles === 0) ? 'block' : 'none';
  });
}

let dibujandoGuest = false;
let ctxGuest = null;

// Inicialización del Canvas y carga de entradas al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('guest-canvas');
  if (!canvas) return;

  ctxGuest = canvas.getContext('2d');
  
  // Fondo oscuro inicial del canvas
  ctxGuest.fillStyle = "#030305";
  ctxGuest.fillRect(0, 0, canvas.width, canvas.height);

  // Eventos de dibujo (Mouse)
  canvas.addEventListener('mousedown', (e) => {
    dibujandoGuest = true;
    ctxGuest.beginPath();
    ctxGuest.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!dibujandoGuest) return;
    ctxGuest.strokeStyle = '#00ff66'; // Trazo neón
    ctxGuest.lineWidth = 2;
    ctxGuest.lineCap = 'round';
    ctxGuest.lineTo(e.offsetX, e.offsetY);
    ctxGuest.stroke();
  });

  window.addEventListener('mouseup', () => {
    dibujandoGuest = false;
  });

  // Cargar las firmas globales existentes en la nube
  cargarEntradasGuest();
});

// Limpiar el área de dibujo
function limpiarCanvasGuest() {
  const canvas = document.getElementById('guest-canvas');
  if (canvas && ctxGuest) {
    ctxGuest.fillStyle = "#030305";
    ctxGuest.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// Guardar la firma directamente en Supabase
async function guardarEntradaGuest() {
  if (!supabaseClient) {
    alert('No hay conexión con el servidor Supabase.');
    return;
  }

  const nombreInput = document.getElementById('guest-nombre');
  const mensajeInput = document.getElementById('guest-mensaje');
  const canvas = document.getElementById('guest-canvas');

  const nombre = nombreInput ? nombreInput.value.trim() : 'Anónimo_Wired';
  const mensaje = mensajeInput ? mensajeInput.value.trim() : '';

  if (!mensaje) {
    alert('Escribe un mensaje antes de transmitir a la red.');
    return;
  }

  // Convertir el lienzo a imagen Base64
  const dibujoBase64 = canvas ? canvas.toDataURL('image/png') : null;

  // Insertar en la base de datos remota
  const { data, error } = await supabaseClient
    .from('guestbook')
    .insert([
      { 
        nombre: nombre, 
        mensaje: mensaje, 
        dibujo: dibujoBase64 
      }
    ]);

  if (error) {
    console.error('Error al guardar en Supabase:', error);
    alert('Error al conectar con el nodo central.');
    return;
  }

  // Limpiar interfaz y recargar la lista global
  if (mensajeInput) mensajeInput.value = '';
  limpiarCanvasGuest();
  cargarEntradasGuest();
}

// Obtener y renderizar todas las firmas desde la nube
async function cargarEntradasGuest() {
  const contenedor = document.getElementById('guestbook-historial');
  if (!contenedor || !supabaseClient) return;

  contenedor.innerHTML = '<p style="color: #00f0ff; font-size: 0.8rem;">Sincronizando con el nodo...</p>';

  // Consultar la base de datos ordenada de más reciente a más antigua
  const { data: entradas, error } = await supabaseClient
    .from('guestbook')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al consultar firmas:', error);
    contenedor.innerHTML = '<p style="color: #ff0055; font-size: 0.8rem;">Error de conexión con la red.</p>';
    return;
  }

  contenedor.innerHTML = '';

  if (!entradas || entradas.length === 0) {
    contenedor.innerHTML = '<p style="color: #666; font-size: 0.8rem;">No hay firmas globales aún. ¡Sé el primero!</p>';
    return;
  }

  entradas.forEach(e => {
    const card = document.createElement('div');
    card.style.cssText = `
      border: 1px solid #00f0ff;
      background: rgba(0, 240, 255, 0.04);
      padding: 8px;
      margin-bottom: 10px;
      font-family: 'Courier New', monospace;
    `;

    const fechaFormateada = new Date(e.created_at).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    card.innerHTML = `
      <div style="color: #00ff66; font-size: 0.85rem; font-weight: bold; display: flex; justify-content: space-between;">
        <span>> ${e.nombre}</span>
        <span style="color: #888; font-size: 0.75rem;">${fechaFormateada}</span>
      </div>
      <p style="color: #fff; font-size: 0.85rem; margin: 6px 0;">${e.mensaje}</p>
      ${e.dibujo ? `<img src="${e.dibujo}" style="border: 1px solid #00ff66; max-width: 100%; height: auto; display: block; margin-top: 5px;">` : ''}
    `;

    contenedor.appendChild(card);
  });
}