/* ============================================================
   ARENSIGHT — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. PAGE LOAD SEQUENCE ─────────────────────────────── */
  // Small tick so first-paint styles are flushed
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('loaded');
    });
  });

  /* ── 2. HERO TRANSFORMATION ────────────────────────────── */
  const scene = document.getElementById('hero-scene');
  const glow  = document.getElementById('scene-glow');
  const paint = document.getElementById('scene-paint');
  const gold  = document.getElementById('scene-gold');

  // Begin transformation after short settle (label/headline fading in)
  setTimeout(() => {
    if (scene) scene.classList.add('transformed');
    if (glow)  glow.classList.add('glowing');
    if (paint) paint.classList.add('painted');
    if (gold)  gold.classList.add('glowing');
  }, 600);

  // Reveal the italic line after transformation completes (600 + 2500 + 300 breathing)
  setTimeout(() => {
    const reveal = document.getElementById('hero-reveal');
    if (reveal) reveal.classList.add('visible');
  }, 3400);

  /* ── 3. NAV SCROLL BEHAVIOUR ───────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── 4. SCROLL REVEAL ──────────────────────────────────── */
  const revealEls = document.querySelectorAll('.scroll-reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: just show everything
    revealEls.forEach(el => el.classList.add('revealed'));
  }

});
