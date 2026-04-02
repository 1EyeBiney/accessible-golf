// physics_collisions.js - Hazard Detection, Lie Penalties, and Terrain Collision (v5.68.0)

// --- TERRAIN QUERIES ---

window.getTerrainAt = function(x, y) {
    if (gameMode !== 'course') return typeof rangeTargetLie !== 'undefined' ? rangeTargetLie : "Fairway";

    const holeData = window.currentCourse.holes[hole - 1];
    let distToPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    const greenSize = holeData.greenRadius || 20;

    // v5.68.0 Rectangular Green Geometry & Packed Earth Base
    if (window.currentCourse.name === "The Pasture" && hole === 9) {
        if (Math.abs(x) <= 17.5 && y >= (pinY - 2) && y <= (pinY + 10)) return "Green";
    } else {
        if (distToPin <= greenSize) return "Green";
    }

    let terrain = "Fairway";
    let currentFW = typeof activeFairwayWidth !== 'undefined' ? activeFairwayWidth : (holeData.fairwayWidth || 40);

    if (holeData.approachWidth && distToPin <= 50 && distToPin > (holeData.apronRadius || 0)) {
        currentFW = holeData.approachWidth;
    } else if (holeData.apronRadius && distToPin <= holeData.apronRadius) {
        currentFW = 30; // Apron width
    }

    if (Math.abs(x) > (currentFW / 2)) terrain = "Rough";

    if (holeData.hazards) {
        holeData.hazards.forEach(h => {
            if (!h.offset || !h.width || !h.distance || !h.depth) return; // Skip flag-only hazard objects
            const hLeft = h.offset - (h.width / 2);
            const hRight = h.offset + (h.width / 2);
            const hStart = h.distance;
            const hEnd = h.distance + h.depth;
            if (y >= hStart && y <= hEnd && x >= hLeft && x <= hRight) {
                terrain = h.type === "Bunker" ? "Sand" : h.type;
            }
        });
    }
    if (window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 4 && terrain !== "Green" && terrain !== "Tee") {
        terrain = "Mud";
    }
    if (window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 5 && (terrain === "Rough" || terrain === "Light Rough")) {
        terrain = "Packed Earth";
    }
    if (window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 9) {
        if (terrain === "Fairway" || terrain === "Rough" || terrain === "Cart Path" || terrain === "Highway Fence") return "Packed Earth";
        if (terrain === "Scrub Brush") return "Mud";
    }
    return terrain;
};

// v5.62.0 Landing Zone Oracle (startY/endY Support)
window.getLandingZoneEffect = function(x, y) {
    if (gameMode !== 'course') return "";
    const holeData = window.currentCourse.holes[hole - 1];
    if (!holeData || !holeData.greenType || typeof window.greenDictionary === 'undefined') return "";

    let distFromPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    let activeContours = window.greenDictionary[holeData.greenType] || [];

    // Find the contour zone using the correct startY/endY schema
    let zone = activeContours.find(z => distFromPin <= z.startY && distFromPin > z.endY);

    if (!zone) return " Area is relatively flat.";

    let kick = "";
    if (zone.slopeX > 0.1) kick = "kicks right";
    else if (zone.slopeX < -0.1) kick = "kicks left";

    let feed = "";
    if (zone.slopeY > 0.1) feed = "feeds uphill";
    else if (zone.slopeY < -0.1) feed = "feeds downhill";

    if (kick && feed) return ` Landing here ${kick} and ${feed}.`;
    if (kick) return ` Landing here ${kick}.`;
    if (feed) return ` Landing here ${feed}.`;

    return " Area is relatively flat.";
};

// --- TREE COLLISION RESOLUTION (v4.22.1, extracted from calculateShot) ---

window.resolveTreeCollisions = function(ctx) {
    let {
        gameMode, synthTreeActive, synthTreeDist, synthTreeX, synthTreeHeight,
        carryDistance, totalDistance, rollDistance, ballX, ballY,
        startX, startY, landX, landY, dynamicLoft, hangTimeSecs,
        shotShapeNarrative, finalRad, physicsX, windXEffect,
        currentHole, stateTimeouts
    } = ctx;
    let flightPathNarrative = ctx.flightPathNarrative || "";
    let treeCollisionReport = ctx.treeCollisionReport || "";

    // 1. Synth Tree Collision (Holo Range / Pitching Green)
    if ((gameMode === 'range' || gameMode === 'chipping') && synthTreeActive) {
        let treeRadius = 10;
        if (carryDistance > synthTreeDist) {
            let flightFraction = synthTreeDist / carryDistance;
            let timeToTreeMs = hangTimeSecs * 1000 * flightFraction; // v4.22.1 Acoustic Timing
            let projectedX = startX + (landX - startX) * flightFraction;
            let lateralDistFromCenter = Math.abs(projectedX - synthTreeX);
            
            if (lateralDistFromCenter < treeRadius) {
                let ballHeightYards = (Math.tan(dynamicLoft * Math.PI / 180) / carryDistance) * synthTreeDist * (carryDistance - synthTreeDist);
                let ballHeightFeet = Math.max(0, ballHeightYards * 3);
                let verticalMargin = Math.round(ballHeightFeet - synthTreeHeight);
                
                if (ballHeightFeet < synthTreeHeight) {
                    stateTimeouts.push(setTimeout(() => {
                        playTone(1200, 'square', 0.1, 0.5);
                        window.announce(`THWACK! You hit the Synth Tree!`);
                    }, timeToTreeMs));
                    
                    totalDistance = Math.round(synthTreeDist); rollDistance = 2; carryDistance = totalDistance - rollDistance;
                    ballY = startY + (landY - startY) * flightFraction; ballX = startX + (landX - startX) * flightFraction;
                    flightPathNarrative = `${shotShapeNarrative} that crashed into the Synth Tree canopy, ${Math.abs(verticalMargin)} feet too low.`;
                    treeCollisionReport = `[Synth Tree: ${Math.round(synthTreeHeight)}ft. Apex: ${Math.round(ballHeightFeet)}ft. Result: THWACK]`;
                } else {
                    stateTimeouts.push(setTimeout(() => { window.announce(`Sailed over the Synth Tree!`); }, timeToTreeMs));
                    flightPathNarrative = `${shotShapeNarrative} that sailed safely over the Synth Tree, clearing the top branches by ${verticalMargin} feet.`;
                    treeCollisionReport = `[Synth Tree: ${Math.round(synthTreeHeight)}ft. Apex: ${Math.round(ballHeightFeet)}ft. Margin: +${verticalMargin}ft. Result: CLEARED]`;
                }
            } else if (lateralDistFromCenter < treeRadius + 15) {
                let lateralMargin = Math.round(lateralDistFromCenter - treeRadius);
                let passSide = projectedX > synthTreeX ? "right" : "left";
                stateTimeouts.push(setTimeout(() => { window.announce(`Curved past the Synth Tree!`); }, timeToTreeMs));
                flightPathNarrative = `${shotShapeNarrative} that shaved the ${passSide} edge of the Synth Tree canopy by just ${lateralMargin} yards.`;
                treeCollisionReport = `[Synth Tree bypassed laterally by ${lateralMargin} yards on the ${passSide}.]`;
            }
        }
    }

    // 2. Natural Tree Collision (Course)
    if (currentHole && currentHole.trees && gameMode === 'course') {
        currentHole.trees.forEach(tree => {
            let distToTreeCenter = Math.sqrt(Math.pow(tree.x - startX, 2) + Math.pow(tree.y - startY, 2));
            if (carryDistance > distToTreeCenter && tree.y > startY) {
                let flightFraction = distToTreeCenter / carryDistance;
                let timeToTreeMs = hangTimeSecs * 1000 * flightFraction; // v4.22.1 Acoustic Timing
                let projectedX = startX + (landX - startX) * flightFraction;
                let projectedY = startY + (landY - startY) * flightFraction;
                let actualDistToTree = Math.sqrt(Math.pow(tree.x - projectedX, 2) + Math.pow(tree.y - projectedY, 2));

                if (actualDistToTree < tree.radius) {
                    let ballHeightAtTree = Math.max(0, (Math.tan(dynamicLoft * Math.PI / 180) / carryDistance) * distToTreeCenter * (carryDistance - distToTreeCenter));
                    let verticalMarginYards = Math.round(ballHeightAtTree - tree.height);
                    
                    if (ballHeightAtTree < tree.height) {
                        let gamble = Math.random();
                        let kickDir = tree.x > 0 ? -1 : 1;

                        if (gamble < 0.33) {
                            stateTimeouts.push(setTimeout(() => {
                                playNoise(0.5, 0.4, false);
                                window.announce(`Rustled through the leaves of the ${tree.name}!`);
                            }, timeToTreeMs));

                            totalDistance = Math.round(totalDistance * 0.5);
                            carryDistance = Math.round(carryDistance * 0.5);
                            rollDistance = Math.max(0, totalDistance - carryDistance);
                            let lateralTotal = (physicsX + windXEffect) * 3;

                            let newMoveY = Math.cos(finalRad) * totalDistance - Math.sin(finalRad) * lateralTotal;
                            let newMoveX = Math.sin(finalRad) * totalDistance + Math.cos(finalRad) * lateralTotal;
                            ballY = startY + newMoveY;
                            ballX = startX + newMoveX;

                            flightPathNarrative = `${shotShapeNarrative} that punched narrowly through the canopy, drastically losing speed and scattering offline.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: NARROW MISS (33%). Disp x3, Dist x0.5]`;
                        }
                        else if (gamble < 0.66) {
                            stateTimeouts.push(setTimeout(() => {
                                playTone(800, 'triangle', 0.1, 0.6);
                                window.announce(`Crack! A glancing blow off a branch of the ${tree.name}!`);
                            }, timeToTreeMs));

                            let bounceDist = 18 + (Math.random() * 5);
                            ballY = startY + (Math.cos(finalRad) * distToTreeCenter);
                            ballX = startX + (Math.sin(finalRad) * distToTreeCenter) + (kickDir * bounceDist);

                            totalDistance = Math.round(distToTreeCenter + bounceDist);
                            rollDistance = Math.round(bounceDist); carryDistance = Math.round(distToTreeCenter);

                            flightPathNarrative = `${shotShapeNarrative} that clipped a thick branch and violently deflected sideways.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: GLANCING BLOW (33%). Kick ${Math.round(bounceDist)}y]`;
                        }
                        else {
                            stateTimeouts.push(setTimeout(() => {
                                playTone(200, 'square', 0.1, 0.8);
                                window.announce(`THWACK! Dead center into the trunk of the ${tree.name}!`);
                            }, timeToTreeMs));

                            let bounceDist = 8 + (Math.random() * 5);
                            ballY = startY + (Math.cos(finalRad) * distToTreeCenter);
                            ballX = startX + (Math.sin(finalRad) * distToTreeCenter) + (kickDir * bounceDist);

                            totalDistance = Math.round(distToTreeCenter + bounceDist);
                            rollDistance = Math.round(bounceDist); carryDistance = Math.round(distToTreeCenter);

                            flightPathNarrative = `${shotShapeNarrative} that crashed straight into the trunk and dropped.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: SOLID STRIKE (33%). Kick ${Math.round(bounceDist)}y]`;
                        }
                    } else {
                        stateTimeouts.push(setTimeout(() => { window.announce(`Sailed right over the ${tree.name}!`); }, timeToTreeMs));
                        flightPathNarrative = `${shotShapeNarrative} that sailed safely over the ${tree.name}, clearing the top by ${verticalMarginYards} yards.`;
                        treeCollisionReport = `[${tree.name} Check: ${tree.height}y tall. Apex: ${Math.round(ballHeightAtTree)}y. Margin: +${verticalMarginYards}y. Result: CLEARED]`;
                    }
                } else if (actualDistToTree < tree.radius + 15) {
                    let lateralMargin = Math.round(actualDistToTree - tree.radius);
                    let passSide = projectedX > tree.x ? "right" : "left";
                    flightPathNarrative = `${shotShapeNarrative} that wrapped past the ${tree.name}, shaving the ${passSide} edge by ${lateralMargin} yards.`;
                    treeCollisionReport = `[${tree.name} bypassed laterally by ${lateralMargin} yards.]`;
                }
            }
        });
    }

    return { carryDistance, totalDistance, rollDistance, ballX, ballY, flightPathNarrative, treeCollisionReport };
};

// --- HAZARD DETECTION AND LIE ASSIGNMENT (extracted from calculateShot) ---

window.resolveHazardLie = function(ctx) {
    let {
        gameMode, rangeTargetLie, ballX, ballY, moveX, moveY,
        carryDistance, totalDistance, rollDistance, flightPathNarrative,
        holeData, activeFairwayWidth, distanceToPin, strokes,
        players, currentPlayerIndex, isBotTurn,
        hangTimeSecs, stateTimeouts
    } = ctx;

    // Dynamic Approach & Apron
    let currentFW = activeFairwayWidth;
    if (holeData.approachWidth && distanceToPin <= 50 && distanceToPin > (holeData.apronRadius || 0)) {
        currentFW = holeData.approachWidth;
    } else if (holeData.apronRadius && distanceToPin <= holeData.apronRadius) {
        currentFW = 30; // Apron width
    }

    let inWater = false;
    let rollStopTriggered = false;
    let currentLie;

    if (gameMode === 'range' || gameMode === 'chipping') {
        currentLie = rangeTargetLie;
        if (currentLie === 'Water') inWater = true;
    } else {
        currentLie = Math.abs(ballX) > (currentFW / 2) ? "Light Rough" : "Fairway";
        if (holeData.hazards && gameMode === 'course') {
            const startY = ballY - moveY;
            const carryY = startY + (moveY * (carryDistance / totalDistance));
            const carryX = (ballX - moveX) + (moveX * (carryDistance / totalDistance));

            holeData.hazards.forEach(h => {
                if (!h.offset || !h.width || !h.distance || !h.depth) return; // Skip flag-only hazard objects

                const hLeft = h.offset - (h.width / 2);
                const hRight = h.offset + (h.width / 2);
                const hStart = h.distance;
                const hEnd = h.distance + h.depth;

                // Check if the ball CARRY landed in hazard
                if (carryY >= hStart && carryY <= hEnd && carryX >= hLeft && carryX <= hRight) {
                    if (h.type === "Bunker") currentLie = "Sand";
                    if (h.type === "Water") inWater = true;
                } else if (carryY >= hStart && carryY <= hEnd) {
                    // v4.23.1 Hazard Narrow Miss
                    let marginL = Math.abs(carryX - hLeft);
                    let marginR = Math.abs(carryX - hRight);
                    if (carryX < hLeft && marginL <= 15) flightPathNarrative += ` Shaved the left edge of the ${h.type} by ${Math.round(marginL)} yards.`;
                    else if (carryX > hRight && marginR <= 15) flightPathNarrative += ` Shaved the right edge of the ${h.type} by ${Math.round(marginR)} yards.`;
                }
                // Check if the ball ROLL entered a hazard
                else if (!inWater && ballY >= hStart && ballY <= hEnd && ballX >= hLeft && ballX <= hRight) {
                    if (h.type === "Bunker") {
                        currentLie = "Sand";
                        rollStopTriggered = true;
                        
                        // v4.29.0 Sand Enter Audio
                        if (typeof window.playGolfSound === 'function') window.playGolfSound('hazard_03');
                        
                        // Stop the ball just inside the bunker edge
                        const entryBuffer = 2; 
                        ballY = hStart + entryBuffer;
                        rollDistance = Math.max(0, Math.round(ballY - carryY));
                        totalDistance = carryDistance + rollDistance;
                    } else if (h.type === "Scrub Brush") {
                        currentLie = "Mud";
                    } else if (h.type === "Highway Fence") {
                        currentLie = "Packed Earth";
                        if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_33');
                        if (typeof strokes !== 'undefined') strokes++; 
                        ballY -= 15; 
                        rollStopTriggered = true;
                        rollDistance = 0;
                        if (typeof flightPathNarrative !== 'undefined') flightPathNarrative += " The ball smashed into the highway chain-link fence! One stroke penalty.";
                    }
                    if (h.type === "Water") inWater = true;
                    if (h.type.includes("Pine Needles")) {
                        currentLie = "Pine Needles";
                        // v4.87.0 Frictionless Slide (Massive Roll Multiplier)
                        rollDistance *= 1.8;
                    }
                }
            });
        }
    }

    const greenSize = holeData.greenRadius || 20;
    if (inWater) {
        currentLie = "Water Penalty";
        strokes++; 
        ballY = Math.max(0, ballY - 20); 
        ballX = 0; 
    } else if (gameMode === 'course' && distanceToPin <= greenSize) {
        currentLie = "Green";
    }

    // v5.40.1 Floyd's Mud Override
    if (window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 4 && currentLie !== "Green" && !inWater) {
        currentLie = "Mud";
    }

    if (currentLie === "Mud") {
        rollStopTriggered = true;
        rollDistance = 0;
        totalDistance = carryDistance;
    }

    // v5.34.5 Clifford's Tractor Reward (First Shot Fairway - Delayed & Audio Fixed)
    let p = players && players[currentPlayerIndex] ? players[currentPlayerIndex] : { currentLie: 'Tee' };
    if (window.currentCourse.name === "The Pasture" && hole === 1 && currentLie === "Fairway" && p.currentLie === "Tee") {
        strokes = 0; // Free Shot
        let bounceAngle = Math.random() * Math.PI;
        ballX += Math.cos(bounceAngle) * 15;
        ballY -= (Math.sin(bounceAngle) * 15) + 5;
        currentLie = "Fairway";
        rollStopTriggered = true;
        
        let bounceMsg = "CLANG! You hit Clifford's tractor! Your stroke is refunded and the ball bounced backward.";
        flightPathNarrative = flightPathNarrative ? flightPathNarrative + ' ' + bounceMsg : bounceMsg;

        // Robust fallback if hangTimeSecs isn't passed from physics_core
        let delayMs = (hangTimeSecs || 4.5) * 1000; 

        let timeoutId = setTimeout(() => {
            // Grab Bag Logic for Voice Lines
            window.cliffExclaims = window.cliffExclaims || ['cliff_exclaim1', 'cliff_exclaim2', 'cliff_exclaim3', 'cliff_exclaim4'];
            window.cliffExclaims.sort(() => Math.random() - 0.5); // Shuffle
            
            let exclaimFile = window.cliffExclaims.pop() || 'cliff_exclaim1';
            
            // Refill array if empty for the next player
            if (window.cliffExclaims.length === 0) {
                window.cliffExclaims = ['cliff_exclaim1', 'cliff_exclaim2', 'cliff_exclaim3', 'cliff_exclaim4'];
            }
            
            let audioEl = new Audio('audio/courses/pasture/' + exclaimFile + '.mp3');
            audioEl.volume = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
            audioEl.play().catch(e => console.warn("Tractor audio blocked", e));

            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_33');
            
            window.announce(bounceMsg);
            if (document.getElementById('visual-output')) document.getElementById('visual-output').innerText = bounceMsg;
        }, delayMs);

        // Safely push to global timeouts to prevent state bleed
        if (typeof window.stateTimeouts !== 'undefined') {
            window.stateTimeouts.push(timeoutId);
        } else if (stateTimeouts) {
            stateTimeouts.push(timeoutId);
        }
    }

    // v5.35.0 The Bovine Bounce (Hole 2 Pinball Mechanics)
    if (window.currentCourse.name === "The Pasture" && hole === 2 && currentLie !== "Green" && totalDistance > 50 && !inWater) {
        // Random 360-degree bounce, 5 to 18 yards
        let bounceDist = 5 + (Math.random() * 13);
        let bounceAngle = Math.random() * Math.PI * 2;
        
        ballX += Math.cos(bounceAngle) * bounceDist;
        ballY += Math.sin(bounceAngle) * bounceDist;
        
        // Re-evaluate lie after the bounce
        currentLie = typeof window.getTerrainAt === 'function' ? window.getTerrainAt(ballX, ballY) : "Fairway";
        rollStopTriggered = true;
        
        let bounceMsg = `MOO! Your ball struck a cow and ricocheted ${Math.round(bounceDist)} yards.`;
        flightPathNarrative = flightPathNarrative ? flightPathNarrative + ' ' + bounceMsg : bounceMsg;

        let delayMs = (hangTimeSecs || 4.5) * 1000;
        
        // Calculate stereo pan based on lateral landing position (Assuming 25y is hard pan)
        let panValue = Math.max(-1, Math.min(1, ballX / 25));

        let timeoutId = setTimeout(() => {
            // Grab Bag Logic for Cow Audio
            window.cowSounds = window.cowSounds || ['cow1', 'cow2', 'cow3', 'cow4', 'cow5', 'cow6'];
            window.cowSounds.sort(() => Math.random() - 0.5); 
            
            let cowFile = window.cowSounds.pop() || 'cow1';
            if (window.cowSounds.length === 0) {
                window.cowSounds = ['cow1', 'cow2', 'cow3', 'cow4', 'cow5', 'cow6'];
            }
            
            if (typeof audioCtx !== 'undefined' && audioCtx) {
                let audioEl = new Audio('audio/courses/pasture/' + cowFile + '.mp3');
                audioEl.volume = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                
                // Route through spatial panner
                let source = audioCtx.createMediaElementSource(audioEl);
                let panner = audioCtx.createStereoPanner();
                panner.pan.value = panValue;
                source.connect(panner);
                panner.connect(audioCtx.destination);
                
                audioEl.play().catch(e => {});
            } else {
                // Fallback if audioCtx is suspended
                let audioEl = new Audio('audio/courses/pasture/' + cowFile + '.mp3');
                audioEl.play().catch(e => {});
            }
            
            // Soft thud for body impact
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_04');
            
            window.announce(bounceMsg);
            if (document.getElementById('visual-output')) document.getElementById('visual-output').innerText = bounceMsg;
        }, delayMs);

        if (typeof window.stateTimeouts !== 'undefined') {
            window.stateTimeouts.push(timeoutId);
        } else if (stateTimeouts) {
            stateTimeouts.push(timeoutId);
        }
    }

    // v5.36.0 Foul Plate Roosters (Hole 3 Hazard & Bonus Loot) — v5.41.0 expanded to Hole 5
    if (window.currentCourse.name === "The Pasture" && (hole === 3 || hole === 5) && currentLie !== "Green" && strokes <= 2 && totalDistance > 50 && !inWater) {
        // Micro-bounce, 3 to 6 yards
        let bounceDist = 3 + (Math.random() * 3);
        let bounceAngle = Math.random() * Math.PI * 2;
        
        ballX += Math.cos(bounceAngle) * bounceDist;
        ballY += Math.sin(bounceAngle) * bounceDist;
        
        currentLie = typeof window.getTerrainAt === 'function' ? window.getTerrainAt(ballX, ballY) : "Fairway";
        rollStopTriggered = true;
        
        // Randomly award a Mulligan or Gimme
        let rewardType = Math.random() < 0.5 ? "Mulligan" : "Gimme";
        if (typeof players !== 'undefined' && players[currentPlayerIndex]) {
            let p = players[currentPlayerIndex];
            if (rewardType === "Mulligan") p.earnedMulligans = (p.earnedMulligans || 0) + 1;
            else p.earnedGimmes = (p.earnedGimmes || 0) + 1;
        }
        
        let bounceMsg = `BRAWK! You beaned a rooster! It dropped a free ${rewardType}! The ball settled ${Math.round(bounceDist)} yards away.`;
        flightPathNarrative = flightPathNarrative ? flightPathNarrative + ' ' + bounceMsg : bounceMsg;

        let delayMs = (hangTimeSecs || 4.5) * 1000;
        let panValue = Math.max(-1, Math.min(1, ballX / 25));

        let timeoutId = setTimeout(() => {
            // Grab Bag Logic for Rooster Audio
            window.roosterSounds = window.roosterSounds || ['rooster1', 'rooster2', 'rooster3', 'rooster4', 'rooster5', 'rooster6'];
            window.roosterSounds.sort(() => Math.random() - 0.5); 
            
            let roosterFile = window.roosterSounds.pop() || 'rooster1';
            if (window.roosterSounds.length === 0) {
                window.roosterSounds = ['rooster1', 'rooster2', 'rooster3', 'rooster4', 'rooster5', 'rooster6'];
            }
            
            if (typeof audioCtx !== 'undefined' && audioCtx) {
                let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                
                // Play Rooster Sound
                let audioEl = new Audio('audio/courses/pasture/' + roosterFile + '.mp3');
                audioEl.volume = vol;
                let source = audioCtx.createMediaElementSource(audioEl);
                let panner = audioCtx.createStereoPanner();
                panner.pan.value = panValue;
                source.connect(panner);
                panner.connect(audioCtx.destination);
                audioEl.play().catch(e => {});

                // Play Bonus Sound 800ms later
                setTimeout(() => {
                    let audioBonus = new Audio('audio/courses/pasture/freechicken.mp3');
                    audioBonus.volume = vol;
                    let bonusSource = audioCtx.createMediaElementSource(audioBonus);
                    let bonusPanner = audioCtx.createStereoPanner();
                    bonusPanner.pan.value = panValue;
                    bonusSource.connect(bonusPanner);
                    bonusPanner.connect(audioCtx.destination);
                    audioBonus.play().catch(e => {});
                }, 800);

            } else {
                new Audio('audio/courses/pasture/' + roosterFile + '.mp3').play().catch(e => {});
                setTimeout(() => { new Audio('audio/courses/pasture/freechicken.mp3').play().catch(e => {}); }, 800);
            }
            
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_04');
            window.announce(bounceMsg);
            if (document.getElementById('visual-output')) document.getElementById('visual-output').innerText = bounceMsg;
        }, delayMs);

        if (typeof window.stateTimeouts !== 'undefined') {
            window.stateTimeouts.push(timeoutId);
        } else if (stateTimeouts) {
            stateTimeouts.push(timeoutId);
        }
    }

    // v5.0.7 Bot Infinite Hazard Loop Failsafe
    if (isBotTurn && gameMode === 'course') {
        let p = players[currentPlayerIndex];
        if (inWater || currentLie === "Sand") {
            p.consecutiveHazards = (p.consecutiveHazards || 0) + 1;
            if (p.consecutiveHazards >= 3) {
                ballY = Math.max(0, ballY - 80); // Move 80 yards back to force a full swing
                ballX = 0;
                currentLie = "Fairway";
                strokes++; // Unplayable penalty stroke
                p.consecutiveHazards = 0; // Reset counter
                let unplayableMsg = "After repeatedly failing to clear the hazard, the bot declared an Unplayable Lie, taking an additional penalty stroke and dropping 80 yards back into the fairway.";
                flightPathNarrative = flightPathNarrative ? flightPathNarrative + " " + unplayableMsg : unplayableMsg;
            }
        } else {
            p.consecutiveHazards = 0;
        }
    }

    if (currentLie === "Packed Earth") {
        rollDistance = Math.round(rollDistance * 1.5);
        totalDistance = carryDistance + rollDistance;
    }

    // v5.59.0 The Sinkhole Funnel
    if (typeof window.currentCourse !== 'undefined' && window.currentCourse.name === "The Pasture" && typeof hole !== 'undefined' && hole === 8) {
        let distToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));
        // If the ball misses the 35y green but lands within the 80y crater
        if (distToPin > 35 && distToPin < 80) {
            currentLie = "Rough";
            let kickNarrative = " The ball caught the upper rim and spiraled violently down the porcelain bowl!";
            if (typeof flightPathNarrative !== 'undefined') flightPathNarrative += kickNarrative;

            // Pull laterally towards center
            ballX = ballX * 0.2;

            // Push vertically towards the green
            if (ballY < pinY) ballY += 25; // Kicks forward if short
            else ballY -= 25;               // Kicks backward if long

            // Cap the funnel so it stops exactly at the edge of the green (35 yards)
            let newDistToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));
            if (newDistToPin < 35) {
                ballY = pinY > ballY ? pinY - 35.1 : pinY + 35.1;
                currentLie = "Fringe"; // Gives them a clean look from the edge
            }
        }
    }

    return { currentLie, inWater, rollStopTriggered, ballX, ballY, rollDistance, totalDistance, strokes, flightPathNarrative };
};
