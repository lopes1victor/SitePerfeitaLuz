(async () => {
  const SiteConfig = window.SiteConfig;
  const finishConfigBoot = () => {
    document.documentElement.classList.remove("config-loading");
  };

  if (!SiteConfig) {
    finishConfigBoot();
    return;
  }
  const config = await SiteConfig.load();
  if (!config) {
    finishConfigBoot();
    return;
  }

  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

  const setText = (selector, value) => {
    const el = $(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  const setImage = (selector, image) => {
    const el = $(selector);
    if (!el || !image) return;
    if (image.src) el.src = image.src;
    el.alt = image.alt || "";
  };

  const setVideo = (selector, video) => {
    const el = $(selector);
    if (!el || !video) return;
    if (video.poster) el.setAttribute("poster", video.poster);
    const src = video.src || "";
    if (src) {
      if (el.getAttribute("src") !== src) {
        el.setAttribute("src", src);
        el.load();
      }
    } else {
      el.removeAttribute("src");
      el.load();
    }
  };

  const setLink = (selector, link) => {
    const el = $(selector);
    if (!el || !link) return;
    if (link.label) el.textContent = link.label;
    if (link.href) el.setAttribute("href", link.href);
  };

  const SECTION_ORDER_MAP = {
    about: "sobre",
    services: "curadoria",
    collections: "colecoes",
    projects: "projetos",
    media: "midia",
    showroom: "showroom"
  };
  const SECTION_ORDER_KEYS = Object.keys(SECTION_ORDER_MAP);

  const normalizeSectionOrder = (order) => {
    const source = Array.isArray(order) ? order : [];
    const normalized = [];
    source.forEach((key) => {
      if (!SECTION_ORDER_KEYS.includes(key)) return;
      if (normalized.includes(key)) return;
      normalized.push(key);
    });
    SECTION_ORDER_KEYS.forEach((key) => {
      if (!normalized.includes(key)) normalized.push(key);
    });
    return normalized;
  };

  const applySectionOrder = () => {
    const main = document.querySelector("main#conteudo");
    if (!main) return;
    const footer = main.querySelector("footer.footer");
    const order = normalizeSectionOrder(config.sectionOrder);
    config.sectionOrder = order;
    order.forEach((key) => {
      const sectionId = SECTION_ORDER_MAP[key];
      if (!sectionId) return;
      const section = document.getElementById(sectionId);
      if (!section || section.parentElement !== main) return;
      main.insertBefore(section, footer || null);
    });
  };

  let aboutCycleTimer = null;

  const renderStats = (selector, items) => {
    const wrap = $(selector);
    if (!wrap || !Array.isArray(items)) return;
    wrap.innerHTML = "";
    items.forEach((item) => {
      const stat = document.createElement("div");
      stat.className = "stat";
      const num = document.createElement("span");
      num.className = "stat__num";
      num.textContent = item.value;
      const label = document.createElement("span");
      label.className = "stat__label";
      label.textContent = item.label;
      stat.appendChild(num);
      stat.appendChild(label);
      wrap.appendChild(stat);
    });
  };

  const renderServices = (selector, items) => {
    const grid = $(selector);
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "service-card reveal";
      const title = document.createElement("h3");
      title.textContent = item.title;
      const text = document.createElement("p");
      text.textContent = item.text;
      card.appendChild(title);
      card.appendChild(text);
      grid.appendChild(card);
    });
  };

  const toCollectionImages = (item) => {
    if (!item) return [];
    const gallery = Array.isArray(item.images) ? item.images : [];
    const validGallery = gallery.filter((image) => image && image.src);
    if (validGallery.length) return validGallery;
    if (item.image && item.image.src) return [item.image];
    return [];
  };

  const renderCollections = (selector, items) => {
    const grid = $(selector);
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "collection-card reveal";

      const media = document.createElement("div");
      media.className = "collection-card__media";

      const imageBtn = document.createElement("button");
      imageBtn.type = "button";
      imageBtn.className = "collection-card__imagebtn";
      imageBtn.setAttribute("aria-label", `Abrir galeria de ${item.title || "coleção"}`);

      const img = document.createElement("img");
      img.loading = "lazy";
      imageBtn.appendChild(img);
      media.appendChild(imageBtn);

      const images = toCollectionImages(item);
      let activeIndex = 0;

      const applyImage = () => {
        const current = images[activeIndex] || {};
        img.src = current.src || "";
        img.alt = current.alt || item.title || "";
      };

      if (images.length) applyImage();

      const openCollectionLightbox = () => {
        if (!images.length) return;
        openLightbox(
          images.map((image, index) => ({
            src: image.src || "",
            alt: image.alt || item.title || `Coleção ${index + 1}`,
            cap: `${item.title || "Coleção"} • ${index + 1}/${images.length}`
          })),
          activeIndex
        );
      };
      imageBtn.addEventListener("click", openCollectionLightbox);

      if (images.length > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "collection-card__nav collection-card__nav--prev";
        prevBtn.setAttribute("aria-label", "Foto anterior");
        prevBtn.textContent = "<";

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "collection-card__nav collection-card__nav--next";
        nextBtn.setAttribute("aria-label", "Próxima foto");
        nextBtn.textContent = ">";

        const counter = document.createElement("span");
        counter.className = "collection-card__counter";

        const updateCounter = () => {
          counter.textContent = `${activeIndex + 1} / ${images.length}`;
        };

        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeIndex = (activeIndex - 1 + images.length) % images.length;
          applyImage();
          updateCounter();
        });

        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeIndex = (activeIndex + 1) % images.length;
          applyImage();
          updateCounter();
        });

        updateCounter();
        media.appendChild(prevBtn);
        media.appendChild(nextBtn);
        media.appendChild(counter);
      }

      const label = document.createElement("span");
      label.className = "collection-card__label";
      label.textContent = item.title || "";
      media.appendChild(label);

      card.appendChild(media);
      grid.appendChild(card);
    });
  };

  const toProjectImages = (item) => {
    if (!item) return [];
    const gallery = Array.isArray(item.images) ? item.images : [];
    const validGallery = gallery.filter((image) => image && image.src);
    if (validGallery.length) return validGallery;
    if (item.image && item.image.src) return [item.image];
    return [];
  };

  const renderProjects = (selector, items) => {
    const track = $(selector);
    if (!track || !Array.isArray(items)) return;
    track.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "project-card reveal";

      const media = document.createElement("div");
      media.className = "project-card__media";
      const imageBtn = document.createElement("button");
      imageBtn.type = "button";
      imageBtn.className = "project-card__imagebtn";
      imageBtn.setAttribute("aria-label", `Abrir galeria de ${item.title || "projeto"}`);

      const img = document.createElement("img");
      img.loading = "lazy";
      imageBtn.appendChild(img);
      media.appendChild(imageBtn);

      const images = toProjectImages(item);
      let activeIndex = 0;

      const applyImage = () => {
        const current = images[activeIndex] || {};
        img.src = current.src || "";
        img.alt = current.alt || item.title || "";
      };

      if (images.length) applyImage();

      const openProjectLightbox = () => {
        if (!images.length) return;
        openLightbox(
          images.map((image, index) => ({
            src: image.src || "",
            alt: image.alt || item.title || `Projeto ${index + 1}`,
            cap: `${item.title || "Projeto"} • ${index + 1}/${images.length}`
          })),
          activeIndex
        );
      };
      imageBtn.addEventListener("click", openProjectLightbox);

      if (images.length > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "project-card__nav project-card__nav--prev";
        prevBtn.setAttribute("aria-label", "Foto anterior");
        prevBtn.textContent = "<";

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "project-card__nav project-card__nav--next";
        nextBtn.setAttribute("aria-label", "Próxima foto");
        nextBtn.textContent = ">";

        const counter = document.createElement("span");
        counter.className = "project-card__counter";

        const updateCounter = () => {
          counter.textContent = `${activeIndex + 1} / ${images.length}`;
        };

        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeIndex = (activeIndex - 1 + images.length) % images.length;
          applyImage();
          updateCounter();
        });

        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeIndex = (activeIndex + 1) % images.length;
          applyImage();
          updateCounter();
        });

        updateCounter();
        media.appendChild(prevBtn);
        media.appendChild(nextBtn);
        media.appendChild(counter);
      }

      const body = document.createElement("div");
      body.className = "project-card__body";

      const title = document.createElement("h3");
      title.textContent = item.title;
      const text = document.createElement("p");
      text.textContent = item.text;

      const link = document.createElement("a");
      link.className = "link";
      link.href = item.linkHref || "#";
      link.textContent = item.linkLabel || "Saiba mais";

      body.appendChild(title);
      body.appendChild(text);
      body.appendChild(link);

      card.appendChild(media);
      card.appendChild(body);
      track.appendChild(card);
    });
  };

  const renderMediaItems = (selector, items) => {
    const track = $(selector);
    if (!track || !Array.isArray(items)) return;
    track.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "media-card reveal";

      const img = document.createElement("img");
      img.src = item.image?.src || "";
      img.alt = item.image?.alt || item.title || "";
      img.loading = "lazy";

      const body = document.createElement("div");
      body.className = "media-card__body";

      if (item.date) {
        const meta = document.createElement("span");
        meta.className = "media-card__meta";
        meta.textContent = item.date;
        body.appendChild(meta);
      }

      const title = document.createElement("h4");
      title.textContent = item.title || "";
      const text = document.createElement("p");
      text.textContent = item.text || "";

      body.appendChild(title);
      body.appendChild(text);

      if (item.linkLabel || item.linkHref) {
        const link = document.createElement("a");
        link.className = "link";
        link.href = item.linkHref || "#";
        link.textContent = item.linkLabel || "Ver mais";
        body.appendChild(link);
      }

      card.appendChild(img);
      card.appendChild(body);
      track.appendChild(card);
    });
  };

  const processIconData = [
    {
      viewBox: "0 0 24 24",
      path:
        "M9 2h6a2 2 0 012 2v1h1a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1V4a2 2 0 012-2zm0 3h6V4H9v1zM6 7v13h12V7H6z"
    },
    {
      viewBox: "0 0 24 24",
      path:
        "M12 2a7 7 0 00-4 12.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2zm0 2a5 5 0 013 9.17c-.3.22-.5.56-.5.93V16h-5v-1.9c0-.37-.2-.71-.5-.93A5 5 0 0112 4zM9 21h6v-1H9v1z"
    },
    {
      viewBox: "0 0 24 24",
      path:
        "M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 13.2l-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5 5z"
    }
  ];

  const createProcessIcon = (index) => {
    const data = processIconData[index % processIconData.length];
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", data.viewBox);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data.path);
    svg.appendChild(path);
    return svg;
  };

  const renderProcess = (selector, items) => {
    const list = $(selector);
    if (!list || !Array.isArray(items)) return;
    list.innerHTML = "";
    list.classList.add("is-animating");
    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "process__step";
      li.style.setProperty("--step-delay", `${index * 0.18}s`);

      const icon = document.createElement("div");
      icon.className = "process__icon";
      icon.appendChild(createProcessIcon(index));

      const idx = document.createElement("span");
      idx.className = "process__index";
      idx.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("h3");
      title.textContent = item.title;
      const text = document.createElement("p");
      text.textContent = item.text;

      li.appendChild(icon);
      li.appendChild(idx);
      li.appendChild(title);
      li.appendChild(text);
      list.appendChild(li);
    });
  };

  const applyMeta = () => {
    if (!config.meta) return;
    document.title = config.meta.title || document.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && config.meta.description) desc.setAttribute("content", config.meta.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && config.meta.ogTitle) ogTitle.setAttribute("content", config.meta.ogTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && config.meta.ogDescription) ogDesc.setAttribute("content", config.meta.ogDescription);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && config.meta.ogImage) ogImg.setAttribute("content", config.meta.ogImage);
  };

  const applyBrand = () => {
    if (!config.brand?.logo) return;
    setImage("#brand-logo", config.brand.logo);
    setImage("#footer-logo", config.brand.logo);
  };

  const applyHero = () => {
    setText("#hero-eyebrow", config.hero.eyebrow);
    setText("#hero-title", config.hero.title);
    setText("#hero-subtitle", config.hero.subtitle);
    setImage("#hero-bg-image", config.hero.background);
    const heroBg = document.querySelector(".hero__bg");
    if (!document.querySelector("#hero-bg-image") && heroBg && config.hero.background?.src) {
      heroBg.style.setProperty("--hero-bg-image", `url("${config.hero.background.src}")`);
    }
  };

  const toAboutSlide = (item) => {
    if (!item || typeof item !== "object") return null;
    const title = String(item.title || "").trim();
    const text = String(item.text || "").trim();
    if (!title || !text) return null;
    return { title, text };
  };

  const getAboutSlides = () => {
    const base = toAboutSlide({
      title: config.about?.title || "Sobre a Perfeita Luz",
      text:
        config.about?.text ||
        "Atuando no mercado desde 2014, a Perfeita Luz oferece solucoes completas em iluminacao tecnica e decorativa."
    });

    const customSlides = Array.isArray(config.about?.rotatingItems)
      ? config.about.rotatingItems.map(toAboutSlide).filter(Boolean)
      : [];

    const fallbackSlides = [
      {
        title: "Missao",
        text:
          "Transformar ambientes com solucoes de iluminacao que unem tecnica, estetica e atendimento consultivo."
      },
      {
        title: "Visao",
        text:
          "Ser referencia em curadoria luminotecnica em Alphaville e regiao, com excelencia em projeto e experiencia."
      },
      {
        title: "Valores",
        text:
          "Respeito ao cliente, compromisso com qualidade, transparencia nas indicacoes e cuidado em cada detalhe."
      }
    ];

    const extras = customSlides.length ? customSlides : fallbackSlides;
    return [base, ...extras].filter(Boolean);
  };

  const startAboutCycle = () => {
    const titleEl = $("#about-title");
    const textEl = $("#about-text");
    if (!titleEl || !textEl) return;

    const head = titleEl.closest(".section__head");
    if (!head) return;

    if (aboutCycleTimer) clearTimeout(aboutCycleTimer);

    const slides = getAboutSlides();
    if (slides.length < 2) {
      head.classList.remove("about-rotator", "is-leaving", "is-entering");
      return;
    }

    let index = 0;
    const applySlide = (slide) => {
      titleEl.textContent = slide.title;
      textEl.textContent = slide.text;
    };

    applySlide(slides[index]);
    head.classList.add("about-rotator");
    head.classList.remove("is-leaving", "is-entering");

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = 3600;
    const leaveMs = 380;

    const scheduleNext = () => {
      aboutCycleTimer = window.setTimeout(() => {
        index = (index + 1) % slides.length;

        if (prefersReducedMotion) {
          applySlide(slides[index]);
          scheduleNext();
          return;
        }

        head.classList.add("is-leaving");
        window.setTimeout(() => {
          applySlide(slides[index]);
          head.classList.remove("is-leaving");
          head.classList.add("is-entering");
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              head.classList.remove("is-entering");
            });
          });
          scheduleNext();
        }, leaveMs);
      }, holdMs);
    };

    scheduleNext();
  };

  const applyAbout = () => {
    setText("#about-title", config.about.title);
    setText("#about-text", config.about.text);
    setImage("#about-image", config.about.image);
    renderStats("#about-stats", config.about.stats);
    startAboutCycle();
  };

  const applyServices = () => {
    if (config.servicesSection) {
      setText("#services-title", config.servicesSection.title);
      setText("#services-subtitle", config.servicesSection.subtitle);
      setLink("#services-cta", config.servicesSection.cta);
    }
    renderServices("#services-list", config.services);
  };

  const applyCollections = () => {
    setText("#collections-title", config.collections.title);
    setText("#collections-subtitle", config.collections.subtitle);
    renderCollections("#collections-grid", config.collections.items);
  };

  const applyProjects = () => {
    setText("#projects-title", config.projects.title);
    setText("#projects-subtitle", config.projects.subtitle);
    renderProjects("#projects-track", config.projects.items);
  };

  const applyMedia = () => {
    if (!config.media) return;
    setText("#media-title", config.media.title);
    setText("#media-subtitle", config.media.subtitle);

    if (config.media.featured) {
      setText("#media-eyebrow", config.media.featured.eyebrow);
      setText("#media-badge", config.media.featured.badge);
      setText("#media-featured-title", config.media.featured.title);
      setText("#media-featured-text", config.media.featured.text);
      setLink("#media-featured-link", {
        label: config.media.featured.linkLabel,
        href: config.media.featured.linkHref
      });
      setVideo("#media-video", config.media.featured.video);
    }

    renderMediaItems("#media-track", config.media.items);
  };

  const applyProcess = () => {
    setText("#process-title", config.process.title);
    setText("#process-subtitle", config.process.subtitle);
    renderProcess("#process-steps", config.process.steps);
  };

  const applyShowroom = () => {
    setText("#showroom-title", config.showroom.title);
    setText("#showroom-address", config.showroom.address);
    setLink("#showroom-cta", { label: config.showroom.ctaLabel, href: config.showroom.ctaHref });
    const map = $("#map-frame");
    if (map && config.showroom.mapUrl) map.setAttribute("src", config.showroom.mapUrl);
  };

  const applyContact = () => {
    setText("#contact-title", config.contact.title);
    setText("#contact-subtitle", config.contact.subtitle);
    setText("#contact-address-label", config.contact.addressLabel);
    setText("#contact-address", config.contact.address);
    setText("#contact-phone-label", config.contact.phoneLabel);
    setText("#contact-whatsapp-label", config.contact.whatsappLabel);
    setText("#contact-instagram-label", config.contact.instagramLabel);
    setText("#contact-note", config.contact.formNote);

    const phoneBtn = $("#contact-phone");
    if (phoneBtn) {
      phoneBtn.textContent = config.contact.phone;
      phoneBtn.setAttribute("data-copy", config.contact.phone);
    }

    const whatsappLink = $("#contact-whatsapp");
    if (whatsappLink) whatsappLink.textContent = config.contact.whatsapp;

    const insta = $("#contact-instagram");
    if (insta && config.contact.instagram) insta.setAttribute("href", config.contact.instagram);
  };

  const applyHeader = () => {
    setLink("#nav-cta", { label: config.header.ctaLabel, href: config.header.ctaHref });
    setLink("#header-cta", { label: config.header.ctaLabel, href: config.header.ctaHref });
    const ig = $("#header-ig");
    if (ig && config.header.instagram) ig.setAttribute("href", config.header.instagram);
  };

  const applyFooter = () => {
    setText("#footer-tagline", config.footer.tagline);
  };

  applyMeta();
  applyBrand();
  applyHeader();
  applyHero();
  applyAbout();
  applyServices();
  applyCollections();
  applyProjects();
  applyMedia();
  applyProcess();
  applyShowroom();
  applyContact();
  applyFooter();
  applySectionOrder();
  finishConfigBoot();

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuBtn = document.querySelector("[data-menu-btn]");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const closeMenu = () => {
    if (!nav || !menuBtn) return;
    nav.classList.remove("is-open");
    menuBtn.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  const openMenu = () => {
    if (!nav || !menuBtn) return;
    nav.classList.add("is-open");
    menuBtn.classList.add("is-open");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const isOpen = nav?.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });
  }

  if (nav) {
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      closeMenu();
    });
  }

  const dlg = document.querySelector("[data-lightbox]");
  const dlgImg = document.querySelector("[data-lightbox-img]");
  const dlgCap = document.querySelector("[data-lightbox-cap]");
  const dlgClose = document.querySelector("[data-lightbox-close]");
  const dlgPrev = document.querySelector("[data-lightbox-prev]");
  const dlgNext = document.querySelector("[data-lightbox-next]");
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxScrollPos = null;

  const rememberScrollPos = () => {
    lightboxScrollPos = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0
    };
  };

  const restoreScrollPos = () => {
    if (!lightboxScrollPos) return;
    const { x, y } = lightboxScrollPos;
    lightboxScrollPos = null;
    requestAnimationFrame(() => {
      window.scrollTo({ left: x, top: y, behavior: "auto" });
    });
  };

  const setLightboxSlide = (index) => {
    if (!dlgImg || !dlgCap || !lightboxItems.length) return;
    lightboxIndex = Math.max(0, Math.min(index, lightboxItems.length - 1));
    const slide = lightboxItems[lightboxIndex];
    dlgImg.src = slide.src || "";
    dlgImg.alt = slide.alt || slide.cap || "Imagem";
    dlgCap.textContent = slide.cap || "";
    const multi = lightboxItems.length > 1;
    if (dlgPrev) dlgPrev.style.display = multi ? "" : "none";
    if (dlgNext) dlgNext.style.display = multi ? "" : "none";
  };

  const stepLightbox = (delta) => {
    if (lightboxItems.length < 2) return;
    const next = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    setLightboxSlide(next);
  };

  const openLightbox = (srcOrItems, capOrStartIndex) => {
    if (!dlg || !dlgImg || !dlgCap) return;
    if (Array.isArray(srcOrItems)) {
      lightboxItems = srcOrItems.filter((item) => item && item.src);
      if (!lightboxItems.length) return;
      const startIndex = typeof capOrStartIndex === "number" ? capOrStartIndex : 0;
      setLightboxSlide(startIndex);
    } else {
      const src = srcOrItems;
      if (!src) return;
      const cap = typeof capOrStartIndex === "string" ? capOrStartIndex : "";
      lightboxItems = [{ src, cap, alt: cap || "Imagem" }];
      setLightboxSlide(0);
    }
    rememberScrollPos();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  };

  const closeLightbox = () => {
    if (!dlg) return;
    if (dlg.hasAttribute("open")) {
      if (typeof dlg.close === "function") dlg.close();
      else dlg.removeAttribute("open");
      restoreScrollPos();
    }
    lightboxItems = [];
    lightboxIndex = 0;
  };

  const bindLightbox = () => {
    $$('[data-lightbox-src]').forEach((el) => {
      el.addEventListener("click", () => {
        openLightbox(el.getAttribute("data-lightbox-src"), el.getAttribute("data-lightbox-cap"));
      });
    });
  };

  bindLightbox();

  if (dlgClose) dlgClose.addEventListener("click", closeLightbox);
  if (dlgPrev) dlgPrev.addEventListener("click", () => stepLightbox(-1));
  if (dlgNext) dlgNext.addEventListener("click", () => stepLightbox(1));
  if (dlg) {
    dlg.addEventListener("click", (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) closeLightbox();
    });
  }

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  const timelines = $$("[data-timeline]");
  if (timelines.length) {
    const activateTimeline = (el) => el.classList.add("is-active");
    if ("IntersectionObserver" in window) {
      const timelineObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              activateTimeline(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      timelines.forEach((el) => timelineObserver.observe(el));
    } else {
      timelines.forEach(activateTimeline);
    }
  }

  const waUrl = (text) => {
    const msg = encodeURIComponent(text || "");
    return `https://api.whatsapp.com/send?phone=${config.whatsapp.number}&text=${msg}`;
  };

  const openWhatsApp = (text) => {
    window.open(waUrl(text), "_blank", "noopener,noreferrer");
  };

  $$('[data-whatsapp]').forEach((el) => {
    const link = waUrl(config.whatsapp.quickMessage);
    if (el.tagName.toLowerCase() === "a") el.setAttribute("href", link);
    el.addEventListener("click", (e) => {
      if (el.tagName.toLowerCase() === "a") e.preventDefault();
      openWhatsApp(config.whatsapp.quickMessage);
    });
  });

  const form = document.querySelector("[data-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nome = String(fd.get("nome") || "").trim();
      const tel = String(fd.get("tel") || "").trim();
      const msg = String(fd.get("msg") || "").trim();
      const text = config.whatsapp.template
        .replace("{nome}", nome || "-")
        .replace("{tel}", tel || "-")
        .replace("{msg}", msg ? "Mensagem: " + msg : "");
      openWhatsApp(text);
    });
  }

  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        const old = btn.textContent;
        btn.textContent = "Copiado ✓";
        setTimeout(() => (btn.textContent = old), 900);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeLightbox();
    }
    if (dlg && dlg.hasAttribute("open")) {
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  window.addEventListener(
    "pagehide",
    () => {
      if (aboutCycleTimer) clearTimeout(aboutCycleTimer);
    },
    { once: true }
  );
})();
