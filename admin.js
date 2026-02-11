(async () => {
  const SiteConfig = window.SiteConfig;
  if (!SiteConfig) return;

  let config = await SiteConfig.load();
  const defaults = SiteConfig.clone(SiteConfig.DEFAULT_CONFIG);

  const nav = document.querySelector("[data-config-nav]");
  const container = document.querySelector("[data-config-container]");
  const toast = document.querySelector("[data-toast]");
  let navObserver = null;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2000);
  };

  const parsePath = (path) =>
    path.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part));

  const getByPath = (obj, path) => {
    return parsePath(path).reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const setByPath = (obj, path, value) => {
    const parts = parsePath(path);
    let current = obj;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = value;
        return;
      }
      if (current[part] === undefined) {
        current[part] = typeof parts[idx + 1] === "number" ? [] : {};
      }
      current = current[part];
    });
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read_error"));
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });

  const createField = ({ label, path, multiline, hint, placeholder }) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.value = getByPath(config, path) ?? "";
    if (placeholder) input.placeholder = placeholder;

    input.addEventListener("input", () => {
      setByPath(config, path, input.value);
    });

    wrap.appendChild(labelEl);
    wrap.appendChild(input);

    if (hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "field__hint";
      hintEl.textContent = hint;
      wrap.appendChild(hintEl);
    }

    return wrap;
  };

  const createLinkFields = ({ label, basePath }) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const title = document.createElement("label");
    title.textContent = label;
    wrap.appendChild(title);

    const row = document.createElement("div");
    row.className = "field-row";

    const labelField = createField({
      label: "Texto",
      path: `${basePath}.label`
    });

    const hrefField = createField({
      label: "Link",
      path: `${basePath}.href`
    });

    row.appendChild(labelField);
    row.appendChild(hrefField);
    wrap.appendChild(row);

    return wrap;
  };

  const updateResolutionBadge = (badge, actual, recommended) => {
    if (!badge) return;
    if (!actual.width || !actual.height) {
      badge.textContent = "Atual: —";
      badge.className = "badge";
      return;
    }

    badge.textContent = `Atual: ${actual.width} x ${actual.height}`;
    if (!recommended) {
      badge.className = "badge";
      return;
    }

    const exactMatch = actual.width === recommended.width && actual.height === recommended.height;
    badge.className = exactMatch ? "badge badge--ok" : "badge badge--warn";
    if (!exactMatch) badge.textContent += " • fora do ideal";
  };

  const createImageField = ({ label, path }) => {
    const wrap = document.createElement("div");
    wrap.className = "image-field";

    const title = document.createElement("strong");
    title.textContent = label;

    const preview = document.createElement("img");
    preview.alt = label;
    preview.src = getByPath(config, `${path}.src`) || "";

    const previewWrap = document.createElement("div");
    previewWrap.className = "image-preview";
    previewWrap.appendChild(preview);

    const rec = getByPath(config, `${path}.recommended`);

    const badges = document.createElement("div");
    badges.className = "image-meta";
    const recBadge = document.createElement("span");
    recBadge.className = "badge";
    recBadge.textContent = rec
      ? `Ideal: ${rec.width} x ${rec.height}`
      : "Ideal: não definido";

    const actualBadge = document.createElement("span");
    actualBadge.className = "badge";
    actualBadge.textContent = "Atual: —";

    badges.appendChild(recBadge);
    badges.appendChild(actualBadge);

    const srcField = createField({
      label: "Caminho da imagem",
      path: `${path}.src`,
      placeholder: "assets/img/nome-da-imagem.jpg"
    });

    const altField = createField({
      label: "Texto alternativo (alt)",
      path: `${path}.alt`
    });
    const srcInput = srcField.querySelector("input");

    const fileField = document.createElement("div");
    fileField.className = "field";
    const fileLabel = document.createElement("label");
    fileLabel.textContent = "Escolher arquivo";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileField.appendChild(fileLabel);
    fileField.appendChild(fileInput);

    const updateResolution = (img, badgeEl, recommended) => {
      if (!img || !badgeEl) return;
      if (!img.complete) {
        img.onload = () => {
          updateResolutionBadge(badgeEl, { width: img.naturalWidth, height: img.naturalHeight }, recommended);
        };
        return;
      }
      updateResolutionBadge(badgeEl, { width: img.naturalWidth, height: img.naturalHeight }, recommended);
    };

    updateResolution(preview, actualBadge, rec);

    srcInput.addEventListener("input", (e) => {
      preview.src = e.target.value;
      updateResolution(preview, actualBadge, rec);
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setByPath(config, `${path}.src`, dataUrl);
        if (srcInput) srcInput.value = dataUrl;
        preview.src = dataUrl;
        updateResolution(preview, actualBadge, rec);
      };
      reader.readAsDataURL(file);
    });

    wrap.appendChild(title);
    wrap.appendChild(previewWrap);
    wrap.appendChild(badges);
    wrap.appendChild(srcField);
    wrap.appendChild(altField);
    wrap.appendChild(fileField);

    return wrap;
  };

  const createVideoField = ({ label, path }) => {
    const wrap = document.createElement("div");
    wrap.className = "video-field";

    const title = document.createElement("strong");
    title.textContent = label;

    const preview = document.createElement("video");
    preview.controls = true;
    preview.muted = true;
    preview.playsInline = true;
    preview.src = getByPath(config, `${path}.src`) || "";
    preview.poster = getByPath(config, `${path}.poster`) || "";

    const previewWrap = document.createElement("div");
    previewWrap.className = "video-preview";
    previewWrap.appendChild(preview);

    const rec = getByPath(config, `${path}.recommended`);

    const badges = document.createElement("div");
    badges.className = "image-meta";
    const recBadge = document.createElement("span");
    recBadge.className = "badge";
    recBadge.textContent = rec
      ? `Ideal: ${rec.width} x ${rec.height}`
      : "Ideal: nao definido";

    const actualBadge = document.createElement("span");
    actualBadge.className = "badge";
    actualBadge.textContent = "Atual: -";

    badges.appendChild(recBadge);
    badges.appendChild(actualBadge);

    const srcField = createField({
      label: "Caminho do video",
      path: `${path}.src`,
      placeholder: "assets/video/reel.mp4"
    });

    const posterField = createField({
      label: "Poster (imagem)",
      path: `${path}.poster`,
      placeholder: "assets/img/reel.jpg"
    });

    const fileField = document.createElement("div");
    fileField.className = "field";
    const fileLabel = document.createElement("label");
    fileLabel.textContent = "Escolher video";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileField.appendChild(fileLabel);
    fileField.appendChild(fileInput);

    const posterFileField = document.createElement("div");
    posterFileField.className = "field";
    const posterLabel = document.createElement("label");
    posterLabel.textContent = "Escolher poster";
    const posterInput = document.createElement("input");
    posterInput.type = "file";
    posterInput.accept = "image/*";
    posterFileField.appendChild(posterLabel);
    posterFileField.appendChild(posterInput);

    const updateVideoResolution = (video, badgeEl, recommended) => {
      if (!video || !badgeEl) return;
      const apply = () =>
        updateResolutionBadge(
          badgeEl,
          { width: video.videoWidth, height: video.videoHeight },
          recommended
        );
      if (video.readyState >= 1) {
        apply();
      } else {
        video.onloadedmetadata = apply;
      }
    };

    updateVideoResolution(preview, actualBadge, rec);

    srcField.querySelector("input").addEventListener("input", (e) => {
      preview.src = e.target.value;
      preview.load();
      updateVideoResolution(preview, actualBadge, rec);
    });

    posterField.querySelector("input").addEventListener("input", (e) => {
      preview.poster = e.target.value;
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setByPath(config, `${path}.src`, dataUrl);
        preview.src = dataUrl;
        preview.load();
        updateVideoResolution(preview, actualBadge, rec);
      };
      reader.readAsDataURL(file);
    });

    posterInput.addEventListener("change", () => {
      const file = posterInput.files && posterInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setByPath(config, `${path}.poster`, dataUrl);
        preview.poster = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    wrap.appendChild(title);
    wrap.appendChild(previewWrap);
    wrap.appendChild(badges);
    wrap.appendChild(srcField);
    wrap.appendChild(posterField);
    wrap.appendChild(fileField);
    wrap.appendChild(posterFileField);

    return wrap;
  };

  const createSection = (title, description) => {
    const section = document.createElement("section");
    section.className = "section-card";
    const h2 = document.createElement("h2");
    h2.textContent = title;
    section.appendChild(h2);
    if (description) {
      const p = document.createElement("p");
      p.textContent = description;
      section.appendChild(p);
    }
    return section;
  };

  const appendGroupTitle = (section, title) => {
    const h3 = document.createElement("div");
    h3.className = "group-title";
    h3.textContent = title;
    section.appendChild(h3);
  };

  const addFields = (section, fields) => {
    const wrap = document.createElement("div");
    wrap.className = "fields";
    fields.forEach((field) => wrap.appendChild(field));
    section.appendChild(wrap);
  };

  const slugify = (text) =>
    String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const buildSidebarNav = () => {
    if (!nav || !container) return;
    nav.innerHTML = "";

    const title = document.createElement("div");
    title.className = "admin-nav__title";
    title.textContent = "Seções";

    const list = document.createElement("div");
    list.className = "admin-nav__list";

    const sections = Array.from(container.querySelectorAll(".section-card"));
    const entries = sections
      .map((section, index) => {
        const h2 = section.querySelector("h2");
        if (!h2) return null;
        const label = h2.textContent || `Seção ${index + 1}`;
        const id = `${slugify(label) || "secao"}-${index + 1}`;
        section.id = id;

        const itemBtn = document.createElement("button");
        itemBtn.type = "button";
        itemBtn.className = "admin-nav__item";
        itemBtn.textContent = label;
        itemBtn.addEventListener("click", () => {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        list.appendChild(itemBtn);
        return { section, itemBtn };
      })
      .filter(Boolean);

    nav.appendChild(title);
    nav.appendChild(list);

    const setActive = (section) => {
      entries.forEach(({ section: target, itemBtn }) => {
        itemBtn.classList.toggle("is-active", target === section);
      });
    };

    if (navObserver) navObserver.disconnect();

    if ("IntersectionObserver" in window && entries.length) {
      navObserver = new IntersectionObserver(
        (observed) => {
          const visible = observed
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setActive(visible.target);
        },
        {
          root: null,
          threshold: [0.2, 0.5, 0.8],
          rootMargin: "-25% 0px -55% 0px"
        }
      );
      entries.forEach(({ section }) => navObserver.observe(section));
    }

    if (entries[0]) setActive(entries[0].section);
  };

  const getProjectImageFallback = () => ({
    src: "assets/img/p01.jpg",
    alt: "Imagem do projeto",
    recommended: { width: 1600, height: 1000 }
  });

  const getCollectionImageFallback = () => ({
    src: "assets/img/gallery-01.png",
    alt: "Imagem da coleção",
    recommended: { width: 900, height: 1100 }
  });

  const ensureProjectImages = (project) => {
    if (!project || typeof project !== "object") return [];
    if (!Array.isArray(project.images)) project.images = [];
    if (!project.images.length) {
      if (project.image && project.image.src) {
        project.images.push(SiteConfig.clone(project.image));
      } else {
        project.images.push(getProjectImageFallback());
      }
    }
    return project.images;
  };

  const ensureCollectionImages = (collection) => {
    if (!collection || typeof collection !== "object") return [];
    if (!Array.isArray(collection.images)) collection.images = [];
    if (!collection.images.length) {
      if (collection.image && collection.image.src) {
        collection.images.push(SiteConfig.clone(collection.image));
      } else {
        collection.images.push(getCollectionImageFallback());
      }
    }
    return collection.images;
  };

  const build = () => {
    if (!container) return;
    container.innerHTML = "";

    const meta = createSection("Meta e SEO", "Ajuste o título, descrições e imagem de compartilhamento.");
    addFields(meta, [
      createField({ label: "Título do site", path: "meta.title" }),
      createField({ label: "Descrição", path: "meta.description", multiline: true }),
      createField({ label: "OG Title", path: "meta.ogTitle" }),
      createField({ label: "OG Description", path: "meta.ogDescription", multiline: true }),
      createField({ label: "OG Image (URL)", path: "meta.ogImage" })
    ]);
    container.appendChild(meta);

    const brand = createSection("Marca", "Atualize o logo quadrado com fundo transparente.");
    brand.appendChild(createImageField({ label: "Logo", path: "brand.logo" }));
    container.appendChild(brand);

    const header = createSection("Cabeçalho", "Chamada principal do menu e link do Instagram.");
    addFields(header, [
      createField({ label: "Texto do botão", path: "header.ctaLabel" }),
      createField({ label: "Link do botão", path: "header.ctaHref" }),
      createField({ label: "Instagram", path: "header.instagram" })
    ]);
    container.appendChild(header);

    const hero = createSection("Hero", "Texto principal e imagem de impacto.");
    addFields(hero, [
      createField({ label: "Eyebrow", path: "hero.eyebrow" }),
      createField({ label: "Título", path: "hero.title", multiline: true }),
      createField({ label: "Subtítulo", path: "hero.subtitle", multiline: true })
    ]);

    appendGroupTitle(hero, "Imagem de fundo do topo");
    hero.appendChild(createImageField({ label: "Imagem de fundo", path: "hero.background" }));
    container.appendChild(hero);

    const about = createSection("Sobre", "Texto institucional e imagem de apoio.");
    addFields(about, [
      createField({ label: "Título", path: "about.title" }),
      createField({ label: "Texto", path: "about.text", multiline: true })
    ]);
    appendGroupTitle(about, "Indicadores");
    const statsWrap = document.createElement("div");
    statsWrap.className = "fields";
    (config.about.stats || []).forEach((_, index) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.appendChild(createField({ label: `Dado ${index + 1}`, path: `about.stats.${index}.value` }));
      row.appendChild(createField({ label: `Descrição ${index + 1}`, path: `about.stats.${index}.label` }));
      statsWrap.appendChild(row);
    });
    about.appendChild(statsWrap);
    appendGroupTitle(about, "Imagem sobre");
    about.appendChild(createImageField({ label: "Imagem sobre", path: "about.image" }));
    container.appendChild(about);

    const services = createSection("Curadoria", "Cards de serviços principais.");
    addFields(services, [
      createField({ label: "Título da seção", path: "servicesSection.title" }),
      createField({ label: "Subtítulo", path: "servicesSection.subtitle", multiline: true })
    ]);
    services.appendChild(createLinkFields({ label: "CTA da seção", basePath: "servicesSection.cta" }));
    appendGroupTitle(services, "Cards");
    const servicesWrap = document.createElement("div");
    servicesWrap.className = "fields";
    (config.services || []).forEach((_, index) => {
      const card = document.createElement("div");
      card.className = "field-row";
      card.appendChild(createField({ label: `Título ${index + 1}`, path: `services.${index}.title` }));
      card.appendChild(createField({ label: `Texto ${index + 1}`, path: `services.${index}.text` }));
      servicesWrap.appendChild(card);
    });
    services.appendChild(servicesWrap);
    container.appendChild(services);

    const collections = createSection("Coleções", "Cards com múltiplas fotos e navegação manual.");
    if (!config.collections) {
      config.collections = { title: "Coleções para cada linguagem", subtitle: "", items: [] };
    }
    if (!Array.isArray(config.collections.items)) config.collections.items = [];

    addFields(collections, [
      createField({ label: "Título da seção", path: "collections.title" }),
      createField({ label: "Subtítulo", path: "collections.subtitle", multiline: true })
    ]);
    appendGroupTitle(collections, "Itens");

    const collectionItems = config.collections.items;
    collectionItems.forEach((_, index) => {
      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.textContent = `Coleção ${index + 1}`;
      collections.appendChild(groupTitle);
      collections.appendChild(createField({ label: "Título", path: `collections.items.${index}.title` }));

      const images = ensureCollectionImages(config.collections.items[index]);
      images.forEach((__, imageIndex) => {
        const imageTitle = document.createElement("div");
        imageTitle.className = "group-title";
        imageTitle.textContent = `Foto ${imageIndex + 1}`;
        collections.appendChild(imageTitle);
        collections.appendChild(
          createImageField({ label: "Imagem", path: `collections.items.${index}.images.${imageIndex}` })
        );

        if (images.length > 1) {
          const removeImageBtn = document.createElement("button");
          removeImageBtn.className = "btn btn--ghost";
          removeImageBtn.type = "button";
          removeImageBtn.textContent = "Remover foto";
          removeImageBtn.addEventListener("click", () => {
            const targetCollection = config.collections?.items?.[index];
            if (!targetCollection || !Array.isArray(targetCollection.images)) return;
            targetCollection.images.splice(imageIndex, 1);
            if (!targetCollection.images.length) targetCollection.images.push(getCollectionImageFallback());
            build();
            showToast("Foto removida.");
          });
          collections.appendChild(removeImageBtn);
        }
      });

      const addImageBtn = document.createElement("button");
      addImageBtn.className = "btn btn--ghost";
      addImageBtn.type = "button";
      addImageBtn.textContent = "Adicionar foto";
      addImageBtn.addEventListener("click", () => {
        const targetCollection = config.collections?.items?.[index];
        if (!targetCollection) return;
        const targetImages = ensureCollectionImages(targetCollection);
        const rec = targetImages[0]?.recommended || { width: 900, height: 1100 };
        targetImages.push({
          src: targetImages[0]?.src || "assets/img/gallery-01.png",
          alt: `${targetCollection.title || "Coleção"} - foto ${targetImages.length + 1}`,
          recommended: { width: rec.width, height: rec.height }
        });
        build();
        showToast("Foto adicionada.");
      });
      collections.appendChild(addImageBtn);

      const batchField = document.createElement("div");
      batchField.className = "field";
      const batchLabel = document.createElement("label");
      batchLabel.textContent = "Selecionar várias fotos de uma vez";
      const batchInput = document.createElement("input");
      batchInput.type = "file";
      batchInput.accept = "image/*";
      batchInput.multiple = true;
      const batchHint = document.createElement("div");
      batchHint.className = "field__hint";
      batchHint.textContent = "A 1ª foto substitui a foto 1 da coleção. As demais são adicionadas.";

      batchInput.addEventListener("change", async () => {
        const selectedFiles = Array.from(batchInput.files || []);
        if (!selectedFiles.length) return;

        const targetCollection = config.collections?.items?.[index];
        if (!targetCollection) return;

        const targetImages = ensureCollectionImages(targetCollection);
        const rec = targetImages[0]?.recommended || { width: 900, height: 1100 };
        const results = await Promise.allSettled(
          selectedFiles.map((file) => readFileAsDataUrl(file))
        );

        const parsedImages = [];
        results.forEach((result, resultIndex) => {
          if (result.status !== "fulfilled") return;
          const src = String(result.value || "");
          if (!src) return;
          const file = selectedFiles[resultIndex];
          const fallbackName = `foto ${parsedImages.length + 1}`;
          parsedImages.push({
            src,
            alt: `${targetCollection.title || "Coleção"} - ${file?.name || fallbackName}`,
            recommended: { width: rec.width, height: rec.height }
          });
        });

        batchInput.value = "";
        if (!parsedImages.length) {
          showToast("Não foi possível adicionar as fotos selecionadas.");
          return;
        }

        const firstImage = parsedImages[0];
        if (targetImages.length) {
          const previous = targetImages[0] || {};
          targetImages[0] = {
            ...previous,
            src: firstImage.src,
            alt: firstImage.alt,
            recommended: previous.recommended || firstImage.recommended
          };
        } else {
          targetImages.push(firstImage);
        }

        const extraImages = parsedImages.slice(1);
        extraImages.forEach((image) => targetImages.push(image));

        build();
        const addedCount = extraImages.length;
        if (!addedCount) {
          showToast("Foto 1 substituída.");
          return;
        }
        showToast(
          `Foto 1 substituída e ${addedCount} foto${addedCount > 1 ? "s" : ""} adicionada${
            addedCount > 1 ? "s" : ""
          }.`
        );
      });

      batchField.appendChild(batchLabel);
      batchField.appendChild(batchInput);
      batchField.appendChild(batchHint);
      collections.appendChild(batchField);

      const removeCollectionBtn = document.createElement("button");
      removeCollectionBtn.className = "btn btn--ghost";
      removeCollectionBtn.type = "button";
      removeCollectionBtn.textContent = "Remover coleção";
      removeCollectionBtn.addEventListener("click", () => {
        if (!Array.isArray(config.collections?.items)) return;
        config.collections.items.splice(index, 1);
        build();
        showToast("Coleção removida.");
      });
      collections.appendChild(removeCollectionBtn);
    });

    const addCollectionBtn = document.createElement("button");
    addCollectionBtn.className = "btn btn--gold";
    addCollectionBtn.type = "button";
    addCollectionBtn.textContent = "Adicionar coleção";
    addCollectionBtn.addEventListener("click", () => {
      if (!config.collections) {
        config.collections = { title: "Coleções para cada linguagem", subtitle: "", items: [] };
      }
      if (!Array.isArray(config.collections.items)) config.collections.items = [];
      const baseItem = defaults.collections?.items?.[0]
        ? SiteConfig.clone(defaults.collections.items[0])
        : {
            title: "Nova coleção",
            image: {
              src: "assets/img/gallery-01.png",
              alt: "Imagem da coleção",
              recommended: { width: 900, height: 1100 }
            }
          };
      if (!Array.isArray(baseItem.images) || !baseItem.images.length) {
        if (baseItem.image && baseItem.image.src) {
          baseItem.images = [SiteConfig.clone(baseItem.image)];
        } else {
          baseItem.images = [getCollectionImageFallback()];
        }
      }
      baseItem.title = `Nova coleção ${config.collections.items.length + 1}`;
      config.collections.items.push(baseItem);
      build();
      showToast("Coleção adicionada.");
    });
    collections.appendChild(addCollectionBtn);
    container.appendChild(collections);

    const projects = createSection("Projetos", "Cards do carrossel editorial.");
    addFields(projects, [
      createField({ label: "Título da seção", path: "projects.title" }),
      createField({ label: "Subtítulo", path: "projects.subtitle", multiline: true })
    ]);
    appendGroupTitle(projects, "Itens");
    const projectItems = Array.isArray(config.projects?.items) ? config.projects.items : [];
    projectItems.forEach((_, index) => {
      const projectTitle = document.createElement("div");
      projectTitle.className = "group-title";
      projectTitle.textContent = `Projeto ${index + 1}`;
      projects.appendChild(projectTitle);
      projects.appendChild(createField({ label: "Título", path: `projects.items.${index}.title` }));
      projects.appendChild(createField({ label: "Texto", path: `projects.items.${index}.text`, multiline: true }));
      projects.appendChild(createField({ label: "Texto do link", path: `projects.items.${index}.linkLabel` }));
      projects.appendChild(createField({ label: "Link", path: `projects.items.${index}.linkHref` }));

      const images = ensureProjectImages(config.projects.items[index]);
      images.forEach((__, imageIndex) => {
        const imageTitle = document.createElement("div");
        imageTitle.className = "group-title";
        imageTitle.textContent = `Foto ${imageIndex + 1}`;
        projects.appendChild(imageTitle);
        projects.appendChild(
          createImageField({ label: "Imagem", path: `projects.items.${index}.images.${imageIndex}` })
        );

        if (images.length > 1) {
          const removeImageBtn = document.createElement("button");
          removeImageBtn.className = "btn btn--ghost";
          removeImageBtn.type = "button";
          removeImageBtn.textContent = "Remover foto";
          removeImageBtn.addEventListener("click", () => {
            const targetProject = config.projects?.items?.[index];
            if (!targetProject || !Array.isArray(targetProject.images)) return;
            targetProject.images.splice(imageIndex, 1);
            if (!targetProject.images.length) targetProject.images.push(getProjectImageFallback());
            build();
            showToast("Foto removida.");
          });
          projects.appendChild(removeImageBtn);
        }
      });

      const addImageBtn = document.createElement("button");
      addImageBtn.className = "btn btn--ghost";
      addImageBtn.type = "button";
      addImageBtn.textContent = "Adicionar foto";
      addImageBtn.addEventListener("click", () => {
        const targetProject = config.projects?.items?.[index];
        if (!targetProject) return;
        const targetImages = ensureProjectImages(targetProject);
        const rec = targetImages[0]?.recommended || { width: 1600, height: 1000 };
        targetImages.push({
          src: targetImages[0]?.src || "assets/img/p01.jpg",
          alt: `${targetProject.title || "Projeto"} - foto ${targetImages.length + 1}`,
          recommended: { width: rec.width, height: rec.height }
        });
        build();
        showToast("Foto adicionada.");
      });
      projects.appendChild(addImageBtn);

      const batchField = document.createElement("div");
      batchField.className = "field";
      const batchLabel = document.createElement("label");
      batchLabel.textContent = "Selecionar várias fotos de uma vez";
      const batchInput = document.createElement("input");
      batchInput.type = "file";
      batchInput.accept = "image/*";
      batchInput.multiple = true;
      const batchHint = document.createElement("div");
      batchHint.className = "field__hint";
      batchHint.textContent = "Escolha várias imagens (Ctrl/Shift) para adicionar no mesmo projeto.";

      batchInput.addEventListener("change", async () => {
        const selectedFiles = Array.from(batchInput.files || []);
        if (!selectedFiles.length) return;

        const targetProject = config.projects?.items?.[index];
        if (!targetProject) return;

        const targetImages = ensureProjectImages(targetProject);
        const rec = targetImages[0]?.recommended || { width: 1600, height: 1000 };
        const results = await Promise.allSettled(
          selectedFiles.map((file) => readFileAsDataUrl(file))
        );

        const parsedImages = [];
        results.forEach((result, resultIndex) => {
          if (result.status !== "fulfilled") return;
          const src = String(result.value || "");
          if (!src) return;
          const file = selectedFiles[resultIndex];
          const fallbackName = `foto ${parsedImages.length + 1}`;
          parsedImages.push({
            src,
            alt: `${targetProject.title || "Projeto"} - ${file?.name || fallbackName}`,
            recommended: { width: rec.width, height: rec.height }
          });
        });

        batchInput.value = "";
        if (!parsedImages.length) {
          showToast("Não foi possível adicionar as fotos selecionadas.");
          return;
        }

        const firstImage = parsedImages[0];
        if (targetImages.length) {
          const previous = targetImages[0] || {};
          targetImages[0] = {
            ...previous,
            src: firstImage.src,
            alt: firstImage.alt,
            recommended: previous.recommended || firstImage.recommended
          };
        } else {
          targetImages.push(firstImage);
        }

        const extraImages = parsedImages.slice(1);
        extraImages.forEach((image) => targetImages.push(image));

        build();
        const addedCount = extraImages.length;
        if (!addedCount) {
          showToast("Foto 1 substituída.");
          return;
        }
        showToast(`Foto 1 substituída e ${addedCount} foto${addedCount > 1 ? "s" : ""} adicionada${addedCount > 1 ? "s" : ""}.`);
      });

      batchField.appendChild(batchLabel);
      batchField.appendChild(batchInput);
      batchField.appendChild(batchHint);
      projects.appendChild(batchField);

      const removeProjectBtn = document.createElement("button");
      removeProjectBtn.className = "btn btn--ghost";
      removeProjectBtn.type = "button";
      removeProjectBtn.textContent = "Remover projeto";
      removeProjectBtn.addEventListener("click", () => {
        if (!Array.isArray(config.projects?.items)) return;
        config.projects.items.splice(index, 1);
        build();
        showToast("Projeto removido.");
      });
      projects.appendChild(removeProjectBtn);
    });

    const addProjectBtn = document.createElement("button");
    addProjectBtn.className = "btn btn--gold";
    addProjectBtn.type = "button";
    addProjectBtn.textContent = "Adicionar projeto";
    addProjectBtn.addEventListener("click", () => {
      if (!config.projects) config.projects = { title: "Projetos em destaque", subtitle: "", items: [] };
      if (!Array.isArray(config.projects.items)) config.projects.items = [];
      const baseItem = defaults.projects?.items?.[0]
        ? SiteConfig.clone(defaults.projects.items[0])
        : {
            title: "Novo projeto",
            text: "Descreva o projeto e seus diferenciais.",
            linkLabel: "Saiba mais",
            linkHref: "#contato",
            image: {
              src: "assets/img/p01.jpg",
              alt: "Imagem do projeto",
              recommended: { width: 1600, height: 1000 }
            }
          };
      if (!Array.isArray(baseItem.images) || !baseItem.images.length) {
        if (baseItem.image && baseItem.image.src) {
          baseItem.images = [SiteConfig.clone(baseItem.image)];
        } else {
          baseItem.images = [getProjectImageFallback()];
        }
      }
      baseItem.title = `Novo projeto ${config.projects.items.length + 1}`;
      config.projects.items.push(baseItem);
      build();
      showToast("Projeto adicionado.");
    });
    projects.appendChild(addProjectBtn);
    container.appendChild(projects);

    const media = createSection("Na midia", "Video destaque e carrossel de noticias.");
    addFields(media, [
      createField({ label: "Titulo da secao", path: "media.title" }),
      createField({ label: "Subtitulo", path: "media.subtitle", multiline: true })
    ]);
    appendGroupTitle(media, "Video destaque");
    addFields(media, [
      createField({ label: "Badge", path: "media.featured.badge" }),
      createField({ label: "Eyebrow", path: "media.featured.eyebrow" }),
      createField({ label: "Titulo do destaque", path: "media.featured.title" }),
      createField({ label: "Texto do destaque", path: "media.featured.text", multiline: true }),
      createField({ label: "Texto do link", path: "media.featured.linkLabel" }),
      createField({ label: "Link", path: "media.featured.linkHref" })
    ]);
    media.appendChild(createVideoField({ label: "Video reels", path: "media.featured.video" }));
    appendGroupTitle(media, "Noticias");
    (config.media?.items || []).forEach((_, index) => {
      const groupTitle = document.createElement("div");
      groupTitle.className = "group-title";
      groupTitle.textContent = `Noticia ${index + 1}`;
      media.appendChild(groupTitle);
      media.appendChild(createField({ label: "Titulo", path: `media.items.${index}.title` }));
      media.appendChild(createField({ label: "Data", path: `media.items.${index}.date` }));
      media.appendChild(createField({ label: "Texto", path: `media.items.${index}.text`, multiline: true }));
      media.appendChild(createField({ label: "Texto do link", path: `media.items.${index}.linkLabel` }));
      media.appendChild(createField({ label: "Link", path: `media.items.${index}.linkHref` }));
      media.appendChild(createImageField({ label: "Imagem", path: `media.items.${index}.image` }));
    });
    const addMediaBtn = document.createElement("button");
    addMediaBtn.className = "btn btn--gold";
    addMediaBtn.type = "button";
    addMediaBtn.textContent = "Adicionar noticia";
    addMediaBtn.addEventListener("click", () => {
      if (!config.media) config.media = { items: [] };
      if (!Array.isArray(config.media.items)) config.media.items = [];
      const baseItem = defaults.media?.items?.[0]
        ? SiteConfig.clone(defaults.media.items[0])
        : {
            title: "Nova noticia",
            date: "Mes AAAA",
            text: "Descricao da noticia.",
            linkLabel: "Ver mais",
            linkHref: "#",
            image: {
              src: "assets/img/p05.jpg",
              alt: "Imagem da noticia",
              recommended: { width: 1200, height: 900 }
            }
          };
      config.media.items.push(baseItem);
      build();
      showToast("Noticia adicionada.");
    });
    media.appendChild(addMediaBtn);
    container.appendChild(media);

    const process = createSection("Processo (linha do tempo)", "Etapas exibidas dentro da Curadoria.");
    addFields(process, [
      createField({ label: "Título da seção", path: "process.title" }),
      createField({ label: "Subtítulo", path: "process.subtitle", multiline: true })
    ]);
    appendGroupTitle(process, "Etapas da linha do tempo");
    (config.process.steps || []).forEach((_, index) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.appendChild(createField({ label: `Título ${index + 1}`, path: `process.steps.${index}.title` }));
      row.appendChild(createField({ label: `Texto ${index + 1}`, path: `process.steps.${index}.text` }));
      process.appendChild(row);
    });
    container.appendChild(process);

    const showroom = createSection("Showroom", "Endereço e mapa do showroom.");
    addFields(showroom, [
      createField({ label: "Título", path: "showroom.title" }),
      createField({ label: "Endereço", path: "showroom.address" }),
      createField({ label: "Texto do botão", path: "showroom.ctaLabel" }),
      createField({ label: "Link do botão", path: "showroom.ctaHref" }),
      createField({ label: "URL do mapa", path: "showroom.mapUrl" })
    ]);
    container.appendChild(showroom);

    const contact = createSection("Contato", "Informações exibidas no card de contato.");
    addFields(contact, [
      createField({ label: "Título", path: "contact.title" }),
      createField({ label: "Subtítulo", path: "contact.subtitle", multiline: true }),
      createField({ label: "Label endereço", path: "contact.addressLabel" }),
      createField({ label: "Endereço", path: "contact.address" }),
      createField({ label: "Label telefone", path: "contact.phoneLabel" }),
      createField({ label: "Telefone", path: "contact.phone" }),
      createField({ label: "Label WhatsApp", path: "contact.whatsappLabel" }),
      createField({ label: "WhatsApp", path: "contact.whatsapp" }),
      createField({ label: "Label Instagram", path: "contact.instagramLabel" }),
      createField({ label: "Instagram", path: "contact.instagram" }),
      createField({ label: "Nota do formulário", path: "contact.formNote", multiline: true })
    ]);
    container.appendChild(contact);

    const wa = createSection("WhatsApp", "Número e mensagens padrão.");
    addFields(wa, [
      createField({ label: "Número (com DDI)", path: "whatsapp.number" }),
      createField({ label: "Mensagem rápida", path: "whatsapp.quickMessage", multiline: true }),
      createField({
        label: "Template do formulário",
        path: "whatsapp.template",
        multiline: true,
        hint: "Use {nome}, {tel} e {msg} para personalizar."
      })
    ]);
    container.appendChild(wa);

    const footer = createSection("Rodapé", "Texto final do site.");
    addFields(footer, [createField({ label: "Texto do rodapé", path: "footer.tagline" })]);
    container.appendChild(footer);

    buildSidebarNav();
  };

  build();

  const bindAction = (action, handler) => {
    const el = document.querySelector(`[data-action="${action}"]`);
    if (el) el.addEventListener("click", handler);
  };

  const showSaveStatus = (result) => {
    if (!result || !result.ok) {
      if (result && result.mode === "cancel") {
        showToast("Salvamento cancelado.");
        return;
      }
      showToast("Não foi possível salvar.");
      return;
    }
    if (result.mode === "file") {
      if (result.storageSaved === false) {
        showToast("Salvo em site-config.json. Cópia local não foi atualizada.");
        return;
      }
      if (result.localSaved === false && result.indexedDbSaved === true) {
        showToast("Salvo em site-config.json. Cópia local salva via IndexedDB.");
        return;
      }
      showToast("Alterações salvas em site-config.json.");
      return;
    }
    if (result.fileSynced === false) {
      if (result.storageSaved === false) {
        showToast("O arquivo do projeto não foi atualizado e não houve cópia local.");
        return;
      }
      showToast("Salvo localmente. O arquivo do projeto não foi atualizado.");
      return;
    }
    if (result.storageSaved === false) {
      showToast("Não foi possível manter cópia local neste navegador.");
      return;
    }
    showToast("Salvo somente neste navegador. Para publicar, salve em site-config.json.");
  };

  bindAction("save", async () => {
    const result = await SiteConfig.save(config);
    showSaveStatus(result);
  });

  bindAction("export", () => {
    const data = JSON.stringify(config, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "perfeita-luz-config.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  const importInput = document.querySelector('[data-action="import"]');
  if (importInput) {
    importInput.addEventListener("change", () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(String(reader.result || "{}"));
          const merged = SiteConfig.mergeDeep(SiteConfig.clone(SiteConfig.DEFAULT_CONFIG), parsed);
          const result = await SiteConfig.save(merged);
          if (result && result.ok) {
            showToast("Configuração importada e salva.");
          } else {
            showToast("Configuração importada, mas não foi possível salvar.");
          }
          setTimeout(() => window.location.reload(), 600);
        } catch {
          showToast("Arquivo inválido.");
        }
      };
      reader.readAsText(file);
    });
  }
})();
