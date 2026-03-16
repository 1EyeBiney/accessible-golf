// input_ag.js - Keyboard Controls and Event Listeners

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
            gameMode = 'range'; confirmingRange = false; strokes = 0; ballX = 0; ballY = 0; pinX = 0; pinY = club.baseDistance; rangeLie = 'Fairway'; isHoleComplete = false; swingState = 0; if (typeof isPutting !== 'undefined') isPutting = false;
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
            gameMode = 'chipping'; confirmingGreen = false; strokes = 0; isHoleComplete = false; swingState = 0;
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
        if (e.code === 'KeyC') {
            e.preventDefault();
            if (e.shiftKey) {
                navigator.clipboard.writeText(lastShotReport).then(() => {
                    const msg = "Telemetry copied to clipboard.";
                    document.getElementById('visual-output').innerText = msg; window.announce(msg);
                }).catch(err => {
                    const errMsg = "Failed to copy telemetry.";
                    document.getElementById('visual-output').innerText = errMsg; window.announce(errMsg);
                });
            } else {
                document.getElementById('visual-output').innerText = lastShotReport; window.announce(lastShotReport);
            }
        }
        if (e.code === 'KeyL' && gameMode === 'range') {
            e.preventDefault(); rangeLie = rangeLie === 'Fairway' ? 'Rough' : 'Fairway';
            const lieMsg = `Virtual lie set to ${rangeLie}.`;
            document.getElementById('visual-output').innerText = lieMsg; window.announce(lieMsg);
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
        if (e.code === 'KeyT') {
            e.preventDefault(); const distMsg = `${calculateDistanceToPin()} yards to the pin.`;
            document.getElementById('visual-output').innerText = distMsg; window.announce(distMsg);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' && (swingState === 1 || swingState === 2)) {
        e.preventDefault(); startDownswing();
    }
});