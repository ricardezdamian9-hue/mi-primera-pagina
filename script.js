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
  { titulo: "02. Cyberpunk Ambient Track", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
  // Para agregar más pistas, usa un link DIRECTO a un archivo de audio
  // (termina en .mp3/.ogg/.wav), nunca un link de youtube.com — el
  // reproductor no puede leer eso. Ver explicación completa en el chat.
];

let indiceActual = 0;

function cargarPista(index) {
  const audioPlayer = document.getElementById('reproductor-main');
  const tituloPista = document.getElementById('titulo-pista');
  const selectPlaylist = document.getElementById('select-playlist');
  if (!audioPlayer) return;

  indiceActual = index;
  const pista = listaCanciones[index];
  audioPlayer.src = pista.url;
  if (tituloPista) tituloPista.textContent = pista.titulo;
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
   4B. COMANDOS SECRETOS DE LA TERMINAL (EASTER EGGS)
   ========================================== */
const secretosWired = [
  {
    id: 'lain',
    comandos: ['lain'],
    nombre: 'Capa Oculta // Serial Experiments Lain',
    accion: () => {
      imprimirEnTerminal('[ACCESO CONCEDIDO] Descifrando canal oculto...');
      abrirVentanaSecreta();
    }
  },
  {
    id: 'jojo',
    comandos: ['za warudo', 'jojo', 'toki wo tomare'],
    nombre: 'ZA WARUDO // JoJo\'s Bizarre Adventure',
    accion: () => {
      imprimirEnTerminal('¡TOKI WO TOMARE!\n> El tiempo se ha detenido...');
      activarTiempoDetenido();
    }
  },
  {
    id: 'akira',
    comandos: ['akira', 'tetsuo', 'neo-tokyo', 'neo tokyo'],
    nombre: 'Neo-Tokyo // Akira',
    accion: () => {
      imprimirEnTerminal('NEO-TOKYO ESTÁ A PUNTO DE...\n[ADVERTENCIA] Nivel de energía psíquica crítico detectado.\n> TETSUOOOOO!!');
    }
  },
  {
    id: 'evangelion',
    comandos: ['eva', 'nerv', 'shinji', 'unit 01'],
    nombre: 'Unidad EVA // Neon Genesis Evangelion',
    accion: () => {
      imprimirEnTerminal('SINCRONIZACIÓN: 400%...\n[ALERTA] PATTERN ORANGE DETECTADO.\n> No huyas.');
    }
  },
  {
    id: 'mgs',
    comandos: ['metal gear', 'snake', 'codec'],
    nombre: 'Alerta de Infiltración // Metal Gear Solid',
    accion: () => {
      imprimirEnTerminal('!\n[ALERTA] Has sido detectado.\n> Iniciando protocolo de infiltración...');
      activarAlertaMGS();
      sonarEfecto(880, 0.15, 0.08, 'square');
    }
  },
  {
    id: 'pokemon',
    comandos: ['pokemon', 'pikachu'],
    nombre: 'Encuentro Salvaje // Pokémon',
    accion: () => {
      imprimirEnTerminal('¡Un PIKACHU salvaje apareció!\n> ¿Qué debería hacer NAVI_OS?\n[ LUCHAR ]  [ CAPTURAR ]  [ HUIR ]');
    }
  }
];

function revisarComandoSecreto(comandoCompleto) {
  for (const secreto of secretosWired) {
    if (secreto.comandos.includes(comandoCompleto)) {
      secreto.accion();
      registrarSecreto(secreto.id, secreto.nombre);
      return true;
    }
  }
  return false;
}

function registrarSecreto(id, nombre) {
  const encontrados = JSON.parse(localStorage.getItem('secretos_encontrados') || '[]');
  if (!encontrados.includes(id)) {
    encontrados.push(id);
    localStorage.setItem('secretos_encontrados', JSON.stringify(encontrados));
    setTimeout(() => imprimirEnTerminal(`[LOGRO DESBLOQUEADO] ${nombre}`), 300);
  }
  actualizarWidgetSecretos();
}

function actualizarWidgetSecretos() {
  const contador = document.getElementById('secretos-contador');
  const lista = document.getElementById('secretos-lista');
  if (!contador || !lista) return;

  const encontrados = JSON.parse(localStorage.getItem('secretos_encontrados') || '[]');
  contador.textContent = `${encontrados.length} / ${secretosWired.length}`;

  lista.innerHTML = '';
  secretosWired.forEach(secreto => {
    const item = document.createElement('li');
    item.style.marginBottom = '3px';
    if (encontrados.includes(secreto.id)) {
      item.style.color = '#00ff66';
      item.textContent = `✓ ${secreto.nombre}`;
    } else {
      item.style.color = '#555';
      item.textContent = '??? // secreto sin descubrir';
    }
    lista.appendChild(item);
  });
}

// Easter egg visual: congela la pantalla estilo "Za Warudo"
function activarTiempoDetenido() {
  document.body.classList.add('tiempo-detenido');
  setTimeout(() => {
    document.body.classList.remove('tiempo-detenido');
    imprimirEnTerminal('> El tiempo vuelve a correr...');
  }, 3000);
}

// Easter egg visual: flash rojo de alerta estilo Metal Gear Solid
function activarAlertaMGS() {
  const overlay = document.createElement('div');
  overlay.className = 'alerta-mgs';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1200);
}

/* ==========================================
   5C. GALERÍA POR CATEGORÍAS (vista previa oculta)
   ========================================== */
function cambiarCategoriaGaleria(categoria, boton) {
  document.querySelectorAll('.categoria-imgs').forEach(div => {
    div.style.display = (div.dataset.categoria === categoria) ? 'flex' : 'none';
  });
  document.querySelectorAll('.tab-galeria').forEach(btn => btn.classList.remove('activo'));
  if (boton) boton.classList.add('activo');
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

  // Revisa primero si es un comando secreto (no aparece en 'help')
  if (revisarComandoSecreto(inputLimpio.toLowerCase())) return;

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
   5B. ARCHIVO / TIMELINE + COMPARTIR EN LA WIRED
   ========================================== */
function inicializarArchivoYCompartir() {
  const posts = document.querySelectorAll('#entradas .post');
  const contenedorArchivo = document.getElementById('lista-archivo');
  if (!contenedorArchivo) return;

  if (posts.length === 0) {
    contenedorArchivo.innerHTML = '<p style="color:#666; font-size:0.8rem;">No hay entradas registradas todavía.</p>';
    return;
  }

  contenedorArchivo.innerHTML = '';

  posts.forEach((post, index) => {
    // Asignar un ID único al post si no tiene uno (para poder enlazarlo)
    if (!post.id) post.id = `post-${index + 1}`;

    const fechaEl = post.querySelector('.fecha');
    const tituloEl = post.querySelector('h3');
    const fechaTexto = fechaEl ? fechaEl.textContent.replace(/[\[\]]/g, '').trim() : 'FECHA DESCONOCIDA';
    const tituloTexto = tituloEl ? tituloEl.textContent.trim() : 'Sin título';

    // Línea en el timeline apuntando directo al post
    const linea = document.createElement('div');
    linea.className = 'linea-archivo';
    linea.innerHTML = `<a href="#${post.id}">
        <span class="archivo-fecha">${fechaTexto}</span>
        <span class="archivo-titulo">${tituloTexto}</span>
      </a>`;
    contenedorArchivo.appendChild(linea);
  });
}

/* ==========================================
   5C. JSON-LD (SCHEMA.ORG) GENERADO DESDE LOS POSTS
   ------------------------------------------------
   Lee cada .post (fecha, título, id) y arma un bloque
   application/ld+json tipo "Blog" con sus "BlogPosting".
   Se regenera solo, así que no hay que tocar nada a mano
   cuando agregás una entrada nueva: solo asegurate de que
   el nuevo <article class="post"> tenga un id único
   (post-4, post-5, ...) como los que ya existen.
   ========================================== */
function generarJSONLD() {
  const posts = document.querySelectorAll('#entradas .post');
  if (posts.length === 0) return;

  const urlBase = window.location.href.split('#')[0];
  const blogPostings = [];

  posts.forEach(post => {
    const fechaEl = post.querySelector('.fecha');
    const tituloEl = post.querySelector('h3');
    const parrafoEl = post.querySelector('p');
    if (!tituloEl) return;

    // La fecha viene como "[ FECHA: 2026.07.26 // LAYER_01 ]" -> extraemos YYYY.MM.DD
    let fechaISO = null;
    if (fechaEl) {
      const match = fechaEl.textContent.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (match) fechaISO = `${match[1]}-${match[2]}-${match[3]}`;
    }

    blogPostings.push({
      "@type": "BlogPosting",
      "headline": tituloEl.textContent.trim(),
      "url": `${urlBase}#${post.id}`,
      ...(fechaISO ? { "datePublished": fechaISO } : {}),
      "description": parrafoEl ? parrafoEl.textContent.trim().slice(0, 200) : ""
    });
  });

  const datosLD = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Layer 01 // WIRED ACCESS",
    "url": urlBase,
    "blogPost": blogPostings
  };

  // Si ya existe un bloque generado por nosotros, lo reemplazamos en vez de duplicarlo
  const existente = document.getElementById('json-ld-blog');
  if (existente) existente.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'json-ld-blog';
  script.textContent = JSON.stringify(datosLD, null, 2);
  document.head.appendChild(script);
}

/* ==========================================
   5D. WIDGET DECORATIVO: NODE_PING
   ------------------------------------------------
   100% cosmético: simula líneas de "ping" a nodos
   inventados de la Wired. No mide latencia real ni
   se conecta a ningún servidor para esto.
   ========================================== */
const nodosFalsos = ['wired.node', 'psyche.layer', 'navi.core', 'protocol_7', 'copland.os'];
function inicializarPingDecorativo() {
  const contenedor = document.getElementById('ping-terminal');
  if (!contenedor) return;

  function agregarLinea() {
    const nodo = nodosFalsos[Math.floor(Math.random() * nodosFalsos.length)];
    const ms = Math.floor(Math.random() * 90 + 8);
    const ok = ms < 70;
    const linea = document.createElement('p');
    linea.className = ok ? 'ping-ok' : 'ping-warn';
    linea.textContent = `[ ${ok ? ' OK ' : 'WARN'} ] PING ${nodo}... ${ms}ms`;
    contenedor.appendChild(linea);

    // Mantener solo las últimas 5 líneas visibles
    while (contenedor.children.length > 5) {
      contenedor.removeChild(contenedor.firstChild);
    }
  }

  agregarLinea();
  setInterval(agregarLinea, 3500);
}

/* ==========================================
   5E. MODO GLITCH TOTAL (decorativo, aleatorio y poco frecuente)
   ------------------------------------------------
   Cada cierto tiempo (entre ~45s y ~105s) agrega por 1.2s una
   clase al <body> que dispara la animación glitchTotal del CSS
   (aberración cromática + desplazamiento + recorte). Se detiene
   solo con setTimeout, no interfiere con el resto del sitio.
   No se dispara si el visitante tiene "modo lectura" activo,
   para no interrumpir la lectura.
   ========================================== */
function inicializarGlitchTotal() {
  function dispararGlitch() {
    const desactivado = localStorage.getItem('glitch_off') === 'true';
    if (!desactivado && !document.body.classList.contains('modo-lectura')) {
      document.body.classList.add('glitch-total-activo');
      setTimeout(() => document.body.classList.remove('glitch-total-activo'), 1300);
    }
    const proximoEn = 45000 + Math.random() * 60000; // entre 45s y 105s
    setTimeout(dispararGlitch, proximoEn);
  }
  // Primer disparo entre 20s y 40s después de cargar (no apenas entra)
  setTimeout(dispararGlitch, 20000 + Math.random() * 20000);
}

// Activa/desactiva el modo glitch total desde el widget VIEW_OPTIONS.
// Se guarda en localStorage para que la preferencia se recuerde entre visitas.
function alternarModoGlitch() {
  const apagadoActual = localStorage.getItem('glitch_off') === 'true';
  const nuevoApagado = !apagadoActual;
  localStorage.setItem('glitch_off', nuevoApagado);

  // Si lo están apagando justo en medio de un glitch, lo corta al instante
  if (nuevoApagado) {
    document.body.classList.remove('glitch-total-activo');
  }

  actualizarBotonModoGlitch();
}

function actualizarBotonModoGlitch() {
  const btn = document.getElementById('btn-glitch-toggle');
  if (!btn) return;
  const apagado = localStorage.getItem('glitch_off') === 'true';
  btn.textContent = apagado ? '[ GLITCH: OFF ]' : '[ GLITCH: ON ]';
}

function compartirPagina() {
  const url = window.location.href;

  // Si el navegador soporta compartir nativo (móviles sobre todo), lo usamos
  if (navigator.share) {
    navigator.share({
      title: document.title,
      text: 'Échale un vistazo a mi nodo en la Wired:',
      url: url
    }).catch(() => {});
    return;
  }

  // Si no, copiamos el link al portapapeles
  navigator.clipboard.writeText(url).then(() => {
    mostrarAvisoCompartir('[ LINK DE LA PÁGINA COPIADO AL PORTAPAPELES ]');
  }).catch(() => {
    mostrarAvisoCompartir('[ NO SE PUDO COPIAR EL LINK ]');
  });
}

function mostrarAvisoCompartir(mensaje) {
  const aviso = document.createElement('div');
  aviso.textContent = mensaje;
  aviso.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #0d0d12; color: #00ff66; border: 1px solid #00ff66;
    padding: 8px 16px; font-family: 'Courier New', monospace; font-size: 0.8rem;
    z-index: 10000; box-shadow: 0 0 15px rgba(0,255,102,0.4);
  `;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), 2500);
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

  // 7.9 Archivo/Timeline y botones de compartir (se generan a partir de los posts)
  inicializarArchivoYCompartir();

  // 7.10 Widget de logros de comandos secretos (recuerda lo ya encontrado)
  actualizarWidgetSecretos();

  // 7.11 JSON-LD para SEO (se genera solo a partir de los posts existentes)
  generarJSONLD();

  // 7.12 Widget decorativo de "ping" de red (100% visual, no mide nada real)
  inicializarPingDecorativo();

  // 7.13 Contador de comentarios por post (cuántos hay, sin cargarlos aún)
  inicializarContadoresComentarios();

  // 7.14 Modo glitch total (decorativo, se dispara solo cada tanto)
  inicializarGlitchTotal();
  actualizarBotonModoGlitch();
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
  const imagenesGaleria = document.querySelectorAll('#galeria img, .grid-posters img');
  imagenesGaleria.forEach(img => {
    img.addEventListener('click', () => {
      const link = img.dataset.link; // solo los posters tienen data-link
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
          ${link ? `<a href="${link}" target="_blank" rel="noopener" class="btn-retro-mini" style="display:inline-block; margin-top:10px; text-decoration:none;">[ VISITAR SITIO ]</a>` : ''}
          <p style="color: #00ff66; font-family: 'Courier New', monospace; font-size: 0.8rem; margin-top: 10px; letter-spacing: 1px;">[ CLICK FUERA DE LA IMAGEN PARA CERRAR ]</p>
        </div>
      `;
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      document.body.appendChild(modal);
    });
  });
});

/* ==========================================
   11. ANILIST STATUS
   ========================================== */
async function cargarAniList() {
  const widget = document.getElementById('anilist-widget');
  if (!widget) return;
  const query = `
    query ($name: String) {
      MediaListCollection(userName: $name, type: ANIME, status: CURRENT) {
        lists { entries { media { title { romaji } coverImage { medium } } progress } }
      }
    }`;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { name: 'Tonyrv' } })
    });
    const data = await res.json();
    const entry = data.data.MediaListCollection.lists[0]?.entries[0];
    if (entry) {
      widget.innerHTML = `
        <img src="${entry.media.coverImage.medium}" style="width:60px; border:1px solid #00f0ff; margin-bottom:5px;">
        <p style="color:#00ff66; margin:0;">${entry.media.title.romaji}</p>
        <p style="color:#888; font-size:0.7rem; margin:0;">EP ${entry.progress}</p>`;
    } else {
      widget.textContent = 'Nada en emisión ahora mismo.';
    }
  } catch {
    widget.textContent = 'No se pudo conectar a AniList.';
  }
}
cargarAniList();

/* ==========================================
   13. CUENTA REGRESIVA A PRÓXIMOS EVENTOS
   ========================================== */
// Agrega/edita aquí tus eventos. El mes va de 0 a 11 (0=enero, 9=octubre, 11=diciembre).
// El año NO es necesario: la función calcula solo el próximo que ocurra (este año o el que sigue).
const EVENTOS = [
  { nombre: 'HALLOWEEN', mes: 9, dia: 31 },
  { nombre: 'NAVIDAD', mes: 11, dia: 25 },
  { nombre: 'AÑO NUEVO', mes: 0, dia: 1 },
];

function proximoEvento() {
  const ahora = new Date();
  let candidatos = EVENTOS.map(ev => {
    let fecha = new Date(ahora.getFullYear(), ev.mes, ev.dia, 0, 0, 0);
    if (fecha < ahora) fecha = new Date(ahora.getFullYear() + 1, ev.mes, ev.dia, 0, 0, 0);
    return { nombre: ev.nombre, fecha };
  });
  candidatos.sort((a, b) => a.fecha - b.fecha);
  return candidatos[0];
}

function actualizarContadorEventos() {
  const widget = document.getElementById('evento-widget');
  if (!widget) return;

  const evento = proximoEvento();
  const diff = evento.fecha - new Date();

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const segs = Math.floor((diff / 1000) % 60);

  widget.innerHTML = `
    <p style="color:#ff0055; font-weight:bold; margin-bottom:4px;">${evento.nombre}</p>
    <p style="color:#00ff66; font-size:1rem; font-weight:bold; margin:0;">${dias}d ${horas}h ${mins}m ${segs}s</p>
  `;
}

actualizarContadorEventos();
setInterval(actualizarContadorEventos, 1000);

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

// Easter egg: solo se llama cuando se escribe el comando secreto en la terminal
function abrirVentanaSecreta() {
  const ventana = document.getElementById('ventana-secreta');
  if (ventana) ventana.style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  const listaVentanas = [
    ['ventana-contador', 'ventana-contador-header'],
    ['ventana-notas',    'ventana-notas-header'],
    ['ventana-status',   'ventana-status-header'],
    ['ventana-reloj',    'ventana-reloj-header'],
    ['ventana-lluvia',   'ventana-lluvia-header'],
    ['ventana-clima',    'ventana-clima-header'],
    ['ventana-secreta',  'ventana-secreta-header']
  ];

  listaVentanas.forEach(([idVentana, idHeader]) => {
    const ventana = document.getElementById(idVentana);
    const header = document.getElementById(idHeader);
    if (ventana && header) hacerArrastrable(ventana, header);
  });
});

/* ==========================================
   12. NOTAS (MEMO)
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
   REGISTRO DISCRETO DE ORIGEN DE VISITAS
   ========================================== */
async function registrarOrigenVisita() {
  if (!supabaseClient) return;
  try {
    const geoRes = await fetch('https://ipapi.co/json/');
    const geo = await geoRes.json();

    await supabaseClient.from('visitas_log').insert({
      referrer: document.referrer || 'directo',
      pais: geo.country_name || null,
      ciudad: geo.city || null,
    });
  } catch {
    // Si falla la geolocalización, simplemente no se registra ese dato — no afecta el resto del sitio
  }
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

    // Sumar 1 directamente en la base de datos con una función RPC segura
    // (evita que dos visitas simultáneas se pisen y evita dejar un UPDATE
    // abierto que cualquiera pudiera usar para poner el contador en 0).
    const { data: nuevoValor, error: errorRpc } = await supabaseClient.rpc('sumar_visita');

    if (errorRpc) throw errorRpc;

    // Marcar esta sesión como ya contada (se resetea al cerrar el navegador/pestaña)
    sessionStorage.setItem('visita_contada', 'true');
    registrarOrigenVisita(); // registro silencioso de país/ciudad/referrer, no se muestra en pantalla

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

/* ==========================================
   18. COMENTARIOS POR POST (SUPABASE, tabla "comentarios")
   ------------------------------------------------
   Usa una tabla separada de la del guestbook, con una
   columna post_id que la liga a cada <article class="post">
   por su id (post-1, post-2, ...). Ver
   supabase_setup_4_comentarios.sql para crear la tabla.
   ========================================== */

// Recordar qué post-id ya cargó sus comentarios, para no pedirlos de nuevo cada vez que se abre/cierra
const comentariosYaCargados = new Set();

// --- LÍMITE DE REACCIONES POR PERSONA EN COMENTARIOS (guardado en este navegador) ---
// Misma idea que en el guestbook.html: se guarda en localStorage qué ids de
// comentarios ya recibieron like/reporte desde este navegador, para no dejar
// repetir la reacción. Usa una clave distinta a la del guestbook.
function obtenerReaccionesLocalesComentarios() {
  try {
    const datos = JSON.parse(localStorage.getItem('wired_reacciones_comentarios'));
    return datos && datos.likes && datos.reportes ? datos : { likes: [], reportes: [] };
  } catch (e) {
    return { likes: [], reportes: [] };
  }
}

function guardarReaccionLocalComentario(campo, id) {
  const datos = obtenerReaccionesLocalesComentarios();
  if (!datos[campo].includes(id)) datos[campo].push(id);
  localStorage.setItem('wired_reacciones_comentarios', JSON.stringify(datos));
}

function alternarComentarios(postId, btn) {
  const contenedor = document.getElementById(`comentarios-${postId}`);
  if (!contenedor) return;

  const abrir = contenedor.style.display === 'none';
  contenedor.style.display = abrir ? 'block' : 'none';

  if (btn) {
    const contadorSpan = btn.querySelector('.contador-comentarios');
    const textoContador = contadorSpan ? contadorSpan.outerHTML : '';
    btn.innerHTML = (abrir ? '[ OCULTAR COMENTARIOS ' : '[ VER COMENTARIOS ') + textoContador + ' ]';
  }

  if (abrir && !comentariosYaCargados.has(postId)) {
    cargarComentarios(postId);
  }
}

async function cargarComentarios(postId) {
  const lista = document.getElementById(`comentarios-lista-${postId}`);
  if (!lista || !supabaseClient) return;

  lista.innerHTML = '<p style="color:#00f0ff; font-size:0.75rem;">Sincronizando con el nodo...</p>';

  const { data: comentarios, error } = await supabaseClient
    .from('comentarios')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al consultar comentarios:', error);
    lista.innerHTML = '<p style="color:#ff0055; font-size:0.75rem;">Error de conexión con la red.</p>';
    return;
  }

  comentariosYaCargados.add(postId);
  lista.innerHTML = '';

  if (!comentarios || comentarios.length === 0) {
    lista.innerHTML = '<p style="color:#666; font-size:0.75rem;">Aún no hay comentarios en esta entrada. ¡Sé el primero!</p>';
  } else {
    const reaccionesLocales = obtenerReaccionesLocalesComentarios();

    comentarios.forEach(c => {
      const item = document.createElement('div');
      item.className = 'comentario-item';
      const fecha = new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

      const yaDioLike = reaccionesLocales.likes.includes(c.id);
      const yaReporto = reaccionesLocales.reportes.includes(c.id);

      item.innerHTML = `
        <div class="comentario-cabecera">
          <span>> ${c.nombre || 'Anónimo_Wired'}</span>
          <span class="comentario-fecha">${fecha}</span>
        </div>
        <p class="comentario-texto"></p>
        <div class="comentario-reacciones" style="display:flex; gap:8px; margin-top:6px; align-items:center;">
          <button data-id="${c.id}" data-accion="like" ${yaDioLike ? 'disabled' : ''} style="background: transparent; color: #ff0055; border: 1px solid #ff0055; padding: 2px 8px; font-size: 0.7rem; cursor: pointer; ${yaDioLike ? 'opacity: 0.5; cursor: not-allowed;' : ''}">❤ <span data-likes>${c.likes || 0}</span></button>
          <button data-id="${c.id}" data-accion="reportar" ${yaReporto ? 'disabled' : ''} style="background: transparent; color: #666; border: 1px solid #666; padding: 2px 8px; font-size: 0.7rem; cursor: pointer; ${yaReporto ? 'opacity: 0.5; cursor: not-allowed;' : ''}">${yaReporto ? '🚩 Reportado' : '🚩 Reportar'}</button>
        </div>
      `;
      // Se asigna como texto (no innerHTML) para no permitir HTML/scripts inyectados en el mensaje
      item.querySelector('.comentario-texto').textContent = c.mensaje;

      item.querySelector('[data-accion="like"]').addEventListener('click', (ev) => {
        reaccionarComentario(c.id, 'likes', ev.currentTarget);
      });
      item.querySelector('[data-accion="reportar"]').addEventListener('click', (ev) => {
        reaccionarComentario(c.id, 'reportes', ev.currentTarget, true);
      });

      lista.appendChild(item);
    });
  }

  actualizarContadorComentarios(postId, (comentarios || []).length);
}

async function enviarComentario(postId, btn) {
  if (!supabaseClient) {
    alert('No hay conexión con el servidor Supabase.');
    return;
  }

  const contenedor = document.getElementById(`comentarios-${postId}`);
  if (!contenedor) return;

  const nombreInput = contenedor.querySelector('.comentario-nombre');
  const mensajeInput = contenedor.querySelector('.comentario-mensaje');

  const nombre = nombreInput ? nombreInput.value.trim().slice(0, 40) : '';
  const mensaje = mensajeInput ? mensajeInput.value.trim().slice(0, 500) : '';

  if (!mensaje) {
    alert('Escribe un comentario antes de transmitirlo a la red.');
    return;
  }

  const { error } = await supabaseClient
    .from('comentarios')
    .insert([{ post_id: postId, nombre: nombre || 'Anónimo_Wired', mensaje: mensaje }]);

  if (error) {
    console.error('Error al guardar comentario:', error);
    alert('Error al conectar con el nodo central.');
    return;
  }

  if (mensajeInput) mensajeInput.value = '';
  comentariosYaCargados.delete(postId); // forzar recarga completa para traer el nuevo comentario
  cargarComentarios(postId);
}

// Suma 1 al campo indicado ('likes' o 'reportes') de un comentario.
// Usa las funciones RPC seguras (sumar_like_comentario / sumar_reporte_comentario)
// en vez de un UPDATE directo, igual que se hace con las firmas del guestbook,
// para que un visitante solo pueda sumar +1 y nunca reescribir el comentario ajeno.
// Ver supabase_setup_5_comentarios_reacciones.sql.
async function reaccionarComentario(id, campo, boton, esReporte = false) {
  if (!supabaseClient) return;
  boton.disabled = true;

  const nombreFuncion = esReporte ? 'sumar_reporte_comentario' : 'sumar_like_comentario';
  const { error: errorRpc } = await supabaseClient.rpc(nombreFuncion, { fila_id: id });

  if (errorRpc) {
    console.error('Error al reaccionar al comentario:', errorRpc);
    boton.disabled = false;
    return;
  }

  if (esReporte) {
    boton.textContent = '🚩 Reportado';
  } else {
    const spanLikes = boton.querySelector('[data-likes]');
    if (spanLikes) spanLikes.textContent = (parseInt(spanLikes.textContent, 10) || 0) + 1;
  }

  // Se guarda para que esta persona no pueda repetir la reacción en este comentario
  guardarReaccionLocalComentario(campo, id);
  boton.disabled = true;
  boton.style.opacity = '0.5';
  boton.style.cursor = 'not-allowed';
}

function actualizarContadorComentarios(postId, cantidad) {
  document.querySelectorAll(`.contador-comentarios[data-post-id="${postId}"]`).forEach(span => {
    span.textContent = `(${cantidad})`;
  });
}

// Al cargar la página, pedimos solo la CANTIDAD de comentarios de cada post (no el contenido)
// para mostrar el número en el botón sin gastar de más antes de que el usuario abra la sección.
async function inicializarContadoresComentarios() {
  if (!supabaseClient) return;
  const spans = document.querySelectorAll('.contador-comentarios[data-post-id]');
  const postIds = [...new Set([...spans].map(s => s.dataset.postId))];

  for (const postId of postIds) {
    const { count, error } = await supabaseClient
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (!error && typeof count === 'number') {
      actualizarContadorComentarios(postId, count);
    }
  }
}