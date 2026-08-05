// ============================================================
// CODモバイル 武器ガチャ
// ランチャーはサブ武器扱いのため対象外にしています。
// 武器の追加・削除・名称修正はこの WEAPONS オブジェクトを編集するだけでOKです。
// ============================================================

const WEAPONS = {
  "アサルトライフル": {
    color: "var(--c-ar)",
    list: [
      "BAL-27", "Lachmann-556", "Groza", "XM4", "RAM-7", "AS VAL", "Type 19",
      "Grau 5.56", "DR-H", "M13", "AK117", "Kilo 141", "Swordfish", "HVK-30",
      "CR-56 AMAX", "Maddox", "BP50", "Oden", "KN-44", "Type 25", "M16",
      "ICR-1", "ASM10", "EM2", "LAG53", "BK57", "LK24", "Peacekeeper MK2",
      "Krig 6", "HBRa3", "AK-47", "Man-O-War", "FR .556", "M4", "FFAR 1"
    ]
  },
  "サブマシンガン": {
    color: "var(--c-smg)",
    list: [
      "Switchblade X9", "Chicom", "QQ9", "MX9", "CX-9", "Fennec", "VMP",
      "FSS Hurricane", "USS9", "QXR", "LAPA", "GKS", "Razorback", "HG 40",
      "Sten", "Pharo", "PP19 Bizon", "CBR4", "PDW-57", "Striker 45", "OTs 9",
      "MAC-10", "KSP 45", "PPSh-41", "Tec-9", "AGR 556", "Cordite",
      "RUS-79U", "MSMC", "ISO", "LC10"
    ]
  },
  "ライトマシンガン": {
    color: "var(--c-lmg)",
    list: [
      "PKM", "MG42", "Raal MG", "M4LMG", "Chopper", "Holger 26", "UL736",
      "Dingo", "Hades", "S36", "Bruen Mk9", "DP 27", "MG82"
    ]
  },
  "マークスマンライフル": {
    color: "var(--c-mr)",
    list: [
      "SO-14", "Type 63", "SKS", "M1 Garand", "MK2", "SP-R 208",
      "Kilo Bolt-Action"
    ]
  },
  "スナイパーライフル": {
    color: "var(--c-sr)",
    list: [
      "Locus", "Koshka", "LW3-Tundra", "Rytec AMR", "XPR-50", "HDR", "SVD",
      "DL Q33", "Arctic .50", "Outlaw", "ZRG 20mm", "M21 EBR", "NA-45"
    ]
  },
  "ショットガン": {
    color: "var(--c-sg)",
    list: [
      "R9-0", "HS0405", "HS2126", "KRM-262", "Argus", "BY15", "Striker",
      "JAK-12", "MX Guardian", "VLK Rogue", "Echo", "リボルビング"
    ]
  }
};

const ITEM_HEIGHT = 96;
const SPIN_ITEM_COUNT = 26; // 最終結果を含む、演出用に流す件数
const SPIN_DURATION_MS = 3600;

const state = {
  active: {},
  history: [],
  spinning: false
};

Object.keys(WEAPONS).forEach((category) => {
  state.active[category] = true;
});

const categoryListEl = document.getElementById("categoryList");
const poolCountEl = document.getElementById("poolCount");
const spinBtn = document.getElementById("spinBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const historyListEl = document.getElementById("historyList");
const reelWindow = document.getElementById("reelWindow");
const reelTrack = document.getElementById("reelTrack");
const confettiLayer = document.getElementById("confettiLayer");

function getPool() {
  const pool = [];
  Object.keys(WEAPONS).forEach((category) => {
    if (state.active[category]) {
      const { color, list } = WEAPONS[category];
      list.forEach((name) => {
        pool.push({ name, category, color });
      });
    }
  });
  return pool;
}

function renderCategories() {
  categoryListEl.innerHTML = "";
  Object.keys(WEAPONS).forEach((category) => {
    const { color, list } = WEAPONS[category];
    const isActive = state.active[category];

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip" + (isActive ? " active" : "");
    chip.style.setProperty("--chip-color", color);

    const dot = document.createElement("span");
    dot.className = "dot";

    const label = document.createElement("span");
    label.textContent = category + "（" + list.length + "）";

    chip.appendChild(dot);
    chip.appendChild(label);

    chip.addEventListener("click", () => {
      if (state.spinning) return;
      state.active[category] = !state.active[category];
      renderCategories();
      updatePoolCount();
    });

    categoryListEl.appendChild(chip);
  });
}

function updatePoolCount() {
  const count = getPool().length;
  poolCountEl.textContent = "候補: " + count + "丁";
  spinBtn.classList.toggle("empty", count === 0);
}

function buildReelItem(entry, extraClass) {
  const item = document.createElement("div");
  item.className = "reel-item" + (extraClass ? " " + extraClass : "");
  item.style.setProperty("--item-color", entry.color);

  const cat = document.createElement("span");
  cat.className = "reel-cat";
  cat.textContent = entry.category;

  const name = document.createElement("span");
  name.className = "reel-name";
  name.textContent = entry.name;

  item.appendChild(cat);
  item.appendChild(name);
  return item;
}

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnConfetti(color) {
  confettiLayer.innerHTML = "";
  const palette = [color, "#c9a25e", "#8a8578"];
  const pieceCount = 14;

  for (let i = 0; i < pieceCount; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 46;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance * 0.6 - 10;
    const delay = Math.random() * 0.15;

    piece.style.setProperty("--dx", dx + "px");
    piece.style.setProperty("--dy", dy + "px");
    piece.style.animationDelay = delay + "s";
    piece.style.background = palette[i % palette.length];

    confettiLayer.appendChild(piece);
  }

  window.setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 1500);
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "まだ結果がありません";
    empty.style.border = "none";
    empty.style.background = "none";
    historyListEl.appendChild(empty);
    return;
  }

  state.history.slice(0, 8).forEach((entry) => {
    const li = document.createElement("li");
    li.style.setProperty("--item-color", entry.color);

    const name = document.createElement("span");
    name.className = "h-name";
    name.textContent = entry.name;

    const cat = document.createElement("span");
    cat.className = "h-cat";
    cat.textContent = entry.category;

    li.appendChild(name);
    li.appendChild(cat);
    historyListEl.appendChild(li);
  });
}

function spin() {
  if (state.spinning) return;

  const pool = getPool();
  if (pool.length === 0) return;

  state.spinning = true;
  spinBtn.disabled = true;

  const finalPick = pickRandom(pool);

  // 演出用の帯を作る（最後の1件が最終結果）
  const sequence = [];
  for (let i = 0; i < SPIN_ITEM_COUNT - 1; i += 1) {
    sequence.push(pickRandom(pool));
  }
  sequence.push(finalPick);

  reelTrack.style.transition = "none";
  reelTrack.style.transform = "translateY(0)";
  reelTrack.innerHTML = "";
  sequence.forEach((entry) => {
    reelTrack.appendChild(buildReelItem(entry));
  });

  // 中央に止まるよう、window中央から半アイテム分オフセット
  const centerOffset = (reelWindow.clientHeight - ITEM_HEIGHT) / 2;
  const targetY = -((SPIN_ITEM_COUNT - 1) * ITEM_HEIGHT) + centerOffset;

  // リフローを挟んでからアニメーション開始
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reelTrack.style.transition =
        "transform " + SPIN_DURATION_MS + "ms cubic-bezier(0.1, 0.82, 0.18, 1)";
      reelTrack.style.transform = "translateY(" + targetY + "px)";
    });
  });

  window.setTimeout(() => {
    state.spinning = false;
    spinBtn.disabled = false;
    state.history.unshift(finalPick);
    renderHistory();
    spawnConfetti(finalPick.color);
  }, SPIN_DURATION_MS + 80);
}

spinBtn.addEventListener("click", spin);

selectAllBtn.addEventListener("click", () => {
  if (state.spinning) return;
  Object.keys(WEAPONS).forEach((category) => {
    state.active[category] = true;
  });
  renderCategories();
  updatePoolCount();
});

clearAllBtn.addEventListener("click", () => {
  if (state.spinning) return;
  Object.keys(WEAPONS).forEach((category) => {
    state.active[category] = false;
  });
  renderCategories();
  updatePoolCount();
});

renderCategories();
updatePoolCount();
renderHistory();