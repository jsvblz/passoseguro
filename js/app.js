/**
 * ============================================================================
 * PASSO SEGURO · CONTROLADOR SIMPLIFICADO (PRODUTO -> MARCA -> BREVE MAPA + COMEÇAR)
 * - Saudação automática ao abrir: "Olá! Eu sou Passo Seguro e estou aqui para te ajudar !"
 * - Fluxo simples:
 *   1. O usuário toca em uma opção simples (ex: "Leite", "Feijão", "Arroz", "Pão").
 *   2. Abre imediatamente as marcas e tipos daquele produto (ex: Italac Desnatado, Ninho Integral).
 *   3. Ao escolher a marca, o Breve Mapa embaixo já desenha a linha amarela até o local
 *      e destaca o botão gigante "COMEÇAR" para guiá-lo passo a passo como um GPS.
 * ============================================================================
 */

const WELCOME_PHRASE = "Olá! Eu sou Passo Seguro e estou aqui para te ajudar !";

window.AppState = {
  activeTab: "screen-inicio",
  envKey: "supermercado",
  grid: [],
  user: { x: 2, y: 10, dirIdx: 0 },
  openGroupId: null,     // Qual opção simples está aberta (ex: 'leite')
  targetItem: null,      // Qual marca/tipo específico foi selecionado
  gpsRunning: false,     // Se o botão COMEÇAR já foi acionado
  autoWalkTimer: null,   // Timer da caminhada automática passo a passo
  lastSpokenQuery: "",
  route: [],
  obstacles: [],
  favorites: ["leite-italac-desn", "feijao-kicaldo-carioca", "cx-pref"],
  communityPosts: [...(window.INITIAL_COMMUNITY_POSTS || [])],
  searchQuery: "",
  screenReaderMode: false,
  highContrast: false,
  fontSizeIdx: 1,
  fontSizes: ["17px", "19px", "22px", "25px"],
  hoverCell: null,
  isPointerDown: false,
  hasSpokenWelcome: false,
  routesCompletedCount: 12,
  userProfile: {
    name: "Usuário Passo Seguro",
    cpf: "000.000.000-00",
    method: "cpf",
    visualCondition: "Baixa Visão",
    mobilityAid: "Bengala Longa / Verde",
    emergencyContact: "(81) 99876-5432 - Familiar"
  }
};

// ============================================================================
// 0.1 TELA INICIAL DE LOGIN E PAINEL "MINHA CONTA" (ÍCONE DO USUÁRIO NO TOPO DIREITO)
// ============================================================================
function formatCpfMask(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function getInitialsFromName(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "👤";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function updateProfileUI() {
  const prof = AppState.userProfile || {};
  const name = prof.name || "Usuário Passo Seguro";
  const cpf = prof.cpf || "000.000.000-00";
  const method = prof.method === "google"
    ? "🌐 Conectado via Conta Google · Acesso Verificado"
    : "✅ Conta Cadastrada via CPF · Acesso Ativo";

  const emailSlug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "") || "usuario";

  const initials = getInitialsFromName(name);

  // Atualiza ícone no canto superior direito e avatar grande na conta
  const topAvatar = document.getElementById("lblUserAvatarIcon");
  if (topAvatar) topAvatar.textContent = initials;

  const bigAvatar = document.getElementById("profileBigAvatar");
  if (bigAvatar) bigAvatar.textContent = initials;

  const nameEl = document.getElementById("profileDisplayName");
  if (nameEl) nameEl.textContent = name;

  const methodEl = document.getElementById("profileDisplayMethod");
  if (methodEl) methodEl.textContent = method;

  const cpfEl = document.getElementById("profileDisplayCpf");
  if (cpfEl) cpfEl.textContent = cpf;

  const emailEl = document.getElementById("profileDisplayEmail");
  if (emailEl) emailEl.textContent = `${emailSlug}@gmail.com`;

  // Estatísticas da Conta
  const statFav = document.getElementById("statFavCount");
  if (statFav) statFav.textContent = String(AppState.favorites.length);

  const statRoutes = document.getElementById("statRoutesCount");
  if (statRoutes) statRoutes.textContent = String(AppState.routesCompletedCount || 12);

  const statPosts = document.getElementById("statPostsCount");
  if (statPosts) statPosts.textContent = String(AppState.communityPosts.length);

  // Campos de Perfil de Acessibilidade
  const selVis = document.getElementById("selProfileVisual");
  if (selVis && prof.visualCondition) selVis.value = prof.visualCondition;

  const selMob = document.getElementById("selProfileMobility");
  if (selMob && prof.mobilityAid) selMob.value = prof.mobilityAid;

  const inpEmerg = document.getElementById("inpProfileEmergency");
  if (inpEmerg && prof.emergencyContact) inpEmerg.value = prof.emergencyContact;
}

function setupLoginScreen() {
  const overlay = document.getElementById("loginOverlay");
  const profileOverlay = document.getElementById("profileOverlay");
  const form = document.getElementById("loginForm");
  const inpName = document.getElementById("inputLoginName");
  const inpCpf = document.getElementById("inputLoginCpf");
  const inpPass = document.getElementById("inputLoginPass");
  const errEl = document.getElementById("loginErrorMsg");
  const btnGoogle = document.getElementById("btnLoginGoogle");
  const btnOpenProfile = document.getElementById("btnOpenProfile");
  const btnCloseProfile = document.getElementById("btnCloseProfile");
  const btnSaveProfilePrefs = document.getElementById("btnSaveProfilePrefs");
  const btnSpeakProfileSummary = document.getElementById("btnSpeakProfileSummary");
  const btnLogout = document.getElementById("btnLogout");

  if (!overlay || !form) return;

  // Máscara automática de CPF enquanto digita
  inpCpf.addEventListener("input", (e) => {
    e.target.value = formatCpfMask(e.target.value);
  });

  // Se já preencheu antes, restaura os dados salvos da conta
  try {
    const savedUser = localStorage.getItem("passoseguro_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      AppState.userProfile = { ...AppState.userProfile, ...parsed };
      if (parsed.name) inpName.value = parsed.name;
      if (parsed.cpf && parsed.cpf !== "Conta Google") inpCpf.value = parsed.cpf;
    }
  } catch (e) {}

  updateProfileUI();

  function completeLogin(name, cpf, method) {
    AppState.userProfile = {
      ...AppState.userProfile,
      name,
      cpf,
      method
    };
    try {
      localStorage.setItem("passoseguro_user", JSON.stringify(AppState.userProfile));
    } catch (e) {}

    updateProfileUI();
    if (errEl) errEl.setAttribute("hidden", "");
    overlay.setAttribute("hidden", "");

    const firstName = name.split(" ")[0] || "amigo";
    const personalSpeech = `Olá, ${firstName}! Eu sou Passo Seguro e estou aqui para te ajudar !`;
    const speechEl = document.getElementById("welcomeSpeechText");
    if (speechEl) {
      speechEl.textContent = `"${personalSpeech}"`;
    }

    SensoryEngine.playTone("arrival");
    SensoryEngine.vibrate("straight");
    showPhoneToast(`✅ Bem-vindo(a), ${firstName}!`);
    SensoryEngine.announce(personalSpeech, "assertive", AppState.screenReaderMode);
    AppState.hasSpokenWelcome = true;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = inpName.value.trim();
    const cpfDigits = inpCpf.value.replace(/\D/g, "");
    const pass = inpPass.value.trim();

    if (!name) {
      errEl.textContent = "Por favor, digite seu nome completo.";
      errEl.removeAttribute("hidden");
      SensoryEngine.announce("Por favor, digite seu nome completo.", "assertive", AppState.screenReaderMode);
      inpName.focus();
      return;
    }
    if (cpfDigits.length < 11) {
      errEl.textContent = "Por favor, digite os 11 números do seu CPF.";
      errEl.removeAttribute("hidden");
      SensoryEngine.announce("Por favor, digite os 11 números do seu CPF.", "assertive", AppState.screenReaderMode);
      inpCpf.focus();
      return;
    }
    if (!pass) {
      errEl.textContent = "Por favor, digite sua senha.";
      errEl.removeAttribute("hidden");
      SensoryEngine.announce("Por favor, digite sua senha.", "assertive", AppState.screenReaderMode);
      inpPass.focus();
      return;
    }

    completeLogin(name, inpCpf.value, "cpf");
  });

  btnGoogle.addEventListener("click", () => {
    const typedName = inpName.value.trim() || "Usuário Google";
    const typedCpf = inpCpf.value.trim() || "123.456.789-00";
    completeLogin(typedName, typedCpf, "google");
  });

  // Abrir Minha Conta clicando no ícone do usuário no canto superior direito
  if (btnOpenProfile && profileOverlay) {
    btnOpenProfile.addEventListener("click", () => {
      updateProfileUI();
      profileOverlay.removeAttribute("hidden");
      btnOpenProfile.setAttribute("aria-expanded", "true");
      const p = AppState.userProfile;
      SensoryEngine.announce(
        `Minha Conta aberta. Usuário: ${p.name}, CPF: ${p.cpf}. Condição visual: ${p.visualCondition}.`,
        "assertive",
        AppState.screenReaderMode
      );
    });
  }

  // Fechar Minha Conta
  if (btnCloseProfile && profileOverlay) {
    btnCloseProfile.addEventListener("click", () => {
      profileOverlay.setAttribute("hidden", "");
      if (btnOpenProfile) btnOpenProfile.setAttribute("aria-expanded", "false");
      SensoryEngine.announce("Minha Conta fechada.", "polite", AppState.screenReaderMode);
    });
  }

  // Salvar preferências de acessibilidade e contato de emergência na Conta
  if (btnSaveProfilePrefs) {
    btnSaveProfilePrefs.addEventListener("click", () => {
      const selVis = document.getElementById("selProfileVisual");
      const selMob = document.getElementById("selProfileMobility");
      const inpEmerg = document.getElementById("inpProfileEmergency");

      AppState.userProfile = {
        ...AppState.userProfile,
        visualCondition: selVis ? selVis.value : "Baixa Visão",
        mobilityAid: selMob ? selMob.value : "Bengala Longa / Verde",
        emergencyContact: inpEmerg ? inpEmerg.value : "(81) 99876-5432"
      };

      try {
        localStorage.setItem("passoseguro_user", JSON.stringify(AppState.userProfile));
      } catch (e) {}

      SensoryEngine.playTone("arrival");
      showPhoneToast("💾 Informações da conta salvas com sucesso!");
      SensoryEngine.announce("Informações da sua conta salvas com sucesso!", "assertive", AppState.screenReaderMode);
    });
  }

  // Ouvir resumo completo da conta por voz
  if (btnSpeakProfileSummary) {
    btnSpeakProfileSummary.addEventListener("click", () => {
      const p = AppState.userProfile;
      const summary =
        `Resumo da conta de ${p.name}. CPF cadastrado: ${p.cpf}. ` +
        `Perfil de acessibilidade: ${p.visualCondition}, utilizando ${p.mobilityAid}. ` +
        `Contato de emergência: ${p.emergencyContact}. ` +
        `Você possui ${AppState.favorites.length} favoritos salvos e ${AppState.routesCompletedCount} rotas concluídas.`;
      SensoryEngine.announce(summary, "assertive", AppState.screenReaderMode);
    });
  }

  // Botão Sair dentro da Conta (volta para a tela inicial de login)
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (profileOverlay) profileOverlay.setAttribute("hidden", "");
      if (btnOpenProfile) btnOpenProfile.setAttribute("aria-expanded", "false");
      overlay.removeAttribute("hidden");
      SensoryEngine.announce("Você saiu da conta. Tela inicial de login do Passo Seguro.", "polite", AppState.screenReaderMode);
    });
  }
}

// ============================================================================
// 0. PERSISTÊNCIA LOCAL (SALVA FAVORITOS, MENSAGENS E TEMA AUTOMATICAMENTE)
// ============================================================================
function loadSavedState() {
  try {
    const savedFavs = localStorage.getItem("passoseguro_favorites");
    if (savedFavs) AppState.favorites = JSON.parse(savedFavs);

    const savedPosts = localStorage.getItem("passoseguro_posts");
    if (savedPosts) AppState.communityPosts = JSON.parse(savedPosts);

    const savedHC = localStorage.getItem("passoseguro_hc");
    if (savedHC === "true") {
      AppState.highContrast = true;
      document.body.classList.add("hc");
    }

    const savedFont = localStorage.getItem("passoseguro_font_idx");
    if (savedFont !== null) {
      const idx = parseInt(savedFont, 10);
      if (!isNaN(idx) && AppState.fontSizes[idx]) {
        AppState.fontSizeIdx = idx;
        document.documentElement.style.setProperty("--fs", AppState.fontSizes[idx]);
      }
    }
  } catch (e) { }
}

function saveAppState() {
  try {
    localStorage.setItem("passoseguro_favorites", JSON.stringify(AppState.favorites));
    localStorage.setItem("passoseguro_posts", JSON.stringify(AppState.communityPosts));
    localStorage.setItem("passoseguro_hc", String(AppState.highContrast));
    localStorage.setItem("passoseguro_font_idx", String(AppState.fontSizeIdx));
  } catch (e) { }
}

function updateMobileClock() {
  const clockEl = document.getElementById("mobileClock");
  if (!clockEl) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clockEl.textContent = `${hh}:${mm}`;
}

// ============================================================================
// 1. SAUDAÇÃO AUTOMÁTICA DE BOAS-VINDAS AO ABRIR A TELA
// ============================================================================
function triggerWelcomeGreeting(force = false) {
  if (AppState.hasSpokenWelcome && !force) return;

  const liveEl = document.getElementById("liveAssertive");
  if (liveEl) liveEl.textContent = WELCOME_PHRASE;

  if (AppState.screenReaderMode) {
    AppState.hasSpokenWelcome = true;
    return;
  }

  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(WELCOME_PHRASE);
      utter.lang = "pt-BR";
      utter.rate = 1.03;
      utter.onstart = () => {
        AppState.hasSpokenWelcome = true;
      };
      window.speechSynthesis.speak(utter);
    } catch (e) { }
  }
}

// ============================================================================
// 2. TROCA ENTRE AS 4 ABAS INFERIORES (INÍCIO, MAPA, FAVORITOS, COMUNIDADE)
// ============================================================================
function switchBottomTab(tabId, shouldAnnounce = true) {
  AppState.activeTab = tabId;
  const tabBtns = document.querySelectorAll(".bottom-tab");
  const screens = document.querySelectorAll(".tab-screen");

  let tabTitle = "";
  tabBtns.forEach(btn => {
    const isCurrent = btn.getAttribute("data-tab") === tabId;
    btn.setAttribute("aria-selected", String(isCurrent));
    if (isCurrent) tabTitle = btn.getAttribute("data-title") || btn.textContent.trim();
  });

  screens.forEach(scr => {
    const isMatch = scr.id === tabId;
    scr.classList.toggle("active", isMatch);
    if (isMatch) scr.removeAttribute("hidden");
    else scr.setAttribute("hidden", "");
  });

  const viewport = document.getElementById("phoneViewport");
  if (viewport) viewport.scrollTop = 0;

  if (tabId === "screen-inicio") {
    renderSimpleGroups();
    drawAllMaps();
  } else if (tabId === "screen-mapa") {
    renderMapScreen();
  } else if (tabId === "screen-favoritos") {
    renderFavoritesScreen();
  } else if (tabId === "screen-comunidade") {
    renderCommunityScreen();
  }

  if (shouldAnnounce && tabTitle) {
    SensoryEngine.announce(`Aba ${tabTitle}`, "polite", AppState.screenReaderMode);
  }
}

// ============================================================================
// 3. ABA INÍCIO SIMPLIFICADA: OPÇÕES SIMPLES (EX: LEITE) -> MARCAS E TIPOS
// ============================================================================
function renderSimpleGroups() {
  const env = ENVIRONMENTS[AppState.envKey];
  const container = document.getElementById("simpleGroupsContainer");
  if (!container) return;

  const q = AppState.searchQuery.trim().toLowerCase();

  // Se o usuário digitou algo na busca rápida, mostra direto as marcas correspondentes
  if (q.length > 0) {
    const matchedItems = env.items.filter(
      it =>
        it.name.toLowerCase().includes(q) ||
        (it.brand && it.brand.toLowerCase().includes(q)) ||
        it.category.toLowerCase().includes(q) ||
        it.aisle.toLowerCase().includes(q)
    );

    if (matchedItems.length === 0) {
      container.innerHTML = `<p style="color:var(--mut);margin:0;">Nenhum item encontrado para "${AppState.searchQuery}".</p>`;
      return;
    }

    container.innerHTML = `
      <div class="brands-box">
        <strong style="color:var(--brand-navy);">Resultados encontrados (${matchedItems.length}):</strong>
        ${matchedItems.map(it => renderBrandOptionButton(it)).join("")}
      </div>
    `;
    bindBrandButtons(container, env);
    return;
  }

  // Sem busca digitada: Mostra os botões simples grandes (ex: Leite, Feijão, Arroz...)
  container.innerHTML = env.groups
    .map(grp => {
      const isOpen = AppState.openGroupId === grp.id;
      const groupItems = env.items.filter(it => it.groupId === grp.id);

      return `
        <div>
          <button
            type="button"
            class="group-card-btn"
            aria-expanded="${isOpen}"
            data-group-id="${grp.id}"
          >
            <div class="group-left">
              <span class="group-icon" aria-hidden="true">${grp.icon}</span>
              <span>
                <span class="group-title">${grp.title}</span>
                <span class="group-sub">${grp.subtitle}</span>
              </span>
            </div>
            <span style="font-weight:700;font-size:1.2rem;color:var(--brand-navy);" aria-hidden="true">
              ${isOpen ? "▲" : "▼"}
            </span>
          </button>

          ${isOpen
          ? `<div class="brands-box" style="margin-top:8px;" role="region" aria-label="Marcas e tipos de ${grp.title}">
                  <strong style="color:var(--brand-navy);font-size:0.92rem;">
                    Escolha a marca ou tipo de ${grp.title}:
                  </strong>
                  ${groupItems.map(it => renderBrandOptionButton(it)).join("")}
                </div>`
          : ""
        }
        </div>
      `;
    })
    .join("");

  // Evento ao clicar em uma opção simples (ex: "Leite")
  container.querySelectorAll("button[data-group-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const gId = btn.getAttribute("data-group-id");
      const grp = env.groups.find(g => g.id === gId);
      if (AppState.openGroupId === gId) {
        AppState.openGroupId = null;
      } else {
        AppState.openGroupId = gId;
        const brands = env.items.filter(i => i.groupId === gId).map(i => i.name).join(", ");
        SensoryEngine.announce(
          `${grp.title}. Opções disponíveis: ${brands}. Toque em uma marca para ver no breve mapa embaixo.`,
          "assertive",
          AppState.screenReaderMode
        );
      }
      renderSimpleGroups();
    });
  });

  bindBrandButtons(container, env);
}

function renderBrandOptionButton(item) {
  const isSelected = AppState.targetItem && AppState.targetItem.id === item.id;
  const isFav = AppState.favorites.includes(item.id);
  return `
    <div style="display:flex;gap:8px;align-items:stretch;">
      <button
        type="button"
        class="brand-option-btn ${isSelected ? "selected" : ""}"
        data-select-item="${item.id}"
      >
        <div>
          <strong style="display:block;font-size:1rem;">${item.name}</strong>
          <small style="color:var(--mut);font-weight:700;">
            ${item.brand || item.category} · 📍 ${item.aisle} (Prateleira ${item.height})
          </small>
        </div>
        <span class="badge-tag">${item.price || "Escolher"}</span>
      </button>

      <button
        type="button"
        class="btn fav-star-btn"
        aria-pressed="${isFav}"
        aria-label="${isFav ? "Remover dos favoritos" : "Favoritar"} ${item.name}"
        data-fav-id="${item.id}"
      >
        ★
      </button>
    </div>
  `;
}

function bindBrandButtons(container, env) {
  container.querySelectorAll("button[data-select-item]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = env.items.find(i => i.id === btn.getAttribute("data-select-item"));
      if (item) {
        previewDestinationOnMiniMap(item);
      }
    });
  });

  container.querySelectorAll("button[data-fav-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleFavoriteItem(btn.getAttribute("data-fav-id"));
    });
  });
}

// ============================================================================
// 4. BREVE MAPA EMBAIXO + FLUXO "COMEÇAR" -> "CONTINUAR INSTRUÇÃO"
// ============================================================================
function previewDestinationOnMiniMap(item) {
  const env = ENVIRONMENTS[AppState.envKey];
  AppState.targetItem = item;
  AppState.gpsRunning = false;
  AppState.lastSpokenQuery = item.name;

  // Se o usuário já estava em cima do destino de uma rota anterior, volta para a entrada
  if (AppState.user.x === item.x && AppState.user.y === item.y) {
    AppState.user = { ...env.startPose };
  }

  AppState.grid = NavigationEngine.buildGrid(env, AppState.obstacles);
  AppState.route = NavigationEngine.findShortestPathBFS(
    AppState.grid,
    AppState.user.x,
    AppState.user.y,
    item.x,
    item.y
  );

  renderSimpleGroups();
  updateMiniMapCardUI(false);
  drawAllMaps();

  const steps = Math.max(0, AppState.route.length - 1) * STEPS_PER_CELL;
  SensoryEngine.playTone("shelf");
  SensoryEngine.vibrate("shelfTouch");
  SensoryEngine.announce(
    `Selecionado: ${item.name}, no ${item.aisle}, distância de ${steps} passos. O breve mapa já está pronto abaixo. Toque no botão Começar para ouvir a primeira instrução.`,
    "assertive",
    AppState.screenReaderMode
  );

  const card = document.getElementById("homeBottomMapCard");
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/**
 * Fluxo de botão único:
 * 1º clique ("COMEÇAR"): Inicia a rota e fala a primeira instrução. O botão vira "CONTINUAR INSTRUÇÃO".
 * Cliques seguintes ("CONTINUAR INSTRUÇÃO"): Avança todo o segmento atual da rota até a próxima curva/instrução ou até a chegada!
 */
function handlePrimaryGpsAction() {
  const env = ENVIRONMENTS[AppState.envKey];
  if (!AppState.targetItem) {
    AppState.targetItem = env.items[0];
  }

  const atDestination =
    AppState.user.x === AppState.targetItem.x &&
    AppState.user.y === AppState.targetItem.y;

  // Caso ainda não tenha começado OU já tenha chegado e queira recomeçar do início
  if (!AppState.gpsRunning || atDestination) {
    if (atDestination) {
      AppState.user = { ...env.startPose };
      AppState.obstacles = [];
    }
    AppState.gpsRunning = true;
    AppState.grid = NavigationEngine.buildGrid(env, AppState.obstacles);
    AppState.route = NavigationEngine.findShortestPathBFS(
      AppState.grid,
      AppState.user.x,
      AppState.user.y,
      AppState.targetItem.x,
      AppState.targetItem.y
    );

    SensoryEngine.playTone("step");
    SensoryEngine.vibrate("straight");
    updateMiniMapCardUI(true);
    drawAllMaps();
    return;
  }

  // Já está com o guia ativo -> Avança toda a instrução atual (segmento reto até a próxima esquina ou destino)
  advanceOneInstructionSegment();
}

function advanceOneInstructionSegment() {
  if (!AppState.targetItem || !AppState.route || AppState.route.length <= 1) return;

  const firstDx = AppState.route[1].x - AppState.route[0].x;
  const firstDy = AppState.route[1].y - AppState.route[0].y;
  const neededDirIdx = NavigationEngine.dirIndexFromDelta(firstDx, firstDy);
  const hadTurn = neededDirIdx !== -1 && neededDirIdx !== AppState.user.dirIdx;
  const turnInfo = NavigationEngine.getRelativeTurn(AppState.user.dirIdx, neededDirIdx);

  // Conta quantas células compõem este trecho reto da instrução
  let segmentCells = 0;
  for (let i = 1; i < AppState.route.length; i++) {
    const dx = AppState.route[i].x - AppState.route[i - 1].x;
    const dy = AppState.route[i].y - AppState.route[i - 1].y;
    if (dx === firstDx && dy === firstDy) {
      segmentCells++;
    } else {
      break;
    }
  }

  const targetNode = AppState.route[segmentCells];
  if (neededDirIdx !== -1) AppState.user.dirIdx = neededDirIdx;
  AppState.user.x = targetNode.x;
  AppState.user.y = targetNode.y;

  AppState.route = NavigationEngine.findShortestPathBFS(
    AppState.grid,
    AppState.user.x,
    AppState.user.y,
    AppState.targetItem.x,
    AppState.targetItem.y
  );

  // Verifica se chegou ao produto/local desejado
  if (AppState.user.x === AppState.targetItem.x && AppState.user.y === AppState.targetItem.y) {
    AppState.routesCompletedCount = (AppState.routesCompletedCount || 12) + 1;
    updateProfileUI();
    SensoryEngine.playTone("arrival");
    SensoryEngine.vibrate("arrival");
    showPhoneToast(`🏁 Você chegou: ${AppState.targetItem.name}!`);
    updateMiniMapCardUI(true);
    drawAllMaps();
    return;
  }

  // Feedback sonoro e tátil da instrução concluída
  if (hadTurn && turnInfo.code === "turnRight") {
    SensoryEngine.playTone("turnRight");
    SensoryEngine.vibrate("turnRight");
  } else if (hadTurn && turnInfo.code === "turnLeft") {
    SensoryEngine.playTone("turnLeft");
    SensoryEngine.vibrate("turnLeft");
  } else {
    SensoryEngine.playTone("step");
    SensoryEngine.vibrate("straight");
  }

  updateMiniMapCardUI(true);
  drawAllMaps();
}

function updateMiniMapCardUI(shouldSpeakInstruction = false) {
  const env = ENVIRONMENTS[AppState.envKey];
  document.getElementById("headerEnvSubtitle").textContent =
    `📍 ${env.name} · Posição: (${AppState.user.x}, ${AppState.user.y})`;

  const titleEl = document.getElementById("miniMapTitle");
  const badgeEl = document.getElementById("miniMapStepsBadge");
  const descEl = document.getElementById("miniMapDesc");
  const iconStartBtn = document.getElementById("iconBtnStartGps");
  const lblStartBtn = document.getElementById("lblBtnStartGps");
  const btnStart = document.getElementById("btnStartGpsNow");
  const gpsControls = document.getElementById("gpsControlsPanel");

  if (!AppState.targetItem) {
    titleEl.textContent = "2. Breve Mapa do Local Escolhido";
    badgeEl.textContent = "Aguardando escolha";
    descEl.textContent =
      "Toque em uma opção acima (ex: Leite) e escolha a marca para ver a linha da rota no breve mapa abaixo e clicar em Começar.";
    if (iconStartBtn) iconStartBtn.textContent = "🚀";
    lblStartBtn.textContent = "COMEÇAR";
    if (gpsControls) gpsControls.style.display = "none";
    updateMapHistoryCard();
    return;
  }

  const stepsLeft = Math.max(0, AppState.route.length - 1) * STEPS_PER_CELL;
  const fullInstructions = NavigationEngine.buildFullTurnByTurnList(
    env,
    AppState.user,
    AppState.targetItem,
    AppState.route
  );
  const activeInstruction = NavigationEngine.buildActiveInstruction(
    env,
    AppState.user,
    AppState.targetItem,
    AppState.route
  );

  titleEl.textContent = `Rota: ${AppState.targetItem.name}`;
  badgeEl.textContent = stepsLeft === 0 ? "🏁 Chegou!" : `~${stepsLeft} passos`;

  if (!AppState.gpsRunning) {
    descEl.textContent =
      `Local: ${AppState.targetItem.aisle} (gôndola à ${AppState.targetItem.side}, prateleira ${AppState.targetItem.height}). Toque em COMEÇAR abaixo para iniciar.`;
    if (iconStartBtn) iconStartBtn.textContent = "🚀";
    lblStartBtn.textContent = `COMEÇAR (${stepsLeft} PASSOS)`;
    btnStart.classList.remove("ok");
    btnStart.classList.add("gold");
    if (gpsControls) gpsControls.style.display = "none";
  } else if (stepsLeft === 0) {
    descEl.textContent = activeInstruction;
    if (iconStartBtn) iconStartBtn.textContent = "🏁";
    lblStartBtn.textContent = "VOCÊ CHEGOU! (RECOMEÇAR ROTA)";
    btnStart.classList.remove("gold");
    btnStart.classList.add("ok");
    if (gpsControls) gpsControls.style.display = "flex";
    if (shouldSpeakInstruction) {
      SensoryEngine.announce(activeInstruction, "assertive", AppState.screenReaderMode);
    }
  } else {
    const remainingStages = Math.max(1, fullInstructions.length - 1);
    descEl.textContent = `📢 Instrução atual: ${activeInstruction}`;
    if (iconStartBtn) iconStartBtn.textContent = "➡️";
    lblStartBtn.textContent =
      remainingStages === 1
        ? "CONTINUAR INSTRUÇÃO (CHEGAR AO LOCAL)"
        : `CONTINUAR INSTRUÇÃO (FALTAM ${stepsLeft} PASSOS)`;
    btnStart.classList.remove("ok");
    btnStart.classList.add("gold");
    if (gpsControls) gpsControls.style.display = "flex";
    if (shouldSpeakInstruction) {
      SensoryEngine.announce(
        `${activeInstruction} Depois toque em Continuar Instrução.`,
        "assertive",
        AppState.screenReaderMode
      );
    }
  }

  updateMapHistoryCard();
}

// ============================================================================
// 5. DESENHO DO BREVE MAPA (ABA INÍCIO) E DO MAPA COMPLETO (ABA MAPA)
// ============================================================================
function drawAllMaps() {
  drawCanvasMap("miniHomeMap", false);
  drawCanvasMap("spatialMap", true);
}

function drawCanvasMap(canvasId, showHoverCursor = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cellW = canvas.width / GRID_COLS;
  const cellH = canvas.height / GRID_ROWS;
  const env = ENVIRONMENTS[AppState.envKey];
  const isHC = AppState.highContrast;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Malha de fundo
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cType = AppState.grid[y][x];
      if (cType === CELL.WALL) {
        ctx.fillStyle = isHC ? "#2B0910" : "#162A4A";
      } else if (cType === CELL.OBSTACLE) {
        ctx.fillStyle = "#E60026";
      } else {
        ctx.fillStyle = isHC ? "#050811" : "#0A1E3F";
      }
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);

      ctx.strokeStyle = isHC ? "#1C2D4F" : "#153263";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
    }
  }

  // 2. Gôndolas e Seções
  env.zones.forEach(z => {
    const zx = z.x1 * cellW;
    const zy = z.y1 * cellH;
    const zw = (z.x2 - z.x1 + 1) * cellW;
    const zh = (z.y2 - z.y1 + 1) * cellH;

    ctx.fillStyle = isHC ? "#102347" : "#1B4382";
    ctx.fillRect(zx + 2, zy + 2, zw - 4, zh - 4);

    ctx.strokeStyle = "#F2B705";
    ctx.lineWidth = 2;
    ctx.strokeRect(zx + 2, zy + 2, zw - 4, zh - 4);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px 'Atkinson Hyperlegible', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(z.name.slice(0, 14), zx + zw / 2, zy + zh / 2);
  });

  // 3. Linha Amarela da Rota até o Produto
  if (AppState.route && AppState.route.length > 1) {
    ctx.save();
    ctx.strokeStyle = "#FFE500";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    AppState.route.forEach((pt, idx) => {
      const cx = (pt.x + 0.5) * cellW;
      const cy = (pt.y + 0.5) * cellH;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();
  }

  // 4. Ponto do Produto / Local Escolhido
  if (AppState.targetItem) {
    const tx = (AppState.targetItem.x + 0.5) * cellW;
    const ty = (AppState.targetItem.y + 0.5) * cellH;
    ctx.fillStyle = "#FFE500";
    ctx.beginPath();
    ctx.arc(tx, ty, cellW * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 5. Cursor de Toque (Mapa Completo)
  if (showHoverCursor && AppState.hoverCell) {
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      AppState.hoverCell.x * cellW + 2,
      AppState.hoverCell.y * cellH + 2,
      cellW - 4,
      cellH - 4
    );
  }

  // 6. Posição Atual do Usuário (Bolinha Verde + Seta)
  const ux = (AppState.user.x + 0.5) * cellW;
  const uy = (AppState.user.y + 0.5) * cellH;
  const dir = DIRS[AppState.user.dirIdx];

  ctx.save();
  ctx.fillStyle = "#00FF66";
  ctx.beginPath();
  ctx.arc(ux, uy, cellW * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000000";
  ctx.stroke();

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ux, uy);
  ctx.lineTo(ux + dir.dx * (cellW * 0.34), uy + dir.dy * (cellH * 0.34));
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 6. DESVIO DE OBSTÁCULO E ABA MAPA / FAVORITOS / COMUNIDADE
// ============================================================================
function simulateObstacleInFront() {
  if (!AppState.route || AppState.route.length <= 2) {
    SensoryEngine.announce("Escolha uma rota mais longa para simular desvio de obstáculo.", "polite", AppState.screenReaderMode);
    return;
  }

  const obsCoord = { x: AppState.route[1].x, y: AppState.route[1].y };
  AppState.obstacles.push(obsCoord);
  const env = ENVIRONMENTS[AppState.envKey];
  AppState.grid = NavigationEngine.buildGrid(env, AppState.obstacles);
  AppState.route = NavigationEngine.findShortestPathBFS(
    AppState.grid,
    AppState.user.x,
    AppState.user.y,
    AppState.targetItem.x,
    AppState.targetItem.y
  );

  SensoryEngine.playTone("obstacle");
  SensoryEngine.vibrate("wall");
  updateMiniMapCardUI(false);
  drawAllMaps();

  const newStep = document.getElementById("miniMapDesc").textContent;
  SensoryEngine.announce(`Obstáculo à frente! Novo caminho calculado: ${newStep}`, "assertive", AppState.screenReaderMode);
}

// ============================================================================
// 7. ABA MAPA, FAVORITOS E COMUNIDADE
// ============================================================================
function updateMapHistoryCard() {
  const env = ENVIRONMENTS[AppState.envKey];
  const textEl = document.getElementById("mapSpokenHistoryText");
  const badgeEl = document.getElementById("mapStepsBadge");
  const iconMapBtn = document.getElementById("iconBtnMapGps");
  const lblMapBtn = document.getElementById("lblBtnMapGps");
  const btnMap = document.getElementById("btnMapResumeGps");
  if (!textEl) return;

  if (!AppState.targetItem) {
    textEl.textContent = `Você está em ${env.name}. Escolha um item na aba Início para ver a rota.`;
    if (badgeEl) badgeEl.textContent = "Aguardando";
    if (iconMapBtn) iconMapBtn.textContent = "🚀";
    if (lblMapBtn) lblMapBtn.textContent = "COMEÇAR";
    return;
  }

  const stepsLeft = Math.max(0, AppState.route.length - 1) * STEPS_PER_CELL;
  const activeInstruction = NavigationEngine.buildActiveInstruction(
    env,
    AppState.user,
    AppState.targetItem,
    AppState.route
  );

  if (badgeEl) {
    badgeEl.textContent = stepsLeft === 0 ? "🏁 Chegou!" : `~${stepsLeft} passos`;
  }

  if (!AppState.gpsRunning) {
    textEl.textContent =
      `Destino: ${AppState.targetItem.name} (${AppState.targetItem.aisle}, prateleira ${AppState.targetItem.height}). Toque em COMEÇAR abaixo para ouvir a instrução.`;
    if (iconMapBtn) iconMapBtn.textContent = "🚀";
    if (lblMapBtn) lblMapBtn.textContent = `COMEÇAR (${stepsLeft} PASSOS)`;
    if (btnMap) {
      btnMap.classList.remove("ok");
      btnMap.classList.add("gold");
    }
  } else if (stepsLeft === 0) {
    textEl.textContent = activeInstruction;
    if (iconMapBtn) iconMapBtn.textContent = "🏁";
    if (lblMapBtn) lblMapBtn.textContent = "VOCÊ CHEGOU! (RECOMEÇAR ROTA)";
    if (btnMap) {
      btnMap.classList.remove("gold");
      btnMap.classList.add("ok");
    }
  } else {
    textEl.textContent = `📢 Instrução atual: ${activeInstruction}`;
    if (iconMapBtn) iconMapBtn.textContent = "➡️";
    if (lblMapBtn) lblMapBtn.textContent = `CONTINUAR INSTRUÇÃO (FALTAM ${stepsLeft} PASSOS)`;
    if (btnMap) {
      btnMap.classList.remove("ok");
      btnMap.classList.add("gold");
    }
  }
}

function renderMapScreen() {
  updateMapHistoryCard();
  drawAllMaps();

  const container = document.getElementById("nearbyPlacesContainer");
  if (!container) return;

  container.innerHTML = (window.NEARBY_PLACES || [])
    .map(place => {
      const isCurrent = place.envKey === AppState.envKey;
      return `
        <article class="place-card ${isCurrent ? "current-place" : ""}">
          <div class="dest-top">
            <h3 class="dest-name">${place.name}</h3>
            <span class="badge-tag">${isCurrent ? "📍 Local Atual" : place.distance}</span>
          </div>
          <p class="dest-meta" style="font-weight:700;">${place.rating}</p>
          <p class="dest-meta">${place.features}</p>
          <button
            type="button"
            class="btn ${isCurrent ? "ok" : "gold"}"
            data-switch-env="${place.envKey}"
          >
            <span aria-hidden="true">${isCurrent ? "✅" : "🚀"}</span>
            <span>${isCurrent ? "Você já está neste local" : `Escolher ${place.name}`}</span>
          </button>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll("button[data-switch-env]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetEnv = btn.getAttribute("data-switch-env");
      if (targetEnv !== AppState.envKey) {
        switchEnvironment(targetEnv, true);
      }
      switchBottomTab("screen-inicio", false);
    });
  });
}

function inspectMapCell(x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return null;
  const env = ENVIRONMENTS[AppState.envKey];

  if (x === AppState.user.x && y === AppState.user.y) {
    return { kind: "free", title: "Seu local atual" };
  }

  const prod = env.items.find(it => (it.shelfX === x && it.shelfY === y) || (it.x === x && it.y === y));
  if (prod) {
    return { kind: "shelf", title: `${prod.name} (${prod.aisle})` };
  }

  const zone = env.zones.find(z => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2);
  if (zone) {
    return { kind: zone.type === CELL.FREE ? "free" : "shelf", title: zone.name };
  }

  if (AppState.grid[y][x] === CELL.OBSTACLE) return { kind: "obstacle", title: "Obstáculo no Corredor" };
  if (AppState.grid[y][x] === CELL.WALL) return { kind: "wall", title: "Parede" };

  const aisle = env.aisleLabels.find(a => a.x === x && y >= a.y1 && y <= a.y2);
  if (aisle) return { kind: "free", title: aisle.name };

  return { kind: "free", title: "Corredor Livre" };
}

function handleTouchScanOnMap(clientX, clientY, canvasId = "spatialMap") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;
  if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return;

  const gx = Math.floor((relX / rect.width) * GRID_COLS);
  const gy = Math.floor((relY / rect.height) * GRID_ROWS);

  if (AppState.hoverCell && AppState.hoverCell.x === gx && AppState.hoverCell.y === gy) return;
  AppState.hoverCell = { x: gx, y: gy };

  const info = inspectMapCell(gx, gy);
  if (!info) return;

  const relDir = NavigationEngine.getBodyRelativeDirection(AppState.user, gx, gy);
  SensoryEngine.playTone(info.kind);
  if (info.kind === "wall" || info.kind === "obstacle") SensoryEngine.vibrate("wall");
  else if (info.kind === "shelf") SensoryEngine.vibrate("shelfTouch");

  const msg = `${info.title}, ${relDir}.`;
  const fb = document.getElementById("mapTouchFeedback");
  if (fb) fb.textContent = msg;
  SensoryEngine.announce(msg, "assertive", AppState.screenReaderMode);
  drawAllMaps();
}

function toggleFavoriteItem(itemId) {
  const env = ENVIRONMENTS[AppState.envKey];
  const item = env.items.find(i => i.id === itemId);

  const idx = AppState.favorites.indexOf(itemId);
  if (idx === -1) {
    AppState.favorites.push(itemId);
    SensoryEngine.announce(`${item ? item.name : "Item"} salvo nos Favoritos.`, "polite", AppState.screenReaderMode);
    showPhoneToast(`⭐ Salvo nos Favoritos!`);
  } else {
    AppState.favorites.splice(idx, 1);
    SensoryEngine.announce(`${item ? item.name : "Item"} removido dos Favoritos.`, "polite", AppState.screenReaderMode);
  }

  saveAppState();

  const badge = document.getElementById("favCountBadge");
  if (badge) badge.textContent = String(AppState.favorites.length);

  renderSimpleGroups();
  renderFavoritesScreen();
}

function renderFavoritesScreen() {
  const container = document.getElementById("favoritesListContainer");
  if (!container) return;

  const favItems = [];
  Object.values(ENVIRONMENTS).forEach(env => {
    env.items.forEach(item => {
      if (AppState.favorites.includes(item.id)) {
        favItems.push({ envKey: env.id, envName: env.name, item });
      }
    });
  });

  if (favItems.length === 0) {
    container.innerHTML = `<p style="color:var(--mut);margin:0;">Nenhum favorito salvo ainda.</p>`;
    return;
  }

  container.innerHTML = favItems
    .map(({ envKey, envName, item }) => `
      <article class="dest-item">
        <div class="dest-top">
          <h3 class="dest-name">${item.name}</h3>
          <span class="badge-tag">${envName}</span>
        </div>
        <p class="dest-meta">📍 ${item.aisle} · Prateleira ${item.height}</p>
        <div class="dest-actions">
          <button type="button" class="btn gold" data-fav-go="${item.id}" data-fav-env="${envKey}">
            <span aria-hidden="true">🚀</span> Começar
          </button>
          <button
            type="button"
            class="btn fav-star-btn"
            aria-pressed="true"
            aria-label="Remover ${item.name}"
            data-fav-remove="${item.id}"
          >
            ★
          </button>
        </div>
      </article>
    `)
    .join("");

  container.querySelectorAll("button[data-fav-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetEnv = btn.getAttribute("data-fav-env");
      const itemId = btn.getAttribute("data-fav-go");
      if (targetEnv !== AppState.envKey) switchEnvironment(targetEnv, false);
      const item = ENVIRONMENTS[AppState.envKey].items.find(i => i.id === itemId);
      if (item) {
        switchBottomTab("screen-inicio", false);
        previewDestinationOnMiniMap(item);
        handlePrimaryGpsAction();
      }
    });
  });

  container.querySelectorAll("button[data-fav-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleFavoriteItem(btn.getAttribute("data-fav-remove"));
    });
  });
}

function renderCommunityScreen() {
  const feedEl = document.getElementById("communityFeedContainer");
  if (!feedEl) return;

  feedEl.innerHTML = AppState.communityPosts
    .map(post => `
      <article class="chat-post">
        <div class="chat-author-row">
          <span class="chat-author">👤 ${post.author}</span>
          <span class="chat-time">${post.time}</span>
        </div>
        <div class="chat-place-tag">📍 Local: ${post.place}</div>
        <p class="chat-message">"${post.message}"</p>
        <div class="chat-actions">
          <button type="button" class="btn" data-listen-post="${post.id}">
            <span aria-hidden="true">🔊</span> Ouvir
          </button>
          <button type="button" class="btn" data-like-post="${post.id}">
            <span aria-hidden="true">👍</span> Útil (${post.likes})
          </button>
        </div>
      </article>
    `)
    .join("");

  feedEl.querySelectorAll("button[data-listen-post]").forEach(btn => {
    btn.addEventListener("click", () => {
      const post = AppState.communityPosts.find(p => p.id === btn.getAttribute("data-listen-post"));
      if (post) {
        SensoryEngine.announce(`${post.author} disse sobre ${post.place}: ${post.message}`, "assertive", AppState.screenReaderMode);
      }
    });
  });

  feedEl.querySelectorAll("button[data-like-post]").forEach(btn => {
    btn.addEventListener("click", () => {
      const post = AppState.communityPosts.find(p => p.id === btn.getAttribute("data-like-post"));
      if (post) {
        post.likes += 1;
        saveAppState();
        renderCommunityScreen();
      }
    });
  });
}

function publishCommunityMessage() {
  const placeInput = document.getElementById("inputCommPlace");
  const msgInput = document.getElementById("inputCommMessage");
  const place = (placeInput.value || ENVIRONMENTS[AppState.envKey].name).trim();
  const message = (msgInput.value || "").trim();

  if (!message) {
    SensoryEngine.announce("Escreva ou fale uma mensagem antes de enviar.", "assertive", AppState.screenReaderMode);
    return;
  }

  const userName = AppState.userProfile && AppState.userProfile.name
    ? `${AppState.userProfile.name} (Passo Seguro)`
    : "Você (Passo Seguro)";

  AppState.communityPosts.unshift({
    id: "post-" + Date.now(),
    author: userName,
    time: "Agora",
    place,
    message,
    likes: 1
  });

  saveAppState();
  msgInput.value = "";
  renderCommunityScreen();
  SensoryEngine.playTone("arrival");
  showPhoneToast("💬 Mensagem publicada na Comunidade!");
  SensoryEngine.announce("Mensagem enviada para a comunidade!", "assertive", AppState.screenReaderMode);
}

// ============================================================================
// 8. COMANDO DE VOZ SIMPLIFICADO
// ============================================================================
function setupVoiceCommands() {
  const btnVoiceHome = document.getElementById("btnVoiceHome");
  const lblVoiceHome = document.getElementById("lblVoiceHome");
  const statusHome = document.getElementById("voiceTranscriptHome");
  const btnDictateComm = document.getElementById("btnDictateComm");
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let mode = "nav";
  let listening = false;

  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listening = true;
      if (mode === "nav") {
        btnVoiceHome.classList.add("listening");
        lblVoiceHome.textContent = "Ouvindo... Diga o produto (ex: Leite)";
      } else {
        btnDictateComm.classList.add("listening");
      }
      SensoryEngine.vibrate("shelfTouch");
    };

    recognition.onend = () => {
      listening = false;
      btnVoiceHome.classList.remove("listening");
      btnDictateComm.classList.remove("listening");
      lblVoiceHome.textContent = "Falar o que você procura (Voz)";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (mode === "community") {
        const msgBox = document.getElementById("inputCommMessage");
        msgBox.value = (msgBox.value ? msgBox.value + " " : "") + transcript;
        SensoryEngine.announce(`Você ditou: ${transcript}`, "assertive", AppState.screenReaderMode);
      } else {
        statusHome.textContent = `Você falou: "${transcript}"`;
        processSpokenChoice(transcript);
      }
    };
  }

  btnVoiceHome.addEventListener("click", () => {
    mode = "nav";
    if (!recognition) {
      const sim = prompt('Fale o que procura (ex: "Leite", "Leite Italac", "Feijão", "Caixa"):', "Leite");
      if (sim) {
        statusHome.textContent = `Você falou: "${sim}"`;
        processSpokenChoice(sim);
      }
      return;
    }
    if (listening) recognition.stop();
    else {
      try { recognition.start(); } catch (e) { }
    }
  });

  btnDictateComm.addEventListener("click", () => {
    mode = "community";
    if (!recognition) {
      const sim = prompt("Fale sua mensagem para a comunidade:", "O corredor de laticínios está livre e bem sinalizado!");
      if (sim) document.getElementById("inputCommMessage").value = sim;
      return;
    }
    if (listening) recognition.stop();
    else {
      try { recognition.start(); } catch (e) { }
    }
  });
}

function processSpokenChoice(speechText) {
  const norm = speechText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (norm.includes("comecar") || norm.includes("iniciar") || norm.includes("continuar") || norm.includes("proximo")) {
    handlePrimaryGpsAction();
    return;
  }

  const env = ENVIRONMENTS[AppState.envKey];

  // 1. Verifica se falou o nome de uma categoria simples (ex: "Leite", "Feijão")
  const matchedGroup = env.groups.find(g => {
    const gNorm = g.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm === gNorm || norm === g.id;
  });

  if (matchedGroup) {
    AppState.openGroupId = matchedGroup.id;
    renderSimpleGroups();
    const firstItem = env.items.find(i => i.groupId === matchedGroup.id);
    if (firstItem) previewDestinationOnMiniMap(firstItem);
    return;
  }

  // 2. Procura uma marca ou produto específico falado
  let bestItem = null;
  let bestScore = 0;
  env.items.forEach(item => {
    const corpus = `${item.name} ${item.brand || ""} ${item.category}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const tokens = corpus.split(/\W+/).filter(w => w.length > 2);
    let score = 0;
    tokens.forEach(tk => {
      if (norm.includes(tk)) score += tk.length;
    });

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  });

  if (bestItem && bestScore > 0) {
    AppState.openGroupId = bestItem.groupId;
    previewDestinationOnMiniMap(bestItem);
  } else {
    SensoryEngine.announce(
      `Não encontrei "${speechText}". Tente dizer Leite, Feijão, Arroz, Pão ou Caixa.`,
      "assertive",
      AppState.screenReaderMode
    );
  }
}

// ============================================================================
// 9. SELETOR DE "LOCAL" E INICIALIZAÇÃO DO APLICATIVO MOBILE
// ============================================================================
function switchEnvironment(envKey, shouldAnnounce = true) {
  if (!ENVIRONMENTS[envKey]) return;
  AppState.envKey = envKey;
  const env = ENVIRONMENTS[envKey];
  AppState.user = { ...env.startPose };
  AppState.openGroupId = null;
  AppState.targetItem = env.items[0] || null;
  AppState.gpsRunning = false;
  AppState.obstacles = [];
  AppState.searchQuery = "";

  const searchInp = document.getElementById("inputHomeSearch");
  if (searchInp) searchInp.value = "";

  const selEnv = document.getElementById("selDebugEnv");
  if (selEnv) selEnv.value = envKey;

  const commPlace = document.getElementById("inputCommPlace");
  if (commPlace) commPlace.value = env.name;

  AppState.grid = NavigationEngine.buildGrid(env, AppState.obstacles);
  if (AppState.targetItem) {
    AppState.route = NavigationEngine.findShortestPathBFS(
      AppState.grid,
      AppState.user.x,
      AppState.user.y,
      AppState.targetItem.x,
      AppState.targetItem.y
    );
  }

  populateLocalSelector();
  renderSimpleGroups();
  updateMiniMapCardUI(false);
  renderMapScreen();

  if (shouldAnnounce) {
    SensoryEngine.announce(`Local alterado para ${env.name}.`, "assertive", AppState.screenReaderMode);
  }
}

function populateLocalSelector() {
  const env = ENVIRONMENTS[AppState.envKey];
  const sel = document.getElementById("selDebugTeleport");
  if (!sel) return;
  sel.innerHTML =
    `<option value="entrada">Entrada Principal (${env.startPose.x},${env.startPose.y})</option>` +
    env.items
      .map(it => `<option value="${it.id}">${it.aisle} - ${it.name}</option>`)
      .join("");
}

let phoneToastTimer = null;
function showPhoneToast(text) {
  const el = document.getElementById("phoneToast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(phoneToastTimer);
  phoneToastTimer = setTimeout(() => {
    el.classList.remove("visible");
  }, 4000);
}

function initMobileApp() {
  loadSavedState();

  const env = ENVIRONMENTS[AppState.envKey];
  AppState.grid = NavigationEngine.buildGrid(env, AppState.obstacles);

  // Deixa o primeiro item (Leite Desnatado Italac) pré-calculado no Breve Mapa embaixo
  AppState.targetItem = env.items[0];
  AppState.route = NavigationEngine.findShortestPathBFS(
    AppState.grid,
    AppState.user.x,
    AppState.user.y,
    AppState.targetItem.x,
    AppState.targetItem.y
  );

  const badge = document.getElementById("favCountBadge");
  if (badge) badge.textContent = String(AppState.favorites.length);

  populateLocalSelector();
  renderSimpleGroups();
  updateMiniMapCardUI(false);
  renderMapScreen();
  renderFavoritesScreen();
  renderCommunityScreen();
  drawAllMaps();
  setupVoiceCommands();
  setupLoginScreen();

  // Botão Principal na Aba Início: COMEÇAR -> CONTINUAR INSTRUÇÃO
  document.getElementById("btnStartGpsNow").addEventListener("click", () => {
    handlePrimaryGpsAction();
  });

  // Abas Inferiores
  const tabBtns = Array.from(document.querySelectorAll(".bottom-tab"));
  tabBtns.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      switchBottomTab(btn.getAttribute("data-tab"), true);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = tabBtns[(idx + dir + tabBtns.length) % tabBtns.length];
        next.focus();
        switchBottomTab(next.getAttribute("data-tab"), true);
      }
    });
  });

  // Controles do Topo
  const btnSR = document.getElementById("btnToggleSR");
  btnSR.addEventListener("click", () => {
    AppState.screenReaderMode = !AppState.screenReaderMode;
    btnSR.setAttribute("aria-pressed", String(AppState.screenReaderMode));
    document.getElementById("lblSRIcon").textContent = AppState.screenReaderMode ? "🔇" : "🔊";
    if (AppState.screenReaderMode && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    SensoryEngine.announce(
      AppState.screenReaderMode ? "Modo leitor de tela ativado." : "Voz interna ativada.",
      "assertive",
      false
    );
  });

  const btnHC = document.getElementById("btnToggleHC");
  const lblHC = document.getElementById("lblContrastMode");
  if (AppState.highContrast) {
    btnHC.setAttribute("aria-pressed", "true");
    if (lblHC) lblHC.textContent = "Desativar Alto Contraste (Voltar ao Padrão)";
  }
  btnHC.addEventListener("click", () => {
    AppState.highContrast = !AppState.highContrast;
    document.body.classList.toggle("hc", AppState.highContrast);
    btnHC.setAttribute("aria-pressed", String(AppState.highContrast));
    if (lblHC) {
      lblHC.textContent = AppState.highContrast
        ? "Desativar Alto Contraste (Voltar ao Padrão)"
        : "Ativar Alto Contraste (Preto/Amarelo)";
    }
    saveAppState();
    drawAllMaps();
    SensoryEngine.announce(
      AppState.highContrast
        ? "Alto contraste preto e amarelo ativado."
        : "Tema branco, azul e amarelo ativado.",
      "polite",
      AppState.screenReaderMode
    );
  });

  document.getElementById("btnCycleFont").addEventListener("click", () => {
    AppState.fontSizeIdx = (AppState.fontSizeIdx + 1) % AppState.fontSizes.length;
    const size = AppState.fontSizes[AppState.fontSizeIdx];
    document.documentElement.style.setProperty("--fs", size);
    saveAppState();
    SensoryEngine.announce(`Fonte ${size}.`, "polite", AppState.screenReaderMode);
  });

  const btnDebug = document.getElementById("btnToggleDebug");
  const debugBar = document.getElementById("debugBar");
  btnDebug.addEventListener("click", () => {
    const isHidden = debugBar.hasAttribute("hidden");
    if (isHidden) {
      debugBar.removeAttribute("hidden");
      btnDebug.setAttribute("aria-expanded", "true");
    } else {
      debugBar.setAttribute("hidden", "");
      btnDebug.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("selDebugEnv").addEventListener("change", (e) => {
    switchEnvironment(e.target.value, true);
  });

  // Seletor "Local"
  document.getElementById("selDebugTeleport").addEventListener("change", (e) => {
    const currEnv = ENVIRONMENTS[AppState.envKey];
    if (e.target.value === "entrada") {
      AppState.user.x = currEnv.startPose.x;
      AppState.user.y = currEnv.startPose.y;
    } else {
      const item = currEnv.items.find(i => i.id === e.target.value);
      if (item) {
        AppState.user.x = item.x;
        AppState.user.y = item.y;
      }
    }
    if (AppState.targetItem) {
      AppState.route = NavigationEngine.findShortestPathBFS(
        AppState.grid,
        AppState.user.x,
        AppState.user.y,
        AppState.targetItem.x,
        AppState.targetItem.y
      );
    }
    updateMiniMapCardUI(true);
    drawAllMaps();
  });

  document.getElementById("btnDebugArrival").addEventListener("click", () => {
    if (!AppState.targetItem) return;
    AppState.user.x = AppState.targetItem.x;
    AppState.user.y = AppState.targetItem.y;
    AppState.route = [{ x: AppState.user.x, y: AppState.user.y }];
    AppState.gpsRunning = true;
    SensoryEngine.playTone("arrival");
    SensoryEngine.vibrate("arrival");
    showPhoneToast(`🏁 Você chegou: ${AppState.targetItem.name}!`);
    updateMiniMapCardUI(true);
    drawAllMaps();
  });

  // Botões Auxiliares (Ouvir de Novo / Simular Obstáculo)
  document.getElementById("btnRepeatGpsStep").addEventListener("click", () => updateMiniMapCardUI(true));
  document.getElementById("btnGpsObstacle").addEventListener("click", simulateObstacleInFront);

  // Busca Simples na Aba Início
  document.getElementById("inputHomeSearch").addEventListener("input", (e) => {
    AppState.searchQuery = e.target.value;
    renderSimpleGroups();
  });

  // Botão Principal na Aba Mapa: COMEÇAR -> CONTINUAR INSTRUÇÃO (funciona direto no Mapa!)
  document.getElementById("btnMapResumeGps").addEventListener("click", () => {
    handlePrimaryGpsAction();
  });

  // Comunidade
  document.getElementById("btnPublishComm").addEventListener("click", publishCommunityMessage);

  // Varredura Tátil no Mapa Completo e no Breve Mapa
  ["spatialMap", "miniHomeMap"].forEach(mapId => {
    const canvas = document.getElementById(mapId);
    if (!canvas) return;
    canvas.addEventListener("pointerdown", (e) => {
      AppState.isPointerDown = true;
      canvas.setPointerCapture(e.pointerId);
      handleTouchScanOnMap(e.clientX, e.clientY, mapId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!AppState.isPointerDown) return;
      handleTouchScanOnMap(e.clientX, e.clientY, mapId);
    });
    canvas.addEventListener("pointerup", () => {
      AppState.isPointerDown = false;
    });
    canvas.addEventListener("pointercancel", () => {
      AppState.isPointerDown = false;
    });
  });
}

window.addEventListener("DOMContentLoaded", initMobileApp);
