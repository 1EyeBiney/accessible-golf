// audio_ag.js - Audio Engine and Screen Reader Announcer (v4.71.0)

let audioCtx = null;
let powerOscillator, powerGain;
const AUDIO_GAIN_BOOST = 1.45;
const CONTINUOUS_GAIN_BOOST = 1.4;

window.announce = function(msg) {
    const el = document.getElementById('aria-announce');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
};

window.initAudio = function() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window.__agAudioCtx = audioCtx;
    if (audioCtx.state === 'suspended') audioCtx.resume();
};

window.stopAllAudio = function() {
    if (!audioCtx) return;
    try {
        audioCtx.close();
    } catch (_err) {
        // Ignore close errors from browsers with strict lifecycle timing.
    }
    audioCtx = null;
    window.__agAudioCtx = null;
};

function playTone(freq, type, dur, vol) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol, isRoll = false) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (isRoll ? 0.5 : 1.0);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = isRoll ? 'lowpass' : 'bandpass';
    filter.frequency.value = isRoll ? 400 : 1000;

    const gain = audioCtx.createGain();
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);
    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
}

function playSweep(f1, f2, f3, dur, vol = 0.12, type = 'sawtooth') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);
    osc.type = type;
    osc.frequency.setValueAtTime(f1, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(f2, audioCtx.currentTime + (dur / 2));
    osc.frequency.linearRampToValueAtTime(f3, audioCtx.currentTime + dur);
    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

window.playPanTone = function(freq, type, dur, vol, pan = 0) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);
    osc.type = type;
    osc.frequency.value = freq;
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(panner);
    panner.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
};

window.playEcho = function(type, f1, f2, dur, vol, delaySeconds = 0.12, feedbackGain = 0.35) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const delay = audioCtx.createDelay();
    const feedback = audioCtx.createGain();
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);

    osc.type = type;
    osc.frequency.setValueAtTime(f1, audioCtx.currentTime);
    if (f2 && f2 !== f1) {
        try {
            osc.frequency.exponentialRampToValueAtTime(f2, audioCtx.currentTime + dur);
        } catch (_err) {
            osc.frequency.setValueAtTime(f2, audioCtx.currentTime + dur);
        }
    }

    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    delay.delayTime.value = Math.max(0.02, delaySeconds);
    feedback.gain.value = Math.max(0.0, Math.min(0.8, feedbackGain));

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
};

window.playSequence = function(types, freqs, dur, vol) {
    if (!Array.isArray(freqs) || freqs.length === 0) return;
    for (let i = 0; i < freqs.length; i++) {
        setTimeout(() => {
            playTone(freqs[i], (types && types[i]) || 'sine', dur, vol);
        }, i * dur * 1000);
    }
};

window.playChord = function(freqs, dur, vol, type = 'sine') {
    if (!Array.isArray(freqs) || freqs.length === 0) return;
    const perVoiceVol = vol / freqs.length;
    for (let i = 0; i < freqs.length; i++) {
        playTone(freqs[i], type, dur, perVoiceVol);
    }
};

function triggerMilestone(percent) {
    if (percent === 25) playTone(220, 'square', 0.3, 0.2);
    if (percent === 50) playTone(440, 'triangle', 0.2, 0.4);
    if (percent === 75) { playTone(660, 'triangle', 0.1, 0.4); setTimeout(() => playTone(660, 'triangle', 0.1, 0.4), 120); }
    if (percent === 100) playTone(1200, 'sine', 0.8, 0.6);
    if (percent === 120) playTone(150, 'sawtooth', 0.4, 0.7);
}

window.playSplash = function(vol) {
    if (!audioCtx) return;
    const boostedVol = Math.min(1, vol * AUDIO_GAIN_BOOST);
    
    // White noise splash
    const bufferSize = audioCtx.sampleRate * 0.4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 800;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(audioCtx.destination);
    noise.start();

    // Droplet / Bloop 1 (Extended to 0.33s)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.frequency.setValueAtTime(450, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.33);
    gain1.gain.setValueAtTime(boostedVol * 0.8, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.33);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    osc1.start(); osc1.stop(audioCtx.currentTime + 0.33);

    // Droplet / Bloop 2 (Starts at 0.33s, Ends at 0.66s)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.frequency.setValueAtTime(600, audioCtx.currentTime + 0.33);
    osc2.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.66);
    gain2.gain.setValueAtTime(boostedVol * 0.6, audioCtx.currentTime + 0.33);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.66);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.33); osc2.stop(audioCtx.currentTime + 0.66);

    // Droplet / Bloop 3 (Repeated Bloop 2 - Starts at 0.66s, Ends at 0.99s)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.frequency.setValueAtTime(600, audioCtx.currentTime + 0.66);
    osc3.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.99);
    gain3.gain.setValueAtTime(boostedVol * 0.4, audioCtx.currentTime + 0.66);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.99);
    osc3.connect(gain3); gain3.connect(audioCtx.destination);
    osc3.start(audioCtx.currentTime + 0.66); osc3.stop(audioCtx.currentTime + 0.99);
};

// Expose core generators for game modules and external sound bank definitions.
window.playTone = playTone;
window.playNoise = playNoise;
window.playSweep = playSweep;

// --- AI CHARACTER AUDIO SIGNATURES ---

window._createAudioSegment = function(startTime, duration, waveType, freqs, lfos, filters) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freqs[0].f, startTime);
    for (let i = 1; i < freqs.length; i++) osc.frequency.exponentialRampToValueAtTime(freqs[i].f, startTime + (freqs[i].t * duration));

    const bufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filters[0].f, startTime);
    for (let i = 1; i < filters.length; i++) filter.frequency.linearRampToValueAtTime(filters[i].f, startTime + (filters[i].t * duration));
    noise.connect(filter);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(lfos[0].f, startTime);
    for (let i = 1; i < lfos.length; i++) lfo.frequency.linearRampToValueAtTime(lfos[i].f, startTime + (lfos[i].t * duration));

    const rumbleGain = audioCtx.createGain();
    rumbleGain.gain.value = 0.6;
    lfo.connect(rumbleGain.gain);

    const masterGain = audioCtx.createGain();
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    const vol = 0.8 * boost;
    masterGain.gain.setValueAtTime(0.001, startTime);
    masterGain.gain.exponentialRampToValueAtTime(vol, startTime + (duration * 0.1));
    masterGain.gain.setValueAtTime(vol, startTime + (duration * 0.7));
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(rumbleGain); filter.connect(rumbleGain); rumbleGain.connect(masterGain); masterGain.connect(audioCtx.destination);
    lfo.start(startTime); lfo.stop(startTime + duration);
    osc.start(startTime); osc.stop(startTime + duration);
    noise.start(startTime); noise.stop(startTime + duration);
};

window.playBotWoodsSignature = function(type = 1) {
    window.initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    const t0 = audioCtx.currentTime;
    let barkDur = type === 3 ? 0.3 : 0.4;
    let barkGap = type === 3 ? 0.05 : 0.1;
    let snarlDur = 0.9;
    let t1 = t0 + barkDur + barkGap; 
    let t2 = t1 + barkDur + barkGap; 
    let waveType = type === 5 ? 'square' : 'sawtooth';

    window._createAudioSegment(t0, barkDur, waveType, [{t: 0, f: 150}, {t: 1, f: 60}], [{t: 0, f: 25}, {t: 1, f: 15}], [{t: 0, f: 600}, {t: 1, f: 200}]);
    window._createAudioSegment(t1, barkDur, waveType, [{t: 0, f: 160}, {t: 1, f: 65}], [{t: 0, f: 25}, {t: 1, f: 15}], [{t: 0, f: 600}, {t: 1, f: 200}]);

    let snarlFreqs;
    switch(type) {
        case 1: snarlFreqs = [{t: 0, f: 280}, {t: 1, f: 40}]; break; 
        case 2: snarlFreqs = [{t: 0, f: 120}, {t: 0.2, f: 300}, {t: 1, f: 40}]; break; 
        case 3: snarlFreqs = [{t: 0, f: 150}, {t: 0.15, f: 350}, {t: 1, f: 40}]; break; 
        case 4: snarlFreqs = [{t: 0, f: 100}, {t: 0.4, f: 250}, {t: 1, f: 30}]; break; 
        case 5: snarlFreqs = [{t: 0, f: 120}, {t: 0.2, f: 300}, {t: 1, f: 40}]; break; 
        default: snarlFreqs = [{t: 0, f: 280}, {t: 1, f: 40}];
    }
    window._createAudioSegment(t2, snarlDur, waveType, snarlFreqs, [{t: 0, f: 30}, {t: 1, f: 12}], [{t: 0, f: 800}, {t: 1, f: 150}]);
};