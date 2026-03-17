// main_ag.js - Game State, Variables, and Swing Sequence (v3.32.0)

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
let viewingHazards = false, hazardIndex = 0;
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
    viewingHazards = false;
    
    let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
    currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
    if (currentClubIndex === -1) currentClubIndex = 0;
    club = clubs[currentClubIndex];
    shotStyleIndex = 0;
}

function getSightReport() {
    const currentHole = courses[currentCourseIndex].holes[hole - 1];
    if (!currentHole.trees) return "";
    
    let warnings = [];
    currentHole.trees.forEach(tree => {
        // Calculate angle to tree relative to ball position
        let angleToTree = Math.atan2(tree.x - ballX, tree.y - ballY) * (180 / Math.PI);
        let relativeAngle = Math.abs(angleToTree - aimAngle);
        
        // If tree is within 15 degrees of our aim line and ahead of us
        if (relativeAngle < 15 && tree.y > ballY) {
            let dist = Math.round(Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2)));
            warnings.push(`${tree.name} is in your line of sight, ${dist} yards ahead.`);
        }
    });
    return warnings.length > 0 ? " Warning: " + warnings.join(" ") : "";
}

window.initGame = function() {
    window.initAudio();
    generateWind();
    loadHole(1);
    document.getElementById('initBtn').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('game-container').focus();
    let setupReport = getSetupReport();
    if (gameMode === 'course') setupReport += getSightReport();
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

window.announceHazard = function(h) {
    if (!h) return;
    let msg = "";

    // Calculate the exact ray direction based on current aim
    const targetAngleRad = Math.atan2(pinX - ballX, pinY - ballY);
    const userAimRad = aimAngle * (Math.PI / 180);
    const finalRad = targetAngleRad + userAimRad;
    const dirX = Math.sin(finalRad);
    const dirY = Math.cos(finalRad);

    if (h.radius) {
        // Tree logic (Static for now)
        const side = h.x < 0 ? "Left" : h.x > 0 ? "Right" : "Center";
        msg = `${h.name}. Located at ${h.y} yards, ${Math.abs(h.x)} yards ${side}. Radius is ${h.radius} yards.`;
    } else {
        // Rectangular Hazard Math (AABB Raycasting)
        let minX = h.offset - (h.width / 2);
        let maxX = h.offset + (h.width / 2);
        let minY = h.distance;
        let maxY = h.distance + h.depth;

        let tmin = -Infinity, tmax = Infinity;

        // X-Axis bounds
        if (Math.abs(dirX) > 0.00001) {
            let tx1 = (minX - ballX) / dirX;
            let tx2 = (maxX - ballX) / dirX;
            tmin = Math.max(tmin, Math.min(tx1, tx2));
            tmax = Math.min(tmax, Math.max(tx1, tx2));
        } else if (ballX < minX || ballX > maxX) {
            tmin = Infinity; tmax = -Infinity;
        }

        // Y-Axis bounds
        if (Math.abs(dirY) > 0.00001) {
            let ty1 = (minY - ballY) / dirY;
            let ty2 = (maxY - ballY) / dirY;
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
        } else if (ballY < minY || ballY > maxY) {
            tmin = Infinity; tmax = -Infinity;
        }

        let tacticalMsg = "";
        if (tmax >= tmin && tmax > 0) {
            let reachDist = Math.max(0, Math.round(tmin));
            let clearDist = Math.round(tmax);
            if (reachDist === 0) {
                tacticalMsg = ` You are currently inside it. It will take ${clearDist} yards to clear it on this line.`;
            } else {
                tacticalMsg = ` On your current aim line, it is ${reachDist} yards to reach it, and ${clearDist} yards to clear it.`;
            }
        } else {
            tacticalMsg = ` It is not in your current flight path.`;
        }

        msg = `${h.type}. Starts at ${h.distance} yards. Located on the ${h.side || 'Center'}. ${h.width} yards wide and ${h.depth} yards deep.${tacticalMsg}`;
    }
    
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
};