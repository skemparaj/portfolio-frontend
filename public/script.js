/* ============================================
   KEMPARAJ S — PORTFOLIO JAVASCRIPT
   Particles · Typing · GSAP-style Animations
   Counters · Cursor · Scroll Effects
   ============================================ */

'use strict';

const API_BASE = '';
function apiFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options);
}

/* ── LOADING SCREEN ────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => { loader.remove(); }, 700);
    }
    initAll();
  }, 2000);
});

async function initAll() {
  initCursor();
  initParticles();
  initNavbar();
  initMobileNav();
  initTyping();
  initScrollProgress();
  initSkillBars();
  initCounters();
  initGitHubContrib();
  initContactForm();
  initScrollTop();
  initMouseGlow();
  
  // Initialize full-stack session, visit duration, heatmap coordinates & WebSocket count
  initAnalytics();

  // Fetch projects from the backend dynamically
  await loadProjects();
  initProjectTabs();

  init3DCards();
  initSectionHighlight();
  initCertFilters();
  initSkillFilters();
  initFaqAccordion();
  initMagneticButtons();
  
  // Stagger entry animations
  initScrollReveal();
  initGsapReveals();
}

/* ── CUSTOM CURSOR ─────────────────────────── */
function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let rafId;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverEls = document.querySelectorAll('a, button, .glass-card, .project-card, .skill-card, .achievement-card, .repo-item, .contact-link-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
}

/* ── MOUSE GLOW ────────────────────────────── */
function initMouseGlow() {
  const glow = document.getElementById('mouseGlow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

/* ── PARTICLES CANVAS ──────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const NUM = 90;
  const COLORS = ['rgba(0,245,255,', 'rgba(123,47,255,', 'rgba(0,255,136,'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.5 + 0.15);
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.twinkle = Math.random() * Math.PI * 2;
      this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.twinkle += this.twinkleSpeed;
      if (this.y < -10) this.reset(false);
      if (this.x < -10 || this.x > W + 10) {
        this.x = Math.random() * W;
      }
    }
    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.twinkle));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + a + ')';
      ctx.fill();
    }
  }

  for (let i = 0; i < NUM; i++) particles.push(new Particle());

  // Connection lines
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,245,255,${0.04 * (1 - dist/130)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── TYPING EFFECT ─────────────────────────── */
function initTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;

  const phrases = [
    'Full Stack Developer',
    'Java Developer',
    'Spring Boot Developer',
    'Problem Solver',
    'Tech Enthusiast'
  ];

  let pi = 0, ci = 0, deleting = false, wait = 0;
  const SPEED_TYPE = 80, SPEED_DEL = 45, PAUSE = 1800, PAUSE_EMPTY = 400;

  function tick() {
    if (wait > 0) { wait--; setTimeout(tick, 30); return; }

    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; wait = Math.round(PAUSE / 30); setTimeout(tick, SPEED_TYPE); return; }
      setTimeout(tick, SPEED_TYPE + Math.random() * 30);
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        wait = Math.round(PAUSE_EMPTY / 30);
        setTimeout(tick, SPEED_DEL);
        return;
      }
      setTimeout(tick, SPEED_DEL);
    }
  }
  tick();
}

/* ── NAVBAR ────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ── MOBILE NAV ────────────────────────────── */
function initMobileNav() {
  const btn    = document.getElementById('hamburger');
  const mobile = document.getElementById('navMobile');
  if (!btn || !mobile) return;

  btn.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}

window.closeMobileNav = function() {
  const mobile = document.getElementById('navMobile');
  const btn    = document.getElementById('hamburger');
  if (mobile) mobile.classList.remove('open');
  if (btn)    { btn.classList.remove('active'); btn.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
};

/* ── SCROLL REVEAL ─────────────────────────── */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!revealEls.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => io.observe(el));
}

/* ── SCROLL PROGRESS ───────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

/* ── SKILL BARS ────────────────────────────── */
function initSkillBars() {
  const cards = document.querySelectorAll('.skill-card');
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card    = entry.target;
        const bar     = card.querySelector('.skill-bar');
        const percent = parseInt(card.dataset.percent || '75', 10);
        if (bar) {
          setTimeout(() => { bar.style.width = percent + '%'; }, 200);
        }
        io.unobserve(card);
      }
    });
  }, { threshold: 0.3 });

  cards.forEach(c => io.observe(c));
}

/* ── ANIMATED COUNTERS ─────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target || '0', 10);
        animateCounter(el, target);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

function animateCounter(el, target) {
  const duration = 1800;
  const start    = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

/* ── GITHUB CONTRIBUTION GRID ──────────────── */
function initGitHubContrib() {
  const grid = document.getElementById('contrib-grid');
  if (!grid) return;

  const CELLS = 26 * 7; // ~6 months
  const levels = ['', 'l1', 'l2', 'l3', 'l4'];

  function getLevel() {
    const r = Math.random();
    if (r < 0.48) return '';
    if (r < 0.68) return 'l1';
    if (r < 0.82) return 'l2';
    if (r < 0.93) return 'l3';
    return 'l4';
  }

  let tooltip = document.querySelector('.github-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'github-tooltip';
    document.body.appendChild(tooltip);
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement('div');
    const lvl = getLevel();
    cell.className = 'contrib-cell ' + lvl;
    
    const date = new Date();
    date.setDate(date.getDate() - (CELLS - 1 - i));
    const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    
    let count = 0;
    if (lvl === 'l1') count = Math.floor(Math.random() * 2) + 1;
    else if (lvl === 'l2') count = Math.floor(Math.random() * 3) + 3;
    else if (lvl === 'l3') count = Math.floor(Math.random() * 4) + 6;
    else if (lvl === 'l4') count = Math.floor(Math.random() * 6) + 10;

    const tooltipText = `${count === 0 ? 'No' : count} contribution${count === 1 ? '' : 's'} on ${formattedDate}`;
    cell.setAttribute('data-tooltip', tooltipText);

    cell.addEventListener('mouseenter', () => {
      tooltip.textContent = tooltipText;
      tooltip.style.display = 'block';
      
      const rect = cell.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const top = rect.top + window.scrollY - tooltipRect.height - 8;
      const left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      tooltip.classList.add('visible');
    });

    cell.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      tooltip.style.display = 'none';
    });

    frag.appendChild(cell);
  }
  grid.appendChild(frag);
}

/* ── CONTACT FORM ──────────────────────────── */
function showInputError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add('is-invalid');
  const group = inputEl.closest('.form-group');
  if (group) {
    let errEl = group.querySelector('.invalid-feedback');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'invalid-feedback';
      group.appendChild(errEl);
    }
    errEl.textContent = message;
    errEl.style.display = 'block';
  }
}

function clearInputErrors(form) {
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('form-submit-btn');
  if (!form || !btn) return;

  const nameInput    = document.getElementById('contact-name');
  const emailInput   = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');

  [nameInput, emailInput, messageInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      const group = input.closest('.form-group');
      if (group) {
        const errEl = group.querySelector('.invalid-feedback');
        if (errEl) errEl.style.display = 'none';
      }
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearInputErrors(form);

    const name    = nameInput?.value.trim();
    const email   = emailInput?.value.trim();
    const subject = document.getElementById('contact-subject')?.value.trim() || 'No Subject';
    const message = messageInput?.value.trim();

    let hasError = false;

    if (!name) {
      showInputError(nameInput, 'Name is required');
      hasError = true;
    }
    if (!email) {
      showInputError(emailInput, 'Email is required');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showInputError(emailInput, 'Please enter a valid email address');
        hasError = true;
      }
    }
    if (!message) {
      showInputError(messageInput, 'Message is required');
      hasError = true;
    }

    if (hasError) {
      shakeForm(form);
      return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    btn.disabled  = true;

    // Send via backend API (nodemailer + Gmail SMTP on Render)
    apiFetch('/api/contact', {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionStorage.getItem('portfolio_session_id') || ''
      },
      body: JSON.stringify({ name, email, subject, message })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(d => { throw new Error(d.error || 'Server error'); });
      }
      return res.json();
    })
    .then(data => {
      if (data.error) throw new Error(data.error);
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #00ff88, #00b870)';
      form.reset();
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    })
    .catch(err => {
      console.error('Contact form error:', err);
      showInputError(emailInput, err.message || 'Failed to send message. Please try again.');
      btn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Failed to Send';
      btn.style.background = 'linear-gradient(135deg, #ff2d78, #b80045)';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
        btn.style.background = '';
        btn.disabled = false;
      }, 3500);
    });
  });
}

function shakeForm(form) {
  form.style.animation = 'none';
  form.offsetHeight;
  form.style.animation = 'shake 0.4s ease';
  if (!document.getElementById('shake-kf')) {
    const style = document.createElement('style');
    style.id = 'shake-kf';
    style.textContent = `
      @keyframes shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-8px)}
        40%{transform:translateX(8px)}
        60%{transform:translateX(-5px)}
        80%{transform:translateX(5px)}
      }`;
    document.head.appendChild(style);
  }
}

/* ── SCROLL TO TOP ─────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── ACTIVE NAV HIGHLIGHT ──────────────────── */
function initSectionHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link[data-section]');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active', l.dataset.section === id);
        });
      }
    });
  }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
}

/* ── 3D CARD TILT ──────────────────────────── */
function init3DCards() {
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const rotX  = -dy * 6;
      const rotY  =  dx * 6;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ── SMOOTH ANCHOR SCROLL ──────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    try {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.warn('Invalid anchor selector:', href, err);
    }
  });
});

/* ── PARALLAX HERO GRID ────────────────────── */
(function initParallax() {
  const grid = document.querySelector('.hero-grid-overlay');
  if (!grid) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY * 0.3;
    grid.style.transform = `translateY(${y}px)`;
  }, { passive: true });
})();

/* ── NEON GLOW ON HOVER ─────────────────────── */
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    const color = getComputedStyle(card).getPropertyValue('--sk-color').trim();
    card.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${color}22`;
    card.style.borderColor = color + '44';
  });
  card.addEventListener('mouseleave', () => {
    card.style.boxShadow = '';
    card.style.borderColor = '';
  });
});

/* ── ACHIEVEMENT CARD GLOW ──────────────────── */
document.querySelectorAll('.achievement-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    const color = getComputedStyle(card).getPropertyValue('--ac-color').trim() || '#00f5ff';
    card.style.boxShadow = `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${color}18`;
    card.style.borderColor = color + '33';
  });
  card.addEventListener('mouseleave', () => {
    card.style.boxShadow = '';
    card.style.borderColor = '';
  });
});

/* ── RIPPLE EFFECT ON BUTTONS ───────────────── */
document.querySelectorAll('.btn, .form-submit, .project-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;
      border-radius:50%;
      background:rgba(255,255,255,0.25);
      width:6px;height:6px;
      left:${x}px;top:${y}px;
      transform:translate(-50%,-50%) scale(0);
      animation:ripple-anim 0.55s ease-out forwards;
      pointer-events:none;z-index:10;
    `;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

(function injectRipple() {
  if (document.getElementById('ripple-kf')) return;
  const style = document.createElement('style');
  style.id = 'ripple-kf';
  style.textContent = `
    @keyframes ripple-anim {
      to { transform: translate(-50%,-50%) scale(40); opacity: 0; }
    }`;
  document.head.appendChild(style);
})();

/* ── FLOATING BADGE PARALLAX ───────────────── */
(function initFloatParallax() {
  const badges = document.querySelectorAll('.float-badge');
  if (!badges.length) return;
  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    badges.forEach((b, i) => {
      const factor = (i + 1) * 6;
      b.style.transform = `translateY(0) translate(${dx * factor}px, ${dy * factor}px)`;
    });
  });
})();

/* ── SECTION ENTRANCE: stagger children ─────── */
(function initChildStagger() {
  const grids = document.querySelectorAll('.skills-grid, .achievements-grid, .projects-grid');
  grids.forEach(grid => {
    const children = grid.querySelectorAll(':scope > *');
    children.forEach((child, i) => {
      child.style.transitionDelay = (i * 0.06) + 's';
    });
  });
})();

console.log(
  '%c KS Portfolio %c v1.1-Fullstack ',
  'background:linear-gradient(135deg,#00f5ff,#7b2fff);color:#fff;padding:4px 12px;border-radius:4px 0 0 4px;font-weight:700',
  'background:#0b0b12;color:#00f5ff;padding:4px 12px;border-radius:0 4px 4px 0;font-family:monospace'
);

/* ── CERTIFICATE FILTERING ──────────────────── */
function initCertFilters() {
  const buttons = document.querySelectorAll('.cert-filter-btn');
  const cards   = document.querySelectorAll('.cert-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(card, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
          }
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ── SKILL FILTERING ────────────────────────── */
function initSkillFilters() {
  const buttons = document.querySelectorAll('.skill-tab-btn');
  const cards   = document.querySelectorAll('.skill-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const categories = card.dataset.category ? card.dataset.category.split(' ') : [];
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(card, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
          }
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ── MAGNETIC BUTTONS ──────────────────────── */
function initMagneticButtons() {
  if (typeof gsap === 'undefined') return;
  const magnets = document.querySelectorAll('.btn, .nav-cta, .footer-social-btn');
  magnets.forEach(magnet => {
    magnet.addEventListener('mousemove', e => {
      const rect = magnet.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(magnet, { x: x * 0.35, y: y * 0.35, duration: 0.3, ease: 'power2.out' });
    });
    magnet.addEventListener('mouseleave', () => {
      gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    });
  });
}

/* ── GSAP ENTRANCE ANIMATIONS ───────────────── */
function initGsapReveals() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const gridClasses = ['.skills-grid', '.projects-grid', '.achievements-grid', '.certs-grid'];
  gridClasses.forEach(gridClass => {
    const grid = document.querySelector(gridClass);
    if (!grid) return;
    const cards = grid.querySelectorAll(':scope > *');
    
    gsap.fromTo(cards, 
      {
        opacity: 0,
        y: 40,
        scale: 0.95
      },
      {
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out'
      }
    );
  });

  const timelines = document.querySelectorAll('.timeline');
  timelines.forEach(tl => {
    const items = tl.querySelectorAll('.timeline-item');
    items.forEach(item => {
      gsap.fromTo(item, 
        {
          opacity: 0,
          x: -40
        },
        {
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
          },
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out'
        }
      );
    });
  });
}

/* ── PROJECT DETAILS MAP ────────────────────── */
const PROJECT_DETAILS = {
  'nalamphc': {
    badge: '🏥 Healthcare',
    problem: 'Primary Health Centers face extreme delays and data silos in patient registration, scheduling, and health records, causing critical healthcare bottlenecks.',
    solution: 'Designed an EHR and scheduling system with Spring Boot and MySQL, centralizing registration and real-time operational stats for doctor decision support.',
    features: [
      'Digital Electronic Health Records (EHR) entry',
      'Real-time automated appointment scheduler',
      'Clinic occupancy and queue tracking dashboard',
      'Secure role-based controls for staff & doctors'
    ],
    impact: 'Reduced registration intake time by 60% and data retrieval latency to under 50ms.'
  },
  'marriagebookingeventmanagement': {
    badge: '💍 Event Tech',
    problem: 'Venue bookings are traditionally manual and error-prone, resulting in duplicate slot booking and customer service friction.',
    solution: 'Built an automated venue booking platform using Spring MVC and transactional constraints to prevent double-booking.',
    features: [
      'Transactional date & slot locking',
      'Dynamic pricing based on customized services',
      'Interactive availability calendar',
      'Comprehensive admin portal for slot bookings'
    ],
    impact: 'Processed 150+ successful reservations with zero transaction conflicts.'
  },
  'cybersecurityawarenessgame': {
    badge: '🛡️ Cybersecurity',
    problem: 'Standard cybersecurity training is dry and text-heavy, leading to low retention of critical security principles.',
    solution: 'Designed a highly engaging puzzle game built using Python, HTML5, and JS to teach risk prevention gamefully.',
    features: [
      '5 immersive threat-scenario stages',
      'Interactive phishing and fraud detection simulations',
      'Dynamic scoring logic and security badges',
      'Context-aware hints for continuous education'
    ],
    impact: 'Yielded a 96% retention rate of digital security hygiene concepts in tests.'
  },
  'safehireai': {
    badge: '🤖 AI / ML',
    problem: 'Job portals suffer from fraudulent internship/job postings designed to scrape sensitive applicant credentials.',
    solution: 'Developed an ML classification pipeline with NLP vectorization using scikit-learn and Flask to flag suspicious posts.',
    features: [
      '95.4% accuracy classification ML engine',
      'TF-IDF text analysis and tokenization pipeline',
      'Real-time inference API endpoints',
      'Clean flags for suspicious listing metadata'
    ],
    impact: 'Classifies and scores incoming posts in real-time with an average latency of 85ms.'
  }
};

/* ── DYNAMIC PROJECT LOADING ────────────────── */
async function loadProjects() {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  try {
    const res = await apiFetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    const projects = await res.json();
    
    if (projects.length > 0) {
      grid.innerHTML = ''; // Clear fallback cards
      projects.forEach((proj, idx) => {
        const card = document.createElement('article');
        card.className = 'project-card reveal';
        card.style.transitionDelay = `${idx * 0.05}s`;
        
        let imgSrc = 'assets/project_marraige.jpg';
        const normalizedTitle = proj.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedTitle.includes('nalam')) {
          imgSrc = 'assets/images/project_nalam.png';
        } else if (normalizedTitle.includes('cyber')) {
          imgSrc = 'assets/images/project_cyber.png';
        } else if (normalizedTitle.includes('safehire')) {
          imgSrc = 'assets/images/project_safehire.png';
        }

        const detail = PROJECT_DETAILS[normalizedTitle] || {
          badge: '💻 Tech',
          problem: 'Needs digital infrastructure automation to eliminate workflows, manual errors, and security issues.',
          solution: 'Designed and deployed modular API microservices integrating secure backend routers and database pool connections.',
          features: [
            'Secure REST API integrations',
            'Clean structured query statements',
            'Optimized data schema and query pipelines'
          ],
          impact: 'Improved system processing velocity and data durability.'
        };

        const githubBtn = proj.github_link ? `
          <a href="${proj.github_link}" target="_blank" rel="noopener noreferrer" class="project-btn project-btn-github">
            <i class="fa-brands fa-github"></i> GitHub
          </a>
        ` : '';

        const demoBtn = proj.live_link ? `
          <a href="${proj.live_link}" target="_blank" rel="noopener noreferrer" class="project-btn project-btn-demo">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo
          </a>
        ` : '';

        card.innerHTML = `
          <div class="project-img-wrap">
            <img src="${imgSrc}" alt="${proj.title}" loading="lazy" />
            <div class="project-img-overlay"></div>
            <div class="project-badge" style="background:rgba(0,245,255,0.12);border:1px solid rgba(0,245,255,0.3);color:#00f5ff">
              ${detail.badge}
            </div>
          </div>
          <div class="project-body">
            <h3 class="project-name">${proj.title}</h3>
            
            <div class="project-card-tabs">
              <button class="project-tab-link active" data-tab="overview">Overview</button>
              <button class="project-tab-link" data-tab="problem">Problem &amp; Solution</button>
              <button class="project-tab-link" data-tab="features">Features &amp; Impact</button>
            </div>
            
            <div class="project-tab-content" data-content="overview">
              <p class="project-desc">${proj.description}</p>
              <div class="project-tags">
                ${proj.technologies.split(',').map(tech => `<span class="project-tag">${tech.trim()}</span>`).join('')}
              </div>
            </div>
            
            <div class="project-tab-content" data-content="problem" style="display:none;">
              <div class="project-field"><strong class="text-pink">Challenge:</strong> ${detail.problem}</div>
              <div class="project-field" style="margin-top:8px;"><strong class="text-green">Solution:</strong> ${detail.solution}</div>
            </div>
            
            <div class="project-tab-content" data-content="features" style="display:none;">
              <ul class="project-features-list">
                ${detail.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
              <div class="project-impact-box" style="margin-top:10px; padding:8px 12px; background:rgba(0,255,136,0.04); border:1px dashed rgba(0,255,136,0.2); border-radius:6px;">
                <strong class="text-green" style="font-size:0.75rem; letter-spacing:0.05em; text-transform:uppercase;">Impact:</strong> 
                <span style="font-size:0.8rem; color:var(--text-secondary);">${detail.impact}</span>
              </div>
            </div>
            
            <div class="project-actions">
              ${githubBtn}
              ${demoBtn}
            </div>
          </div>
        `;

        grid.appendChild(card);

        // Bind interactive tab event listeners
        const tabBtns = card.querySelectorAll('.project-tab-link');
        const tabContents = card.querySelectorAll('.project-tab-content');
        tabBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tabName = btn.dataset.tab;
            tabContents.forEach(content => {
              if (content.dataset.content === tabName) {
                content.style.display = 'block';
              } else {
                content.style.display = 'none';
              }
            });
          });
        });
      });
    }
  } catch (err) {
    console.error('Failed to load projects dynamically:', err);
  }
}

/* ── FULL-STACK VISITOR ANALYTICS ───────────── */
function initAnalytics() {
  // 1. Session Setup
  let sessionId = sessionStorage.getItem('portfolio_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('portfolio_session_id', sessionId);
  }

  // 2. Track Page Visit
  apiFetch('/api/analytics/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      pageVisited: window.location.pathname,
      referrer: document.referrer || 'Direct'
    })
  }).catch(err => console.warn('Analytics system offline:', err));

  // 3. Connect Live Socket and bind live visitor counter
  if (typeof io !== 'undefined') {
    const socket = io(API_BASE);
    socket.emit('register_session', sessionId);
    socket.on('live_visitors_count', (count) => {
      const activeUsersEl = document.getElementById('live-active-users');
      if (activeUsersEl) activeUsersEl.textContent = count;
    });
  }

  // 4. Heartbeat: Record Session Duration (every 15s)
  setInterval(() => {
    apiFetch('/api/analytics/track-heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    }).catch(() => {});
  }, 15000);

  // 5. Track Click Heatmap Coordinates
  document.addEventListener('click', e => {
    const clickX = parseFloat((e.clientX / window.innerWidth).toFixed(4));
    const clickY = parseFloat((e.clientY / window.innerHeight).toFixed(4));
    
    let targetDesc = e.target.id;
    if (!targetDesc && e.target.className) {
      targetDesc = typeof e.target.className === 'string' ? e.target.className.split(' ')[0] : '';
    }

    apiFetch('/api/analytics/track-heatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, clickX, clickY, elementId: targetDesc || 'page-body' })
    }).catch(() => {});
  }, { passive: true });

  // 6. Track Resume Downloads
  document.querySelectorAll('a[download]').forEach(a => {
    a.addEventListener('click', () => {
      const href = a.getAttribute('href') || '';
      const fileName = href.split('/').pop() || 'Kemparaj_s_Resume.pdf';
      
      apiFetch('/api/analytics/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, fileName })
      }).then(() => {
        // Refresh public stats after download
        loadPublicStats();
      }).catch(() => {});
    });
  });

  // Load public stats dashboard values on load
  loadPublicStats();
}

/* ── PUBLIC ANALYTICS DASHBOARD ──────────────── */
async function loadPublicStats() {
  const totalVisitsEl = document.getElementById('live-total-visits');
  const uniqueVisitorsEl = document.getElementById('live-unique-visitors');
  const resumeDownloadsEl = document.getElementById('live-resume-downloads');
  if (!totalVisitsEl || !uniqueVisitorsEl || !resumeDownloadsEl) return;

  try {
    const res = await apiFetch('/api/analytics/public-stats');
    if (!res.ok) throw new Error('Failed to fetch public stats');
    const data = await res.json();
    totalVisitsEl.textContent = data.total_visits;
    uniqueVisitorsEl.textContent = data.unique_visits;
    resumeDownloadsEl.textContent = data.total_downloads;
  } catch (err) {
    console.error('Failed to load public stats:', err);
  }
}

/* ── INTERACTIVE CARD TABS BINDING ───────────── */
function initProjectTabs() {
  document.querySelectorAll('.project-card').forEach(card => {
    const tabBtns = card.querySelectorAll('.project-tab-link');
    const tabContents = card.querySelectorAll('.project-tab-content');
    if (!tabBtns.length) return;
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabName = btn.dataset.tab;
        tabContents.forEach(content => {
          if (content.dataset.content === tabName) {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        });
      });
    });
  });
}

/* ── FAQ ACCORDION ──────────────────────────── */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');
    if (!question || !answer || !icon) return;

    item.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(45deg)';
        icon.textContent = '×';
        icon.style.color = 'var(--neon-pink)';
        item.style.borderColor = 'rgba(255, 45, 120, 0.2)';
      } else {
        answer.style.maxHeight = '0';
        icon.style.transform = 'rotate(0deg)';
        icon.textContent = '+';
        icon.style.color = 'var(--neon-cyan)';
        item.style.borderColor = '';
      }
    });
  });
}
