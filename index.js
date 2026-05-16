const countSlider = document.getElementById('sound-count');
const countOut      = document.getElementById('sound-out');
const minSlider   = document.getElementById('min-delay');
const maxSlider   = document.getElementById('max-delay');
const minOut      = document.getElementById('min-out');
const maxOut      = document.getElementById('max-out');
const startBtn    = document.getElementById('start-btn');
const stopBtn     = document.getElementById('stop-btn');
const statusEl    = document.getElementById('status');
const cardsEl     = document.getElementById('cards');
var cardEls = [];

function updateCount(num_cards) {
    // Build sound cards
    cardsEl.replaceChildren();
    for (let i = 0; i < num_cards; i++) {
        let s = SOUNDS[i];
        const d = document.createElement('div');
        d.className = 'card';
        d.id = 'card-' + i;
        d.innerHTML = `<p class="card-name">${s.name}</p>`;
        cardsEl.appendChild(d);
  	}
    cardEls = SOUNDS.map((_, i) => document.getElementById('card-' + i)).filter(ce => ce !== null);
}

updateCount(4);

let running   = false;
let timeoutId = null;
let audioCtx  = null;
const buffers = new Array(SOUNDS.length).fill(null);

// --- Audio loading ---
async function loadBuffers() {
    const promises = SOUNDS.map(async (s, i) => {
        try {
            const res  = await fetch(s.src);
            const ab   = await res.arrayBuffer();
            buffers[i] = await audioCtx.decodeAudioData(ab);
        } catch (e) {
            console.warn(`Could not load sound ${i + 1}:`, e);
        }
    });
    await Promise.all(promises);
}

// --- Playback ---
function playSound(idx) {
    const buf = buffers[idx];
    if (!buf) { console.warn('No buffer for sound', idx); return; }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start();
}

function pickAndScheduleNext() {
    if (!running) return;

    const idx = Math.floor(Math.random() * cardEls.length);
    playSound(idx);

    // Flash the card
    cardEls.forEach((c, i) => c.classList.toggle('active', i === idx));

    const minMs  = parseInt(minSlider.value) * 1000;
    const maxMs  = parseInt(maxSlider.value) * 1000;
    const delay  = minMs + Math.random() * (maxMs - minMs);
    const delaySec = (delay / 1000).toFixed(1);

    statusEl.textContent = `Playing "${SOUNDS[idx].name}". Next in ${delaySec}s…`;

    timeoutId = setTimeout(() => {
        cardEls.forEach(c => c.classList.remove('active'));
        pickAndScheduleNext();
    }, delay);
}

// --- Controls ---
async function handleStart() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    // Resume in case browser suspended it
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    startBtn.disabled = true;
    statusEl.textContent = 'Loading audio…';
    await loadBuffers();

    running = true;
    stopBtn.disabled = false;
    pickAndScheduleNext();
}

function handleStop() {
    running = false;
    clearTimeout(timeoutId);
    cardEls.forEach(c => c.classList.remove('active'));
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    statusEl.textContent = "That's numberwang!";
}

// --- Slider sync (keep min ≤ max) ---
countSlider.addEventListener('input', () => {
    countOut.textContent = countSlider.value;
    updateCount(countSlider.value);
});

minSlider.addEventListener('input', () => {
    minOut.textContent = minSlider.value;
    if (+minSlider.value > +maxSlider.value) {
        maxSlider.value    = minSlider.value;
        maxOut.textContent = minSlider.value;
    }
});

maxSlider.addEventListener('input', () => {
    maxOut.textContent = maxSlider.value;
    if (+maxSlider.value < +minSlider.value) {
        minSlider.value    = maxSlider.value;
        minOut.textContent = maxSlider.value;
    }
});

// Initialise sliders to defaults defined above
countSlider.value  = DEFAULT_SOUND_COUNT;
minSlider.value    = DEFAULT_MIN_DELAY;
maxSlider.value    = DEFAULT_MAX_DELAY;
minOut.textContent = DEFAULT_MIN_DELAY;
maxOut.textContent = DEFAULT_MAX_DELAY;