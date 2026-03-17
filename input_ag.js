// input_ag.js - Keyboard Controls and Event Listeners (v3.37.0)

window.addEventListener('keydown', (e) => {
    if (e.code === 'F1') {
        e.preventDefault(); devPower = !devPower; window.announce(`Dev Power 100% ${devPower ? 'On' : 'Off'}`);
    }
    if (e.code === 'F2') {
        e.preventDefault(); devHinge = !devHinge; window.announce(`Dev Perfect Hinge ${devHinge ? 'On' : 'Off'}`);
    }
    if (e.code === 'F3') {
        e.preventDefault(); devImpact = !devImpact; window.announce(`Dev Perfect Impact ${devImpact ? 'On' : 'Off'}`);
    }

    if (confirmingRange) {
        if (e.code === 'KeyY' || e.code === 'Enter') {
            e.preventDefault();
            gameMode = 'range'; confirmingRange = false; strokes = 0; holeTelemetry = []; ballX = 0; ballY = 0; pinX = 0; pinY = club.baseDistance; rangeLie = 'Fairway'; isHoleComplete = false; swingState = 0; if (typeof isPutting !== 'undefined') isPutting = false;
            window.announce(`Welcome to the Driving Range. Target set to ${pinY} yards. Lie is ${rangeLie}.`);
            document.getElementById('visual-output').innerText = `Driving Range. Target: ${pinY}. Lie: ${rangeLie}.`;
        } else {
            confirmingRange = false; window.announce("Range travel cancelled.");
        }
        return;
    }

    if (confirmingGreen) {
        if (e.code === 'KeyY' || e.code === 'Enter') {
            e.preventDefault();
            gameMode = 'chipping'; confirmingGreen = false; strokes = 0; holeTelemetry = []; isHoleComplete = false; swingState = 0;
            ballX = 0; ballY = 0; pinX = 0;
            pinY = chippingRange === 'short' ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 61) + 20;
            let targetDist = calculateDistanceToPin();
            window.announce(`Welcome to the Chipping Green. Target is ${targetDist} yards.`);
            document.getElementById('visual-output').innerText = `Chipping Green. Target: ${targetDist} yards.`;
        } else {
            confirmingGreen = false; window.announce("Chipping Green travel cancelled.");
        }
        return;
    }

    if (swingState === 0 || isHoleComplete) {
        if (e.code === 'KeyC') {
            e.preventDefault();
            if (e.shiftKey) {
                let exportData = holeTelemetry.length > 0 ? holeTelemetry.join('\n\n---\n\n') : lastShotReport;
                navigator.clipboard.writeText(exportData).then(() => {
                    const msg = `Copied ${holeTelemetry.length} shots to clipboard.`;
                    document.getElementById('visual-output').innerText = msg; window.announce(msg);
                });
            } else {
                document.getElementById('visual-output').innerText = lastShotReport; window.announce(lastShotReport);
            }
            return;
        }
        if (e.code === 'KeyL') {
            e.preventDefault();
            if (gameMode === 'range') {
                rangeLie = rangeLie === 'Fairway' ? 'Rough' : 'Fairway';
                const lieMsg = `Virtual lie set to ${rangeLie}.`;
                document.getElementById('visual-output').innerText = lieMsg; window.announce(lieMsg);
            } else {
                const lieMsg = `Ball is on the ${currentLie}.`;
                document.getElementById('visual-output').innerText = lieMsg; window.announce(lieMsg);
            }
            return;
        }
        if (e.code === 'KeyR') {
            e.preventDefault(); confirmingRange = true; window.announce("Go to Driving Range? Press Y or Enter to confirm."); return;
        }
        if (e.code === 'KeyG') {
            e.preventDefault();
            if (e.shiftKey) {
                chippingRange = chippingRange === 'short' ? 'long' : 'short';
                let newTarget = chippingRange === 'short' ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 61) + 20;
                if (gameMode === 'chipping') {
                    ballX = 0; ballY = 0; pinX = 0; pinY = newTarget;
                    let targetDist = calculateDistanceToPin();
                    window.announce(`Chipping range set to ${chippingRange}. New target: ${targetDist} yards.`);
                } else {
                    window.announce(`Chipping range set to ${chippingRange}.`);
                }
            } else {
                confirmingGreen = true; window.announce("Go to Chipping Green? Press Y or Enter to confirm.");
            }
            return;
        }
        if (e.code.startsWith('Digit') && e.code !== 'Digit0') {
            e.preventDefault();
            let targetHole = parseInt(e.code.replace('Digit', ''));
            if (e.shiftKey) targetHole += 9;

            gameMode = 'course'; 
            confirmingRange = false;
            if (typeof isPutting !== 'undefined') isPutting = false;

            loadHole(targetHole);

            let targetDist = calculateDistanceToPin();
            let msg = `Warping to Hole ${hole}. Par ${par}. ${targetDist} yards.`;
            window.announce(msg); 
            document.getElementById('visual-output').innerText = msg;
            return;
        }
    }

    // --- v2.30.0 Hazard List Menu ---
    if (swingState === 0) {
        if (e.code === 'KeyH') {
            e.preventDefault();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            // Combine hazards and trees into one list for the menu
            const allObstacles = [...(holeData.hazards || []), ...(holeData.trees || [])];
            
            if (allObstacles.length === 0) {
                window.announce("No hazards or trees on this hole.");
                return;
            }
            viewingHazards = !viewingHazards;
            if (viewingHazards) {
                hazardIndex = 0;
                window.announceHazard(allObstacles[hazardIndex]);
            } else {
                window.announce("Exited Obstacle List.");
                document.getElementById('visual-output').innerText = getSetupReport();
            }
            return;
        }

        if (viewingHazards) {
            e.preventDefault();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            const allObstacles = [...(holeData.hazards || []), ...(holeData.trees || [])];
            if (e.code === 'ArrowDown') {
                if (hazardIndex < allObstacles.length - 1) hazardIndex++;
                window.announceHazard(allObstacles[hazardIndex]);
            }
            if (e.code === 'ArrowUp') {
                if (hazardIndex > 0) hazardIndex--;
                window.announceHazard(allObstacles[hazardIndex]);
            }
            if (e.code === 'Escape') {
                viewingHazards = false; 
                window.announce("Exited Obstacle List.");
                document.getElementById('visual-output').innerText = getSetupReport();
            }
            return; // Block swing/aim inputs while viewing hazards
        }
    }

    if (isHoleComplete || e.repeat || swingState === 5) return;

    if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (swingState === 0) startBackswing();
        else if (swingState === 4) calculateShot(false);
    }

    if (e.code === 'Space') {
        e.preventDefault();
        playTone(880, 'sine', 0.1, 0.25);
        if (swingState === 1) hingeTimeBack = performance.now() - backswingStartTime;
        if (swingState === 3) hingeTimeDown = performance.now() - downswingStartTime;
    }

    if (swingState === 0) {
        if (e.code === 'Home' || e.code === 'End') {
            e.preventDefault();
            if (e.code === 'Home') stanceIndex = Math.max(0, stanceIndex - 1);
            if (e.code === 'End') stanceIndex = Math.min(4, stanceIndex + 1);
            const stanceReport = getStanceReport();
            document.getElementById('visual-output').innerText = stanceReport; window.announce(stanceReport);
        }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
            if (e.shiftKey) {
                stanceAlignment += e.code === 'ArrowLeft' ? -1 : 1;
                stanceAlignment = Math.max(-2, Math.min(2, stanceAlignment));
                const stanceReport = getStanceReport();
                document.getElementById('visual-output').innerText = stanceReport; window.announce(stanceReport);
            } else {
                aimAngle += e.code === 'ArrowLeft' ? -1 : 1;
                aimAngle = Math.max(-90, Math.min(90, aimAngle));
                const aimReport = getAimReport();
                document.getElementById('visual-output').innerText = aimReport; window.announce(aimReport);
            }
        }
        if (e.code === 'KeyW') {
            e.preventDefault();
            if (e.shiftKey) {
                windLevelIndex = (windLevelIndex + 1) % windLevels.length; generateWind();
                const level = windLevels[windLevelIndex];
                const windMsg = `Wind level set to ${level.name}. ${getWindReport()}`;
                document.getElementById('visual-output').innerText = windMsg; window.announce(windMsg);
            } else {
                const windReport = getWindReport();
                document.getElementById('visual-output').innerText = windReport; window.announce(windReport);
            }
        }
        if (e.code === 'KeyD' && gameMode === 'course') {
            e.preventDefault();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            if (holeData.description) {
                document.getElementById('visual-output').innerText = holeData.description; 
                window.announce(holeData.description);
            } else {
                window.announce("No description available for this hole.");
            }
            return;
        }
        if (e.code === 'PageUp') {
            e.preventDefault();
            if (currentClubIndex > 0) {
                currentClubIndex--; club = clubs[currentClubIndex];
                if (gameMode === 'range') { pinY = club.baseDistance; pinX = 0; }
                const setupReport = getSetupReport();
                window.announce(setupReport); document.getElementById('visual-output').innerText = setupReport;
            }
        }
        if (e.code === 'PageDown') {
            e.preventDefault();
            if (currentClubIndex < clubs.length - 1) {
                currentClubIndex++; club = clubs[currentClubIndex];
                if (gameMode === 'range') { pinY = club.baseDistance; pinX = 0; }
                const setupReport = getSetupReport();
                window.announce(setupReport); document.getElementById('visual-output').innerText = setupReport;
            }
        }
        if (e.code === 'KeyS') {
            e.preventDefault(); shotStyleIndex = (shotStyleIndex + 1) % shotStyles.length;
            const typeMsg = getSetupReport();
            document.getElementById('visual-output').innerText = typeMsg; window.announce(typeMsg);
        }
        if (e.code === 'KeyX') {
            e.preventDefault();
            const style = shotStyles[shotStyleIndex];
            const baseCarry = club.baseDistance * style.distMod;
            const baseTotal = Math.round(baseCarry + (baseCarry * (club.rollPct * style.rollMod)));
            const msg = `Holding ${club.name}. Expect ${baseTotal} yards at 100% power under ideal conditions.`;
            document.getElementById('visual-output').innerText = msg; window.announce(msg);
        }
        if (e.code === 'KeyZ' && gameMode === 'course') {
            e.preventDefault();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            let validTargets = [];
            if (holeData.zones) validTargets = holeData.zones.filter(z => z.y > ballY + 15);
            validTargets.push({ name: "The Pin", x: holeData.pinX, y: holeData.pinY });
            
            currentZoneIndex = (currentZoneIndex + 1) % validTargets.length;
            let selectedTarget = validTargets[currentZoneIndex];
            targetX = selectedTarget.x;
            targetY = selectedTarget.y;
            aimAngle = 0; // Reset aim when shifting targets
            
            let dist = Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
            
            let lieMultiplier = 1.0;
            if (currentLie === 'Sand') lieMultiplier = 0.70;
            else if (currentLie === 'Light Rough' || (gameMode === 'range' && rangeLie === 'Rough')) lieMultiplier = 0.90;

            let bestClubIndex = 0; let smallestDiff = 9999;
            for (let i = 0; i < clubs.length; i++) {
                if (clubs[i].name === "Putter") continue;
                let expectedDist = clubs[i].baseDistance * lieMultiplier;
                let diff = Math.abs(expectedDist - dist);
                if (diff < smallestDiff) { smallestDiff = diff; bestClubIndex = i; }
            }
            currentClubIndex = bestClubIndex; club = clubs[currentClubIndex];
            
            let msg = `Target shifted to ${selectedTarget.name}, ${dist} yards away. Auto-equipped ${club.name}.`;
            window.announce(msg); document.getElementById('visual-output').innerText = msg;
            return;
        }
        if (e.code === 'KeyT') {
            e.preventDefault(); 
            let distToPin = calculateDistanceToPin();
            let distMsg = "";
            if (gameMode === 'course') {
                const holeData = courses[currentCourseIndex].holes[hole - 1];
                if (targetY !== holeData.pinY || targetX !== holeData.pinX) {
                    let distToTarget = Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
                    distMsg += `Aiming at zone, ${distToTarget} yards away. `;
                }
                distMsg += `${distToPin} yards to the pin.`;
                if (holeData.pinLocation) distMsg += ` Pin is ${holeData.pinLocation}.`;
                distMsg += getSightReport(); 
            } else {
                distMsg = `${distToPin} yards to the pin.`;
            }
            
            document.getElementById('visual-output').innerText = distMsg; 
            window.announce(distMsg);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' && (swingState === 1 || swingState === 2)) {
        e.preventDefault(); startDownswing();
    }
});