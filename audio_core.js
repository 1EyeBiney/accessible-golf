// audio_core.js - Audio Engine, Announcer, and Environmental Audio (v5.30.0)

let audioCtx = null;
let powerOscillator, powerGain;
const AUDIO_GAIN_BOOST = 1.45;
const CONTINUOUS_GAIN_BOOST = 1.4;

// --- MARQUEE ANNOUNCER (v5.23.0) ---

window.announce = function(msg) {
    const ariaBox = document.getElementById('aria-announce');
    if (ariaBox) ariaBox.innerText = msg;
    
    // Push the same text to the visual marquee
    const marquee = document.getElementById('marquee-text');
    if (marquee) {
        marquee.innerText = msg;
        // Reset the CSS animation to force it to restart from the right side
        marquee.style.animation = 'none';
        void marquee.offsetWidth; // Trigger reflow
        marquee.style.animation = 'scrollMarquee 12s linear infinite';
    }
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
    if (percent === 100) {
        if (typeof playTone === 'function') {
            playTone(1200, 'square', 0.05, 0.4);
            setTimeout(() => playTone(1200, 'square', 0.05, 0.4), 80);
        }
    }
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

// --- ENVIRONMENTAL AUDIO (v5.23.0) ---

window.playEnvironment = function(musicSrc, ambientSrc) {
    if (currentBgMusic) { currentBgMusic.pause(); currentBgMusic.src = ''; }
    if (currentBgAmbient) { currentBgAmbient.pause(); currentBgAmbient.src = ''; }

    if (musicSrc) {
        currentBgMusic = new Audio(musicSrc);
        currentBgMusic.loop = true;
        currentBgMusic.volume = 0.3;
        currentBgMusic.play().catch(e => console.warn("Music play prevented:", e));
    }
    if (ambientSrc) {
        currentBgAmbient = new Audio(ambientSrc);
        currentBgAmbient.loop = true;
        currentBgAmbient.volume = 1.0;
        currentBgAmbient.play().catch(e => console.warn("Ambient play prevented:", e));
    }
};

// --- SPATIAL AUDIO (v4.6.0) ---

// v4.6.0 Spatial Audio Metronome
window.playRollingBlip = function(speed, panValue) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    // A low, thudding frequency that rises slightly with speed
    osc.frequency.value = 120 + (speed * 15);
    osc.type = 'sine';

    // Cap the pan hard at -1 (Left) and 1 (Right)
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    // Short percussive pop (v4.8.0 Volume Boost)
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.8 * boost, audioCtx.currentTime); // Increased from 0.3
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
};

// --- 3D FLIGHT AUDIO ENGINE INTEGRATION ---

window.playFlightBlip = function(pitch, panValue, speedModifier, waveType = 'triangle') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = pitch;
    osc.type = waveType; 

    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3 * boost, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
};

window.playPannedThud = function(panValue, waveType = 'square', baseFreq = 100) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = baseFreq;
    osc.type = waveType;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.6 * boost, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
};

window.playPannedTone = function(freq, type, duration, vol, panValue) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = freq;
    osc.type = type;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    let finalVol = Math.min(2.0, vol * 2.5 * boost); // Match engine scaling
    gain.gain.setValueAtTime(finalVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
};

window.playPannedNoise = function(duration, vol, isBrown, panValue) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate raw white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; 
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // v4.31.6 Native Biquad Filter to remove harsh clipping
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    // Muffle heavily for grass roll (Brown), keep it airy for flight wind
    filter.frequency.value = isBrown ? 350 : 1200; 

    const panner = audioCtx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    const gain = audioCtx.createGain();
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    // Lower the overall noise multiplier so it acts as a bed, not a spike
    let finalVol = Math.min(1.0, vol * boost); 
    
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(finalVol, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(finalVol, audioCtx.currentTime + Math.max(0.1, duration - 0.3));
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    // Chain: Noise -> Filter -> Panner -> Gain -> Speakers
    noise.connect(filter);
    filter.connect(panner); 
    panner.connect(gain); 
    gain.connect(audioCtx.destination);
    
    noise.start();
};

window.playPannedGreenRoll = function(rollTimeSecs, panValue) {
    if (!audioCtx || rollTimeSecs <= 0) return;
    let startTime = performance.now();
    let durationMs = rollTimeSecs * 1000;
    
    function rollLoop() {
        let elapsed = performance.now() - startTime;
        if (elapsed >= durationMs) return;

        let progress = elapsed / durationMs;
        // Simulate speed dropping from 5.0 (fast) down to 0.5 (slow)
        let simulatedSpeed = 5.0 * (1 - progress) + 0.5;
        
        if (typeof window.playRollingBlip === 'function') {
            window.playRollingBlip(simulatedSpeed, panValue);
        }

        // Delay scales inversely with speed (matches the putting engine)
        let delayMs = Math.max(100, 800 / Math.max(0.5, simulatedSpeed));
        
        if (typeof stateTimeouts !== 'undefined') {
            stateTimeouts.push(setTimeout(rollLoop, delayMs));
        } else {
            setTimeout(rollLoop, delayMs);
        }
    }
    rollLoop();
};

window.trigger3DFlight = function(hangTimeSecs, dynamicLoft, startPan, endPan, ballType) {
    let startTime = performance.now();
    let basePitch = 150;
    // Map loft directly to the apex frequency (e.g., 10 deg = ~400Hz, 50 deg = ~1150Hz)
    let maxPitch = 200 + (dynamicLoft * 19); 
    
    function flightLoop() {
        let elapsed = performance.now() - startTime;
        let progress = Math.min(1.0, elapsed / (hangTimeSecs * 1000));

        if (progress >= 1.0) {
            window.playPannedThud(endPan, ballType.landWave, ballType.landFreq);
            return;
        }

        let speedDelay = 30 + (Math.sin(progress * Math.PI) * 90); 
        if (progress > 0.8) speedDelay -= 20; 

        let heightPct = 1 - Math.pow((progress - 0.5) * 2, 2);
        let currentPitch = basePitch + (heightPct * (maxPitch - basePitch));
        
        let currentPan = startPan + (progress * (endPan - startPan));

        window.playFlightBlip(currentPitch, currentPan, speedDelay, ballType.flightWave);
        setTimeout(flightLoop, speedDelay);
    }
    flightLoop();
};
