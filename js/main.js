/* ==========================================================================
   RÉSIDENCE PETIT BEL-AIR — interactions & animations
   GSAP + ScrollTrigger + Lenis
   ========================================================================== */

/* Numéro WhatsApp de la résidence, format international sans "+" ni espaces.
   À REMPLACER par le vrai numéro (ex. 226 70 00 00 00 -> "22670000000"). */
const WHATSAPP_NUMBER = "22600000000";

(() => {
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = () => innerWidth <= 900;

  const header = $(".header");

  /* ------------------------------------------------------------------------
     Défilement fluide (Lenis) synchronisé avec GSAP
     ------------------------------------------------------------------------ */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else if (target === 0) scrollTo(0, 0);
    else $(target)?.scrollIntoView();
  };

  /* ------------------------------------------------------------------------
     Mouvement réduit : on affiche tout, sans animation
     ------------------------------------------------------------------------ */
  if (reduceMotion) {
    $(".loader")?.remove();
    document.body.classList.remove("is-loading");
    initMenu();
    initForm();
    $$("[data-count]").forEach((el) => (el.textContent = formatNum(+el.dataset.count, +(el.dataset.decimals || 0))));
    return;
  }

  /* ------------------------------------------------------------------------
     États initiaux (posés en JS pour que le site reste lisible sans JS)
     ------------------------------------------------------------------------ */
  const ARCH = () =>
    isMobile()
      ? "inset(52% 22% 0% 22% round 28vw 28vw 0vw 0vw)"
      : "inset(48% 39% 0% 39% round 16vw 16vw 0vw 0vw)";
  const ARCH_HIDDEN = () => ARCH().replace(/^inset\(\d+%/, "inset(100%");
  const FULL = "inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)";

  gsap.set(".hero__title .line__in", { yPercent: 110, rotate: 4, transformOrigin: "0% 100%" });
  gsap.set(".hero__frame", { clipPath: ARCH_HIDDEN() });
  gsap.set(".hero__frame img", { scale: 1.6, yPercent: 16 });
  gsap.set([".hero__top", ".hero__caption", header], { autoAlpha: 0 });

  /* ------------------------------------------------------------------------
     Préchargeur
     ------------------------------------------------------------------------ */
  const num = $(".loader__num");
  const counter = { v: 0 };

  gsap
    .timeline({ defaults: { ease: "expo.out" } })
    .to(".loader__mark", { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 1.6, ease: "expo.inOut" }, 0)
    .to(".loader__word span", { y: 0, duration: 1.4, stagger: 0.06 }, 0.2)
    .to(".loader__tag", { opacity: 1, duration: 1 }, 0.9)
    .to(counter, {
      v: 100,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => (num.textContent = Math.round(counter.v)),
    }, 0)
    .to(".loader__line span", { scaleX: 1, duration: 2.4, ease: "power2.inOut" }, 0)
    .to(".loader__word span", { yPercent: -110, duration: 0.9, stagger: 0.035, ease: "expo.in" }, "+=0.15")
    .to([".loader__mark", ".loader__tag", ".loader__count", ".loader__line"], { opacity: 0, duration: 0.5, ease: "power2.out" }, "<")
    .to(".loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.3, ease: "expo.inOut" }, "-=0.25")
    .add(intro, "-=0.75")
    .add(() => $(".loader").remove());

  /* ------------------------------------------------------------------------
     Intro du hero
     ------------------------------------------------------------------------ */
  function intro() {
    gsap
      .timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          document.body.classList.remove("is-loading");
          lenis.start();
          initScroll();
        },
      })
      .to(".hero__frame", { clipPath: ARCH(), duration: 1.8, ease: "expo.inOut" }, 0)
      .to(".hero__frame img", { scale: 1.35, duration: 2.4, ease: "expo.out" }, 0.3)
      .to(".hero__title .line__in", { yPercent: 0, rotate: 0, duration: 1.6, stagger: 0.12 }, 0.35)
      .to([".hero__top", ".hero__caption", header], { autoAlpha: 1, duration: 1.2, ease: "power2.out" }, 1);
  }

  /* ------------------------------------------------------------------------
     En-tête : masquage au défilement + passage clair sur les zones sombres
     ------------------------------------------------------------------------ */
  const darkZones = new Set();
  const setZone = (name, on) => {
    on ? darkZones.add(name) : darkZones.delete(name);
    header.classList.toggle("is-light", darkZones.size > 0);
  };

  lenis.on("scroll", ({ direction, scroll }) => {
    if (document.body.classList.contains("menu-open")) return;
    header.classList.toggle("is-hidden", direction === 1 && scroll > 240);
  });

  /* ------------------------------------------------------------------------
     Tout ce qui dépend du scroll (lancé après l'intro)
     ------------------------------------------------------------------------ */
  function initScroll() {
    heroScroll();
    lineReveals();
    manifesto();
    collection();
    revealSplit();
    marquee();
    counters();
    gallery();
    footer();

    ["gallery", "footer"].forEach((name) =>
      ScrollTrigger.create({
        trigger: "." + name,
        start: "top 45px",
        end: "bottom 45px",
        onToggle: (self) => setZone(name, self.isActive),
      })
    );

    ScrollTrigger.refresh();
  }

  /* Hero : l'arche s'ouvre jusqu'au plein écran */
  function heroScroll() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=130%",
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setZone("hero", self.progress > 0.55),
      },
    });

    tl.fromTo(".hero__frame", { clipPath: ARCH }, { clipPath: FULL, ease: "power2.inOut", duration: 1 }, 0)
      .to(".hero__frame img", { scale: 1, yPercent: 0, ease: "power2.inOut", duration: 1 }, 0)
      .to(".hero__title .line:nth-child(1) .line__in", { xPercent: -40, ease: "power1.in", duration: 0.7 }, 0)
      .to(".hero__title .line:nth-child(2) .line__in", { yPercent: -60, ease: "power1.in", duration: 0.7 }, 0)
      .to(".hero__title .line:nth-child(3) .line__in", { xPercent: 40, ease: "power1.in", duration: 0.7 }, 0)
      .to(".hero__title", { autoAlpha: 0, duration: 0.45 }, 0.2)
      .to([".hero__top", ".hero__caption"], { autoAlpha: 0, duration: 0.3 }, 0);

    ScrollTrigger.create({
      trigger: ".manifesto",
      start: "top 45px",
      onEnter: () => setZone("hero", false),
      onLeaveBack: () => setZone("hero", true),
    });
  }

  /* Titres : lignes qui montent */
  function lineReveals() {
    $$(".section-title, .gallery__title").forEach((el) => {
      gsap.from($$(".line__in", el), {
        yPercent: 115,
        rotate: 3,
        transformOrigin: "0% 100%",
        duration: 1.5,
        stagger: 0.1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    $$(".eyebrow, .body-txt, .manifesto__sign").forEach((el) => {
      if (el.closest(".hero, .menu, .loader, .stat, .footer")) return;
      gsap.from(el, {
        y: 20, autoAlpha: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  }

  /* Manifeste : les mots s'allument au fil de la lecture */
  function manifesto() {
    const el = $("[data-words]");
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w">${w}</span>`)
      .join(" ");

    gsap.to($$(".w", el), {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: true },
    });
  }

  /* Collection : défilement horizontal épinglé */
  function collection() {
    const track = $(".collection__track");
    const cards = $$(".card:not(.card--end)", track);
    const cur = $(".collection__cur");
    const bar = $(".collection__progress span");
    const dist = () => track.scrollWidth - innerWidth;

    const move = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: ".collection",
        start: "top top",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          bar.style.transform = `scaleX(${self.progress})`;
          const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
          cur.textContent = String(i).padStart(2, "0");
        },
      },
    });

    cards.forEach((card) => {
      gsap.fromTo($("img", card), { xPercent: -7 }, {
        xPercent: 7,
        ease: "none",
        scrollTrigger: { trigger: card, containerAnimation: move, start: "left right", end: "right left", scrub: true },
      });
      gsap.from($(".card__info", card), {
        y: 30, autoAlpha: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: card, containerAnimation: move, start: "left 85%" },
      });
    });
  }

  /* Images qui se dévoilent + parallaxe */
  function revealSplit() {
    $$(".reveal-split__img").forEach((wrap, i) => {
      const img = $("img", wrap);
      gsap.fromTo(wrap,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", delay: i * 0.15,
          scrollTrigger: { trigger: wrap, start: "top 80%" } });
      gsap.fromTo(img, { scale: 1.5 }, {
        scale: 1.15, duration: 2.2, ease: "expo.out", delay: i * 0.15,
        scrollTrigger: { trigger: wrap, start: "top 80%" },
      });
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* Bandeau défilant, réactif à la vitesse du scroll */
  function marquee() {
    const row = $(".marquee__row");
    const inner = $(".marquee__inner");
    row.appendChild(inner.cloneNode(true)).setAttribute("aria-hidden", "true");

    let width = inner.offsetWidth;
    let x = 0;
    let dir = 1;
    const skew = gsap.quickTo(row, "skewX", { duration: 0.6, ease: "power3.out" });
    addEventListener("resize", () => (width = inner.offsetWidth));

    lenis.on("scroll", ({ direction }) => direction && (dir = direction));
    gsap.ticker.add(() => {
      const v = lenis.velocity || 0;
      x -= (0.55 + Math.min(Math.abs(v), 60) * 0.12) * dir;
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      gsap.set(row, { x });
      skew(gsap.utils.clamp(-8, 8, -v * 0.25));
    });
  }

  /* Compteurs */
  function counters() {
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count;
      const dec = +(el.dataset.decimals || 0);
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 2.4, ease: "expo.out",
        onUpdate: () => (el.textContent = formatNum(o.v, dec)),
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
    gsap.from(".stat", {
      y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: ".stats", start: "top 85%" },
    });
  }

  /* Galerie : parallaxe à plusieurs vitesses */
  function gallery() {
    $$(".g").forEach((g) => {
      const speed = +g.dataset.speed;
      gsap.to(g, {
        y: () => -speed * innerHeight * 1.4,
        ease: "none",
        scrollTrigger: { trigger: ".gallery", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
      gsap.fromTo($("img", g), { scale: 1.4 }, {
        scale: 1.05, ease: "none",
        scrollTrigger: { trigger: g, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    gsap.fromTo(".gallery__title", { scale: 0.82 }, {
      scale: 1.08, ease: "none",
      scrollTrigger: { trigger: ".gallery", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  /* Pied de page : le logotype géant monte */
  function footer() {
    gsap.from(".footer__word > *", {
      yPercent: 100, autoAlpha: 0, duration: 1.8, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: ".footer__word", start: "top 95%" },
    });
  }

  function formatNum(v, dec) {
    return v.toFixed(dec).replace(".", ",");
  }

  /* ------------------------------------------------------------------------
     Curseur personnalisé
     ------------------------------------------------------------------------ */
  if (finePointer) {
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

    addEventListener("mousemove", (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });

    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      const view = t.closest('[data-cursor="view"]');
      const hide = t.closest('a, button, label, input, textarea, [data-cursor="hide"], .service');
      cursor.classList.toggle("is-view", !!view && !hide);
      cursor.classList.toggle("is-hide", !!hide);
      cursor.classList.toggle("is-dark", !!t.closest(".gallery, .footer, .menu"));
    });
    document.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }));
    document.addEventListener("mouseenter", () => gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }));

    /* Boutons magnétiques */
    $$(".magnetic, .menu-btn__icon").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.35);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("mouseleave", () => { mx(0); my(0); });
    });

    /* Services : image flottante qui suit la souris */
    const float = $(".services__float");
    const floatIn = $(".services__float-in");
    const fx = gsap.quickTo(float, "x", { duration: 0.7, ease: "power3" });
    const fy = gsap.quickTo(float, "y", { duration: 0.7, ease: "power3" });
    const fr = gsap.quickTo(float, "rotate", { duration: 0.9, ease: "power3" });
    let lastX = 0;

    $$(".service").forEach((s) => {
      s.addEventListener("mouseenter", () => {
        floatIn.style.backgroundImage = `url("${s.dataset.img}")`;
        gsap.fromTo(floatIn, { scale: 1.4 }, { scale: 1, duration: 1.2, ease: "expo.out" });
        gsap.to(float, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" });
      });
    });
    $(".services__list").addEventListener("mouseleave", () =>
      gsap.to(float, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.6, ease: "expo.inOut" })
    );
    $(".services__list").addEventListener("mousemove", (e) => {
      fx(e.clientX); fy(e.clientY);
      fr(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
  }

  /* ------------------------------------------------------------------------
     Menu, ancres, formulaire
     ------------------------------------------------------------------------ */
  initMenu();
  initForm();

  function initMenu() {
    const btn = $(".menu-btn");
    const menu = $(".menu");
    let open = false;

    const tl = gsap
      .timeline({ paused: true, defaults: { ease: "expo.inOut" } })
      .set(menu, { visibility: "visible" })
      .fromTo(".menu__bg", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1 })
      .fromTo(".menu__list a", { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.06, ease: "expo.out" }, 0.45)
      .fromTo(".menu__aside > *", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.04, ease: "power3.out" }, 0.6);

    const toggle = (state = !open) => {
      open = state;
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-hidden", !open);
      header.classList.remove("is-hidden");
      if (open) { lenis?.stop(); tl.timeScale(1).play(); }
      else { lenis?.start(); tl.timeScale(1.6).reverse(); }
    };

    btn.addEventListener("click", () => toggle());
    addEventListener("keydown", (e) => e.key === "Escape" && open && toggle(false));

    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#") return;
        e.preventDefault();
        const go = () => scrollToTarget(id === "#top" ? 0 : id);
        if (open) { toggle(false); setTimeout(go, 500); } else go();
      })
    );
  }

  function initForm() {
    const wa = (text = "") =>
      `https://wa.me/${WHATSAPP_NUMBER}${text ? "?text=" + encodeURIComponent(text) : ""}`;

    $$(".js-wa-link").forEach((a) => {
      a.href = wa("Bonjour, je souhaite des informations sur la Résidence Petit Bel-Air.");
      a.target = "_blank";
      a.rel = "noopener";
    });

    const form = $(".form");
    const ok = $(".form__ok");
    const dIn = $("#f-in");
    const dOut = $("#f-out");
    const today = new Date().toISOString().slice(0, 10);
    dIn.min = today;
    dOut.min = today;
    dIn.addEventListener("change", () => {
      dOut.min = dIn.value || today;
      if (dOut.value && dOut.value <= dIn.value) dOut.value = "";
    });

    const fr = (v) => new Date(v + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#f-name");
      const checks = [
        [name, !name.value.trim()],
        [dIn, !dIn.value],
        [dOut, !dOut.value || dOut.value <= dIn.value],
      ];
      checks.forEach(([f, bad]) => f.parentElement.classList.toggle("is-error", bad));
      if (checks.some(([, bad]) => bad)) {
        ok.textContent = "Merci d'indiquer votre nom et des dates d'arrivée et de départ valides.";
        return;
      }

      const nights = Math.round((new Date(dOut.value) - new Date(dIn.value)) / 864e5);
      const logement = $('input[name="logement"]:checked').value;
      const lines = [
        "Bonjour Petit Bel-Air, je souhaite vérifier une disponibilité :",
        `• Logement : ${logement}`,
        `• Du ${fr(dIn.value)} au ${fr(dOut.value)} (${nights} nuit${nights > 1 ? "s" : ""})`,
        `• Personnes : ${$("#f-guests").value}`,
        `• Nom : ${name.value.trim()}`,
      ];
      const phone = $("#f-phone").value.trim();
      if (phone) lines.push(`• Téléphone : ${phone}`);
      const msg = $("#f-msg").value.trim();
      if (msg) lines.push("", msg);

      window.open(wa(lines.join("\n")), "_blank", "noopener");
      ok.textContent = `Merci ${name.value.trim().split(" ")[0]} ! Votre demande s'ouvre dans WhatsApp, il ne reste qu'à l'envoyer.`;
      if (!reduceMotion) gsap.from(ok, { y: 14, autoAlpha: 0, duration: 1, ease: "expo.out" });
    });
  }
})();
