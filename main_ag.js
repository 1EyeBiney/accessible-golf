// main_ag.js - Game State, Variables, and Swing Sequence (v3.81.0)

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
let devPower = false, devHinge = false, devImpact = false;
let stateTimeouts = [];

let backswingStartTime = 0, downswingStartTime = 0, impactStartTime = 0, powerStartTime = 0;
let hingeTimeBack = 0, hingeTimeDown = 0;
let finalPower = 0, dropDurationMs = 0;
let lockedImpactTime = 0;
let windX = 0, windY = 0, windLevelIndex = 3; 
let aimAngle = 0, stanceIndex = 2, stanceAlignment = 0, isChokedDown = false;
let hole = 1, par = 4, strokes = 0;
let ballX = 0, ballY = 0, pinX = 0, pinY = 420;
let targetX = 0, targetY = 0, currentZoneIndex = -1;
let currentLie = "Tee";
let isHoleComplete = false, gameMode = 'course';
let viewingHazards = false, hazardIndex = 0;
let viewingHelp = false, helpIndex = 0;
let rangeLie = 'Fairway', confirmingRange = false;
let synthTreeActive = false;
let synthTreeX = 0;
let synthTreeDist = 0;
let synthTreeHeight = 0; // In feet
let shotStyleIndex = 0, chippingRange = 'short', confirmingGreen = false;
let caddyLevel = 3; // 1: Rookie, 2: Veteran, 3: Tour Pro
let currentClubIndex = 0;
let club = clubs[currentClubIndex]; // Pulls from data_ag.js
let lastShotReport = "No caddy report available yet.";
let holeTelemetry = [];

function loadHole(holeNumber) {
    const course = courses[currentCourseIndex];
    if (holeNumber > course.holes.length) holeNumber = 1; 
    const holeData = course.holes[holeNumber - 1];
    
    hole = holeData.number;
    par = holeData.par;
    pinX = holeData.pinX;
    pinY = holeData.pinY;
    
    ballX = 0; ballY = 0; strokes = 0; isHoleComplete = false;
    currentLie = "Tee";
    aimAngle = 0; stanceIndex = 2; stanceAlignment = 0;
    swingState = 0; // FIX: Added state reset
    holeTelemetry = [];
    window.updateTargetZone();
    viewingHazards = false;
    
    let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
    currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
    if (currentClubIndex === -1) currentClubIndex = 0;
    club = clubs[currentClubIndex];
    shotStyleIndex = 0;
    window.updateDashboard();
}

function getSightReport() {
    const currentHole = courses[currentCourseIndex].holes[hole - 1];
    if (!currentHole.trees) return "";
    
    let warnings = [];
    currentHole.trees.forEach(tree => {
        // Calculate angle to tree relative to ball position
        let targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
        let treeAngleRad = Math.atan2(tree.x - ballX, tree.y - ballY);
        let relativeAngle = Math.abs((treeAngleRad - targetAngleRad) * (180 / Math.PI) - aimAngle);
        
        // If tree is within 15 degrees of our aim line and ahead of us
        if (relativeAngle < 15 && tree.y > ballY) {
            let dist = Math.round(Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2)));
            warnings.push(`${tree.name} is in your line of sight, ${dist} yards ahead.`);
        }
    });
    return warnings.length > 0 ? " Warning: " + warnings.join(" ") : "";
}

window.updateTargetZone = function() {
    if (gameMode !== 'course') return;
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    let validTargets = [];
    if (holeData.zones) validTargets = holeData.zones.filter(z => z.y > ballY + 15);
    validTargets.push({ name: "The Pin", x: holeData.pinX, y: holeData.pinY });
    
    let currentStillValid = validTargets.find(t => t.x === targetX && t.y === targetY);
    if (!currentStillValid) {
        currentZoneIndex = 0;
        targetX = validTargets[0].x;
        targetY = validTargets[0].y;
    }
};

window.getCaddyAdvice = function() {
    if (gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long')) {
        if (!synthTreeActive) return "The practice area is clear. Fire away.";
        
        let currentStyle = shotStyles[shotStyleIndex];
        let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
        
        // v3.81.0 Parabolic Math
        let expectedCarry = club.baseDistance * currentStyle.distMod * (isChokedDown ? 0.9 : 1.0);
        let apexYards = (Math.tan(dynamicLoft * Math.PI / 180) / expectedCarry) * synthTreeDist * (expectedCarry - synthTreeDist);
        let expectedApexFeet = Math.max(0, Math.round(apexYards * 3));
        
        let latStr = synthTreeX === 0 ? 'Center' : `${Math.abs(synthTreeX)}y ${synthTreeX > 0 ? 'Right' : 'Left'}`;
        let msg = `Synth Tree is ${synthTreeDist} yards out, ${latStr}, and ${Math.round(synthTreeHeight)} feet tall. `;
        msg += `With a ${club.name} and ${stanceNames[stanceIndex]} stance, your expected apex at that distance is ${expectedApexFeet} feet. `;
        
        // Caddy Edge Finder Math
        let distToTreeCenter = Math.sqrt(Math.pow(synthTreeX, 2) + Math.pow(synthTreeDist, 2));
        let angleToCenter = Math.atan2(synthTreeX, synthTreeDist) * (180 / Math.PI);
        let angleOffset = Math.asin(10 / distToTreeCenter) * (180 / Math.PI); // 10 is the tree radius
        
        let leftEdge = Math.round(angleToCenter - angleOffset);
        let rightEdge = Math.round(angleToCenter + angleOffset);
        let leftStr = leftEdge < 0 ? `${Math.abs(leftEdge)}° Left` : `${leftEdge}° Right`;
        let rightStr = rightEdge < 0 ? `${Math.abs(rightEdge)}° Left` : `${rightEdge}° Right`;
        
        msg += `To bypass the canopy edges, aim past ${leftStr} or ${rightStr}. `;
        
        if (Math.abs(synthTreeX - (aimAngle * (synthTreeDist/60))) < 10) {
            if (expectedApexFeet < synthTreeHeight + 3) msg += "Warning: You do not have the height. Move the ball forward or shape it around.";
            else msg += "You have the height to clear it safely.";
        } else {
            msg += "Your current aim line appears to bypass the tree laterally.";
        }
        return msg;
    }
    
    if (gameMode !== 'course') return "Caddy advice is only available on the course.";
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    if (!holeData.caddyNotes) return "I don't have any notes for this hole.";

    let distToPin = Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
    let currentTrigger = 'Approach_Long'; 

    if (strokes === 0) currentTrigger = 'Tee';
    else if (distToPin <= 50) currentTrigger = 'Greenside';
    else if (currentLie === 'Sand') currentTrigger = 'Bunker_Fairway';
    else if (ballX < -20) currentTrigger = 'Trouble_Left';
    else if (ballX > 20) currentTrigger = 'Trouble_Right';
    else if (currentLie === 'Light Rough') currentTrigger = 'Rough_Deep';
    else if (currentLie === 'Fairway' && distToPin <= 120) currentTrigger = 'Approach_Scoring';
    else if (currentLie === 'Fairway' && distToPin > 120) currentTrigger = 'Approach_Long';

    let availableNotes = holeData.caddyNotes.filter(n => n.trigger === currentTrigger && n.level <= caddyLevel);
    if (availableNotes.length === 0) {
        availableNotes = holeData.caddyNotes.filter(n => (n.trigger === 'Approach' || n.trigger === 'Always') && n.level <= caddyLevel);
        if (availableNotes.length === 0) return "Just hit a good golf shot here. I don't have specific advice.";
    }

    availableNotes.sort((a, b) => b.level - a.level);
    return `[Level ${caddyLevel} Caddy]: ${availableNotes[0].text}`;
};

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

window.updateDashboard = function() {
    if (!document.getElementById('dashboard-panel')) return;
    
    // 1. Hole / Target Info
    let holeStr = gameMode === 'course' ? `Hole ${hole} (Par ${par})\n${calculateDistanceToPin()}y to Pin` :
                  gameMode === 'range' ? `Driving Range\n${pinY}y Target` : `Chipping Green\n${calculateDistanceToPin()}y Target`;
    if ((gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long')) && synthTreeActive) {
        let latStr = synthTreeX === 0 ? 'Center' : `${Math.abs(synthTreeX)}y ${synthTreeX > 0 ? 'R' : 'L'}`;
        holeStr += `\nSynth Tree: ${synthTreeDist}y out, ${latStr} (${Math.round(synthTreeHeight)}ft)`;
    }
    document.getElementById('dash-hole').innerText = holeStr;
    
    // 2. Environment Info
    let windStr = windX === 0 && windY === 0 ? "Calm" : `${Math.abs(windY)}y ${windY>0?'Tail':'Head'}\n${Math.abs(windX)}y ${windX>0?'Right':'Left'}`;
    let activeLie = gameMode === 'range' ? rangeLie : currentLie;
    document.getElementById('dash-env').innerText = `${activeLie}\n${windStr}`;
    
    // 3. Equipment Info
    let style = shotStyles[shotStyleIndex];
    let gripStr = isChokedDown ? "(Choked 90%)" : "(Full Grip)";
    document.getElementById('dash-club').innerText = `${club.name} ${gripStr}\n${style.name} Swing`;
    
    // 4. Setup Info
    let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;
    document.getElementById('dash-setup').innerText = `Aim: ${aimStr}\n${stanceNames[stanceIndex]}`;
};

window.initGame = function() {
    window.initAudio();
    generateWind();
    loadHole(1);
    document.getElementById('initBtn').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('hud-top').style.display = 'block';
    document.getElementById('dashboard-panel').style.display = 'grid';
    window.updateDashboard();
    document.getElementById('swing-meter').style.display = 'block';
    requestAnimationFrame(window.drawMeter);
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

window.drawMeter = function() {
    requestAnimationFrame(window.drawMeter);
    const canvas = document.getElementById('swing-meter');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

    if (swingState === 0 || isHoleComplete) {
        ctx.fillStyle = '#4CAF50';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("READY - Hold Down Arrow to Swing", w/2, h/2 + 8);
        return;
    }

    const now = performance.now();

    const drawHinges = () => {
        if (hingeTimeBack > 0) {
            let x = (hingeTimeBack / 2000) * w;
            ctx.fillStyle = '#ffeb3b'; 
            ctx.beginPath(); ctx.moveTo(x - 12, 0); ctx.lineTo(x + 12, 0); ctx.lineTo(x, 25); ctx.fill();
        }
        if (hingeTimeDown > 0) {
            let x = (hingeTimeDown / 2000) * w;
            ctx.fillStyle = '#ff9800'; 
            ctx.beginPath(); ctx.moveTo(x - 12, h); ctx.lineTo(x + 12, h); ctx.lineTo(x, h - 25); ctx.fill();
        }
    };

    if (swingState === 1 || swingState === 3) {
        let isBack = swingState === 1;
        let start = isBack ? backswingStartTime : downswingStartTime;
        let elapsed = now - start;
        let progress = Math.min(1, Math.max(0, elapsed / 2000));
        
        // Fill the bar
        ctx.fillStyle = isBack ? '#2e7d32' : '#0277bd';
        ctx.fillRect(0, 0, w * progress, h);
        
        // Draw Audio Metronome Hash Marks
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for(let i=1; i<=4; i++) {
            ctx.fillRect((w * (i * 0.25)) - 2, 0, 4, h);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(isBack ? "BACKSWING (Tap Space for Hinge)" : "DOWNSWING (Tap Space for Hinge)", 15, 30);
        
        drawHinges();
    }
    else if (swingState === 2) {
        let elapsed = now - powerStartTime;
        let pwr = 25 + ((elapsed / 2000) * 75);
        let progress = Math.min(1, Math.max(0, pwr / 120));
        
        ctx.fillStyle = pwr > 100 ? '#c62828' : '#6a1b9a';
        ctx.fillRect(0, 0, w * progress, h);
        
        let mark100 = (100 / 120) * w;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(mark100 - 3, 0, 6, h);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`POWER PHASE: ${Math.round(pwr)}% (Release to Lock)`, 15, 30);
    }
    else if (swingState === 4 || swingState === 5) {
        let targetX = w * 0.8; 
        let currentElapsed = swingState === 4 ? now - impactStartTime : lockedImpactTime;
        
        // Sweet Spot (Green Zone)
        let sweetSpotWidth = (60 / dropDurationMs) * targetX * 2;
        ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
        ctx.fillRect(targetX - (sweetSpotWidth/2), 0, sweetSpotWidth, h);
        
        // White Target Line
        ctx.fillStyle = 'white';
        ctx.fillRect(targetX - 2, 0, 4, h);
        
        // Moving Cursor
        let cursorX = (currentElapsed / dropDurationMs) * targetX;
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(cursorX - 4, 0, 8, h);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        if (swingState === 4) {
            ctx.fillText("IMPACT ZONE (Press Down Arrow at the White Line)", 15, 30);
        } else {
            let diff = Math.round(currentElapsed - dropDurationMs);
            ctx.fillText(`IMPACT LOCKED: ${Math.abs(diff)}ms ${diff < 0 ? 'Early' : diff > 0 ? 'Late' : 'Perfect'}`, 15, 30);
        }
    }
};

