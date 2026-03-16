// audio_ag.js - Audio Engine and Screen Reader Announcer

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
    if (audioCtx.state === 'suspended') audioCtx.resume();
};

function playTone(freq, type, dur, vol) {
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