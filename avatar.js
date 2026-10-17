/* Portfolio Cartoon Avatar Hero V1
   Pointer-responsive 2.5D motion, no dependencies, no heavyweight model load. */
(() => {
  'use strict';
  const stage = document.getElementById('avatarStage');
  const body = document.getElementById('avatarMotion');
  if (!stage || !body) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  if (!fine.matches || reduced.matches) return;
  let pending = 0;
  const reset = () => {
    cancelAnimationFrame(pending);
    body.style.setProperty('--avatar-ry', '0deg');
    body.style.setProperty('--avatar-rx', '0deg');
  };
  stage.parentElement.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      body.style.setProperty('--avatar-ry', `${(nx * 11).toFixed(2)}deg`);
      body.style.setProperty('--avatar-rx', `${(-ny * 5).toFixed(2)}deg`);
    });
  }, { passive:true });
  stage.parentElement.addEventListener('pointerleave', reset);
  reduced.addEventListener?.('change', reset);
})();
