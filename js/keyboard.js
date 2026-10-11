// On-screen keyboard and hands with finger colour coding.
window.KQ = window.KQ || {};

// Each key: [lower, upper, width in units, finger]. Special keys use a name.
KQ.LAYOUT = [
  [["`", "~", 1, "lp"], ["1", "!", 1, "lp"], ["2", "@", 1, "lr"], ["3", "#", 1, "lm"], ["4", "$", 1, "li"], ["5", "%", 1, "li"], ["6", "^", 1, "ri"], ["7", "&", 1, "ri"], ["8", "*", 1, "rm"], ["9", "(", 1, "rr"], ["0", ")", 1, "rp"], ["-", "_", 1, "rp"], ["=", "+", 1, "rp"], ["Backspace", "⌫", 2, "rp"]],
  [["Tab", "Tab", 1.5, "lp"], ["q", "Q", 1, "lp"], ["w", "W", 1, "lr"], ["e", "E", 1, "lm"], ["r", "R", 1, "li"], ["t", "T", 1, "li"], ["y", "Y", 1, "ri"], ["u", "U", 1, "ri"], ["i", "I", 1, "rm"], ["o", "O", 1, "rr"], ["p", "P", 1, "rp"], ["[", "{", 1, "rp"], ["]", "}", 1, "rp"], ["\\", "|", 1.5, "rp"]],
  [["CapsLock", "Caps", 1.8, "lp"], ["a", "A", 1, "lp"], ["s", "S", 1, "lr"], ["d", "D", 1, "lm"], ["f", "F", 1, "li"], ["g", "G", 1, "li"], ["h", "H", 1, "ri"], ["j", "J", 1, "ri"], ["k", "K", 1, "rm"], ["l", "L", 1, "rr"], [";", ":", 1, "rp"], ["'", "\"", 1, "rp"], ["Enter", "Enter", 2.2, "rp"]],
  [["ShiftLeft", "Shift", 2.4, "lp"], ["z", "Z", 1, "lp"], ["x", "X", 1, "lr"], ["c", "C", 1, "lm"], ["v", "V", 1, "li"], ["b", "B", 1, "li"], ["n", "N", 1, "ri"], ["m", "M", 1, "ri"], [",", "<", 1, "rm"], [".", ">", 1, "rr"], ["/", "?", 1, "rp"], ["ShiftRight", "Shift", 2.6, "rp"]],
  [["Space", "", 7, "th"]],
];

KQ.Keyboard = class {
  constructor(container) {
    this.container = container;
    this.keys = {};
    this.render();
  }

  render() {
    this.container.innerHTML = "";
    this.container.classList.add("kb");
    for (const row of KQ.LAYOUT) {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      for (const [lower, upper, width, finger] of row) {
        const el = document.createElement("div");
        el.className = `kb-key finger-${finger}`;
        el.style.flex = `${width} ${width} 0`;
        el.dataset.key = lower;
        const isSpecial = lower.length > 1;
        if (isSpecial) {
          el.classList.add("kb-special");
          el.textContent = upper;
        } else if (/[a-z]/.test(lower)) {
          el.textContent = upper;
        } else {
          el.innerHTML = `<span class="kb-upper">${escapeHtml(upper)}</span><span class="kb-lower">${escapeHtml(lower)}</span>`;
        }
        if (lower === "f" || lower === "j") el.classList.add("kb-bump");
        rowEl.appendChild(el);
        this.keys[lower] = el;
      }
      this.container.appendChild(rowEl);
    }
  }

  clearHighlight() {
    for (const el of Object.values(this.keys)) el.classList.remove("next", "pressed", "wrong");
  }

  // Highlight the key (and the correct Shift) needed for character `ch`.
  highlight(ch) {
    this.clearHighlight();
    if (ch == null) return;
    const { key, shift } = KQ.keyFor(ch);
    const el = this.keys[key === " " ? "Space" : key];
    if (el) el.classList.add("next");
    if (shift) {
      const finger = KQ.FINGERS[key] || "ri";
      const shiftEl = this.keys[finger[0] === "l" ? "ShiftRight" : "ShiftLeft"];
      if (shiftEl) shiftEl.classList.add("next");
    }
  }

  flash(ch, cls) {
    const { key } = KQ.keyFor(ch);
    const el = this.keys[key === " " ? "Space" : key];
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 140);
  }

  // Colour keys by a { char: {attempts, errors} } map (used for the progress heatmap).
  heatmap(keyStats) {
    for (const el of Object.values(this.keys)) {
      el.classList.remove("heat-good", "heat-ok", "heat-bad", "heat-none");
      el.classList.add("heat-none");
      el.title = "";
    }
    for (const [ch, s] of Object.entries(keyStats)) {
      const { key } = KQ.keyFor(ch);
      const el = this.keys[key === " " ? "Space" : key];
      if (!el || s.attempts < 3) continue;
      const acc = Math.round(((s.attempts - s.errors) / s.attempts) * 100);
      el.classList.remove("heat-none");
      el.classList.add(acc >= 95 ? "heat-good" : acc >= 85 ? "heat-ok" : "heat-bad");
      el.title = `${acc}% (${s.attempts} tries)`;
    }
  }
};

// Back-of-hand view with a continuous silhouette and individual finger highlights.
KQ.handsSvg = function () {
  const finger = (id, d) => `<path id="finger-${id}" class="hand-finger finger-${id.endsWith("t") ? "th" : id}" d="${d}"/>`;
  const hand = (side, transform = "") => `
    <g class="hand hand-${side === "l" ? "left" : "right"}"${transform ? ` transform="${transform}"` : ""}>
      <path class="hand-palm" d="M70 248 C71 232 66 219 57 205 C47 188 43 167 40 146 L29 94 C27 85 30 78 37 76 C44 74 50 79 52 88 L64 130 C66 137 72 136 71 128 L59 56 C57 46 62 39 70 38 C78 37 84 43 85 53 L95 118 C96 125 102 125 102 117 L98 35 C98 24 103 17 112 17 C121 17 126 24 126 35 L129 117 C129 124 135 126 137 119 L146 51 C147 41 153 36 161 38 C170 40 172 48 170 58 L159 136 C158 145 161 151 166 146 L189 121 C196 114 204 115 209 121 C214 127 212 135 206 142 L186 170 C179 180 177 192 169 206 C162 220 151 230 150 248 Z"/>
      ${finger(side + "p", "M40 146 L29 94 C27 85 30 78 37 76 C44 74 50 79 52 88 L64 130 C66 137 68 140 69 143 Q57 153 40 146 Z")}
      ${finger(side + "r", "M71 128 L59 56 C57 46 62 39 70 38 C78 37 84 43 85 53 L95 118 L96 129 Q84 138 71 128 Z")}
      ${finger(side + "m", "M102 124 L98 35 C98 24 103 17 112 17 C121 17 126 24 126 35 L129 124 Q115 132 102 124 Z")}
      ${finger(side + "i", "M137 127 L146 51 C147 41 153 36 161 38 C170 40 172 48 170 58 L159 136 Q145 141 137 127 Z")}
      ${finger(side + "t", "M166 146 L189 121 C196 114 204 115 209 121 C214 127 212 135 206 142 L186 170 Q181 178 178 186 Q163 181 159 168 Q157 156 166 146 Z")}
      <g class="hand-nails">
        <path d="M33 89 Q32 81 38 80 Q44 79 47 87 L49 96 Q42 100 35 97 Z"/>
        <path d="M64 53 Q63 44 70 43 Q78 42 80 51 L81 62 Q74 66 66 63 Z"/>
        <path d="M103 33 Q103 23 112 23 Q120 23 121 33 L121 44 Q112 48 104 44 Z"/>
        <path d="M151 51 Q152 42 160 43 Q167 44 166 53 L164 64 Q156 67 149 62 Z"/>
        <path d="M191 125 Q198 118 203 123 Q209 128 202 135 L195 143 Q187 141 184 134 Z"/>
      </g>
      <g class="hand-details">
        <path d="M39 115 Q46 110 54 111 M69 90 Q77 86 85 87 M105 78 Q114 75 123 78 M145 91 Q154 90 163 95"/>
        <path d="M47 143 Q54 139 61 140 M76 129 Q84 125 91 127 M106 124 Q115 121 124 124 M141 132 Q148 129 155 134"/>
        <path d="M178 150 Q184 150 189 155 M157 157 Q150 172 154 187"/>
        <path d="M81 148 Q89 172 91 199 M112 144 Q116 172 115 206 M143 149 Q134 181 133 207"/>
        <path d="M79 231 Q109 236 142 231"/>
      </g>
    </g>`;
  const left = hand("l");
  const right = hand("r", "translate(440 0) scale(-1 1)");
  return `<svg class="hands" viewBox="0 0 440 260" aria-hidden="true">${left}${right}</svg>`;
};

KQ.highlightFinger = function (root, ch) {
  for (const el of root.querySelectorAll(".hand-finger")) el.classList.remove("active");
  if (ch == null) return;
  const { key, shift } = KQ.keyFor(ch);
  const f = KQ.FINGERS[key] || null;
  if (f === "th") {
    root.querySelector("#finger-lt")?.classList.add("active");
    root.querySelector("#finger-rt")?.classList.add("active");
  } else if (f) {
    root.querySelector(`#finger-${f}`)?.classList.add("active");
    if (shift) root.querySelector(`#finger-${f[0] === "l" ? "rp" : "lp"}`)?.classList.add("active");
  }
};

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
KQ.escapeHtml = escapeHtml;
