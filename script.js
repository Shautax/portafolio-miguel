'use strict';

// Datos del visor. Las tarjetas permanecen en HTML para funcionar sin JavaScript.
const projects = [
  {
    title: 'Tu ruta. Tu estilo.',
    category: 'Social media / Willy Helmets',
    image: 'assets/willy-helmets.png',
    alt: 'Publicación original de Willy Helmets con casco blanco y paisaje tropical.',
    description: 'Diseño para redes sociales que combina fotografía de producto, una jerarquía tipográfica contundente y un mensaje de marca directo. Se muestra la captura original proporcionada.'
  },
  {
    title: 'El producto, protagonista.',
    category: 'Campaña / Grupo Moto 11',
    image: 'assets/moto11-caucho.jpeg',
    alt: 'Campaña de caucho 90 90 18 TT de Grupo Moto 11.',
    description: 'Pieza promocional que organiza producto, oferta y condiciones mediante contraste, escala y una composición en rojo, blanco y negro.'
  },
  {
    title: 'Un mensaje que convoca.',
    category: 'Eventos / CNJD 2024',
    image: 'assets/cnjd-2024.jpeg',
    alt: 'Diseño de CNJD 2024 con Herly Soto.',
    description: 'Comunicación visual para la Convención Nacional de Jóvenes y Damas 2024. Integra retrato, información del evento y recursos gráficos en una composición de alto impacto.'
  },
  {
    title: 'Diseño con fuerza comercial.',
    category: 'Campaña / Grupo Moto 11',
    image: 'assets/moto11-edge.jpeg',
    alt: 'Promoción de cauchos Edge de Grupo Moto 11.',
    description: 'Diseño comercial para la línea Edge. El producto y la promoción se convierten en los ejes de una pieza pensada para una lectura rápida en redes.'
  }
];

// Movimiento: preferencia del sistema y control manual persistente.
function initMotion() {
  const button = document.querySelector('.motion-control');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;

  try {
    paused ||= localStorage.getItem('mg-motion-paused') === 'true';
  } catch { /* El sitio también funciona con almacenamiento bloqueado. */ }

  function setPaused(value) {
    paused = value;
    document.body.classList.toggle('motion-paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Activar animaciones' : 'Pausar animaciones');
    button.querySelector('.motion-label').textContent = paused ? 'Activar movimiento' : 'Pausar movimiento';
    button.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    if (paused) document.documentElement.style.setProperty('--parallax', '0px');
  }

  setPaused(paused);
  button.addEventListener('click', () => {
    setPaused(!paused);
    try {
      localStorage.setItem('mg-motion-paused', String(paused));
    } catch { /* La preferencia se mantiene durante esta visita. */ }
  });
  preference.addEventListener('change', () => setPaused(preference.matches));
  return () => !paused && !preference.matches;
}

// El contenido solo se oculta cuando el observador está disponible.
function initReveals() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  document.body.classList.add('motion-ready');
}

// Un único frame por actualización de scroll; sin trabajo continuo fuera del banner.
function initScroll(canAnimate) {
  const progress = document.querySelector('.scroll-progress');
  const hero = document.querySelector('.hero');
  let framePending = false;

  function update() {
    const y = window.scrollY;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1, y / available) : 0})`;
    if (canAnimate() && y < hero.offsetHeight && window.innerWidth > 640) {
      document.documentElement.style.setProperty('--parallax', `${Math.min(y * 0.06, 24)}px`);
    } else {
      document.documentElement.style.setProperty('--parallax', '0px');
    }
    framePending = false;
  }

  function schedule() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
  return schedule;
}

function initFilters(updateScroll) {
  const buttons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.project');
  const status = document.getElementById('filter-status');

  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) {
        visible += 1;
        card.classList.add('is-visible');
      }
    });
    status.textContent = `${visible} ${visible === 1 ? 'trabajo visible' : 'trabajos visibles'}`;
    updateScroll();
  }));
}

// El diálogo nativo gestiona Escape y mantiene el foco dentro del visor.
function initGallery() {
  const dialog = document.querySelector('.lightbox');
  const closeButton = dialog.querySelector('.close-modal');
  const fields = {
    title: document.getElementById('lightbox-title'),
    category: document.getElementById('lightbox-category'),
    description: document.getElementById('lightbox-description'),
    image: document.getElementById('lightbox-img'),
    count: document.getElementById('lightbox-count')
  };
  let active = 0;
  let opener = null;

  function showProject(index) {
    active = (index + projects.length) % projects.length;
    const project = projects[active];
    fields.title.textContent = project.title;
    fields.category.textContent = project.category;
    fields.description.textContent = project.description;
    fields.image.src = project.image;
    fields.image.alt = project.alt;
    fields.count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    dialog.scrollTop = 0;
  }

  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      showProject(Number(button.dataset.project));
      dialog.showModal();
      document.body.classList.add('modal-open');
      closeButton.focus();
    });
  });
  closeButton.addEventListener('click', () => dialog.close());
  document.getElementById('prev-project').addEventListener('click', () => showProject(active - 1));
  document.getElementById('next-project').addEventListener('click', () => showProject(active + 1));
  dialog.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    showProject(active + (event.key === 'ArrowRight' ? 1 : -1));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    opener?.focus();
  });
}

const canAnimate = initMotion();
initReveals();
const updateScroll = initScroll(canAnimate);
initFilters(updateScroll);
initGallery();
