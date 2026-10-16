/*
  MUHAMMED ANSAR — INTERACTIVE PORTFOLIO
  Vanilla JS, no build step. Optional Three.js via CDN for real WebGL 3D.
  All content, navigation and CSS artwork stay usable if WebGL/CDN is unavailable.
*/
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer:fine)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  // UI: navigation, header, reading position.
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const nav = $('#siteNav');
  const toggle = $('#menuToggle');
  const navLinks = $$('#siteNav a[href^="#"]');

  const closeMenu = () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
  };

  toggle?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', isOpen);
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu();
      toggle?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (nav?.classList.contains('is-open') && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  }, { passive: true });

  let scrollQueued = false;
  const updateScroll = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100))}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 28);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  // Section highlighting (IntersectionObserver is supported by modern browsers).
  const navTargets = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const activeNavObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-23% 0px -66% 0px', threshold: 0 });
    navTargets.forEach(section => activeNavObserver.observe(section));
  }

  // Reveal animations: elements are immediately visible without JS or in reduced-motion mode.
  const revealItems = $$('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  // Rotating headline: remain meaningful even when JS is unavailable.
  const role = $('#rotatingRole');
  const roles = ['AI ENGINEER', 'FULL-STACK BUILDER', 'APPLIED AI DEVELOPER', 'PRODUCT CREATOR'];
  let roleIndex = 0;
  if (role && !reducedMotion.matches) {
    window.setInterval(() => {
      if (document.hidden) return;
      role.style.opacity = '0';
      role.style.transform = 'translateY(5px)';
      window.setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        role.textContent = roles[roleIndex];
        role.style.opacity = '1';
        role.style.transform = 'translateY(0)';
      }, 230);
    }, 2800);
  }

  // Simple, keyboard-friendly project filtering.
  const filters = $$('.filter-button');
  const projectCards = $$('.project-card[data-category]');
  const projectCount = $('#projectCount');
  const grid = $('#projectGrid');
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filters.forEach(filter => {
        const active = filter === button;
        filter.classList.toggle('is-active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      let visible = 0;
      projectCards.forEach(card => {
        const matches = category === 'all' || card.dataset.category === category;
        card.hidden = !matches;
        if (matches) {
          visible++;
          card.classList.add('is-visible');
        }
      });
      if (projectCount) projectCount.textContent = `SHOWING ${String(visible).padStart(2, '0')} PROJECT${visible === 1 ? '' : 'S'}`;
      grid?.setAttribute('aria-label', `${visible} matching projects`);
    });
  });

  // Count up in view, respecting reduced motion.
  const counters = $$('[data-count]');
  function animateCounter(el) {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const suffix = el.dataset.suffix || '';
    if (reducedMotion.matches) { el.textContent = target + suffix; return; }
    const start = performance.now();
    const duration = 1200;
    const frame = now => {
      const progress = Math.min(1, (now - start) / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * easeOut) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(counter => countObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // Deliberately light 3D tilt for desktop hover, CSS-only fallback for touch.
  if (finePointer.matches && !reducedMotion.matches) {
    $$('.tilt-card[data-tilt]').forEach(card => {
      let rafId = 0;
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
          card.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
          card.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(rafId);
        card.style.transform = '';
      });
    });
    const glow = $('#cursorGlow');
    let glowRaf = 0;
    document.addEventListener('pointermove', event => {
      if (!glow) return;
      cancelAnimationFrame(glowRaf);
      glowRaf = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${event.clientX - 240}px,${event.clientY - 240}px,0)`;
      });
    }, { passive: true });
  }

  $('#year').textContent = String(new Date().getFullYear());

  // Actual 3D, not a video: dynamic Three.js WebGL scene. The CSS sculpture remains
  // in place if the browser is offline, GPU acceleration is unavailable, or a user
  // prefers less motion. Running it only when visible saves mobile battery.
  async function initThreeScene() {
    if (reducedMotion.matches || saveData) return;
    const mount = $('#webglMount');
    const box = $('#sceneBox');
    if (!mount || !box) return;

    // Detect support before loading code over the network.
    let probe;
    try {
      probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (_) { return; }
    finally { probe = null; }

    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
      if (!document.body.contains(box)) return;
      const isMobile = window.matchMedia('(max-width: 620px)').matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 8.8);
      const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.3 : 1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x99a5ff, 1.8));
      const keyLight = new THREE.PointLight(0xc7aeff, 72, 25);
      keyLight.position.set(4, 4, 6);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x9effdc, 46, 19);
      rimLight.position.set(-4, -2, 4);
      scene.add(rimLight);
      const backside = new THREE.PointLight(0x465cdb, 25, 15);
      backside.position.set(0, 1, -3);
      scene.add(backside);

      const artifact = new THREE.Group();
      scene.add(artifact);
      const coreGeometry = new THREE.IcosahedronGeometry(1.48, 2);
      const coreMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8877d6, metalness: 0.75, roughness: 0.21, clearcoat: 0.8, clearcoatRoughness: 0.18, flatShading: true, transparent: true, opacity: 0.83, side: THREE.DoubleSide });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      artifact.add(core);

      const edgeGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.53, 1));
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xdad4ff, transparent: true, opacity: 0.42 });
      const wire = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      artifact.add(wire);

      const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.57, 1), new THREE.MeshStandardMaterial({ color: 0xa0f4e0, metalness: 0.55, roughness: 0.27, emissive: 0x165e6d, emissiveIntensity: 0.4, flatShading: true }));
      artifact.add(innerCore);

      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xaf9bff, transparent: true, opacity: 0.63, side: THREE.DoubleSide });
      const aquaMaterial = new THREE.MeshBasicMaterial({ color: 0x99ffdf, transparent: true, opacity: 0.47, side: THREE.DoubleSide });
      const rings = [
        { r: 2.42, tube: 0.012, rot: [1.15, 0.55, 0.18], mat: ringMaterial },
        { r: 2.21, tube: 0.013, rot: [-0.65, -0.5, 0.82], mat: aquaMaterial },
        { r: 1.9, tube: 0.008, rot: [0.25, 1.32, -0.52], mat: ringMaterial }
      ];
      rings.forEach(ring => {
        const mesh = new THREE.Mesh(new THREE.TorusGeometry(ring.r, ring.tube, 8, 180), ring.mat);
        mesh.rotation.set(...ring.rot);
        artifact.add(mesh);
      });

      // Orbiting satellites
      const satelliteGeometry = new THREE.OctahedronGeometry(0.12, 0);
      for (let i = 0; i < 6; i++) {
        const m = new THREE.Mesh(satelliteGeometry, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xa6f6df : 0xc2afff }));
        const angle = (i / 6) * Math.PI * 2;
        m.position.set(Math.cos(angle) * 2.16, Math.sin(angle) * 1.65, Math.sin(angle * 2) * 0.7);
        artifact.add(m);
      }

      const particleCount = isMobile ? 70 : 175;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.8 + Math.random() * 2.0;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius * 0.84;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xcfbeff, size: 0.027, transparent: true, opacity: 0.72, depthWrite: false }));
      scene.add(particles);

      let width = 1;
      let height = 1;
      const resizeScene = () => {
        const rect = mount.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        camera.aspect = width / height;
        camera.position.z = width < 500 ? 9.9 : 8.8;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resizeScene();
      const resizer = ('ResizeObserver' in window) ? new ResizeObserver(resizeScene) : null;
      resizer?.observe(mount);
      if (!resizer) window.addEventListener('resize', resizeScene, { passive: true });

      let pointerX = 0;
      let pointerY = 0;
      if (finePointer.matches) {
        window.addEventListener('pointermove', e => {
          const rect = box.getBoundingClientRect();
          pointerX = Math.max(-1, Math.min(1, (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
          pointerY = Math.max(-1, Math.min(1, (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
        }, { passive: true });
      }
      box.classList.add('scene-ready');

      let visible = true;
      let running = false;
      let rafId = 0;
      let lastFrame = 0;
      const frameMs = isMobile ? 1000 / 30 : 1000 / 55;
      const clock = new THREE.Clock();
      function render(timestamp) {
        if (!running) return;
        rafId = requestAnimationFrame(render);
        if (timestamp - lastFrame < frameMs) return;
        lastFrame = timestamp;
        const elapsed = clock.getElapsedTime();
        artifact.rotation.y += 0.004;
        artifact.rotation.x += 0.0016;
        artifact.rotation.y += (pointerX * 0.2 - artifact.rotation.y * 0.004) * 0.0008;
        artifact.position.y = Math.sin(elapsed * 0.65) * 0.1;
        innerCore.rotation.set(elapsed * 0.19, elapsed * 0.24, -elapsed * 0.11);
        particles.rotation.z = elapsed * 0.016;
        artifact.rotation.z += (pointerY * 0.12 - artifact.rotation.z) * 0.035;
        renderer.render(scene, camera);
      }
      function syncAnimation() {
        const shouldRun = visible && !document.hidden && !reducedMotion.matches;
        if (shouldRun && !running) {
          running = true;
          clock.start();
          lastFrame = 0;
          rafId = requestAnimationFrame(render);
        } else if (!shouldRun && running) {
          running = false;
          cancelAnimationFrame(rafId);
          clock.stop();
        }
      }
      if ('IntersectionObserver' in window) {
        const visibilityObserver = new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? false;
          syncAnimation();
        }, { threshold: 0.01 });
        visibilityObserver.observe(box);
      }
      document.addEventListener('visibilitychange', syncAnimation);
      reducedMotion.addEventListener?.('change', syncAnimation);
      renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        running = false;
        cancelAnimationFrame(rafId);
        box.classList.remove('scene-ready');
      });
      syncAnimation();
    } catch (error) {
      // Static CSS sculpture is an intentional complete fallback.
      console.info('Optional 3D scene unavailable; using CSS artwork.', error?.message || error);
      box.classList.remove('scene-ready');
    }
  }

  initThreeScene();
})();
