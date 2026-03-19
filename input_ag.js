// input_ag.js - Keyboard Controls and Event Listeners (v4.19.3)

window.addEventListener('keydown', (e) => {
    // v4.11.0 Custom Grid Interceptor
    if (viewingScorecard) {
        e.preventDefault(); // Lock ALL inputs
        
        if (e.code === 'Escape' || e.code === 'Enter') {
            viewingScorecard = false;
            document.getElementById('scorecard-container').style.display = 'none';
            document.getElementById('visual-output').style.display = 'block';
            window.announce("Exited Scorecard.");
            document.getElementById('visual-output').innerText = getSetupReport();
            return;
        }
        
        if (e.code === 'ArrowRight') {
            if (scCol < scorecardGrid[0].length - 1) { scCol++; window.announceScorecardCell(); }
            else { window.announce("Right edge."); }
        } else if (e.code === 'ArrowLeft') {
            if (scCol > 0) { scCol--; window.announceScorecardCell(); }
            else { window.announce("Left edge."); }
        } else if (e.code === 'ArrowDown') {
            if (scRow < scorecardGrid.length - 1) { scRow++; window.announceScorecardCell(); }
            else { window.announce("Bottom edge."); }
        } else if (e.code === 'ArrowUp') {
            if (scRow > 0) { scRow--; window.announceScorecardCell(); }
            else { window.announce("Top edge."); }
        }
        return; 
    }

    // v4.14.0 Grid Target Navigation Interceptor
    if (activeTargetType === 'grid' && isGridNavigating) {
        e.preventDefault();

        if (e.code === 'ArrowUp') {
            gridY += 1;
            window.announceGridPosition();
        } else if (e.code === 'ArrowDown') {
            gridY -= 1;
            window.announceGridPosition();
        } else if (e.code === 'ArrowLeft') {
            gridX -= 1;
            window.announceGridPosition();
        } else if (e.code === 'ArrowRight') {
            gridX += 1;
            window.announceGridPosition();
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            targetX = pinX + gridX;
            targetY = pinY + gridY;
            isGridNavigating = false; 
            activeTargetType = 'grid'; 

            // v4.14.5 Pin Finder Auto-Equip
            let distToTarget = Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
            let lieMultiplier = currentLie === 'Sand' ? 0.70 : (currentLie === 'Light Rough' || currentLie === 'Rough') ? 0.90 : 1.0;
            let currentStyle = shotStyles[shotStyleIndex];
            let chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
            let bestClubIndex = currentClubIndex;
            let smallestDiff = 9999;

            for (let i = 0; i < clubs.length; i++) {
                if (clubs[i].name === "Putter") continue;
                
                // Evaluate using the CURRENT stance, do not change it
                let dynamicLoft = Math.max(0, clubs[i].loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
                let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
                let expectedDist = clubs[i].baseDistance * lieMultiplier * loftDistMod * chokeMod;
                
                let diff = Math.abs(expectedDist - distToTarget);
                if (diff < smallestDiff) { 
                    smallestDiff = diff; 
                    bestClubIndex = i; 
                }
            }
            
            currentClubIndex = bestClubIndex; 
            club = clubs[currentClubIndex];
            aimAngle = 0; // Reset aim directly at the new target

            let msg = `Pin Finder target locked at ${distToTarget} yards. Auto-equipped ${club.name}. Returning to swing mode.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            window.updateDashboard();
        }
        return;
    }

    // v4.12.0 Clubhouse Interceptor
    if (gameMode === 'clubhouse') {
        e.preventDefault();
        
        // Pass Escape out of the Help Menu back to the Clubhouse
        if (viewingHelp) {
            if (e.code === 'ArrowDown') { if (helpIndex < helpMenuText.length - 1) helpIndex++; window.announceHelp(); }
            else if (e.code === 'ArrowUp') { if (helpIndex > 0) helpIndex--; window.announceHelp(); }
            else if (e.code === 'Escape' || e.code === 'Enter') {
                viewingHelp = false; window.announce("Exited Help Menu."); window.announceClubhouse();
            }
            return;
        }

        if (e.code === 'ArrowDown') {
            if (clubhouseIndex < clubhouseMenu.length - 1) clubhouseIndex++;
            window.announceClubhouse(false);
        } else if (e.code === 'ArrowUp') {
            if (clubhouseIndex > 0) clubhouseIndex--;
            window.announceClubhouse(false);
        } else if (e.code === 'Enter') {
            clubhouseMenu[clubhouseIndex].action();
        }
        return; 
    }

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

    if (confirmingPutting) {
        if (e.code === 'KeyY' || e.code === 'Enter') {
            e.preventDefault();
            gameMode = 'putting'; confirmingPutting = false; strokes = 0; holeTelemetry = []; isHoleComplete = false;
            ballX = 0; ballY = 0; pinX = 0; pinY = Math.floor(Math.random() * 41) + 5; // 5 to 45 yards
            window.initPutting();
        } else {
            confirmingPutting = false; window.announce("Putting Green travel cancelled.");
        }
        return;
    }

    // v4.13.0 Context-Sensitive Quit Confirmation
    if (confirmingQuit) {
        e.preventDefault();
        if (e.code === 'KeyS') {
            confirmingQuit = false;
            if (typeof window.saveGame === 'function') window.saveGame();
            gameMode = 'clubhouse';
            document.getElementById('dashboard-panel').style.display = 'none';
            document.getElementById('swing-meter').style.display = 'none';
            window.announce("Round saved.");
            window.buildClubhouseMenu();
        } else if (e.code === 'KeyA') {
            confirmingQuit = false;
            window.clearSave(); // Wipe the save state
            gameMode = 'clubhouse';
            document.getElementById('dashboard-panel').style.display = 'none';
            document.getElementById('swing-meter').style.display = 'none';
            window.announce("Round abandoned.");
            window.buildClubhouseMenu();
        } else if (e.code === 'Escape') {
            confirmingQuit = false;
            window.announce("Quit cancelled.");
            document.getElementById('visual-output').innerText = getSetupReport();
        }
        return;
    }

    // --- v3.70.0 Help Menu Interceptor ---
    if (viewingHelp) {
        e.preventDefault();
        if (e.code === 'ArrowDown') {
            if (helpIndex < helpMenuText.length - 1) helpIndex++;
            window.announceHelp();
        } else if (e.code === 'ArrowUp') {
            if (helpIndex > 0) helpIndex--;
            window.announceHelp();
        } else if (e.code === 'KeyH') {
            if (e.shiftKey) {
                for (let i = helpIndex - 1; i >= 0; i--) {
                    if (helpMenuText[i].heading) { helpIndex = i; break; }
                }
            } else {
                for (let i = helpIndex + 1; i < helpMenuText.length; i++) {
                    if (helpMenuText[i].heading) { helpIndex = i; break; }
                }
            }
            window.announceHelp();
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            viewingHelp = false;
            window.announce("Exited Help Menu.");
            if (gameMode === 'clubhouse') window.announceClubhouse(); 
            else document.getElementById('visual-output').innerText = getSetupReport();
        }
        return; // Block all other inputs while viewing help
    }

    if (swingState === 0 || isHoleComplete) {
        // v4.13.0 Context-Sensitive Quit Trigger
        if (e.code === 'KeyQ') {
            e.preventDefault();
            if (gameMode === 'course') {
                confirmingQuit = true;
                let msg = "Quit Menu. Press S to Save and Exit, A to Abandon Round, or Escape to cancel.";
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
            } else {
                gameMode = 'clubhouse';
                document.getElementById('dashboard-panel').style.display = 'none';
                document.getElementById('swing-meter').style.display = 'none';
                window.announce("Exited practice area.");
                window.buildClubhouseMenu();
            }
            return;
        }

        if (e.code === 'KeyE') {
            e.preventDefault();
            if (e.shiftKey) {
                viewingScorecard = true; window.showScorecard();
                window.announce("Full Scorecard open. Use your screen reader's native table navigation commands to read. Press Escape to close.");
            } else {
                let quick = window.getQuickScore();
                document.getElementById('visual-output').innerText = quick; window.announce(quick);
            }
            return;
        }

        if (e.key === '?') {
            e.preventDefault();
            viewingHelp = true;
            helpIndex = 0;
            window.announceHelp();
            return;
        }
        if (e.code === 'KeyP' && e.shiftKey) {
            e.preventDefault(); confirmingPutting = true; window.announce("Go to Practice Putting Green? Press Y or Enter to confirm."); return;
        }
        if ((gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long'))) {
            if (e.code === 'KeyY') {
                e.preventDefault();
                if (e.shiftKey && synthTreeActive) {
                    synthTreeHeight += 10;
                    if (synthTreeHeight > 100) synthTreeHeight = 20;
                    window.announce(`Synth Tree height manually adjusted to ${synthTreeHeight} feet.`);
                } else if (!e.shiftKey) {
                    synthTreeActive = !synthTreeActive;
                    if (!synthTreeActive) {
                        window.announce("Synth Tree removed. Practice area is clear.");
                    } else {
                        synthTreeDist = Math.round(calculateDistanceToPin() * 0.70);
                        synthTreeX = 0;
                        
                        // Ghost Simulation for Threshold Math
                        let currentStyle = shotStyles[shotStyleIndex];
                        let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));

                        // v3.81.1 Parabolic Math (Simulating 110% power)
                        let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
                        let chokeMod = isChokedDown ? 0.9 : 1.0;
                        let expectedTotal = club.baseDistance * currentStyle.distMod * loftDistMod * chokeMod * 1.1;

                        let backspinRPM = Math.max(400, Math.round((club.loft * 150) + 1100 + 700 + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
                        let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
                        let expectedRoll = expectedTotal * club.rollPct * currentStyle.rollMod * spinRollMod;
                        if (shotStyleIndex > 0 && shotStyleIndex < 5 && expectedRoll < (expectedTotal * 0.1)) expectedRoll = expectedTotal * 0.15 * spinRollMod;

                        let expectedCarry = Math.max(1, expectedTotal - expectedRoll);
                        let apexYards = (Math.tan(dynamicLoft * Math.PI / 180) / expectedCarry) * synthTreeDist * (expectedCarry - synthTreeDist);
                        let perfectApexFeet = Math.max(0, apexYards * 3);
                        synthTreeHeight = perfectApexFeet;
                        
                        window.announce(`Synth Tree spawned Dead Center, ${synthTreeDist} yards away. Threshold height set to ${Math.round(synthTreeHeight)} feet based on a 110% power shot with your active club.`);
                    }
                }
                window.updateDashboard();
                return;
            }
            if (synthTreeActive) {
                if (e.code === 'BracketRight') { e.preventDefault(); synthTreeX += 5; window.announce(`Synth Tree moved to ${synthTreeX} yards Right.`); window.updateDashboard(); return; }
                if (e.code === 'BracketLeft') { e.preventDefault(); synthTreeX -= 5; window.announce(`Synth Tree moved to ${Math.abs(synthTreeX)} yards Left.`); window.updateDashboard(); return; }
                if (e.code === 'Equal') { e.preventDefault(); synthTreeDist += 5; window.announce(`Synth Tree moved back to ${synthTreeDist} yards.`); window.updateDashboard(); return; }
                if (e.code === 'Minus') { e.preventDefault(); synthTreeDist = Math.max(5, synthTreeDist - 5); window.announce(`Synth Tree moved closer to ${synthTreeDist} yards.`); window.updateDashboard(); return; }
            }
        }
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
            window.updateDashboard();
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

            strokes = 0; holeTelemetry = [];
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
            if (e.code === 'Escape' || e.code === 'Enter') {
                viewingHazards = false; 
                window.announce("Exited Obstacle List.");
                document.getElementById('visual-output').innerText = getSetupReport();
            }
            return; // Block swing/aim inputs while viewing hazards
        }
    }

    if (e.repeat) return;

    // v4.10.0 Next Hole Progression
    if (isHoleComplete && gameMode === 'course') {
        if (e.code === 'Enter') {
            e.preventDefault();
            const course = courses[currentCourseIndex];
            if (hole < course.holes.length) {
                loadHole(hole + 1);
                let targetDist = calculateDistanceToPin();
                let msg = `Hole ${hole}. Par ${par}. ${targetDist} yards.`;
                window.announce(msg); document.getElementById('visual-output').innerText = msg;
            } else {
                window.announce("Round Complete! Press Shift E to view your final scorecard.");
            }
        }
        return;
    }

    if (isHoleComplete) return;
    if (swingState === 5) return;

    // --- v4.4.1 PUTTING CONTROLS (Mode Toggle) ---
    if (isPutting && (swingState === 0 || isHoleComplete)) {
        if (e.code === 'KeyZ' && e.shiftKey) { // v4.18.0 Unified Putting Grid toggle
            e.preventDefault();
            puttState = puttState === 0 ? 1 : 0;
            let msg = puttState === 1 ? `Swing Mode. Target is ${puttTargetDist} yards. Press Down Arrow to start stroke.` : `Targeting Mode. Use arrows to adjust aim and distance.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            window.updateDashboard();
            return;
        }

        if (e.code === 'KeyT') {
            e.preventDefault();
            if (gameMode === 'putting') {
                ballX = 0; ballY = 0; pinX = 0; pinY = Math.floor(Math.random() * 41) + 5; // 5 to 45 yards
                let dist = calculateDistanceToPin();
                puttTargetDist = dist; aimAngle = 0; puttState = 0;
                let msg = `New target flag set at ${dist} yards. Targeting Mode active.`;
                window.announce(msg); document.getElementById('visual-output').innerText = msg;
                window.updateDashboard();
            }
            return;
        }

        if (puttState === 0) {
            // v4.16.0 The Cup Locator
            let updatePuttTarget = () => {
                let distToPin = 0;
                if (typeof calculateDistanceToPin === 'function') distToPin = Math.round(calculateDistanceToPin());
                else distToPin = Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
                
                let isCup = (puttTargetDist === distToPin && aimAngle === 0);
                let locStr = isCup ? " (The Cup)" : "";
                let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;
                let msg = `Target: ${puttTargetDist} yards, Aim: ${aimStr}${locStr}`;
                window.announce(msg);
                window.updateDashboard();
            };
            
            if (e.code === 'ArrowUp') { e.preventDefault(); puttTargetDist += 1; updatePuttTarget(); return; }
            if (e.code === 'ArrowDown') { e.preventDefault(); puttTargetDist = Math.max(1, puttTargetDist - 1); updatePuttTarget(); return; }
            if (e.code === 'ArrowRight') { e.preventDefault(); aimAngle += 1; updatePuttTarget(); return; }
            if (e.code === 'ArrowLeft') { e.preventDefault(); aimAngle -= 1; updatePuttTarget(); return; }
            
            // v4.17.0 Putting Enter-to-Lock Consistency
            if (e.code === 'Enter' || e.code === 'Escape') {
                e.preventDefault();
                puttState = 1; // Switch to Swing Mode
                let msg = `Putt target locked at ${puttTargetDist} yards. Swing Mode active. Press Down Arrow to start stroke.`;
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
                window.updateDashboard();
                return;
            }
        } else if (puttState === 1) {
            // Swing Mode: Block other arrows, let ArrowDown pass to the swing initiator
            if (e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                e.preventDefault(); return; 
            }
        }
        
        if (e.code === 'KeyC') { 
            e.preventDefault(); 
            document.getElementById('visual-output').innerText = lastShotReport; window.announce(lastShotReport);
            return;
        }
        
        // Block stance keys
        if (e.code === 'Home' || e.code === 'End') { e.preventDefault(); return; }
    }

    if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (swingState === 0) startBackswing(false);
        else if (swingState === 4) {
            if (typeof calculateShot === 'function') calculateShot(false); // Success!
        }
    }

    if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (swingState === 0) startBackswing(true);
        else if (swingState === 4) {
            lockedImpactTime = performance.now() - impactStartTime;
            if (typeof window.evaluatePracticeSwing === 'function') window.evaluatePracticeSwing();
        }
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
            window.updateDashboard();
        }
        if (e.code === 'KeyS') {
            e.preventDefault();
            // v4.19.1 Cycle Swing Styles
            if (e.shiftKey) {
                shotStyleIndex = (shotStyleIndex + 1) % shotStyles.length;
            } else {
                shotStyleIndex = (shotStyleIndex - 1 + shotStyles.length) % shotStyles.length;
            }
            const style = shotStyles[shotStyleIndex];
            const msg = `Swing Style: ${style.name}.`;
            document.getElementById('visual-output').innerText = msg;
            window.announce(msg);
            window.updateDashboard();
            return;
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
            if (viewingHazards && !e.shiftKey) {
                const holeData = courses[currentCourseIndex].holes[hole - 1];
                const allObstacles = [...(holeData.hazards || []), ...(holeData.trees || [])];
                window.announceHazard(allObstacles[hazardIndex]);
            }
            window.updateDashboard();
        }
        if (e.code === 'KeyW') {
            e.preventDefault();
            if (e.shiftKey) {
                windLevelIndex = (windLevelIndex + 1) % windLevels.length; generateWind();
                const level = windLevels[windLevelIndex];
                const windMsg = `Wind level set to ${level.name}. ${getWindReport()}`;
                document.getElementById('visual-output').innerText = windMsg; window.announce(windMsg);
                window.updateDashboard();
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
        if (e.code === 'KeyA') {
            e.preventDefault();
            if (e.shiftKey) {
                caddyLevel = caddyLevel >= 3 ? 1 : caddyLevel + 1;
                let levelName = caddyLevel === 1 ? "Rookie" : caddyLevel === 2 ? "Veteran" : "Tour Pro";
                let msg = `Caddy swapped. You now have a Level ${caddyLevel} (${levelName}) Caddy.`;
                document.getElementById('visual-output').innerText = msg;
                window.announce(msg);
            } else {
                let advice = window.getCaddyAdvice();
                document.getElementById('visual-output').innerText = advice;
                window.announce(advice);
            }
            return;
        }
        if (e.code === 'KeyF' && gameMode === 'course') {
            e.preventDefault();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            let fwMsg = holeData.fairwayDescription || `The fairway is ${holeData.fairwayWidth} yards wide.`;
            document.getElementById('visual-output').innerText = fwMsg;
            window.announce(fwMsg);
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
            window.updateDashboard();
        }
        if (e.code === 'PageDown') {
            e.preventDefault();
            if (currentClubIndex < clubs.length - 1) {
                currentClubIndex++; club = clubs[currentClubIndex];
                if (gameMode === 'range') { pinY = club.baseDistance; pinX = 0; }
                const setupReport = getSetupReport();
                window.announce(setupReport); document.getElementById('visual-output').innerText = setupReport;
            }
            window.updateDashboard();
        }
        if (e.code === 'KeyV') {
            e.preventDefault();
            isChokedDown = !isChokedDown;
            const gripMsg = isChokedDown ? "Choked down grip. Distance capped at 90 percent. Control increased." : "Full grip. 100 percent distance.";
            document.getElementById('visual-output').innerText = gripMsg;
            window.announce(gripMsg);
            window.updateDashboard();
            return;
        }
        if (e.code === 'KeyX') {
            e.preventDefault();
            const style = shotStyles[shotStyleIndex];
            const baseCarry = club.baseDistance * style.distMod;
            const baseTotal = baseCarry + (baseCarry * (club.rollPct * style.rollMod));
            let msg = "";
            
            if (gameMode === 'course' && currentLie === 'Sand') {
                const minTotal = Math.round(baseTotal * 0.60);
                const maxTotal = Math.round(baseTotal * 0.80);
                msg = `Holding ${club.name}. In the sand. Expect ${minTotal} to ${maxTotal} yards at 100% power.`;
            } else if ((gameMode === 'course' && currentLie === 'Light Rough') || (gameMode === 'range' && rangeLie === 'Rough')) {
                const minTotal = Math.round(baseTotal * 0.85);
                const maxTotal = Math.round(baseTotal * 0.95);
                msg = `Holding ${club.name}. In the rough. Expect ${minTotal} to ${maxTotal} yards at 100% power.`;
            } else {
                msg = `Holding ${club.name}. Expect ${Math.round(baseTotal)} yards at 100% power.`;
            }
            
            document.getElementById('visual-output').innerText = msg; window.announce(msg);
        }
        if (e.code === 'KeyZ' && gameMode === 'course') {
            e.preventDefault();

            // v4.18.0 Unified Fairway Pin Finder
            if (e.shiftKey) {
                if (isGridNavigating) {
                    isGridNavigating = false;
                    activeTargetType = 'pin';
                    targetX = pinX;
                    targetY = pinY;
                    let msg = "Grid targeting disabled. Target mode set to Pin.";
                    window.announce(msg);
                    document.getElementById('visual-output').innerText = msg;
                } else {
                    isGridNavigating = true;
                    activeTargetType = 'grid';
                    gridX = 0;
                    gridY = 0;
                    let initElevation = "Plays flat.";
                    let distToPin = calculateDistanceToPin();
                    const holeData = courses[currentCourseIndex].holes[hole - 1];
                    if (distToPin <= 50 && holeData.greenType && typeof greenDictionary !== 'undefined') {
                        let activeContours = greenDictionary[holeData.greenType] || [];
                        let zone = activeContours.find(z => distToPin <= z.startY && distToPin > z.endY);
                        if (zone) {
                            if (zone.slopeY > 0) initElevation = "Plays Uphill.";
                            if (zone.slopeY < 0) initElevation = "Plays Downhill.";
                        }
                    }
                    window.announceGridPosition(initElevation);
                }
                window.updateDashboard();
                return;
            }

            // Standard Z (Landing Zones) logic continues here...
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            if (activeTargetType === 'zone') {
                activeTargetType = 'pin';
                targetX = holeData.pinX;
                targetY = holeData.pinY;
                window.autoEquipBestClub(); // v4.19.3
                let msg = `Target mode set to Pin. ${calculateDistanceToTarget()} yards. Auto-equipped ${club.name}.`;
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
                return;
            }

            const landingZones = holeData.landingZones || [];
            if (landingZones.length === 0) {
                window.announce("No landing zones are configured for this hole.");
                return;
            }

            activeTargetType = 'zone';
            if (targetZoneIndex < 0 || targetZoneIndex >= landingZones.length) targetZoneIndex = 0;
            const selectedZone = landingZones[targetZoneIndex];
            targetX = selectedZone.x;
            targetY = selectedZone.y;
            window.autoEquipBestClub(); // v4.19.3
            let msg = `Target mode: ${selectedZone.name}. ${calculateDistanceToTarget()} yards. Auto-equipped ${club.name}.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
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
                    distMsg += `Aiming at target, ${distToTarget} yards away. `;
                }
                distMsg += `${distToPin} yards to the pin.`;
                if (holeData.pinLocation) distMsg += ` Pin is ${holeData.pinLocation}.`;

                // v4.14.3 Macro Elevation Report
                // (Stubbed for future fairway contours. Currently reads Green elevation if close)
                let elevationMsg = " Plays flat.";
                if (distToPin <= 50 && holeData.greenType && typeof greenDictionary !== 'undefined') {
                    let activeContours = greenDictionary[holeData.greenType] || [];
                    let zone = activeContours.find(z => distToPin <= z.startY && distToPin > z.endY);
                    if (zone) {
                        if (zone.slopeY > 0) elevationMsg = " Plays Uphill.";
                        if (zone.slopeY < 0) elevationMsg = " Plays Downhill.";
                    }
                }
                distMsg += elevationMsg;
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
    if ((e.code === 'ArrowDown' || e.code === 'ArrowUp') && (swingState === 1 || swingState === 2)) {
        e.preventDefault(); startDownswing();
    }
});

window.announceHazard = function(h) {
    if (!h) return;
    const toDeg = 180 / Math.PI;
    const toRad = Math.PI / 180;
    
    // 1. EDGE FINDER MATH (Angles to bypass)
    let edgeMsg = "";
    if (h.radius) { // Tree/Circle
        const dist = Math.sqrt(Math.pow(h.x - ballX, 2) + Math.pow(h.y - ballY, 2));
        const angleToCenter = Math.atan2(h.x - ballX, h.y - ballY) * toDeg;
        const angleOffset = Math.asin(Math.min(0.99, h.radius / dist)) * toDeg;
        edgeMsg = `To clear edges: aim ${Math.round(angleToCenter - angleOffset)}° left, or ${Math.round(angleToCenter + angleOffset)}° right.`;
    } else { // Rectangular Hazard
        const corners = [
            {x: h.offset - h.width/2, y: h.distance}, {x: h.offset + h.width/2, y: h.distance},
            {x: h.offset - h.width/2, y: h.distance + h.depth}, {x: h.offset + h.width/2, y: h.distance + h.depth}
        ];
        const angles = corners.map(c => Math.atan2(c.x - ballX, c.y - ballY) * toDeg);
        edgeMsg = `To clear edges: aim ${Math.round(Math.min(...angles))}° left, or ${Math.round(Math.max(...angles))}° right.`;
    }

    // 2. AIM LINE MATH (Distance to reach/clear on current heading)
    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
    const finalRad = targetAngleRad + (aimAngle * toRad);
    const dirX = Math.sin(finalRad);
    const dirY = Math.cos(finalRad);
    
    let tmin = -Infinity, tmax = Infinity;
    const bounds = h.radius ? 
        {minX: h.x - h.radius, maxX: h.x + h.radius, minY: h.y - h.radius, maxY: h.y + h.radius} :
        {minX: h.offset - h.width/2, maxX: h.offset + h.width/2, minY: h.distance, maxY: h.distance + h.depth};

    [[bounds.minX, bounds.maxX, ballX, dirX], [bounds.minY, bounds.maxY, ballY, dirY]].forEach(([min, max, pos, dir]) => {
        if (Math.abs(dir) > 0.00001) {
            let t1 = (min - pos) / dir, t2 = (max - pos) / dir;
            tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
        } else if (pos < min || pos > max) { tmin = Infinity; }
    });

    let lineMsg = "Your current line is clear of this obstacle.";
    if (tmax >= tmin && tmax > 0) {
        let reach = Math.max(0, Math.round(tmin)), clear = Math.round(tmax);
        lineMsg = reach === 0 ? `Line is inside obstacle. ${clear} yards to clear.` : `On this line: ${reach} yards to reach, ${clear} yards to clear.`;
    }

    const finalMsg = `${h.name || h.type}. ${edgeMsg} ${lineMsg}`;
    window.announce(finalMsg);
    document.getElementById('visual-output').innerText = finalMsg;
};

window.announceHelp = function() {
    const line = helpMenuText[helpIndex];
    window.announce(line.text);
    document.getElementById('visual-output').innerText = line.text;
};