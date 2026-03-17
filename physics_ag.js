// physics_ag.js - Math, Wind, and Shot Calculation (v3.37.0)

function calculateDistanceToPin() {
    return Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
}

function calculateDistanceToTarget() {
    return Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
}

function generateWind() {
    const level = windLevels[windLevelIndex];
    let magX = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    let magY = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    windX = Math.random() < 0.5 ? magX : -magX;
    windY = Math.random() < 0.5 ? magY : -magY;
}

function driftWind() {
    const level = windLevels[windLevelIndex];
    let driftX = Math.floor(Math.random() * (level.variance * 2 + 1)) - level.variance;
    let driftY = Math.floor(Math.random() * (level.variance * 2 + 1)) - level.variance;
    windX += driftX; windY += driftY;
    if (windX > level.max) windX = level.max;
    if (windX < -level.max) windX = -level.max;
    if (windY > level.max) windY = level.max;
    if (windY < -level.max) windY = -level.max;
}

function getWindReport() {
    if (windX === 0 && windY === 0) return 'Wind is calm.';
    const verticalWind = windY === 0 ? 'Calm' : `${Math.abs(windY)} mph ${windY > 0 ? 'Tailwind' : 'Headwind'}`;
    const horizontalWind = windX === 0 ? '0 mph Center' : `${Math.abs(windX)} mph ${windX > 0 ? 'Right' : 'Left'}`;
    return `Wind is ${verticalWind}, pushing ${horizontalWind}.`;
}

function getAimReport() {
    if (aimAngle === 0) return 'Aiming straight down the fairway.';
    return `Aiming ${Math.abs(aimAngle)} degrees ${aimAngle < 0 ? 'Left' : 'Right'}.`;
}

function getStanceReport() {
    return "Stance: Ball " + stanceNames[stanceIndex] + ", " + alignmentNames[stanceAlignment + 2] + " Alignment.";
}

function getSetupReport() {
    const style = shotStyles[shotStyleIndex];
    const baseCarry = club.baseDistance * style.distMod;
    const baseTotal = baseCarry + (baseCarry * (club.rollPct * style.rollMod));
    
    if (gameMode === 'course' && currentLie === 'Sand') {
        const minTotal = Math.round(baseTotal * 0.60);
        const maxTotal = Math.round(baseTotal * 0.80);
        return `${club.name}. In the sand. 100% power hits ${minTotal} to ${maxTotal} yards. Style: ${style.name}.`;
    } else if ((gameMode === 'course' && currentLie === 'Light Rough') || (gameMode === 'range' && rangeLie === 'Rough')) {
        const minTotal = Math.round(baseTotal * 0.85);
        const maxTotal = Math.round(baseTotal * 0.95);
        return `${club.name}. In the rough. 100% power hits ${minTotal} to ${maxTotal} yards. Style: ${style.name}.`;
    } else {
        return `${club.name}. 100% power hits ${Math.round(baseTotal)} yards. Style: ${style.name}.`;
    }
}

function calculateZoneAccuracy(offsetMs, pressure) {
    const absOffset = Math.abs(offsetMs);
    const buffer = 60 / (1 + (pressure * 0.5));
    if (absOffset <= buffer) return 100;
    if (absOffset <= 150) return 95 - ((absOffset - buffer) / 100 * 15);
    if (absOffset <= 400) return 80 - ((absOffset - 150) / 250 * 60);
    return 10;
}

function calculateShot(autoMiss = false) {
    swingState = 5; 
    stateTimeouts.forEach(clearTimeout);
    strokes++;
    if (autoMiss) {
        playTone(150, 'sine', 0.5, 0.5);
        let missDist = calculateDistanceToPin();
        lastShotReport = `Whiffed. Stroke ${strokes}. ${missDist} yards to the pin.`;
        window.announce("Whiffed!");
        setTimeout(() => { swingState = 0; }, 1000);
        return;
    }

    if (devPower) finalPower = 100;
    if (devHinge) { hingeTimeBack = 1000; hingeTimeDown = 1000; }
    let impactDiff = devImpact ? 0 : Math.round((performance.now() - impactStartTime) - dropDurationMs);
    let hingeDiff = devHinge ? 0 : Math.round(hingeTimeDown - hingeTimeBack);

    let pressure = finalPower > 105 ? (finalPower - 105) / 15 : 0;
    const hingeAcc = Math.max(10, 100 - (Math.abs(hingeDiff) / 4));
    
    const activeFairwayWidth = gameMode === 'course' ? courses[currentCourseIndex].holes[hole - 1].fairwayWidth : fairwayWidth;
    const isStartingInRough = gameMode === 'range' ? (rangeLie === 'Rough') : (currentLie === 'Light Rough' || currentLie === 'Sand');
    
    let lieMod = 1.0, lieDispersionMod = 1.0, lieForgivenessMod = 1.0;

    if (isStartingInRough) {
        if (currentLie === 'Sand') {
            lieMod = 0.6 + (Math.random() * 0.2); // 60% to 80%
            lieDispersionMod = 2.0;
            lieForgivenessMod = 0.7;
        } else { // Light Rough or Range Rough
            lieMod = 0.85 + (Math.random() * 0.1); // 85% to 95%
            lieDispersionMod = 1.5; 
            lieForgivenessMod = 0.8; 
        }
    }

    let forgiveness = finalPower <= 100 ? 1 + ((100 - finalPower) * 0.01) : Math.max(0.4, 1 - ((finalPower - 100) * 0.02));
    forgiveness *= lieForgivenessMod; 

    let absImpact = Math.abs(impactDiff);
    let adjustedImpact = absImpact / forgiveness;
    let spinPenalty = 0.5 + (adjustedImpact / 50); 
    if (adjustedImpact > 160) spinPenalty = 5 + ((adjustedImpact - 160) / 20);

    let tempSideSpin = Math.abs(Math.round((impactDiff / 20) * 100 * spinPenalty * (1 + pressure)));
    let dampening = Math.max(0.25, 1 - (tempSideSpin / 20000)); 
    let impactAcc = Math.max(10, 100 - (adjustedImpact / 2.5));

    const currentStyle = shotStyles[shotStyleIndex];
    const accuracyScore = Math.round((impactAcc + hingeAcc) / 2);
    let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
    let backspinRPM = Math.max(400, Math.round((club.loft * 150) + (finalPower * 10) + (impactAcc * 7) + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
    
    let sideSpinRPM = Math.round((impactDiff / 20) * 100 * spinPenalty * (1 + pressure)) + (stanceAlignment * 800);
    let potentialDist = club.baseDistance * (finalPower / 100) * (1 + (hingeTimeBack / 2000 * 0.15)) * currentStyle.distMod * lieMod;
    let totalDistance = Math.round(potentialDist * dampening * Math.max(0.2, 1 - Math.pow(Math.abs(hingeDiff) / 400, 2)));

    let hangTimeSecs = Math.min(6, Math.max(0.5, (totalDistance / 60) + (dynamicLoft / 15)));
    let baseWindY = windY * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let baseWindX = windX * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));
    let spinWindInteraction = (windX * sideSpinRPM) / 10000; 

    let windYEffect = Math.round(baseWindY * gyroMod);
    let windXEffect = Math.round((baseWindX * gyroMod) + spinWindInteraction);

    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY); 
    const userAimRad = aimAngle * (Math.PI / 180); 
    const finalRad = targetAngleRad + userAimRad; 

    const physicsX = (typeof isPutt !== 'undefined' && isPutt) ? 0 : (sideSpinRPM / 2400) * (club.maxDispersion * (typeof lieDispersionMod !== 'undefined' ? lieDispersionMod : 1));
    const lateralTotal = physicsX + windXEffect;

    const moveY = Math.cos(finalRad) * totalDistance - Math.sin(finalRad) * lateralTotal;
    const moveX = Math.sin(finalRad) * totalDistance + Math.cos(finalRad) * lateralTotal;

    ballY += moveY;
    ballX += moveX;

    let lateralKick = Math.round((sideSpinRPM / 350) * currentStyle.rollMod);
    ballY -= Math.sin(finalRad) * lateralKick;
    ballX += Math.cos(finalRad) * lateralKick;

    let rollDistance = Math.round(totalDistance * club.rollPct * currentStyle.rollMod);
    let carryDistance = Math.max(0, totalDistance - rollDistance);
    let lateralX = Math.round((physicsX + windXEffect + lateralKick) * 10) / 10;

    const currentHole = courses[currentCourseIndex].holes[hole - 1];
    let treeCollisionReport = "";
    if (currentHole.trees) {
        currentHole.trees.forEach(tree => {
            // Check if ball path (from 0,0 to ballX,ballY) intersects the tree radius
            // Simplified check: if the ball lands within or passes very close to the tree
            let distToTree = Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2));
            if (distToTree < tree.radius) {
                let treeDistFromBall = Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2));
                let ballHeightAtTree = (treeDistFromBall * Math.tan(dynamicLoft * Math.PI / 180));
                
                if (ballHeightAtTree < tree.height) {
                    playTone(1200, 'square', 0.1, 0.5); 
                    window.announce(`Hit the ${tree.name}!`);
                    ballX = tree.x + (Math.random() * 4 - 2);
                    ballY = tree.y - 5; 
                    totalDistance *= 0.4;
                    rollDistance = 2;
                    treeCollisionReport = `[Tree Check: ${tree.name} is ${tree.height}y tall. Ball height was ${Math.round(ballHeightAtTree)}y. Result: THWACK]`;
                } else {
                    window.announce(`Sailed right over the ${tree.name}!`);
                    treeCollisionReport = `[Tree Check: ${tree.name} is ${tree.height}y tall. Ball height was ${Math.round(ballHeightAtTree)}y. Result: CLEARED]`;
                }
            }
        });
    }

    let distanceToPin = calculateDistanceToPin();
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    
    // Dynamic Approach & Apron
    let currentFW = activeFairwayWidth;
    if (holeData.approachWidth && distanceToPin <= 50 && distanceToPin > (holeData.apronRadius || 0)) {
        currentFW = holeData.approachWidth;
    } else if (holeData.apronRadius && distanceToPin <= holeData.apronRadius) {
        currentFW = 30; // Apron width
    }

    currentLie = Math.abs(ballX) > (currentFW / 2) ? "Light Rough" : "Fairway";
    let inWater = false;

    if (holeData.hazards && gameMode === 'course') {
        holeData.hazards.forEach(h => {
            if (ballY >= h.distance && ballY <= h.distance + h.depth) {
                if (ballX >= h.offset - (h.width / 2) && ballX <= h.offset + (h.width / 2)) {
                    if (h.type === "Bunker") currentLie = "Sand";
                    if (h.type === "Water") inWater = true;
                }
            }
        });
    }

    if (inWater) {
        currentLie = "Water Penalty";
        strokes++; 
        ballY = Math.max(0, ballY - 20); 
        ballX = 0; 
    } else if (gameMode === 'course' && distanceToPin <= 20) {
        currentLie = "Green";
    }

    document.getElementById('visual-output').innerText = "Ball is in the air...";
    playTone(800, 'triangle', 0.1, 0.6);
    playNoise(hangTimeSecs + 0.3, 0.3, false);

    setTimeout(() => {
        const loftPenalty = dynamicLoft >= 50 ? 2 : dynamicLoft >= 38 ? 1 : 0;
        const baseBounceCount = rollDistance <= 0 ? 1 : Math.min(6, 1 + Math.floor(rollDistance / 7));
        const bounceCount = Math.max(1, baseBounceCount - loftPenalty);
        const bounceDurationMs = 0.12 * 1000;
        const bounceOffsets = [];
        let bounceGapMs = Math.min(800, 350 + (rollDistance * 3));
        let bounceElapsedMs = 0, bounceSequenceMs = 0;

        for (let bounceIndex = 0; bounceIndex < bounceCount; bounceIndex++) {
            bounceOffsets.push(bounceElapsedMs);
            bounceSequenceMs = bounceElapsedMs + bounceDurationMs;
            bounceElapsedMs += bounceGapMs;
            bounceGapMs = Math.max(90, Math.round(bounceGapMs * 0.85));
        }

        // FIX: Moved rollTimeSecs outside the block so the Caddy timer can read it later
        let isWater = currentLie.toLowerCase().includes("water");
        let rollTimeSecs = Math.max(0, Math.abs(rollDistance) / 10);

        if (isWater) {
            rollTimeSecs = 0; // Kills the roll timer for water shots
            bounceSequenceMs = 400; // Gives the splash exactly 400ms to play before Caddy talks
            if (typeof window.playSplash === 'function') window.playSplash(0.5);
        } else {
            // Only bounce and roll if NOT in water
            bounceOffsets.forEach((bounceOffsetMs, bounceIndex) => {
                setTimeout(() => {
                    const bounceVolume = Math.max(0.12, 1.0 * Math.pow(0.8, bounceIndex));
                    playTone(180, 'sine', 0.12, bounceVolume);
                }, bounceOffsetMs);
            });

            if (rollTimeSecs > 0) {
                setTimeout(() => {
                    document.getElementById('visual-output').innerText = "Ball is bouncing and rolling...";
                    playNoise(rollTimeSecs, 0.4, true); 
                }, bounceSequenceMs);
            }
        }

        const contactLabel = hingeDiff < -60 ? "Thin" : hingeDiff > 60 ? "Fat" : "Flushed";
        const loftDiff = dynamicLoft - club.loft;
        const trajectoryLabel = loftDiff < -8 ? "piercing" : loftDiff < -3 ? "low" : loftDiff > 8 ? "towering" : loftDiff > 3 ? "high" : "standard";
        const shapeLabel = sideSpinRPM < -2500 ? "snap hook" : sideSpinRPM < -1000 ? "hook" : sideSpinRPM < -250 ? "draw" : sideSpinRPM > 2500 ? "banana slice" : sideSpinRPM > 1000 ? "slice" : sideSpinRPM > 250 ? "fade" : "straight shot";
        const shotDesc = `${contactLabel}. A ${trajectoryLabel} ${shapeLabel}.`;
        const windDesc = `Wind pushed it ${Math.abs(windYEffect)} yds ${windYEffect > 0 ? 'long' : windYEffect < 0 ? 'short' : 'nowhere'}, and ${Math.abs(windXEffect)} yds ${windXEffect > 0 ? 'right' : windXEffect < 0 ? 'left' : 'nowhere'}.`;

        setTimeout(() => {
            let displayX = Math.round(ballX * 10) / 10;
            let dirStr = displayX === 0 ? "dead center" : `${Math.abs(displayX)} yards ${displayX < 0 ? 'left' : 'right'} of center`;
            const sideSpinShape = sideSpinRPM === 0 ? "Straight" : sideSpinRPM > 0 ? "Slice" : "Hook";
            const metrics = `Power ${finalPower}%. Hinge Diff ${hingeDiff}ms. Impact Offset ${impactDiff}ms. Accuracy Score ${accuracyScore}%. Backspin: ${backspinRPM} RPM. Side Spin: ${sideSpinRPM} RPM (${sideSpinShape}). ${treeCollisionReport}`;
            const roughDesc = isStartingInRough ? "Hacked it out of the rough. " : "";
            let kickDesc = lateralKick === 0 ? "rolls straight" : `kicks ${Math.abs(lateralKick)} yds ${lateralKick > 0 ? 'right' : 'left'}`;
            const shotBroadcast = `${club.name}. ${roughDesc}${shotDesc} ${windDesc} Carries ${carryDistance}, rolls ${rollDistance} forward and ${kickDesc} for a total of ${totalDistance}. Settles in the ${currentLie}, ${dirStr}.`;

            if (gameMode === 'chipping') {
                let finalProximity = distanceToPin;
                ballX = 0; ballY = 0; pinX = 0;
                pinY = chippingRange === 'short' ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 61) + 20;
                let newTarget = calculateDistanceToPin();
                const chippingMsg = `Chipping Green. ${shotBroadcast} Shot finished ${finalProximity} yards from the pin. New target: ${newTarget} yards.`;
                window.announce(chippingMsg);
                lastShotReport = chippingMsg + "\n\nTelemetry:\n" + metrics;
                holeTelemetry.push(lastShotReport);
                document.getElementById('visual-output').innerText = lastShotReport;
                if (gameMode === 'course') window.updateTargetZone();
                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false;
            } else {
                if (gameMode === 'course' && distanceToPin <= 20 && !currentLie.toLowerCase().includes("water")) isHoleComplete = true;

                if (isHoleComplete) {
                    playTone(440, 'sine', 0.2, 0.4); setTimeout(() => playTone(554, 'sine', 0.2, 0.4), 200); setTimeout(() => playTone(659, 'sine', 0.4, 0.4), 400);
                    const completionMessage = `Hole complete! You reached the green in ${strokes} strokes, finishing ${distanceToPin} yards from the pin.`;
                    window.announce(completionMessage);
                    lastShotReport = completionMessage + "\n\n" + shotBroadcast + "\n\nTelemetry:\n" + metrics;
                    holeTelemetry.push(lastShotReport);
                    document.getElementById('visual-output').innerText = lastShotReport;
                    swingState = 6;
                } else {
                    if (gameMode === 'range') {
                        let finalProximity = distanceToPin;
                        let vertDir = ballY < pinY ? "Short" : "Long";
                        let horizDir = ballX < 0 ? "Left" : "Right";
                        let relativePos = (finalProximity <= 1) ? "Dead Center" : `${vertDir}-${horizDir}`;

                        const rangeMsg = `Driving Range. ${shotBroadcast} Finished ${finalProximity} yards from target, ${relativePos}.`;
                        lastShotReport = rangeMsg + "\n\nTelemetry:\n" + metrics;
                        holeTelemetry.push(lastShotReport);
                        
                        ballX = 0; ballY = 0; 
                        window.announce(rangeMsg);
                        document.getElementById('visual-output').innerText = lastShotReport;

                        if (gameMode === 'course') window.updateTargetZone();
                        driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0;
                    } else {
                        let penaltyStr = ".";
                        if (currentLie.toLowerCase().includes("water") && gameMode === 'course') {
                            penaltyStr = " (includes 1 stroke water penalty).";
                        }
                        const broadcast = `Stroke ${strokes + 1}${penaltyStr} ${distanceToPin} yards to the pin. ${shotBroadcast}`;
                        
                        setTimeout(() => {
                            window.announce(broadcast);
                            lastShotReport = broadcast + "\n\nTelemetry:\n" + metrics;
                            holeTelemetry.push(lastShotReport);
                            document.getElementById('visual-output').innerText = lastShotReport;
                        }, typeof isPutting !== 'undefined' && isPutting && club.name === "Putter" && strokes > 1 ? 1500 : 0);
                        
                        if (gameMode === 'course') window.updateTargetZone();
                        driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false;
                    }
                }
            }
        }, bounceSequenceMs + (rollTimeSecs * 1000) + 500);

    }, hangTimeSecs * 1000);
}