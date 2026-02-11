(() => {
  const STORAGE_KEY = "perfeitaLuzConfig";
  const STORAGE_META_KEY = "perfeitaLuzConfigMeta";
  const CONFIG_URL = "site-config.json";
  const IDB_NAME = "perfeitaLuzConfigDb";
  const IDB_STORE = "config";
  const IDB_DATA_KEY = "data";
  const IDB_META_KEY = "meta";
  let fileHandle = null;
  let indexedDbPromise = null;
  const DEFAULT_CONFIG = {
    brand: {
      logo: {
        src: "assets/brand/logo.png",
        alt: "Perfeita Luz",
        recommended: { width: 512, height: 512 }
      }
    },
    meta: {
      title: "Perfeita Luz • Iluminação premium em Alphaville",
      description:
        "Soluções completas em iluminação técnica e decorativa, interna e externa. Curadoria, especificação e showroom em Alphaville/SP.",
      ogTitle: "Perfeita Luz • Iluminação premium",
      ogDescription:
        "Curadoria, especificação e showroom. Iluminação técnica e decorativa, interna e externa.",
      ogImage: "assets/img/hero.png"
    },
    header: {
      ctaLabel: "Agendar visita",
      ctaHref: "#contato",
      instagram: "https://instagram.com/perfeitaluziluminacao"
    },
    hero: {
      eyebrow: "Design que ilumina",
      title: "Iluminação premium para projetos que pedem presença.",
      subtitle:
        "Soluções completas em iluminação técnica e decorativa, interna e externa. Curadoria, especificação e showroom em Alphaville/SP.",
      image: {
        src: "assets/img/hero.png",
        alt: "Lustre contemporâneo em ambiente sofisticado",
        recommended: { width: 1200, height: 1500 }
      },
      background: {
        src: "assets/img/hero-bg.png",
        alt: "Ambiente sofisticado com iluminação acolhedora",
        recommended: { width: 1920, height: 1200 }
      }
    },
    about: {
      title: "Sobre a Perfeita Luz",
      text:
        "Atuando no mercado desde 2014, a Perfeita Luz oferece soluções completas em iluminação técnica e decorativa. Com mix variado de produtos exclusivos e portfólio com obras assinadas por arquitetos e designers.",
      stats: [
        { value: "10+ anos", label: "de atuação em Alphaville" },
        { value: "+200", label: "projetos atendidos" },
        { value: "Curadoria", label: "técnica e decorativa" }
      ],
      image: {
        src: "assets/img/grid.png",
        alt: "Referências de projetos e luminárias",
        recommended: { width: 1600, height: 1400 }
      }
    },
    services: [
      {
        title: "Curadoria e especificação",
        text: "Do decorativo ao técnico: peças exclusivas e soluções alinhadas ao seu projeto."
      },
      {
        title: "Peças sob medida",
        text: "Dimensionamento, escala e acabamento para entregar presença e conforto visual."
      },
      {
        title: "Consultoria para arquitetos",
        text: "Atendimento consultivo para projetos, obras e demandas recorrentes de iluminação."
      }
    ],
    servicesSection: {
      title: "Curadoria que valoriza cada ambiente",
      subtitle: "Atendimento consultivo para especificação, personalização e acompanhamento de obras.",
      cta: { label: "Falar com a curadoria", href: "#contato" }
    },
    collections: {
      title: "Coleções para cada linguagem",
      subtitle:
        "Seleção de referências (substitua pelas fotos reais do acervo).",
      items: [
        {
          title: "Pendentes",
          image: {
            src: "assets/img/gallery-01.png",
            alt: "Pendentes",
            recommended: { width: 900, height: 1100 }
          }
        },
        {
          title: "Arandelas",
          image: {
            src: "assets/img/gallery-02.png",
            alt: "Arandelas",
            recommended: { width: 900, height: 1100 }
          }
        },
        {
          title: "Cristal",
          image: {
            src: "assets/img/gallery-03.png",
            alt: "Lustres de cristal",
            recommended: { width: 900, height: 1100 }
          }
        },
        {
          title: "Abajures",
          image: {
            src: "assets/img/gallery-04.png",
            alt: "Abajures",
            recommended: { width: 900, height: 1100 }
          }
        },
        {
          title: "Espelhos",
          image: {
            src: "assets/img/gallery-05.png",
            alt: "Espelhos",
            recommended: { width: 900, height: 1100 }
          }
        },
        {
          title: "Decorativos",
          image: {
            src: "assets/img/gallery-06.png",
            alt: "Peças decorativas",
            recommended: { width: 900, height: 1100 }
          }
        }
      ]
    },
    projects: {
      title: "Projetos em destaque",
      subtitle: "Curadoria editorial de ambientes com luz protagonista.",
      items: [
        {
          title: "Residencial • Camadas de luz",
          text: "Composição entre geral, tarefa e destaque para conforto e atmosfera.",
          linkLabel: "Solicitar orçamento",
          linkHref: "#contato",
          image: {
            src: "assets/img/p01.jpg",
            alt: "Projeto residencial com luz cênica",
            recommended: { width: 1600, height: 1000 }
          }
        },
        {
          title: "Decorativo • Cristal",
          text: "Peças statement para áreas sociais com controle de brilho e temperatura.",
          linkLabel: "Ver referências",
          linkHref: "#colecoes",
          image: {
            src: "assets/img/p03.jpg",
            alt: "Lustre de cristal em ambiente social",
            recommended: { width: 1600, height: 1000 }
          }
        },
        {
          title: "Arandelas • Minimalismo",
          text: "Ritmo, simetria e textura: luz que valoriza paredes e materiais.",
          linkLabel: "Falar com a curadoria",
          linkHref: "#contato",
          image: {
            src: "assets/img/p02.jpg",
            alt: "Arandelas minimalistas",
            recommended: { width: 1600, height: 1000 }
          }
        },
        {
          title: "Pendentes • Proporção",
          text: "Escala e altura ajustadas ao mobiliário para equilíbrio visual.",
          linkLabel: "Agendar visita",
          linkHref: "#contato",
          image: {
            src: "assets/img/p04.jpg",
            alt: "Pendentes sobre bancada",
            recommended: { width: 1600, height: 1000 }
          }
        }
      ]
    },
    media: {
      title: "Na midia",
      subtitle: "Destaques, entrevistas e projetos publicados.",
      featured: {
        badge: "Reels",
        eyebrow: "Destaque",
        title: "Luz em evidencia na arquitetura contemporanea",
        text:
          "Selecao de publicacoes que mostram como a curadoria ilumina espacos com identidade.",
        linkLabel: "Ver materia completa",
        linkHref: "#contato",
        video: {
          src: "",
          poster: "assets/img/hero.png",
          recommended: { width: 1080, height: 1920 }
        }
      },
      items: [
        {
          title: "Perfeita Luz no Guia de Decoracao",
          date: "Set 2024",
          text: "Curadoria luminotecnica em projetos residenciais assinados.",
          linkLabel: "Ler noticia",
          linkHref: "#contato",
          image: {
            src: "assets/img/p05.jpg",
            alt: "Lustre em sala de jantar",
            recommended: { width: 1200, height: 900 }
          }
        },
        {
          title: "Showroom em Alphaville",
          date: "Ago 2024",
          text: "Espacos imersivos para testar cenas e temperaturas de cor.",
          linkLabel: "Ver detalhes",
          linkHref: "#showroom",
          image: {
            src: "assets/img/p06.jpg",
            alt: "Showroom com pendentes",
            recommended: { width: 1200, height: 900 }
          }
        },
        {
          title: "Tendencias de iluminacao 2024",
          date: "Jul 2024",
          text: "Camadas de luz e destaque em materiais naturais.",
          linkLabel: "Ver tendencias",
          linkHref: "#colecoes",
          image: {
            src: "assets/img/p07.jpg",
            alt: "Ambiente com luz decorativa",
            recommended: { width: 1200, height: 900 }
          }
        }
      ]
    },
    process: {
      title: "Nosso processo",
      subtitle: "Acompanhamento completo do briefing ao pós-obra.",
      steps: [
        {
          title: "Briefing e conceito",
          text: "Entendemos o ambiente, necessidades e estilo para orientar a curadoria."
        },
        {
          title: "Proposta luminotécnica",
          text: "Especificação de peças e layout de luz com foco em performance e estética."
        },
        {
          title: "Acompanhamento e entrega",
          text: "Suporte na obra e ajuste final para garantir o resultado planejado."
        }
      ]
    },
    showroom: {
      title: "Venha nos visitar",
      address: "Estr. Municipal Bella Vista, 917 • Lj 399 • Alphaville/SP",
      ctaLabel: "Agendar visita",
      ctaHref: "#contato",
      mapUrl:
        "https://www.google.com/maps?q=Estr.%20Municipal%20Bella%20Vista,%20917%20Alphaville%20SP&output=embed"
    },
    contact: {
      title: "Agende seu horário",
      subtitle: "Atendimento consultivo por horário para melhor experiência.",
      addressLabel: "Endereço",
      address: "Estr. Municipal Bella Vista, 917 • Lj 399 • Alphaville/SP",
      phoneLabel: "Telefone",
      phone: "(11) 94751-8715",
      whatsappLabel: "WhatsApp",
      whatsapp: "(11) 94751-8715",
      instagramLabel: "Social",
      instagram: "https://instagram.com/perfeitaluziluminacao",
      formNote:
        "Ao enviar, abriremos o WhatsApp com a mensagem pronta. Nenhum dado é armazenado neste site."
    },
    whatsapp: {
      number: "5511947518715",
      quickMessage: "Olá! Gostaria de agendar um horário na Perfeita Luz.",
      template:
        "Olá! Gostaria de agendar um horário na Perfeita Luz. Meu nome é {nome}. Telefone: {tel}. {msg}"
    },
    footer: {
      tagline: "Iluminação técnica e decorativa • Interna e externa"
    }
  };

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  const isObject = (value) =>
    value && typeof value === "object" && !Array.isArray(value);

  function mergeDeep(target, source) {
    if (!isObject(source)) return target;
    Object.keys(source).forEach((key) => {
      const srcVal = source[key];
      if (Array.isArray(srcVal)) {
        target[key] = srcVal;
        return;
      }
      if (isObject(srcVal)) {
        if (!isObject(target[key])) target[key] = {};
        mergeDeep(target[key], srcVal);
        return;
      }
      target[key] = srcVal;
    });
    return target;
  }

  const parseStoredPayload = (raw) => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (typeof raw === "object") return raw;
    return null;
  };

  const loadFromLocalStorage = () => {
    try {
      return parseStoredPayload(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  };

  const loadMetaFromLocalStorage = () => {
    try {
      return parseStoredPayload(localStorage.getItem(STORAGE_META_KEY));
    } catch {
      return null;
    }
  };

  const saveToLocalStorage = (data, source) => {
    try {
      localStorage.setItem(STORAGE_KEY, data);
      if (source) {
        localStorage.setItem(
          STORAGE_META_KEY,
          JSON.stringify({ source, savedAt: Date.now() })
        );
      }
      return true;
    } catch {
      return false;
    }
  };

  const getIndexedDb = () => {
    if (indexedDbPromise) return indexedDbPromise;
    indexedDbPromise = new Promise((resolve) => {
      try {
        if (!("indexedDB" in window)) {
          resolve(null);
          return;
        }
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return indexedDbPromise;
  };

  const idbGet = async (key) => {
    const db = await getIndexedDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  };

  const idbSet = async (key, value) => {
    const db = await getIndexedDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(value, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  };

  const loadFromIndexedDb = async () => {
    const raw = await idbGet(IDB_DATA_KEY);
    return parseStoredPayload(raw);
  };

  const loadMetaFromIndexedDb = async () => {
    const raw = await idbGet(IDB_META_KEY);
    return parseStoredPayload(raw);
  };

  const saveToIndexedDb = async (data, source) => {
    const dataSaved = await idbSet(IDB_DATA_KEY, data);
    if (!dataSaved) return false;
    if (!source) return true;
    return idbSet(
      IDB_META_KEY,
      JSON.stringify({ source, savedAt: Date.now() })
    );
  };

  const loadFromBrowserStorage = async () => {
    const indexedDbData = await loadFromIndexedDb();
    const indexedDbMeta = await loadMetaFromIndexedDb();
    if (indexedDbData) {
      return { data: indexedDbData, meta: indexedDbMeta, backend: "indexeddb" };
    }

    const localData = loadFromLocalStorage();
    const localMeta = loadMetaFromLocalStorage();
    if (localData) {
      return { data: localData, meta: localMeta, backend: "localStorage" };
    }

    return { data: null, meta: null, backend: null };
  };

  const saveToBrowserStorage = async (data, source) => {
    const localSaved = saveToLocalStorage(data, source);
    const indexedDbSaved = await saveToIndexedDb(data, source);
    return {
      ok: localSaved || indexedDbSaved,
      localSaved,
      indexedDbSaved
    };
  };

  const loadFromXhr = () =>
    new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", CONFIG_URL, true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return;
          const ok = (xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText);
          if (!ok) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(null);
          }
        };
        xhr.onerror = () => resolve(null);
        xhr.send();
      } catch {
        resolve(null);
      }
    });

  async function load() {
    const base = clone(DEFAULT_CONFIG);
    let fileData = null;
    try {
      const res = await fetch(CONFIG_URL, { cache: "no-store" });
      if (res.ok) fileData = await res.json();
    } catch {}
    if (!fileData && window.location && window.location.protocol === "file:") {
      fileData = await loadFromXhr();
    }

    const persisted = await loadFromBrowserStorage();
    const localData = persisted.data;
    const localMeta = persisted.meta;
    const shouldUseLocal =
      !!localData &&
      (!fileData || (localMeta && localMeta.source === "local"));

    if (shouldUseLocal) return mergeDeep(base, localData);

    if (fileData) {
      await saveToBrowserStorage(JSON.stringify(fileData), "file");
      return mergeDeep(base, fileData);
    }

    if (localData) return mergeDeep(base, localData);
    return base;
  }

  async function ensureFileHandle() {
    if (fileHandle) return fileHandle;
    if (!("showSaveFilePicker" in window)) return null;
    fileHandle = await window.showSaveFilePicker({
      suggestedName: CONFIG_URL,
      types: [
        {
          description: "JSON",
          accept: { "application/json": [".json"] }
        }
      ]
    });
    return fileHandle;
  }

  async function save(config) {
    const data = JSON.stringify(config, null, 2);
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await ensureFileHandle();
        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(data);
          await writable.close();

          let fileSynced = false;
          try {
            const res = await fetch(CONFIG_URL, { cache: "no-store" });
            if (res.ok) {
              const diskConfig = await res.json();
              fileSynced = JSON.stringify(diskConfig) === JSON.stringify(config);
            }
          } catch {}

          const source = fileSynced ? "file" : "local";
          const storageStatus = await saveToBrowserStorage(data, source);
          const localSaved = storageStatus.localSaved;
          if (!localSaved) {
            try {
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(STORAGE_META_KEY);
            } catch {}
          }
          return {
            ok: true,
            mode: fileSynced ? "file" : "local",
            localSaved,
            indexedDbSaved: storageStatus.indexedDbSaved,
            storageSaved: storageStatus.ok,
            fileSynced
          };
        }
      } catch (err) {
        if (err && err.name === "AbortError") return { ok: false, mode: "cancel" };
      }
    }
    const storageStatus = await saveToBrowserStorage(data, "local");
    if (storageStatus.ok) {
      return {
        ok: true,
        mode: "local",
        localSaved: storageStatus.localSaved,
        indexedDbSaved: storageStatus.indexedDbSaved,
        storageSaved: storageStatus.ok
      };
    }
    return { ok: false, mode: "error" };
  }

  async function reset() {
    const base = clone(DEFAULT_CONFIG);
    return save(base);
  }

  window.SiteConfig = {
    STORAGE_KEY,
    CONFIG_URL,
    DEFAULT_CONFIG,
    load,
    save,
    reset,
    mergeDeep,
    clone
  };
})();


