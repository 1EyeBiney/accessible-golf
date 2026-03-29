// physics_collisions.js - Hazard Detection, Lie Penalties, and Terrain Collision (v5.30.0)

// --- TERRAIN QUERIES ---

window.getTerrainAt = function(x, y) {
    if (gameMode !== 'course') return typeof rangeTargetLie !== 'undefined' ? rangeTargetLie : "Fairway";

    const holeData = window.currentCourse.holes[hole - 1];
    let distToPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    const greenSize = holeData.greenRadius || 20;

    if (distToPin <= greenSize) return "Green";

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
            const hLeft = h.offset - (h.width / 2);
            const hRight = h.offset + (h.width / 2);
            const hStart = h.distance;
            const hEnd = h.distance + h.depth;
            if (y >= hStart && y <= hEnd && x >= hLeft && x <= hRight) {
                terrain = h.type === "Bunker" ? "Sand" : h.type;
            }
        });
    }
    return terrain;
};

// v4.37.1 Landing Zone Oracle
window.getLandingZoneEffect = function(x, y) {
    if (gameMode !== 'course') return "";
    const holeData = window.currentCourse.holes[hole - 1];
    if (!holeData || !holeData.greenType || typeof greenDictionary === 'undefined') return "";

    // Calculate distance from the targeted coordinates to the pin
    let distFromPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    let activeContours = greenDictionary[holeData.greenType] || [];

    // Find the contour zone that governs this specific distance from the cup
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
        players, currentPlayerIndex, isBotTurn
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

    return { currentLie, inWater, rollStopTriggered, ballX, ballY, rollDistance, totalDistance, strokes, flightPathNarrative };
};
