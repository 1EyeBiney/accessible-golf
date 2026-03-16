// main_ag.js - Game State, Variables, and Swing Sequence

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
let devPower = false, devHinge = false, devImpact = false;
let stateTimeouts = [];

let backswingStartTime = 0, downswingStartTime = 0, impactStartTime = 0, powerStartTime = 0;
let hingeTimeBack = 0, hingeTimeDown = 0;
let finalPower = 0, dropDurationMs = 0;
let windX = 0, windY = 0, windLevelIndex = 3; 
let aimAngle = 0, stanceIndex = 2, stanceAlignment = 0;
let hole = 1, par = 4, strokes = 0;
let ballX = 0, ballY = 0, pinX = 0, pinY = 420;
let isHoleComplete = false, gameMode = 'course';
let rangeLie = 'Fairway', confirmingRange = false;
let shotStyleIndex = 0, chippingRange = 'short', confirmingGreen = false;
let currentClubIndex = 0;
let club = clubs[currentClubIndex]; // Pulls from data_ag.js
let lastShotReport = "No caddy report available yet.";

function loadHole(holeNumber) {
    const course = courses[currentCourseIndex];
    if (holeNumber > course.holes.length) holeNumber = 1; 
    const holeData = course.holes[holeNumber - 1];
    
    hole = holeData.number;
    par = holeData.par;
    pinX = holeData.pinX;
    pinY = holeData.pinY;
    
    ballX = 0; ballY = 0; strokes = 0; isHoleComplete = false;
    aimAngle = 0; stanceIndex = 2; stanceAlignment = 0;
    swingState = 0; // FIX: Added state reset
    
    let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
    currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
    if (currentClubIndex === -1) currentClubIndex = 0;
    club = clubs[currentClubIndex];
    shotStyleIndex = 0;
}

window.initGame = function() {
    window.initAudio();
    generateWind();
    loadHole(1);
    document.getElementById('initBtn').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('game-container').focus();
    const setupReport = getSetupReport();
    let targetDist = calculateDistanceToPin();
    window.announce(`Hole ${hole}. Par ${par}. ${targetDist} yards. Ready. ${setupReport} Use Page Up or Down to change clubs.`);
    document.getElementById('visual-output').innerText = `Hole ${hole}. Par ${par}. ${targetDist} yards. Ready. ${setupReport}`;
};

function startBackswing() {
    if (swingState !== 0) return;
    window.initAudio();
    swingState = 1; hingeTimeBack = 0; hingeTimeDown = 0;
    backswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = `Backswing...`;
    for (let i = 1; i <= 4; i++) { stateTimeouts.push(setTimeout(() => playTone(600, 'triangle', 0.15, 0.25), i * 500)); }
    stateTimeouts.push(setTimeout(startPowerPhase, 2000));
}

function startPowerPhase() {
    swingState = 2; powerStartTime = performance.now();
    triggerMilestone(25);
    powerOscillator = audioCtx.createOscillator();
    powerGain = audioCtx.createGain();
    powerOscillator.type = 'sine';
    powerOscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    powerOscillator.frequency.linearRampToValueAtTime(1050, audioCtx.currentTime + 2.5);
    powerGain.gain.setValueAtTime(Math.min(1, 0.4 * CONTINUOUS_GAIN_BOOST), audioCtx.currentTime);
    powerOscillator.connect(powerGain); powerGain.connect(audioCtx.destination);
    powerOscillator.start();

    stateTimeouts.push(setTimeout(() => triggerMilestone(50), 666));
    stateTimeouts.push(setTimeout(() => triggerMilestone(75), 1333));
    stateTimeouts.push(setTimeout(() => triggerMilestone(100), 2000));
    stateTimeouts.push(setTimeout(() => { if (swingState === 2) { triggerMilestone(120); startDownswing(); } }, 2533));
}

function startDownswing() {
    if (swingState !== 2) { swingState = 0; return; }
    swingState = 3; stateTimeouts.forEach(clearTimeout);
    let elapsed = performance.now() - powerStartTime;
    finalPower = Math.min(120, Math.round(25 + ((elapsed / 2000) * 75)));
    if (powerOscillator) { powerOscillator.stop(); }
    downswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = `Downswing...`;
    for (let i = 1; i <= 4; i++) { stateTimeouts.push(setTimeout(() => playTone(600, 'triangle', 0.15, 0.25), i * 500)); }
    stateTimeouts.push(setTimeout(startImpactPhase, 2000));
}

function startImpactPhase() {
    swingState = 4; impactStartTime = performance.now();
    dropDurationMs = finalPower * 15;
    if (finalPower >= 100) triggerMilestone(100);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100 + (finalPower * 8), audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + (dropDurationMs / 1000));
    gain.gain.setValueAtTime(Math.min(1, 0.4 * CONTINUOUS_GAIN_BOOST), audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (dropDurationMs / 1000));
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + (dropDurationMs / 1000) + 0.1);

    [75, 50, 25].forEach(m => { if (finalPower > m) stateTimeouts.push(setTimeout(() => triggerMilestone(m), (finalPower - m) * 15)); });
    stateTimeouts.push(setTimeout(() => { if (swingState === 4) calculateShot(true); }, dropDurationMs + 400));
}