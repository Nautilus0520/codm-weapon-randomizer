// ============================================================
// CODモバイル 武器抽選
// ランチャーはサブ武器扱いのため対象外にしています。
// 武器の追加・削除・名称修正はこの WEAPONS オブジェクトを編集するだけでOKです。
//
// 演出は apple-design スキルの方針に沿って組んでいます:
//   - ボタン/チップは pointerdown の瞬間に反応する（release待ちにしない）
//   - ルーレットの停止はイージングカーブではなく spring（慣性のある動き）
//   - prefers-reduced-motion のときは spring を使わずクロスフェードに切り替える
// ============================================================

import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm";

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

const ITEM_HEIGHT_FALLBACK = 104; // CSSの .reel-item と同じ値（実測できない場合のみ使用）
const SPIN_ITEM_COUNT = 26; // 最終結果を含む、演出用に流す件数

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// ---------- 押した瞬間に反応するフィードバック（pointerdownで即座に、releaseで戻す） ----------
// apple-design: "Respond on pointer-down, not on release." 通常のタップは
// 慣性を持たないので damping はほぼ効かせず(bounce:0)、素早く反応させるだけに留める。
function attachPressFeedback(el) {
  let pressed = false;

  const pressIn = () => {
    if (pressed) return;
    pressed = true;
    animate(el, { scale: 0.96 }, { type: "spring", bounce: 0, duration: 0.15 });
  };

  const pressOut = () => {
    if (!pressed) return;
    pressed = false;
    animate(el, { scale: 1 }, { type: "spring", bounce: 0, duration: 0.3 });
  };

  el.addEventListener("pointerdown", pressIn);
  el.addEventListener("pointerup", pressOut);
  el.addEventListener("pointerleave", pressOut);
  el.addEventListener("pointercancel", pressOut);
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

    attachPressFeedback(chip);
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
  const palette = [color, "#2a2822", "#8f8b80"];
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

    // reduced motion のときは動かさず、そのまま出す
    if (!prefersReducedMotion()) {
      animate(
        li,
        { opacity: [0, 1], y: [-6, 0] },
        { type: "spring", bounce: 0, duration: 0.35 }
      );
    }
  });
}

function finishSpin(finalPick) {
  state.spinning = false;
  spinBtn.disabled = false;
  state.history.unshift(finalPick);
  renderHistory();
  spawnConfetti(finalPick.color);
}

function spin() {
  if (state.spinning) return;

  const pool = getPool();
  if (pool.length === 0) return;

  state.spinning = true;
  spinBtn.disabled = true;

  const finalPick = pickRandom(pool);

  // 演出用の帯を作る（sequence[SPIN_ITEM_COUNT - 1] が最終結果）
  // 最終結果のあとに数件バッファを足しておく（万一のオーバーシュートでも空白にならないように）
  const sequence = [];
  for (let i = 0; i < SPIN_ITEM_COUNT - 1; i += 1) {
    sequence.push(pickRandom(pool));
  }
  sequence.push(finalPick);
  for (let i = 0; i < 3; i += 1) {
    sequence.push(pickRandom(pool));
  }

  reelTrack.style.transform = "translateY(0)";
  reelTrack.innerHTML = "";
  sequence.forEach((entry) => {
    reelTrack.appendChild(buildReelItem(entry));
  });

  // reduced motion: スクロールさせず、短いクロスフェードで結果だけ見せる
  if (prefersReducedMotion()) {
    reelTrack.innerHTML = "";
    const finalItem = buildReelItem(finalPick);
    finalItem.style.opacity = "0";
    reelTrack.appendChild(finalItem);
    animate(finalItem, { opacity: [0, 1] }, { duration: 0.25, ease: "linear" });
    window.setTimeout(() => finishSpin(finalPick), 260);
    return;
  }

  // 実測の高さを使うことで、CSS側のサイズ変更とズレなく同期させる
  const measuredHeight =
    reelTrack.firstElementChild?.getBoundingClientRect().height ||
    ITEM_HEIGHT_FALLBACK;
  const centerOffset = (reelWindow.clientHeight - measuredHeight) / 2;
  const targetY = -((SPIN_ITEM_COUNT - 1) * measuredHeight) + centerOffset;

  // apple-design: bounceは「勢いのあるジェスチャー由来の動き」にだけ足す。
  // ボタン一発で始まる抽選そのものはジェスチャーの続きではないので、
  // 跳ねて行き過ぎると停止位置が読み取りづらくなる（履歴とズレて見える原因だった）。
  // 跳ねずにスッと止める。
  animate(
    reelTrack,
    { y: [0, targetY] },
    { type: "spring", bounce: 0, duration: 1.8 }
  ).then(() => {
    // spring は許容誤差の範囲で止まるため、最後に厳密な位置へロックしてから確定する
    reelTrack.style.transform = "translateY(" + targetY + "px)";
    finishSpin(finalPick);
  });
}

attachPressFeedback(spinBtn);
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