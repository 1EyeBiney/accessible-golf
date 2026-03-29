// input_ag.js - Keyboard Controls and Event Listeners (v5.31.2)

window.confirmingUnplayable = false;

window.addEventListener('keydown', (e) => {
    // v4.49.0 Unplayable penalty cancel interceptor
    if (window.confirmingUnplayable && e.code !== 'KeyU') {
        e.preventDefault();
        window.confirmingUnplayable = false;
        window.announce("Unplayable penalty cancelled.");
        return;
    }

    if (window.confirmingMulligan || window.confirmingGimme || window.confirmingSnowman) {
        e.preventDefault();
        if (e.code === 'KeyY' || e.code === 'Enter') {
            if (window.confirmingMulligan) {
                window.confirmingMulligan = false;
                ballX = window.preShotState.ballX; ballY = window.preShotState.ballY; currentLie = window.preShotState.currentLie;
                strokes = window.preShotState.strokes; isPutting = window.preShotState.isPutting;
                if (typeof puttTargetDist !== 'undefined') puttTargetDist = window.preShotState.puttTargetDist;
                if (typeof holeTelemetry !== 'undefined' && holeTelemetry.length > window.preShotState.telemetryLength) holeTelemetry.pop();

                let p = players[currentPlayerIndex];
                if (wizardMulligans === 1) p.mulligansUsed = (p.mulligansUsed || 0) + 1;

                let remainStr = wizardMulligans === 1 ? ` You have ${3 - p.mulligansUsed} left.` : " Unlimited remaining.";
                let msg = `Mulligan taken. Stroke erased and ball returned to previous position.${remainStr} ${Math.round(calculateDistanceToPin())} yards to pin.`;
                window.announce(msg); document.getElementById('visual-output').innerText = msg;
                window.updateDashboard();
            } else if (window.confirmingGimme) {
                window.confirmingGimme = false;
                strokes++; puttsThisHole++; isHoleComplete = true;
                let msg = `Gimme taken. 1 stroke added. Hole complete.`;
                window.announce(msg); document.getElementById('visual-output').innerText = msg;
            } else if (window.confirmingSnowman) {
                window.confirmingSnowman = false;
                strokes = 8; isHoleComplete = true;
                let msg = `Snowman taken. Score recorded as an 8. Hole complete.`;
                window.announce(msg); document.getElementById('visual-output').innerText = msg;
            }
            if (isHoleComplete) {
                setTimeout(() => { if (typeof window.advanceTurn === 'function') window.advanceTurn(); }, 2000);
            }
        } else {
            window.confirmingMulligan = false; window.confirmingGimme = false; window.confirmingSnowman = false;
            window.announce("Action cancelled.");
        }
        return;
    }

    // v5.5.0 Quick Telemetry Readout
    if (e.code === 'ArrowUp' && e.shiftKey) {
        e.preventDefault();
        if (typeof holeTelemetry !== 'undefined' && holeTelemetry.length > 0) {
            // Search backwards for the most recent Execution line
            let execLine = [...holeTelemetry].reverse().find(log => log.includes("**Execution:**"));
            if (execLine) {
                let match = execLine.match(/\*\*Execution:\*\* (.*)/);
                if (match) {
                    // Clean up math symbols so the ARIA screen reader pronounces them smoothly
                    let cleanText = match[1]
                        .replace(/-/g, "minus ")
                        .replace(/%/g, " percent")
                        .replace(/ms/g, " milliseconds")
                        .replace(/RPM/g, " R P M");
                    window.announce("Quick Telemetry: " + cleanText);
                    if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_05');
                }
            } else {
                window.announce("No telemetry logged yet for this shot.");
            }
        } else {
            window.announce("No telemetry available.");
        }
        return;
    }

    // v4.25.0 Keyboard Explore Mode
    if (e.code === 'F12') {
        e.preventDefault();
        isExploreMode = !isExploreMode;
        window.announce(isExploreMode ? "Keyboard Explore Mode Enabled. Press any key to hear its function. Press F12 again to exit." : "Keyboard Explore Mode Disabled. Returning to game.");
        return;
    }
    if (typeof isExploreMode !== 'undefined' && isExploreMode) {
        e.preventDefault();
        let keyName = e.key.toUpperCase();
        if (e.code === 'Space') keyName = 'SPACEBAR';
        if (e.ctrlKey) keyName = 'CONTROL + ' + keyName;
        else if (e.shiftKey && e.code !== 'Space') keyName = 'SHIFT + ' + keyName;
        
        let funcMsg = window.getKeyDescription(e.code, e.shiftKey, e.ctrlKey);
        window.announce(`${keyName}: ${funcMsg}`);
        document.getElementById('visual-output').innerText = `${keyName}: ${funcMsg}`;
        return;
    }

    // --- v3.70.0 Help Menu Interceptor ---
    if (viewingHelp) {
        e.preventDefault();
        let activeArr = window.currentActiveHelp || helpMenuText;
        if (e.code === 'ArrowDown') {
            if (helpIndex < activeArr.length - 1) helpIndex++;
            if (typeof window.announceHelp === 'function') window.announceHelp();
        } else if (e.code === 'ArrowUp') {
            if (helpIndex > 0) helpIndex--;
            if (typeof window.announceHelp === 'function') window.announceHelp();
        } else if (e.code === 'KeyH') {
            if (e.shiftKey) {
                for (let i = helpIndex - 1; i >= 0; i--) {
                    if (activeArr[i].heading) { helpIndex = i; break; }
                }
            } else {
                for (let i = helpIndex + 1; i < activeArr.length; i++) {
                    if (activeArr[i].heading) { helpIndex = i; break; }
                }
            }
            if (typeof window.announceHelp === 'function') window.announceHelp();
        } else if (e.code === 'Escape' || e.code === 'Enter') {
            if (e.code === 'Escape' && typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_04');
            viewingHelp = false;
            document.getElementById('help-panel').style.display = 'none';
            window.announce("Exited Help Menu.");
            if (gameMode === 'clubhouse') { if (typeof window.announceClubhouse === 'function') window.announceClubhouse(false); }
            else { document.getElementById('visual-output').innerText = typeof getSetupReport === 'function' ? getSetupReport() : ""; }
        }
        return; // Block all other inputs while viewing help
    }

    // v4.11.0 Custom Grid Interceptor
    if (viewingScorecard) {
        e.preventDefault(); // Lock ALL inputs

        // v4.85.1 Enforce P key for multiplayer swap (Fixes Tab browser conflicts)
        if (e.code === 'KeyP') {
            if (typeof players !== 'undefined' && players.length > 0) {
                scorecardPlayerIndex = (scorecardPlayerIndex + 1) % players.length;
                scRow = 0; scCol = 0; 
                window.showScorecard();
            } else {
                window.announce("No other players available.");
            }
            return;
        }

        if (e.code === 'KeyC') {
            e.preventDefault();
            if (scRow === 0 || scRow === scorecardGrid.length - 1) {
                window.announce("Please select a specific hole row to copy its telemetry.");
                return;
            }
            let targetHole = parseInt(scorecardGrid[scRow][0]);

            if (e.shiftKey) {
                // v4.92.0 Master Telemetry Dump w/ Settings Header
                let allLogs = "";
                
                let courseName = (typeof courses !== 'undefined' && courses[currentCourseIndex]) ? courses[currentCourseIndex].name : "Unknown Course";
                let windName = (typeof windLevels !== 'undefined' && windLevels[windLevelIndex]) ? windLevels[windLevelIndex].name : "Unknown Wind";
                let roughName = (typeof roughConditions !== 'undefined' && roughConditions[roughConditionIndex]) ? roughConditions[roughConditionIndex].name : "Standard";
                let stimpVal = typeof window.stimpSpeed !== 'undefined' ? window.stimpSpeed : 10;
                
                allLogs += `# MATCH SETTINGS\n`;
                allLogs += `**Engine Version:** v5.5.1\n`;
                allLogs += `**Course:** ${courseName}\n`;
                allLogs += `**Wind:** ${windName}\n`;
                allLogs += `**Green Stimp:** ${stimpVal}\n`;
                allLogs += `**Rough Condition:** ${roughName}\n\n=========================================\n\n`;

                // v5.1.2 Scoreboard Header
                allLogs += `# SCOREBOARD SUMMARY\n`;
                if (typeof players !== 'undefined' && players.length > 0) {
                    players.forEach(p => {
                        let totalStrokes = 0, totalPar = 0;
                        p.roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
                        let rel = totalStrokes - totalPar;
                        let relStr = rel === 0 ? "E" : rel > 0 ? `+${rel}` : `${rel}`;
                        allLogs += `* **${p.name}**: ${totalStrokes} (${relStr})\n`;
                    });
                } else {
                    let totalStrokes = 0, totalPar = 0;
                    roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
                    let rel = totalStrokes - totalPar;
                    let relStr = rel === 0 ? "E" : rel > 0 ? `+${rel}` : `${rel}`;
                    allLogs += `* **Player**: ${totalStrokes} (${relStr})\n`;
                }
                allLogs += `\n=========================================\n\n`;

                if (typeof players !== 'undefined' && players.length > 0) {
                    players.forEach(p => {
                        let pLogs = p.roundData.filter(r => r.telemetryLog).map(r => r.telemetryLog).join('\n\n---\n\n');
                        if (pLogs) {
                            allLogs += `# TELEMETRY DUMP: ${p.name.toUpperCase()}\n\n${pLogs}\n\n=========================================\n\n`;
                        }
                    });
                } else {
                    let baseLogs = roundData.filter(r => r.telemetryLog).map(r => r.telemetryLog).join('\n\n---\n\n');
                    if (baseLogs) allLogs += baseLogs;
                }
                
                navigator.clipboard.writeText(allLogs).then(() => {
                    window.announce("Master Foursome Telemetry copied to clipboard.");
                });
            } else {
                let viewData = players[scorecardPlayerIndex] ? players[scorecardPlayerIndex].roundData : roundData; // v4.85.0
                let record = viewData.find(r => r.hole === targetHole);
                let log = (record && record.telemetryLog) ? record.telemetryLog : `No telemetry found for Hole ${targetHole}.`;
                navigator.clipboard.writeText(log).then(() => {
                    window.announce(`Telemetry for Hole ${targetHole} copied to clipboard.`);
                });
            }
            return;
        }
        
        if (e.code === 'Escape' || e.code === 'Enter') {
            if (e.code === 'Escape' && typeof window.playGolfSound === 'function') window.playGolfSound('bunker_33');
            if (e.code === 'Enter' && typeof window.playGolfSound === 'function') window.playGolfSound('menu_01');
            viewingScorecard = false;
            document.getElementById('scorecard-container').style.display = 'none';
            document.getElementById('visual-output').style.display = 'block';
            window.announce("Exited Scorecard.");
            document.getElementById('visual-output').innerText = getSetupReport();
            return;
        }

        // v4.30.2 Spacebar Page Toggle
        if (e.code === 'Space') {
            e.preventDefault();
            scorecardPage = scorecardPage === 0 ? 1 : 0;
            window.showScorecard();
            window.announceScorecardCell(false, true);
            return;
        }
        
        if (e.code === 'ArrowRight') {
            const maxCol = scorecardGrid[0] ? scorecardGrid[0].length - 1 : 0;
            if (scCol < maxCol) { scCol++; window.announceScorecardCell(); }
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

        if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            if (activeTargetType === 'grid' || activeTargetType === 'pin') {
                let distToPin = calculateDistanceToPin();

                // v4.35.1 Dynamic Grid Scaling (Removed Green restriction)
                // If inside 5 yards, use 1-foot (0.33 yard) increments. Otherwise, 1 yard.
                let isShortPutt = (distToPin <= 5.0);
                let increment = isShortPutt ? (1 / 3) : 1.0;

                if (e.code === 'ArrowUp') gridY += increment;
                if (e.code === 'ArrowDown') gridY -= increment;
                if (e.code === 'ArrowLeft') gridX -= increment;
                if (e.code === 'ArrowRight') gridX += increment;

                // Dynamic TTS Reporting
                let reportX = Math.abs(gridX);
                let reportY = Math.abs(gridY);
                let unit = isShortPutt ? "feet" : "yards";

                // Convert to whole numbers if using feet for clean audio
                if (isShortPutt) {
                    reportX = Math.round(reportX * 3);
                    reportY = Math.round(reportY * 3);
                }

                let xZero = Math.abs(gridX) < 0.001;
                let yZero = Math.abs(gridY) < 0.001;
                let msgX = xZero ? "Center" : `${reportX} ${unit} ${gridX < 0 ? 'Left' : 'Right'}`;
                let msgY = yZero ? "Pin High" : `${reportY} ${unit} ${gridY < 0 ? 'Short' : 'Long'}`;

                // v4.37.1 Terrain Probe & Landing Zone Oracle
                let absX = pinX + gridX;
                let absY = pinY + gridY;
                let terrain = typeof window.getTerrainAt === 'function' ? window.getTerrainAt(absX, absY) : "";
                let terrainStr = "";
                let slopeStr = "";

                if (terrain === "Green" || terrain === "Fairway") {
                    terrainStr = ` On the ${terrain}.`;
                    // If on the green, probe the landing effect
                    if (terrain === "Green" && typeof window.getLandingZoneEffect === 'function') {
                        slopeStr = window.getLandingZoneEffect(absX, absY);
                    }
                } else if (terrain === "Sand" || terrain === "Rough" || terrain === "Water") {
                    terrainStr = ` In the ${terrain}.`;
                } else if (terrain) {
                    terrainStr = ` Over ${terrain}.`;
                }

                window.announce(`${msgX}, ${msgY}.${terrainStr}${slopeStr}`);
                document.getElementById('visual-output').innerText = `Target: ${msgX}, ${msgY}.${terrainStr}${slopeStr}`;
            }
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
            
            // v4.26.0 Target Lock Audio
            if (typeof window.playGolfSound === 'function') window.playGolfSound('club_09');

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

        // v5.1.0 Fast-Forward Setup
        if (e.ctrlKey && e.code === 'Enter') {
            let forwardAction = null;
            for (let i = clubhouseMenu.length - 1; i >= 0; i--) {
                if (!clubhouseMenu[i].text.includes("Back")) { forwardAction = clubhouseMenu[i].action; break; }
            }
            if (forwardAction) {
                if (typeof window.playGolfSound === 'function') window.playGolfSound('menu_01');
                forwardAction();
            }
            return;
        }

        // v5.13.0 Tour Pro Foursome Quick-Load Fix
        if (e.code === 'KeyK' && e.shiftKey && gameMode === 'clubhouse') {
            e.preventDefault();
            wizardSize = 4;
            wizardRoster = [
                { name: "Bot Woods", isBot: true, skill: 3, iBias: 0, hBias: 0, focus: 1, ball: 0 },
                { name: "Bot Golden Bear", isBot: true, skill: 3, iBias: 15, hBias: 0, focus: 4, ball: 0 },
                { name: "Bot Lefty", isBot: true, skill: 3, iBias: -25, hBias: 10, focus: 5, ball: 0 },
                { name: "Bot Strickler", isBot: true, skill: 3, iBias: 0, hBias: 0, focus: 2, ball: 0 }
            ];
            clubhouseState = 'course_quick';
            clubhouseIndex = wizardCourse;
            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_02');
            window.announce("Tour Pro Foursome loaded. Select a course.");
            window.buildClubhouseMenu(); 
            window.announceClubhouse(false);
            return;
        }

        // v5.1.8 Global 4F Quick Load (Shawn, Dusty, Fred, Ted)
        if (e.shiftKey && e.code === 'KeyL') {
            e.preventDefault();
            wizardRoster = [
                { name: "Shankin' Shawn", isBot: true, skill: 0, iBias: 80, hBias: -40, focus: 0, ball: 5 },
                { name: "Dusty Bunkers", isBot: true, skill: 1, iBias: -30, hBias: 60, focus: 1, ball: 2 },
                { name: "Fairway Fred", isBot: true, skill: 2, iBias: -15, hBias: 45, focus: 4, ball: 4 },
                { name: "Tour-Pro Ted", isBot: true, skill: 3, iBias: 0, hBias: 0, focus: 3, ball: 0 }
            ];
            wizardSize = 4;
            clubhouseState = 'course_quick';
            clubhouseIndex = wizardCourse; 
            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_02');
            window.announce("Foursome loaded: Shawn, Dusty, Fred, and Ted. Select a course.");
            window.buildClubhouseMenu(); window.announceClubhouse(false);
            return;
        }

        if (e.code === 'ArrowDown') {
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_04');
            clubhouseIndex = (clubhouseIndex + 1) % clubhouseMenu.length;
            window.announceClubhouse(false);
        } else if (e.code === 'ArrowUp') {
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_03');
            clubhouseIndex = (clubhouseIndex - 1 + clubhouseMenu.length) % clubhouseMenu.length;
            window.announceClubhouse(false);
        } else if (e.code === 'Enter') {
            if (e.ctrlKey) {
                // Fast-forward sequence...
                let foundTarget = false;
                for (let i = clubhouseMenu.length - 1; i >= 0; i--) {
                    let txt = clubhouseMenu[i].text.toLowerCase();
                    if (txt.includes("start round") || txt.includes("proceed to match settings") || txt.includes("human player") || txt.includes("group size")) {
                        clubhouseIndex = i; foundTarget = true; break;
                    }
                }
                if (!foundTarget && clubhouseMenu.length > 0) clubhouseIndex = 0;
                if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_05');
                clubhouseMenu[clubhouseIndex].action();
            } else {
                // v5.2.0 Mute standard click if it's the Help button
                if (window.menuOptions && !window.menuOptions[window.menuIndex].text.includes("Help") && typeof window.playGolfSound === 'function') {
                    window.playGolfSound('ui_nav_01');
                }
                if (typeof window.confirmClubhouseSelection === 'function') window.confirmClubhouseSelection();
            }
            return;
        } else if (e.code === 'Escape') {
            if (typeof window.playGolfSound === 'function') window.playGolfSound('menu_02'); // Back Cancel
            if (typeof clubhouseState !== 'undefined') {
                if (clubhouseState === 'settings') { clubhouseState = 'roster'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'practice') { clubhouseState = 'root'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'roster_bot_amateur' || clubhouseState === 'roster_bot_tour') { clubhouseState = 'roster_type'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'roster_type') { clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'roster') { clubhouseState = 'size'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'size') { clubhouseState = 'course'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
                else if (clubhouseState === 'course') { clubhouseState = 'root'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true); }
            }
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
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_33');
            confirmingQuit = false;
            window.announce("Quit cancelled.");
            document.getElementById('visual-output').innerText = getSetupReport();
        }
        return;
    }

    if (swingState === 0 || isHoleComplete) {
        // v4.31.3 Ball Equipment Selection
        if (e.code === 'KeyY' && e.shiftKey) {
            e.preventDefault();
            activeBallIndex = (activeBallIndex + 1) % ballTypes.length;
            let ball = ballTypes[activeBallIndex];
            let msg = `Equipped Ball ${ball.name}`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            
            // Play a quick 0.6s preview of the ball's texture
            if (typeof window.trigger3DFlight === 'function') {
                window.trigger3DFlight(0.6, 25, 0, 0, ball);
            }
            return;
        }

        // v4.41.0 Shot Focus Toggle
        if (e.code === 'KeyJ') {
            e.preventDefault();
            if (e.shiftKey) focusIndex = (focusIndex - 1 + focusModes.length) % focusModes.length;
            else focusIndex = (focusIndex + 1) % focusModes.length;

            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_07');
            const focus = focusModes[focusIndex];
            let msg = `Shot Focus: ${focus.name}. ${focus.desc}`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            window.updateDashboard();
            return;
        }

        // v4.42.0 Global Difficulty Toggle
        if (e.code === 'KeyI') {
            e.preventDefault();
            if (e.shiftKey) difficultyIndex = (difficultyIndex - 1 + difficultyLevels.length) % difficultyLevels.length;
            else difficultyIndex = (difficultyIndex + 1) % difficultyLevels.length;

            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_07');
            const diff = difficultyLevels[difficultyIndex];
            let msg = `Difficulty: ${diff.name}. ${diff.desc}`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            window.updateDashboard();
            return;
        }

        // v4.48.0 Pacing Mode Toggle
        if (e.code === 'KeyP') {
            e.preventDefault();
            pacingModeIndex = (pacingModeIndex + 1) % pacingModes.length;
            window.announce(`Game Pacing set to ${pacingModes[pacingModeIndex]}.`);
            document.getElementById('visual-output').innerText = `Pacing: ${pacingModes[pacingModeIndex]}`;
            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_02');
            return;
        }

        // v5.1.0 Next Player
        if (e.code === 'KeyN') {
            e.preventDefault();
            if (gameMode !== 'course') { window.announce("Multiplayer swap is only available on the course."); return; }

            window.saveActivePlayer();
            let nextIndex = (currentPlayerIndex + 1) % activePlayerCount;
            window.loadActivePlayer(nextIndex);

            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_07');
            let pName = players[currentPlayerIndex].name;
            let distMsg = players[currentPlayerIndex].isHoleComplete ? "Already in the hole." : `${Math.round(calculateDistanceToPin())} yards to pin. Lie: ${currentLie}.`;
            let msg = `Swapped to ${pName}. ${distMsg} Holding ${club.name}.`;
            window.announce(msg); document.getElementById('visual-output').innerText = msg;
            return;
        }

        // v5.1.0 Mulligan & Snowman
        if (e.code === 'KeyM') {
            e.preventDefault();
            if (gameMode !== 'course') return;

            if (e.shiftKey) {
                if (wizardMaxScore !== 2) { window.announce("Snowman rule is not active in match settings."); return; }
                window.confirmingSnowman = true;
                window.announce("Take a Snowman? Your score will be 8 and the hole will end. Press Y to confirm.");
            } else {
                if (wizardMulligans === 0) { window.announce("Mulligans are disabled in match settings."); return; }
                if (!window.preShotState || window.preShotState.strokes === strokes) { window.announce("You have not taken a shot yet."); return; }

                let p = players[currentPlayerIndex];
                let used = p.mulligansUsed || 0;
                if (wizardMulligans === 1 && used >= 3) { window.announce("You have used all 3 Mulligans for this round."); return; }

                window.confirmingMulligan = true;
                let countMsg = wizardMulligans === 1 ? ` You have ${3 - used} left.` : "";
                window.announce(`Use a Mulligan?${countMsg} Press Y to confirm.`);
            }
            return;
        }

        // v5.1.0 Gimme
        if (e.code === 'KeyG') {
            e.preventDefault();
            if (gameMode !== 'course') return;
            if (wizardGimmes === 0) { window.announce("Gimmes are disabled in match settings."); return; }
            if (!isPutting) { window.announce("You must be on the putting green to take a Gimme."); return; }

            window.confirmingGimme = true;
            window.announce("Take a Gimme? This will add 1 stroke to your score and complete the hole. Press Y to confirm.");
            return;
        }

        // v4.13.0 Context-Sensitive Quit Trigger
        if (e.code === 'KeyQ') {
            e.preventDefault();
            if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_11');
            if (gameMode === 'course') {
                confirmingQuit = true;
                let msg = "Quit Menu. Press S to Save and Exit, A to Abandon Round, or Escape to cancel.";
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
            } else {
                gameMode = 'clubhouse'; clubhouseState = 'practice'; clubhouseIndex = 0;
                document.getElementById('dashboard-panel').style.display = 'none';
                document.getElementById('swing-meter').style.display = 'none';
                window.announce("Exited practice area.");
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }
            return;
        }

        if (e.code === 'KeyE') {
            e.preventDefault();
            if (e.shiftKey) {
                e.preventDefault();
                if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_03');
                if (typeof window.renderScorecard === 'function') window.renderScorecard();
                return;
            } else {
                let quick = window.getQuickScore();
                document.getElementById('visual-output').innerText = quick; window.announce(quick);
            }
            return;
        }

        // v4.30.0 Narrative & Share Sheet
        if (e.code === 'KeyN') {
            e.preventDefault();
            if (e.shiftKey) {
                if (gameMode === 'post_round' || (roundData.length > 0 && hole >= courses[currentCourseIndex].holes.length)) {
                    let summary = window.generateNarrativeSummary();
                    navigator.clipboard.writeText(summary).then(() => {
                        let msg = "Round summary copied to clipboard! " + summary;
                        document.getElementById('visual-output').innerText = summary;
                        window.announce(msg);
                    }).catch(err => {
                        window.announce("Failed to copy to clipboard, but here is your summary: " + summary);
                    });
                } else {
                    window.announce("Share Sheet is only available when the round is complete.");
                }
            } else {
                if (roundData.length > 0) {
                    let lastHole = roundData[roundData.length - 1];
                    document.getElementById('visual-output').innerText = lastHole.narrative;
                    window.announce(lastHole.narrative);
                } else {
                    window.announce("No holes completed yet.");
                }
            }
            return;
        }

        if (e.key === '?') {
            e.preventDefault();
            if (typeof window.openHelpMenu === 'function') window.openHelpMenu();
            return;
        }
        // v5.1.5 Holo Range Object Manager
        if (gameMode === 'range') {
            const holoTypes = ["Target Flag", "Single Tree", "Tree Wall", "Tree Cluster", "Sand Bunker"];
            let hd = typeof courses !== 'undefined' ? courses[currentCourseIndex].holes[hole - 1] : null;
            
            let checkCollisions = () => {
                let warns = [];
                if (hd.hazards && hd.hazards.length > 0 && Math.abs(pinY - hd.hazards[0].distance) < 5) warns.push("Bunker");
                if (hd.trees && hd.trees.length > 0) {
                    hd.trees.forEach(t => { if (Math.abs(pinY - t.y) < 10) warns.push("Trees"); });
                }
                return warns.length > 0 ? ` Warning: Close proximity to ${warns.join(" and ")}.` : "";
            };

            // v5.3.0 Target Randomizer
            if (e.code === 'KeyR' && !e.shiftKey) {
                e.preventDefault();
                if (window.rangeMode === 'short') {
                    pinY = Math.floor(Math.random() * 26) + 5; // 5 to 30
                    pinZ = Math.floor(Math.random() * 6); // 0 to 5
                } else if (window.rangeMode === 'long') {
                    pinY = Math.floor(Math.random() * 71) + 30; // 30 to 100
                    pinZ = Math.floor(Math.random() * 11); // 0 to 10
                } else {
                    pinY = Math.floor(Math.random() * 251) + 50; // 50 to 300
                    pinZ = Math.floor(Math.random() * 21); // 0 to 20
                }
                pinX = 0; targetX = pinX; targetY = pinY; targetZ = pinZ;
                
                if (typeof window.playGolfSound === 'function') window.playGolfSound('club_09');
                let msg = `Target randomized to ${pinY} yards away, elevated ${pinZ} yards.`;
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
                window.updateDashboard();
                return;
            }
            if (e.code === 'KeyO') {
                e.preventDefault();
                window.holoFocusIndex = (window.holoFocusIndex + 1) % holoTypes.length;
                let t = holoTypes[window.holoFocusIndex];
                let isSp = t === "Target Flag" ? pinY > 0 : (t === "Sand Bunker" ? hd.hazards.length > 0 : hd.trees.length > 0 && hd.trees[0].name === t);
                window.announce(`${t} selected. ${isSp ? "Spawned." : "Not spawned."}`);
                return;
            }
            if (e.code === 'Enter') {
                e.preventDefault();
                let t = holoTypes[window.holoFocusIndex];
                let isSp = t === "Target Flag" ? pinY > 0 : (t === "Sand Bunker" ? hd.hazards.length > 0 : hd.trees.length > 0 && hd.trees[0].name === t);
                if (isSp) { window.announce(`${t} is already spawned.`); return; }
                
                let baseD = pinY > 0 ? pinY : club.baseDistance;
                if (t === "Target Flag") { pinY = club.baseDistance; pinX = 0; pinZ = 0; }
                else if (t === "Sand Bunker") { hd.hazards = [{ type: "Bunker", name: "Greenside Bunker", distance: Math.max(5, baseD - 20), offset: pinX, width: 7, depth: 7 }]; }
                else if (t === "Single Tree") { hd.trees = [{ name: t, x: pinX, y: Math.max(5, baseD * 0.7), radius: 5, height: 40 }]; }
                else if (t === "Tree Wall") { hd.trees = [{ name: t, x: pinX, y: Math.max(5, baseD * 0.7), radius: 7.5, height: 40 }]; }
                else if (t === "Tree Cluster") { hd.trees = [{ name: t, x: pinX, y: Math.max(5, baseD * 0.7), radius: 15, height: 40 }]; }
                window.announce(`${t} spawned.`); window.updateDashboard(); return;
            }
            if (e.code === 'Backspace' || e.code === 'Delete') {
                e.preventDefault();
                let t = holoTypes[window.holoFocusIndex];
                if (t === "Target Flag") { pinY = 0; pinX = 0; pinZ = 0; }
                else if (t === "Sand Bunker") { hd.hazards = []; }
                else { hd.trees = []; }
                window.announce(`${t} removed.`); window.updateDashboard(); return;
            }
            if (e.code === 'BracketLeft' || e.code === 'BracketRight' || e.code === 'Minus' || e.code === 'Equal') {
                let t = holoTypes[window.holoFocusIndex];
                let isSp = t === "Target Flag" ? pinY > 0 : (t === "Sand Bunker" ? hd.hazards.length > 0 : hd.trees.length > 0 && hd.trees[0].name === t);
                if (!isSp) return;
                
                e.preventDefault();
                let isX = (e.code === 'BracketLeft' || e.code === 'BracketRight');
                let dir = (e.code === 'BracketLeft' || e.code === 'Minus') ? -1 : 1;
                
                if (e.shiftKey && !isX) {
                    // Z-Axis Adjustments
                    if (t === "Target Flag") { pinZ += (dir * 5); window.announce(`Flag Elevation: ${pinZ > 0 ? '+'+pinZ : pinZ} yards.`); }
                    else if (t === "Sand Bunker") { window.announce("Bunker depth cannot be adjusted."); }
                    else { hd.trees[0].height += (dir * 10); window.announce(`${t} height: ${hd.trees[0].height} feet.`); }
                } else {
                    // X/Y Adjustments
                    let inc = t === "Sand Bunker" ? 5 : 10;
                    if (window.rangeMode === 'short') inc = 1;
                    else if (window.rangeMode === 'long') inc = Math.round(inc / 2);
                    
                    if (t === "Target Flag") { if (isX) pinX += (dir * inc); else pinY = Math.max(5, pinY + (dir * inc)); }
                    else if (t === "Sand Bunker") { if (isX) hd.hazards[0].offset += (dir * inc); else hd.hazards[0].distance = Math.max(5, hd.hazards[0].distance + (dir * inc)); }
                    else { if (isX) hd.trees[0].x += (dir * inc); else hd.trees[0].y = Math.max(5, hd.trees[0].y + (dir * inc)); }
                    
                    let objX = t === "Target Flag" ? pinX : (t === "Sand Bunker" ? hd.hazards[0].offset : hd.trees[0].x);
                    let objY = t === "Target Flag" ? pinY : (t === "Sand Bunker" ? hd.hazards[0].distance : hd.trees[0].y);
                    let msgX = objX === 0 ? "Center" : `${Math.abs(objX)}y ${objX < 0 ? 'Left' : 'Right'}`;
                    window.announce(`${t} moved to ${objY} yards, ${msgX}.${checkCollisions()}`);
                }
                window.updateDashboard(); return;
            }
        }
        if (e.code === 'Semicolon' && !e.shiftKey) {
            e.preventDefault();
            if (typeof window.stimpSpeed === 'undefined') window.stimpSpeed = 10;
            const stimps = [8, 9, 10, 11, 12, 13, 14];
            let idx = stimps.indexOf(window.stimpSpeed);
            window.stimpSpeed = stimps[(idx + 1) % stimps.length];
            window.announce(`Green Speed Stimp set to ${window.stimpSpeed}`);
            let vis = document.getElementById('visual-output');
            if (vis) vis.innerText = `Stimp: ${window.stimpSpeed}`;
            return;
        }
        if (e.code === 'KeyC') {
            e.preventDefault();
            if (e.shiftKey) {
                let exportData = holeTelemetry.length > 0 ? holeTelemetry.join('\n\n') : lastShotReport;
                if (gameMode === 'course') {
                    const holeData = courses[currentCourseIndex].holes[hole - 1];
                    const header = `## HOLE ${hole} (${holeData.distance}y, Par ${par})\n**Pin:** ${holeData.pinLocation}\n\n`;
                    exportData = header + exportData;
                }
                navigator.clipboard.writeText(exportData).then(() => {
                    if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_06');
                    window.announce("Telemetry copied to clipboard.");
                    const msg = `Copied ${holeTelemetry.length} shots to clipboard.`;
                    document.getElementById('visual-output').innerText = msg;
                });
            } else {
                document.getElementById('visual-output').innerText = lastShotReport; window.announce(lastShotReport);
            }
            return;
        }
        if (e.code === 'KeyL') {
            e.preventDefault();
            if (e.shiftKey && (gameMode === 'range' || gameMode === 'chipping')) {
                const lies = ['Fairway', 'Green', 'Rough', 'Sand', 'Water'];
                let idx = lies.indexOf(rangeTargetLie);
                rangeTargetLie = lies[(idx + 1) % lies.length];
                let msg = `Target terrain set to ${rangeTargetLie}.`;
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
            } else {
                let activeLie = gameMode === 'range' ? rangeLie : currentLie;
                window.announce(`Ball is on the ${activeLie}.`);
            }
            window.updateDashboard();
            return;
        }
        if (e.code === 'KeyU' && gameMode === 'course') {
            e.preventDefault();
            if (!window.confirmingUnplayable) {
                window.confirmingUnplayable = true;
                window.announce("Unplayable penalty armed. Press U again to confirm, or any other key to cancel.");
                return;
            }

            window.confirmingUnplayable = false;
            strokes++;
            ballX = 0; // Drop in center of fairway
            currentLie = 'Fairway';
            let msg = `Unplayable lie penalty taken. 1 stroke added. Ball dropped in the center of the fairway. Stroke ${strokes + 1}. ${calculateDistanceToPin()} yards to the pin.`;
            document.getElementById('visual-output').innerText = msg;
            window.announce(msg);
            window.updateDashboard();
            return;
        }
        if (e.code.startsWith('Digit') && e.code !== 'Digit0') {
            e.preventDefault();
            let targetHole = parseInt(e.code.replace('Digit', ''));
            if (e.shiftKey) targetHole += 9;

            gameMode = 'course'; 
            if (typeof isPutting !== 'undefined') isPutting = false;

            strokes = 0; holeTelemetry = [];
            loadHole(targetHole);
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
                if (e.code === 'Escape' && typeof window.playGolfSound === 'function') window.playGolfSound('bunker_33');
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
        // v4.25.0 Green Reading
        if (e.code === 'KeyB') {
            e.preventDefault();
            let distToPin = calculateDistanceToPin();
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            let netElevYards = 0;
            let netBreakYards = 0;
            if (holeData.greenType && typeof greenDictionary !== 'undefined') {
                let activeContours = greenDictionary[holeData.greenType] || [];
                activeContours.forEach(z => {
                    if (distToPin >= z.endY) {
                        let start = Math.min(distToPin, z.startY);
                        let distInZone = start - z.endY;
                        netElevYards += (z.slopeY * distInZone * 2.0);
                        netBreakYards += (z.slopeX * distInZone * 1.5);
                    }
                });
            }
            let elevInches = Math.round(netElevYards * 4);
            let breakInches = Math.round(netBreakYards * 6);

            let elevStr = elevInches === 0 ? "plays flat" : `plays ${Math.abs(elevInches)} inches ${elevInches > 0 ? "uphill" : "downhill"}`;
            let breakStr = breakInches === 0 ? "straight" : `breaks roughly ${Math.abs(breakInches)} inches outside the ${breakInches > 0 ? "right" : "left"} edge`;

            let msg = `Green Reading: It ${elevStr}, and ${breakStr}.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            return;
        }

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
            // v4.35.1 Scalable Cup Locator
            let updatePuttTarget = () => {
                let distToPin = 0;
                if (typeof calculateDistanceToPin === 'function') distToPin = Math.round(calculateDistanceToPin());
                else distToPin = Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
                
                let isCup = (Math.abs(puttTargetDist - distToPin) < 0.1 && aimAngle === 0);
                let locStr = isCup ? " (The Cup)" : "";
                let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;
                
                let isShort = puttTargetDist <= 5.0;
                let unit = isShort ? "feet" : "yards";
                let displayDist = isShort ? Math.round(puttTargetDist * 3) : Math.round(puttTargetDist);
                
                let msg = `Target: ${displayDist} ${unit}, Aim: ${aimStr}${locStr}`;
                window.announce(msg);
                window.updateDashboard();
            };
            
            if (e.code === 'ArrowUp') { e.preventDefault(); let inc = puttTargetDist <= 5.0 ? (1/3) : 1; puttTargetDist += inc; updatePuttTarget(); return; }
            if (e.code === 'ArrowDown') { e.preventDefault(); let inc = puttTargetDist <= 5.0 ? (1/3) : 1; puttTargetDist = Math.max(1/3, puttTargetDist - inc); updatePuttTarget(); return; }
            if (e.code === 'ArrowRight') { e.preventDefault(); aimAngle += 1; updatePuttTarget(); return; }
            if (e.code === 'ArrowLeft') { e.preventDefault(); aimAngle -= 1; updatePuttTarget(); return; }
            
            // Putting Enter-to-Lock Consistency
            if (e.code === 'Enter' || e.code === 'Escape') {
                e.preventDefault();
                puttState = 1; // Switch to Swing Mode
                let isShort = puttTargetDist <= 5.0;
                let unit = isShort ? "feet" : "yards";
                let displayDist = isShort ? Math.round(puttTargetDist * 3) : Math.round(puttTargetDist);
                let msg = `Putt target locked at ${displayDist} ${unit}. Swing Mode active. Press Down Arrow to start stroke.`;
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

        // v4.48.2 Bot Turn Input Lock
        let isBotTurn = typeof players !== 'undefined' && players.length > 0 && players[currentPlayerIndex].isBot;
        if (isBotTurn) {
            if (typeof window.waitingForBot !== 'undefined' && window.waitingForBot) {
                window.announce("It is the bot's turn. Press Spacebar to let them strike.");
            } else {
                window.announce("It is the bot's turn. Please wait.");
            }
            return;
        }

        if (swingState === 0) startBackswing(false);
        else if (swingState === 4) {
            if (typeof calculateShot === 'function') calculateShot(false); 
        }
    }

    if (e.code === 'ArrowUp') {
        e.preventDefault();

        // v4.48.2 Bot Turn Input Lock
        let isBotTurn = typeof players !== 'undefined' && players.length > 0 && players[currentPlayerIndex].isBot;
        if (isBotTurn) {
            if (typeof window.waitingForBot !== 'undefined' && window.waitingForBot) {
                window.announce("It is the bot's turn. Press Spacebar to let them strike.");
            } else {
                window.announce("It is the bot's turn. Please wait.");
            }
            return;
        }

        if (swingState === 0) startBackswing(true);
        else if (swingState === 4) {
            lockedImpactTime = performance.now() - impactStartTime;
            if (typeof window.evaluatePracticeSwing === 'function') window.evaluatePracticeSwing();
        }
    }

    if (e.code === 'Space') {
        // v4.48.0 Manual Bot Trigger
        if (typeof window.waitingForBot !== 'undefined' && window.waitingForBot) {
            e.preventDefault();
            window.waitingForBot = false;
            swingState = 4;
            if (typeof calculateShot === 'function') calculateShot(false);
            return;
        }

        e.preventDefault();
        playTone(880, 'sine', 0.1, 0.25);
        if (swingState === 1) hingeTimeBack = performance.now() - backswingStartTime;
        if (swingState === 3) hingeTimeDown = performance.now() - downswingStartTime;
    }

    if (swingState === 0) {
        if (e.code === 'Tab') {
            e.preventDefault();
            let playerName = (typeof players !== 'undefined' && players.length > 0 && players[currentPlayerIndex]) ? players[currentPlayerIndex].name : "Player";
            let dist = calculateDistanceToPin();
            let msg = `${playerName}. Hole ${hole}. Stroke ${strokes + 1}. ${dist} yards to pin. Lie: ${currentLie}.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            return;
        }

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
            // v4.19.7 Advanced Style Cycling: S = Forward (+1), Shift+S = Backward (-1)
            if (e.shiftKey) {
                shotStyleIndex = (shotStyleIndex - 1 + shotStyles.length) % shotStyles.length;
                if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_04');
            } else {
                shotStyleIndex = (shotStyleIndex + 1) % shotStyles.length;
                if (typeof window.playGolfSound === 'function') window.playGolfSound('bunker_03');
            }
            
            const style = shotStyles[shotStyleIndex];
            const chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
            let dynamicLoft = Math.max(0, club.loft + style.loftMod + ((2 - stanceIndex) * 5));
            let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
            const baseTotal = club.baseDistance * style.distMod * chokeMod * loftDistMod;
            
            let distMsg = "";
            if (gameMode === 'course' && currentLie === 'Sand') {
                distMsg = ` Expect ${Math.round(baseTotal * 0.60)} to ${Math.round(baseTotal * 0.80)} yards in sand.`;
            } else if ((gameMode === 'course' && currentLie === 'Light Rough') || (gameMode === 'range' && rangeLie === 'Rough')) {
                distMsg = ` Expect ${Math.round(baseTotal * 0.85)} to ${Math.round(baseTotal * 0.95)} yards in rough.`;
            } else {
                distMsg = ` Expect ${Math.round(baseTotal)} yards.`;
            }

            const msg = `Swing Style: ${style.name}.${distMsg}`;
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
                
                // v4.26.0 Club Equip Audio
                if (typeof window.playGolfSound === 'function') {
                    let sfx = club.name.includes("Wedge") ? 'club_03' : club.name.includes("Iron") ? 'club_02' : club.name === "Putter" ? 'club_04' : 'club_01';
                    window.playGolfSound(sfx);
                }

                if (gameMode === 'range' && pinY > 0) { pinY = club.baseDistance; } // Preserves custom offsets
                if (typeof window.autoSetFocus === 'function') window.autoSetFocus(true);
                const setupReport = getSetupReport();
                window.announce(setupReport); document.getElementById('visual-output').innerText = setupReport;
            }
            window.updateDashboard();
        }
        if (e.code === 'PageDown') {
            e.preventDefault();
            if (currentClubIndex < clubs.length - 1) {
                currentClubIndex++; club = clubs[currentClubIndex];
                
                // v4.26.0 Club Equip Audio
                if (typeof window.playGolfSound === 'function') {
                    let sfx = club.name.includes("Wedge") ? 'club_03' : club.name.includes("Iron") ? 'club_02' : club.name === "Putter" ? 'club_04' : 'club_01';
                    window.playGolfSound(sfx);
                }

                if (gameMode === 'range' && pinY > 0) { pinY = club.baseDistance; } // Preserves custom offsets
                if (typeof window.autoSetFocus === 'function') window.autoSetFocus(true);
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
            let chokeMod = (typeof isChokedDown !== 'undefined' && isChokedDown) ? 0.9 : 1.0;
            let currentStyle = shotStyles[shotStyleIndex];
            let styleMod = (typeof currentStyle !== 'undefined') ? currentStyle.distMod : 1.0;
            
            let loftDistMod = 1 + ((stanceIndex - 2) * 0.03);
            let focusMod = focusIndex === 1 ? 1.10 : 1.0; 
            
            let expectedDist = Math.round(club.baseDistance * styleMod * chokeMod * loftDistMod * focusMod);
            
            let gripStr = isChokedDown ? "Choked " : "";
            let focusStr = typeof focusModes !== 'undefined' ? focusModes[focusIndex].name : "Standard";

            // v4.80.0 Verbosity Reduction Array
            let reportParts = [
                `${gripStr}${club.name}`,
                `${expectedDist} expected clear`,
                `Focus: ${focusStr}`
            ];

            // Only append stance and alignment if they are NOT neutral
            if (typeof stanceAlignment !== 'undefined' && stanceAlignment !== 0) {
                let alignStr = typeof alignmentNames !== 'undefined' ? alignmentNames[stanceAlignment + 2] : "";
                reportParts.push(`${alignStr} Stance`);
            }
            
            if (typeof stanceIndex !== 'undefined' && stanceIndex !== 2) {
                let stanceStr = typeof stanceNames !== 'undefined' ? stanceNames[stanceIndex] : "";
                reportParts.push(`${stanceStr} Address`);
            }

            let msg = reportParts.join(", ") + ".";
            
            window.announce(msg);
            let vis = document.getElementById('visual-output');
            if (vis) vis.innerText = msg;
            return;
        }
        if (e.code === 'KeyZ' && (gameMode === 'course' || gameMode === 'range')) {
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

            const holeData = courses[currentCourseIndex].holes[hole - 1];
            const landingZones = holeData.landingZones || [];

            if (activeTargetType === 'pin') {
                if (landingZones.length > 0) {
                    activeTargetType = 'zone';
                    targetZoneIndex = 0;
                    const z = landingZones[targetZoneIndex];
                    targetX = z.x; targetY = z.y; 
                    targetZ = z.z || 0; lieTilt = z.tilt || 0; landingSlope = z.slope || 0;
                } else {
                    window.announce("No landing zones defined for this hole.");
                    return;
                }
            } else {
                targetZoneIndex++;
                if (targetZoneIndex >= landingZones.length) {
                    activeTargetType = 'pin';
                    const holeData = courses[currentCourseIndex].holes[hole - 1];
                    targetX = holeData.pinX; targetY = holeData.pinY; 
                    targetZ = holeData.pinZ || 0; lieTilt = 0; landingSlope = 0;
                } else {
                    const z = landingZones[targetZoneIndex];
                    targetX = z.x; targetY = z.y;
                    targetZ = z.z || 0; lieTilt = z.tilt || 0; landingSlope = z.slope || 0;
                }
            }

            window.autoEquipBestClub();
            
            // v4.83.0 Altimeter Ping (Audio Sonification of Z-Axis)
            let zDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
            if (zDiff > 2) {
                if (typeof window.playTone === 'function') {
                    window.playTone(400, 'sine', 0.1, 0.3);
                    setTimeout(() => window.playTone(600, 'sine', 0.15, 0.3), 100);
                }
            } else if (zDiff < -2) {
                if (typeof window.playTone === 'function') {
                    window.playTone(600, 'sine', 0.1, 0.3);
                    setTimeout(() => window.playTone(400, 'sine', 0.15, 0.3), 100);
                }
            } else {
                if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_07');
            }

            let label = activeTargetType === 'pin' ? "The Pin" : landingZones[targetZoneIndex].name;
            let behindStr = (targetY < ballY) ? " (Behind you)" : "";
            let msg = `Target: ${label}${behindStr}. ${calculateDistanceToTarget()} yards. Auto-equipped ${club.name}.`;
            window.announce(msg);
            document.getElementById('visual-output').innerText = msg;
            window.updateDashboard();
            return;
        }
        if (e.code === 'KeyT') {
            e.preventDefault(); 
            if (!e.shiftKey) {
                let distToPin = calculateDistanceToPin();
                let distMsg = "";
                if (gameMode === 'course' || gameMode === 'range') {
                    const holeData = courses[currentCourseIndex].holes[hole - 1];
                    if (targetY !== holeData.pinY || targetX !== holeData.pinX) {
                        let distToTarget = Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
                        distMsg += `Aiming at target, ${distToTarget} yards away. `;
                    }
                    distMsg += `${distToPin} yards to the pin.`;
                    if (holeData.pinLocation) distMsg += ` Pin is ${holeData.pinLocation}.`;

                    // v4.83.0 Exact 3D Slope Rangefinder
                    let elevationDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
                    if (elevationDiff !== 0) {
                         let effDist = targetY !== holeData.pinY || targetX !== holeData.pinX ? 
                             Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2))) + elevationDiff : 
                             distToPin + elevationDiff;
                         distMsg += ` Plays ${Math.abs(elevationDiff)} yards ${elevationDiff > 0 ? 'uphill' : 'downhill'}. Effective distance: ${effDist} yards.`;
                    }
                    distMsg += getSightReport(); 
                } else {
                    distMsg = `${distToPin} yards to the pin.`;
                }
                
                document.getElementById('visual-output').innerText = distMsg; 
                window.announce(distMsg);
            } else {
                let p = typeof players !== 'undefined' ? players[currentPlayerIndex] : null;
                let pName = p ? p.name : 'None';
                let isB = p ? p.isBot : false;
                let qLen = typeof stateTimeouts !== 'undefined' ? stateTimeouts.length : 0;
                let pMode = typeof pacingModes !== 'undefined' ? pacingModes[pacingModeIndex] : 'Unknown';
                let diag = `Turn Diagnostic. Index: ${currentPlayerIndex}. Name: ${pName}. Bot: ${isB}. Waiting: ${window.waitingForBot}. Pacing: ${pMode}. Timeouts: ${qLen}.`;
                window.announce(diag);
                document.getElementById('visual-output').innerText = diag;
            }
            
            return;
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
    
    let edgeMsg = "";
    const dist = Math.sqrt(Math.pow((h.x !== undefined ? h.x : h.offset) - ballX, 2) + Math.pow((h.y !== undefined ? h.y : h.distance) - ballY, 2));
    
    // v4.21.0 Canopy/Trunk Awareness
    if (h.radius) {
        let effectiveRadius = h.radius;
        let contextPrefix = "";
        if (dist < h.radius * 1.2) {
            effectiveRadius = 1.5; // Trunk radius
            contextPrefix = "Under the canopy. ";
        }
        const angleToCenter = Math.atan2(h.x - ballX, h.y - ballY) * toDeg;
        const angleOffset = Math.asin(Math.min(0.99, effectiveRadius / dist)) * toDeg;
        edgeMsg = `${contextPrefix}To clear trunk: aim ${Math.round(angleToCenter - angleOffset)}° left, or ${Math.round(angleToCenter + angleOffset)}° right.`;
    } else {
        const corners = [
            {x: h.offset - h.width/2, y: h.distance}, {x: h.offset + h.width/2, y: h.distance},
            {x: h.offset - h.width/2, y: h.distance + h.depth}, {x: h.offset + h.width/2, y: h.distance + h.depth}
        ];
        const angles = corners.map(c => Math.atan2(c.x - ballX, c.y - ballY) * toDeg);
        edgeMsg = `To clear edges: aim ${Math.round(Math.min(...angles))}° left, or ${Math.round(Math.max(...angles))}° right.`;
    }

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

    let lineMsg = "Your current line is clear.";
    if (tmax >= tmin && tmax > 0) {
        let reach = Math.max(0, Math.round(tmin)), clear = Math.round(tmax);
        lineMsg = reach === 0 ? `Inside hazard. ${clear}y to clear.` : `${reach}y to reach, ${clear}y to clear.`;
    }

    const finalMsg = `${h.name || h.type}. ${Math.round(dist)} yards away. ${edgeMsg} ${lineMsg}`;
    window.announce(finalMsg);
    document.getElementById('visual-output').innerText = finalMsg;
};

window.getKeyDescription = function(code, shift, ctrl) {
    const desc = {
        'ArrowDown': "Starts the backswing, locks power, and executes the strike.",
        'ArrowUp': shift ? "Reads the quick telemetry for your last shot." : "Aims your shot to the Left. Hold Shift for micro-adjustments.",
        'Space': "Sets hinge timing during the swing. Inside Scorecard, flips pages.",
        'ArrowLeft': shift ? "Closes your stance to add draw spin." : "Aims 1 degree left.",
        'ArrowRight': shift ? "Opens your stance to add fade spin." : "Aims 1 degree right.",
        'Home': "Moves the ball forward in your stance, adding loft.",
        'End': "Moves the ball back in your stance, reducing loft.",
        'PageUp': "Equips the previous club.",
        'PageDown': "Equips the next club.",
        'KeyZ': shift ? "Opens the Pin Finder grid." : "Cycles through tactical landing zones.",
        'KeyJ': shift ? "Cycles Shot Focus backward." : "Cycles Shot Focus forward.",
        'KeyI': shift ? "Cycles Difficulty backward." : "Cycles Difficulty forward.",
        'KeyM': shift ? "Takes a Snowman (Max score of 8) and ends the hole." : "Uses a Mulligan to erase the last shot.",
        'KeyN': shift ? "Copies the Post-Round Summary to your clipboard." : "Swaps control to the Next Player.",
        'KeyG': "Takes a Gimme and finishes the hole (Only available on the putting green).",
        'KeyY': shift ? "Cycles equipped golf ball brand." : "Unassigned key.",
        'KeyX': "Announces the active club and expected 100 percent distance.",
        'KeyS': shift ? "Cycles swing styles backward." : "Cycles swing styles forward.",
        'KeyV': "Toggles choked down grip for increased control.",
        'Tab': "Provides a quick summary of hole, stroke, distance, and lie.",
        'KeyT': "Provides a full distance and targeting report.",
        'KeyW': shift ? "Cycles wind conditions in practice modes." : "Reads the current wind speed and direction.",
        'KeyK': shift ? "Quick-loads the Tour Pro Foursome." : "Unassigned key.",
        'KeyL': shift ? "On the Holo Range, cycles target terrain. In clubhouse, loads Sim Roster." : "Announces current lie.",
        'KeyO': gameMode === 'range' ? "Holo Range: Cycles the Object Manager." : "Unassigned key.",
        'KeyA': shift ? "Cycles the Caddy skill level." : "Asks the Oracle Caddy for a strategic shot blueprint.",
        'KeyF': "Reads the fairway description.",
        'KeyH': "Opens the navigable Hazard and Tree list.",
        'Semicolon': shift ? "Reads your quick timing and spin diagnostics." : "Cycles global green speed (Stimp).",
        'KeyC': shift ? "Copies the raw telemetry data to your clipboard." : "Announces your current club.",
        'KeyB': "Reads the green elevation and break when putting.",
        'KeyU': "Takes an unplayable lie penalty and drops the ball in the fairway.",
        'KeyE': shift ? "Opens the full scorecard." : "Announces your quick score summary.",
        'KeyP': "Cycles through the Multiplayer Game Pacing modes. Inside Scorecard, swaps players.",
        'KeyQ': "Opens the Quit and Save menu.",
        'KeyR': gameMode === 'range' ? "Practice Facility: Randomizes target distance and elevation." : "Unassigned key.",
        'BracketLeft': gameMode === 'range' ? "Holo Range: Moves active object Left." : "Unassigned key.",
        'BracketRight': gameMode === 'range' ? "Holo Range: Moves active object Right." : "Unassigned key.",
        'Minus': gameMode === 'range' ? (shift ? "Holo Range: Lowers Elevation/Height." : "Holo Range: Moves active object Closer.") : "Unassigned key.",
        'Equal': gameMode === 'range' ? (shift ? "Holo Range: Raises Elevation/Height." : "Holo Range: Moves active object Further.") : "Unassigned key.",
        'Backspace': gameMode === 'range' ? "Holo Range: De-spawns the active object." : "Unassigned key.",
        'Delete': gameMode === 'range' ? "Holo Range: De-spawns the active object." : "Unassigned key.",
        'Enter': ctrl ? "Fast-forwards through Clubhouse setup menus." : "Confirms selections and targets.",
        'F1': "Toggles Dev Power.",
        'F2': "Toggles Dev Hinge.",
        'F3': "Toggles Dev Impact.",
        'F12': "Toggles Keyboard Explore mode."
    };
    return desc[code] || "Unassigned key.";
};