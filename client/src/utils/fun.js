// Fun utilities: Web Audio synthesizer, zero-dependency confetti, and achievement tracker

// --- 1. Synthesized Audio Engine (Zero External Audio Files) ---
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundManager = {
  isEnabled: () => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('farmledger_sound');
    return saved === null ? true : saved === 'true';
  },

  toggle: () => {
    const current = soundManager.isEnabled();
    localStorage.setItem('farmledger_sound', (!current).toString());
    if (!current) soundManager.playPop();
    return !current;
  },

  playPop: () => {
    if (!soundManager.isEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio autoplay policy fallback
    }
  },

  playSuccess: () => {
    if (!soundManager.isEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {}
  },

  playShield: () => {
    if (!soundManager.isEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Metallic clang deflection sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1240, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } catch {}
  },

  playFanfare: () => {
    if (!soundManager.isEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [
        { f: 523.25, t: 0.0, d: 0.12 },
        { f: 523.25, t: 0.12, d: 0.12 },
        { f: 523.25, t: 0.24, d: 0.12 },
        { f: 659.25, t: 0.36, d: 0.28 },
        { f: 783.99, t: 0.64, d: 0.2 },
        { f: 1046.5, t: 0.84, d: 0.45 }
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + t;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + d);
      });
    } catch {}
  }
};

// --- 2. Lightweight Zero-Dependency Confetti System ---
export function triggerConfetti(options = {}) {
  if (typeof window === 'undefined') return;

  const count = options.count || 80;
  const originX = options.x !== undefined ? options.x : window.innerWidth / 2;
  const originY = options.y !== undefined ? options.y : window.innerHeight / 3;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const colors = [
    '#059669', '#10b981', '#34d399', '#6ee7b7', // Emeralds & Greens
    '#3b82f6', '#60a5fa', '#93c5fd',             // Blues
    '#f59e0b', '#fbbf24', '#fcd34d',             // Ambers & Golds
    '#ec4899', '#f43f5e', '#a855f7'              // Pinks & Purples
  ];

  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 5 + Math.random() * 8;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 3,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      gravity: 0.18 + Math.random() * 0.1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function render() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.vRotation;
      p.alpha = Math.max(0, 1 - elapsed / 1800);

      if (p.alpha > 0.01) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    if (activeParticles > 0 && elapsed < 2000) {
      animationFrame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrame);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  }

  render();
}

// --- 3. Gamification & Achievements Tracker ---
export const ACHIEVEMENTS = [
  {
    id: 'trigger_master',
    title: 'Trigger Sentinel',
    icon: '🛡️',
    description: 'Simulated a DBMS trigger preventing invalid state in real-time.'
  },
  {
    id: 'sql_wizard',
    title: 'SQL Warlock',
    icon: '⚡',
    description: 'Executed an analytical CTE query in the SQL Playground.'
  },
  {
    id: 'viva_scholar',
    title: 'Viva Scholar',
    icon: '🎓',
    description: 'Scored 80% or higher in the DBMS Viva Examination Quiz.'
  },
  {
    id: 'schema_explorer',
    title: 'Schema Architect',
    icon: '🏛️',
    description: 'Inspected table structures and foreign keys in the interactive ER Diagram.'
  },
  {
    id: 'green_thumb',
    title: 'Master Farmer',
    icon: '🌱',
    description: 'Logged an agricultural inventory transaction or crop cycle.'
  }
];

export const achievementsManager = {
  getUnlocked: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('farmledger_achievements');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  unlock: (id) => {
    if (typeof window === 'undefined') return null;
    const current = achievementsManager.getUnlocked();
    if (current.includes(id)) return null;

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return null;

    const updated = [...current, id];
    localStorage.setItem('farmledger_achievements', JSON.stringify(updated));

    // Celebratory FX
    soundManager.playFanfare();
    triggerConfetti({ count: 90 });

    // Show achievement notification dispatch
    window.dispatchEvent(
      new CustomEvent('farmledger_achievement_unlocked', { detail: ach })
    );

    return ach;
  }
};

// --- 4. Fun Farm & DBMS Trivia Generator ---
export const FARM_DBMS_TRIVIA = [
  "💡 Did you know? Edgar F. Codd invented the Relational Model in 1970, while agriculture dates back over 12,000 years to the Fertile Crescent!",
  "🌱 Fun Fact: Nitrogen (in Urea) gives crops leafy green vigor, just like PRIMARY KEYs give your tables unique integrity!",
  "⚡ Pro Tip: A B-Tree index on (crop_cycle_id, transaction_date) accelerates inventory lookups by turning full table scans into O(log N) seeks.",
  "🛡️ Fun Fact: FarmLedger's triggers operate BEFORE INSERT, stopping invalid data before disk write - just like pest traps stop infestations early!",
  "🌾 Did you know? Crop rotation between Legumes (Chickpea/Soybean) and Cereals (Wheat/Maize) naturally fixes nitrogen into the soil without synthetic inputs!",
  "📊 Pro Tip: SQLite can process over 100,000 prepared statement SELECTs per second in-memory. Fast enough for 1,000 farm plots!"
];
