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