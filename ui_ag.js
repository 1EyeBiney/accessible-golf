// ui_ag.js - Dashboard, Scorecard, Clubhouse Menu, and Help UI (v5.98.0)

// v4.10.0 Scorecard System

window.updateDashboard = function() {
    if (!document.getElementById('dashboard-panel')) return;
    
    // 1. Hole / Target Info
    let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name + "\n" : "";
    let holeStr = gameMode === 'course' ? `${pName}Hole ${hole} (Par ${par})\n${calculateDistanceToPin()}y to Pin` :
                  gameMode === 'range' ? `Driving Range\n${pinY}y Target` : `Chipping Green\n${calculateDistanceToPin()}y Target`;
    if ((gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long')) && synthTreeActive) {
        let latStr = synthTreeX === 0 ? 'Center' : `${Math.abs(synthTreeX)}y ${synthTreeX > 0 ? 'R' : 'L'}`;
        holeStr += `\nSynth Tree: ${synthTreeDist}y out, ${latStr} (${Math.round(synthTreeHeight)}ft)`;
    }

    if (isPutting) {
        let locationStr = gameMode === 'putting' ? "Practice Putting Green" : "Putting Green";
        holeStr = `${locationStr}\n${calculateDistanceToPin()}y to Cup`;
        let modeStr = puttState === 0 ? "TARGETING MODE" : "SWING MODE";
        document.getElementById('dash-env').innerText = modeStr;
        document.getElementById('dash-club').innerText = `Putter\nTarget: ${puttTargetDist}y`;
        let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'L' : 'R'}`;
        document.getElementById('dash-setup').innerText = `Aim: ${aimStr}`;
        document.getElementById('dash-hole').innerText = holeStr;
        return; 
    }

    document.getElementById('dash-hole').innerText = holeStr;
    
    // 2. Environment Info
    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
    const finalRad = targetAngleRad + (aimAngle * (Math.PI / 180));
    let relWindY = Math.round((windY * Math.cos(finalRad)) + (windX * Math.sin(finalRad)));
    let relWindX = Math.round((windX * Math.cos(finalRad)) - (windY * Math.sin(finalRad)));
    
    let windStr = windX === 0 && windY === 0 ? "Calm" : `${Math.abs(relWindY)}y ${relWindY>0?'Tail':'Head'}\n${Math.abs(relWindX)}y ${relWindX>0?'Right':'Left'}`;
    let activeLie = gameMode === 'range' ? rangeLie : currentLie;
    document.getElementById('dash-env').innerText = `${activeLie}\n${windStr}`;
    
    // 3. Equipment Info
    let style = shotStyles[shotStyleIndex];
    let gripStr = isChokedDown ? "(Choked 90%)" : "(Full Grip)";
    document.getElementById('dash-club').innerText = `${club.name} ${gripStr}\n${style.name} Swing`;
    
    // 4. Setup Info
    let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;
    let focusName = typeof focusModes !== 'undefined' ? focusModes[focusIndex].name : 'Std';
    let diffName = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex].name : 'Pro';
    document.getElementById('dash-setup').innerText = `Aim: ${aimStr}\n${stanceNames[stanceIndex]}\n[${focusName} / ${diffName}]`;
};

window.getQuickScore = function() {
    if (roundData.length === 0) return "No scores recorded yet. You are Even Par.";
    let totalStrokes = 0, totalPar = 0;
    roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
    let rel = totalStrokes - totalPar;
    let relStr = rel === 0 ? "Even Par" : rel > 0 ? `${rel} Over Par` : `${Math.abs(rel)} Under Par`;
    return `Through ${roundData.length} holes, you are ${relStr}. Total strokes: ${totalStrokes}.`;
};

window.getScoreTerm = function(par, score) {
    if (score === 1) return "Hole in One";
    let diff = score - par;
    if (diff === -3) return "Albatross";
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    if (diff === 3) return "Triple Bogey";
    return `+${diff}`;
};

window.showScorecard = function() {
    let activeRoundData = players[scorecardPlayerIndex] ? players[scorecardPlayerIndex].roundData : roundData; // v4.85.0
    scorecardGrid = [];
    let tStrokes = 0, tPar = 0, tPutts = 0;
    let firHit = 0, firPossible = 0;
    let girHit = 0, girPossible = 0;
    let totalAppProx = 0, appProxCount = 0;

    if (scorecardPage === 0) {
        // v4.30.3 Added Putt Dist
        scorecardGrid.push(["Hole", "Par", "Score", "Result", "Putts", "Putt Dist"]);
    } else {
        scorecardGrid.push(["Hole", "Drive", "FIR", "App Start", "App Prox", "GIR"]);
    }

    activeRoundData.forEach(r => {
        tStrokes += r.strokes; tPar += r.par; tPutts += r.putts;
        let firStr = "-";
        if (r.fir !== null) {
            firPossible++;
            if (r.fir) { firHit++; firStr = "Yes"; } else { firStr = "No"; }
        }
        girPossible++;
        if (r.gir) { girHit++; }
        let girStr = r.gir ? "Yes" : "No";

        let term = window.getScoreTerm(r.par, r.strokes);
        let driveStr = r.driveDistance ? `${r.driveDistance}y` : "-";
        let puttStr = r.putts.toString();
        
        // v4.30.3 Extract and format the holed putt distance
        let puttDistStr = (r.putts > 0 && r.puttDistance) ? window.formatProximity(r.puttDistance) : "-";
        
        let appStartStr = r.approachStart ? `${r.approachStart}y` : "-";
        let appProxStr = r.approachProx ? window.formatProximity(r.approachProx) : "-";
        if (r.approachProx) {
            totalAppProx += r.approachProx;
            appProxCount++;
        }

        if (scorecardPage === 0) {
            scorecardGrid.push([r.hole.toString(), r.par.toString(), r.strokes.toString(), term, puttStr, puttDistStr]);
        } else {
            scorecardGrid.push([r.hole.toString(), driveStr, firStr, appStartStr, appProxStr, girStr]);
        }
    });

    let rel = tStrokes - tPar;
    let relStr = rel === 0 ? "E" : rel > 0 ? `+${rel}` : `${rel}`;
    let firTotalStr = firPossible > 0 ? `${firHit}/${firPossible}` : "-";
    let girTotalStr = girPossible > 0 ? `${girHit}/${girPossible}` : "-";
    let avgProxStr = appProxCount > 0 ? window.formatProximity(totalAppProx / appProxCount) : "-";

    if (scorecardPage === 0) {
        scorecardGrid.push(["TOTAL", `(${relStr})`, tStrokes.toString(), "-", tPutts.toString(), "-"]);
    } else {
        scorecardGrid.push(["TOTAL", "-", firTotalStr, "-", avgProxStr, girTotalStr]);
    }

    let html = `<table id="scorecard-table" style="width:100%; border-collapse: collapse; text-align: center; color: white;" border="1" aria-hidden="true">
        <thead><tr>${scorecardGrid[0].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    for (let i = 1; i < scorecardGrid.length - 1; i++) {
        html += `<tr>${scorecardGrid[i].map(d => `<td>${d}</td>`).join('')}</tr>`;
    }
    let lastRow = scorecardGrid[scorecardGrid.length - 1];
    html += `</tbody><tfoot><tr><th>${lastRow[0]}</th>` + lastRow.slice(1).map(d => `<td>${d}</td>`).join('') + `</tr></tfoot></table>`;

    document.getElementById('scorecard-container').innerHTML = html;
    window.lastHighlightedCell = null; // v4.84.0 Clear stale DOM reference
    document.getElementById('scorecard-container').style.display = 'block';
    document.getElementById('visual-output').style.display = 'none';

    // Clamp column if Analytics page has fewer/more columns than Traditional
    if (scCol >= scorecardGrid[0].length) scCol = scorecardGrid[0].length - 1;

    // Only call the Init Announcement if we are opening it fresh (Row 0, Col 0)
    if (scRow === 0 && scCol === 0) window.announceScorecardCell(true);
};

window.renderScorecard = function() {
    if (!players || players.length === 0) {
        window.announce("Scorecard unavailable: No player data found.");
        return;
    }
    // v5.7.0 Lock out background game controls
    viewingScorecard = true;
    window.viewingScorecard = true;
    window.showScorecard();
};

window.announceScorecardCell = function(isInit = false, isPageFlip = false) {
    let val = scorecardGrid[scRow][scCol];
    let colName = scorecardGrid[0][scCol];
    let rowName = scorecardGrid[scRow][0];
    
    let msg = "";
    if (isInit) {
        let pName = (typeof players !== 'undefined' && players.length > 0 && typeof scorecardPlayerIndex !== 'undefined') ? players[scorecardPlayerIndex].name : "Player";
        let courseName = window.currentCourse.name;
        msg = `${pName}'s Scorecard. ${courseName}. Page ${scorecardPage + 1}. Use Spacebar to flip pages, P to swap players, Arrow Keys to navigate, Escape to close. `;
        msg += `Row 1, Column 1. ${val}.`;
    } else if (isPageFlip) {
        let pageName = scorecardPage === 0 ? "Page 1: Traditional Scoring" : "Page 2: Advanced Analytics";
        let rowPrefix = rowName === "TOTAL" ? "TOTAL Row" : `Hole ${rowName}`;
        msg = `${pageName}. ${rowPrefix}, ${colName}: ${val}`;
    } else {
        if (scRow === 0) {
            msg = `Column Header: ${val}`;
        } else if (scCol === 0) {
            msg = rowName === "TOTAL" ? "TOTAL Row" : `Hole ${val}`;
        } else {
            let rowPrefix = rowName === "TOTAL" ? "Total" : `Hole ${rowName},`;
            msg = `${rowPrefix} ${colName}: ${val}`;
        }
    }
    
    window.announce(msg);
    
    let table = document.getElementById('scorecard-table');
    if (table) {
        // v4.84.0 O(1) DOM Targeting (Eliminates UI Lag)
        if (typeof window.lastHighlightedCell !== 'undefined' && window.lastHighlightedCell) {
            window.lastHighlightedCell.style.backgroundColor = 'transparent';
            window.lastHighlightedCell.style.color = 'white';
        } else if (isInit || isPageFlip) {
            // Fallback to clear all if we just built the table
            let cells = table.getElementsByTagName('td');
            let ths = table.getElementsByTagName('th');
            for (let c of cells) { c.style.backgroundColor = 'transparent'; c.style.color = 'white'; }
            for (let c of ths) { c.style.backgroundColor = 'transparent'; c.style.color = 'white'; }
        }
        
        try {
            let targetRow = table.rows[scRow];
            let targetCell = targetRow.cells[scCol];
            targetCell.style.backgroundColor = '#4CAF50';
            targetCell.style.color = 'black';
            window.lastHighlightedCell = targetCell;
        } catch(e) {}
    }
};

window.generateNarrativeSummary = function() {
    if (roundData.length === 0) return "No holes completed yet.";
    let totalStrokes = 0, totalPar = 0;
    roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
    let rel = totalStrokes - totalPar;
    let relStr = rel === 0 ? "Even Par" : rel > 0 ? `+${rel}` : `${Math.abs(rel)} Under Par`;

    let text = `⛳ Accessible Golf Round Summary ⛳\n`;
    text += `Course: ${window.currentCourse.name}\n`;
    text += `Score: ${relStr} (${totalStrokes})\n\n`;
    text += `🏆 Highlights of the Round:\n`;

    let hasHighlights = false;
    if (roundHighlights.drives.length > 0) {
        text += `[Monster Drives]\n`;
        roundHighlights.drives.forEach(d => text += `- Crushed a ${d.dist}-yard tee shot on Hole ${d.hole}.\n`);
        hasHighlights = true;
    }
    if (roundHighlights.approaches.length > 0) {
        text += `\n[Sniper Approaches]\n`;
        roundHighlights.approaches.forEach(a => text += `- Stuck it to ${window.formatProximity(a.prox)} from ${a.start} yards out on Hole ${a.hole}.\n`);
        hasHighlights = true;
    }
    if (roundHighlights.putts.length > 0) {
        text += `\n[Clutch Putts]\n`;
        roundHighlights.putts.forEach(p => text += `- Drained a ${window.formatProximity(p.dist)} putt on Hole ${p.hole}.\n`);
        hasHighlights = true;
    }

    if (!hasHighlights) text += "- A solid, consistent round of golf.\n";
    return text;
};

// --- CLUBHOUSE MENU (v5.0.0) ---

window.buildClubhouseMenu = function() {
    clubhouseMenu = [];
    
    if (clubhouseState === 'root') {
        if (typeof roundData !== 'undefined' && (roundData.length > 0 || strokes > 0)) {
            clubhouseMenu.push({ text: "Resume Current Round", action: () => {
                gameMode = 'course';
                document.getElementById('dashboard-panel').style.display = 'block';
                document.getElementById('swing-meter').style.display = 'block';
                if (typeof window.loadActivePlayer === 'function') window.loadActivePlayer(currentPlayerIndex);
                window.announce("Resuming round. Hole " + hole + ".");
            }});
        }
        clubhouseMenu.push({ text: "Start New Game", action: () => {
            clubhouseState = 'course'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Practice Facilities", action: () => {
            clubhouseState = 'practice'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Help & Master Keybindings", action: () => {
            if (typeof window.openHelpMenu === 'function') window.openHelpMenu();
        }});
    }
    else if (clubhouseState === 'practice') {
            // Helper function to build the dummy course
            const setupDummyCourse = () => {
                strokes = 0; holeTelemetry = []; isHoleComplete = false; swingState = 0; window.holoFocusIndex = 0;
                let holoCourseIdx = courses.findIndex(c => c.name === "Holo Range Simulator");
                if (holoCourseIdx === -1) {
                    courses.push({ name: "Holo Range Simulator", holes: [{ number: 1, par: 4, distance: 600, pinX: 0, pinY: 100, pinZ: 0, trees: [], hazards: [] }] });
                    holoCourseIdx = courses.length - 1;
                }
                currentCourseIndex = holoCourseIdx; hole = 1;
                ballX = 0; ballY = 0; pinX = 0; pinZ = 0; rangeLie = 'Fairway';
            };

            clubhouseMenu.push({ text: "The Holo Range", action: () => {
                gameMode = 'range'; window.rangeMode = 'holo'; setupDummyCourse();
                pinY = 180; targetY = 180;
                let msg = `Welcome to the Holo Range. Target set to ${pinY} yards. ${window.rangeOrientationText}`;
                setTimeout(() => { window.announce(msg); }, 1000);
                document.getElementById('visual-output').innerText = "Holo Range Active.";
                clubhouseState = 'root';
            }});
            clubhouseMenu.push({ text: "Pitching & Long Chipping Green", action: () => {
                gameMode = 'range'; window.rangeMode = 'long'; setupDummyCourse();
                pinY = Math.floor(Math.random() * 71) + 30; // 30 to 100
                let msg = `Welcome to the Pitching Green. Target set to ${pinY} yards. ${window.rangeOrientationText}`;
                setTimeout(() => { window.announce(msg); }, 1000);
                document.getElementById('visual-output').innerText = "Pitching Green Active.";
                clubhouseState = 'root';
            }});
            clubhouseMenu.push({ text: "Short Chipping Green", action: () => {
                gameMode = 'range'; window.rangeMode = 'short'; setupDummyCourse();
                pinY = Math.floor(Math.random() * 26) + 5; // 5 to 30
                let msg = `Welcome to the Short Chipping Green. Target set to ${pinY} yards. ${window.rangeOrientationText}`;
                setTimeout(() => { window.announce(msg); }, 1000);
                document.getElementById('visual-output').innerText = "Short Chipping Green Active.";
                clubhouseState = 'root';
            }});
        clubhouseMenu.push({ text: "Putting Green", action: () => {
            gameMode = 'putting'; strokes = 0; holeTelemetry = []; isHoleComplete = false;
            ballX = 0; ballY = 0; pinX = 0; pinY = Math.floor(Math.random() * 41) + 5;
            if (typeof window.initPutting === 'function') window.initPutting();
            clubhouseState = 'root';
        }});
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'root'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'course_quick') {
        window.courseData.forEach((c, idx) => {
            clubhouseMenu.push({ text: c.name, action: () => {
                wizardCourse = idx; 
                window.currentCourse = window.courseData[idx]; // v5.15.0 Lock in the active course data
                clubhouseState = 'settings'; clubhouseIndex = 0;
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }});
        });
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'root'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'course') {
        window.courseData.forEach((c, idx) => {
            clubhouseMenu.push({ text: c.name, action: () => {
                wizardCourse = idx; 
                window.currentCourse = window.courseData[idx]; // v5.15.0 Lock in the active course data
                clubhouseState = 'size'; clubhouseIndex = 0;
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }});
        });
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'root'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'size') {
        for (let i = 1; i <= 4; i++) {
            clubhouseMenu.push({ text: `Group Size: ${i} Player${i > 1 ? 's' : ''}`, action: () => {
                wizardSize = i;
                wizardRoster = Array(i).fill(null);
                wizardRoster[0] = { name: "Player 1", isBot: false }; 
                clubhouseState = 'roster'; clubhouseIndex = 0;
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }});
        }
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'course'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'roster') {
        for (let i = 0; i < wizardSize; i++) {
            let slotName = wizardRoster[i] ? wizardRoster[i].name : "Empty. Press Enter to assign.";
            clubhouseMenu.push({ text: `Slot ${i + 1}: ${slotName}`, action: () => {
                wizardSlot = i; clubhouseState = 'roster_type'; clubhouseIndex = 0;
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }});
        }
        let allFilled = wizardRoster.filter(r => r !== null).length === wizardSize;
        if (allFilled) {
            clubhouseMenu.push({ text: "Proceed to Match Settings", action: () => {
                clubhouseState = 'settings'; clubhouseIndex = 0;
                window.buildClubhouseMenu(); window.announceClubhouse(true);
            }});
        }
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'size'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'roster_type') {
        clubhouseMenu.push({ text: "Human Player", action: () => {
            wizardRoster[wizardSlot] = { name: wizardSlot === 0 ? "Player 1" : `Player ${wizardSlot+1}`, isBot: false };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Amateur Bots", action: () => {
            clubhouseState = 'roster_bot_amateur'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Tour Pro Bots", action: () => {
            clubhouseState = 'roster_bot_tour'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'roster_bot_amateur') {
        clubhouseMenu.push({ text: "Mulligan Moe", action: () => {
            wizardRoster[wizardSlot] = { name: "Mulligan Moe", isBot: true, skill: 1, iBias: 35, hBias: 0, focus: 1, ball: 1 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Fairway Frank", action: () => {
            wizardRoster[wizardSlot] = { name: "Fairway Frank", isBot: true, skill: 1, iBias: -15, hBias: 45, focus: 4, ball: 4 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Shankin' Shawn", action: () => {
            wizardRoster[wizardSlot] = { name: "Shankin' Shawn", isBot: true, skill: 0, iBias: 80, hBias: -40, focus: 0, ball: 5 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Dusty Bunkers", action: () => {
            wizardRoster[wizardSlot] = { name: "Dusty Bunkers", isBot: true, skill: 1, iBias: 0, hBias: 0, focus: 0, ball: 2 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'roster_type'; clubhouseIndex = 1; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'roster_bot_tour') {
        clubhouseMenu.push({ text: "Tour-Pro Ted", action: () => {
            wizardRoster[wizardSlot] = { name: "Tour-Pro Ted", isBot: true, skill: 3, iBias: 0, hBias: 0, focus: 3, ball: 0 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Bot Rory (The Bomber)", action: () => {
            wizardRoster[wizardSlot] = { name: "Bot Rory", isBot: true, skill: 3, iBias: -15, hBias: 12, focus: 1, ball: 0 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Bot Golden Bear (The Tactician)", action: () => {
            wizardRoster[wizardSlot] = { name: "Bot Golden Bear", isBot: true, skill: 3, iBias: 15, hBias: 0, focus: 4, ball: 0 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Bot Lefty (The Thrill)", action: () => {
            wizardRoster[wizardSlot] = { name: "Bot Lefty", isBot: true, skill: 3, iBias: -25, hBias: 10, focus: 5, ball: 0 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Bot Seve (The Magician)", action: () => {
            wizardRoster[wizardSlot] = { name: "Bot Seve", isBot: true, skill: 3, iBias: -10, hBias: 0, focus: 5, ball: 0 };
            clubhouseState = 'roster'; clubhouseIndex = wizardSlot; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
        clubhouseMenu.push({ text: "Go Back", action: () => {
            clubhouseState = 'roster_type'; clubhouseIndex = 0; window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    else if (clubhouseState === 'settings') {
        clubhouseMenu.push({ text: `Starting Wind: ${windLevels[wizardWind].name}`, action: () => {
            wizardWind = (wizardWind + 1) % windLevels.length; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});
        clubhouseMenu.push({ text: `Tournament Greens: ${wizardTournamentGreens ? "ON (Stimp 13)" : "OFF (Stimp 10)"}`, action: () => {
            wizardTournamentGreens = !wizardTournamentGreens; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});
        clubhouseMenu.push({ text: `Rough Condition: ${roughConditions[wizardRough].name}`, action: () => {
            wizardRough = (wizardRough + 1) % roughConditions.length; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});

        const mulToggles = ["Off", "3 Per Round", "Unlimited"];
        clubhouseMenu.push({ text: `Mulligans: ${mulToggles[wizardMulligans]}`, action: () => {
            wizardMulligans = (wizardMulligans + 1) % 3; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});

        const gimToggles = ["Off", "Manual Only", "Auto Inside 3ft", "Auto Inside 6ft"];
        clubhouseMenu.push({ text: `Gimmes: ${gimToggles[wizardGimmes]}`, action: () => {
            wizardGimmes = (wizardGimmes + 1) % 4; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});

        const maxToggles = ["Off", "Double Par", "Snowman (Max 8)"];
        clubhouseMenu.push({ text: `Max Score: ${maxToggles[wizardMaxScore]}`, action: () => {
            wizardMaxScore = (wizardMaxScore + 1) % 3; window.buildClubhouseMenu(); window.announceClubhouse(false);
        }});

        clubhouseMenu.push({ text: "Start Round!", action: () => {
            if (typeof window.clearSave === 'function') window.clearSave(); 
            
            currentCourseIndex = wizardCourse;
            windLevelIndex = wizardWind; generateWind();
            window.tournamentGreens = wizardTournamentGreens;
            roughConditionIndex = wizardRough; 
            pacingModeIndex = 0; // v4.90.0 Failsafe: Hardcode to Fast Pacing
            
            players = [];
            activePlayerCount = wizardSize;
            for (let i = 0; i < wizardSize; i++) {
                let pData = wizardRoster[i];
                players.push({
                    name: pData.name, isBot: pData.isBot, botSkill: pData.skill || 0,
                    impactBias: pData.iBias || 0, hingeBias: pData.hBias || 0,
                    botImpact: 0, botHinge: 0, botPower: 100,
                    strokes: 0, puttsThisHole: 0,
                    roundData: [], roundHighlights: { drives: [], approaches: [], putts: [] }, currentHoleStats: { fir: null, gir: false },
                    ballX: 0, ballY: 0, currentLie: "Tee", isHoleComplete: false, isPutting: false, puttTargetDist: 0,
                    aimAngle: 0, stanceIndex: 2, stanceAlignment: 0, focusIndex: pData.focus || 0, currentClubIndex: currentClubIndex,
                    difficultyIndex: typeof difficultyIndex !== 'undefined' ? difficultyIndex : 2,
                    caddyLevel: typeof caddyLevel !== 'undefined' ? caddyLevel : 1,
                    activeBallIndex: pData.ball || 0,
                    shotStyleIndex: 0, isChokedDown: false, devPower: false, devHinge: false, devImpact: false
                });
            }
            currentPlayerIndex = 0;
            gameMode = 'course'; strokes = 0;
            clubhouseState = 'root'; // reset for next time
            document.getElementById('dashboard-panel').style.display = 'block';
            document.getElementById('swing-meter').style.display = 'block';
            loadHole(1);
        }});
        clubhouseMenu.push({ text: "Back (Escape)", action: () => {
            clubhouseState = 'roster'; clubhouseIndex = 0;
            window.buildClubhouseMenu(); window.announceClubhouse(true);
        }});
    }
    window.menuOptions = clubhouseMenu;
    window.menuIndex = clubhouseIndex;
};

window.announceClubhouse = function(isInit = true) {
    // v5.93.0 TTS Delay for Door Transitions
    if (typeof window.isDoorTransitioning !== 'undefined' && window.isDoorTransitioning) {
        window.deferredAnnounce = () => window.announceClubhouse(isInit);
        return;
    }
    if (!clubhouseMenu || clubhouseMenu.length === 0) return;
    window.menuOptions = clubhouseMenu;
    window.menuIndex = clubhouseIndex;
    let prefix = "";
    if (isInit) {
        if (clubhouseState === 'course') prefix = "Select a Course. ";
        else if (clubhouseState === 'size') prefix = "How many in your group today? ";
        else if (clubhouseState === 'roster') prefix = "Configure your Roster. ";
        else if (clubhouseState === 'roster_type') prefix = "Select player type using Up and Down arrows. ";
        else if (clubhouseState === 'roster_bot_amateur') prefix = "Select Amateur Bot. ";
        else if (clubhouseState === 'roster_bot_tour') prefix = "Select Tour Pro Bot. ";
        else if (clubhouseState === 'settings') prefix = "Round Setup. ";
    }
    let msg = prefix + window.menuOptions[window.menuIndex].text;
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
};

window.confirmClubhouseSelection = function() {
    let oldState = typeof clubhouseState !== 'undefined' ? clubhouseState : 'root';
    if (window.menuOptions && window.menuOptions[window.menuIndex]) {
        window.menuOptions[window.menuIndex].action();
    }
    let newState = typeof clubhouseState !== 'undefined' ? clubhouseState : 'root';
    
    // v5.94.0 Bi-Directional Door Triggers
    if (oldState === 'root' && (newState === 'course' || newState === 'course_quick')) {
        if (typeof window.triggerDoorTransition === 'function') window.triggerDoorTransition('vox');
    } else if (oldState === 'root' && newState === 'practice') {
        if (typeof window.triggerDoorTransition === 'function') window.triggerDoorTransition('cafe');
    } else if ((oldState === 'practice' || oldState === 'course' || oldState === 'course_quick') && newState === 'root') {
        if (typeof window.triggerDoorTransition === 'function') window.triggerDoorTransition('vox');
    }
};

// --- v5.1.10 Visual Swing Meter Restoration (With Hinge Markers) ---

window.drawMeter = function() {
    const canvas = document.getElementById('swing-meter');
    if (!canvas) {
        requestAnimationFrame(window.drawMeter);
        return;
    }
    
    // Only draw if we are actively playing (not in clubhouse or help menus)
    if (typeof gameMode === 'undefined' || gameMode === 'clubhouse' || window.viewingHelp) {
        canvas.style.display = 'none';
        requestAnimationFrame(window.drawMeter);
        return;
    } else {
        canvas.style.display = 'block';
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background Track
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, w, h);

    // Anchor Points
    let impactX = w * 0.2;  // Sweet Spot (20% from left)
    let powerX = w * 0.8;   // 100% Power Line (80% from left)

    // Draw Sweet Spot (Impact Zone)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(impactX - 10, 0, 20, h);

    // Draw 100% Power Line
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(powerX - 2, 0, 4, h);

    // Draw 120% Over-Torque Zone
    ctx.fillStyle = '#f44336';
    ctx.fillRect(w * 0.95, 0, w * 0.05, h);

    // Helper function for Hinge Markers
    function drawHingeMarker(x, isTop) {
        ctx.fillStyle = '#2196F3'; // Blue hinge color
        ctx.beginPath();
        if (isTop) {
            ctx.moveTo(x, 15); ctx.lineTo(x - 8, 0); ctx.lineTo(x + 8, 0);
        } else {
            ctx.moveTo(x, h - 15); ctx.lineTo(x - 8, h); ctx.lineTo(x + 8, h);
        }
        ctx.fill();
    }

    // Draw Hinge Triangles based on Spacebar timestamps
    if (typeof hingeTimeBack !== 'undefined' && hingeTimeBack > 0 && backswingStartTime > 0) {
        let elapsedHinge = hingeTimeBack - backswingStartTime;
        let hingePower = Math.min(120, (elapsedHinge / 1000) * 100);
        let hX = impactX + (hingePower / 100) * (powerX - impactX);
        drawHingeMarker(hX, false); // Bottom triangle for backswing
    }

    if (typeof hingeTimeDown !== 'undefined' && hingeTimeDown > 0 && downswingStartTime > 0 && dropDurationMs > 0) {
        let elapsedHinge = hingeTimeDown - downswingStartTime;
        let hingePower = Math.max(0, finalPower - ((elapsedHinge / dropDurationMs) * finalPower));
        let hX = impactX + (hingePower / 100) * (powerX - impactX);
        drawHingeMarker(hX, true); // Top triangle for downswing
    }

    // Calculate Moving Cursor
    let cursorX = impactX;
    let now = performance.now();

    if (swingState === 1 || swingState === 2) {
        let elapsed = now - backswingStartTime;
        let currentPower = Math.min(120, (elapsed / 1000) * 100);
        cursorX = impactX + (currentPower / 100) * (powerX - impactX);
    } else if (swingState === 3) {
        let elapsed = now - downswingStartTime;
        let currentPower = Math.max(0, finalPower - ((elapsed / dropDurationMs) * finalPower));
        cursorX = impactX + (currentPower / 100) * (powerX - impactX);
    } else if (swingState === 4 || swingState === 5) {
        let visualOffset = (window.lockedImpactTime || 0) * (w / 1500); // Scale ms to pixels
        cursorX = impactX + visualOffset;
    }

    // Draw White Cursor
    ctx.fillStyle = '#FFF';
    ctx.fillRect(cursorX - 3, 0, 6, h);

    requestAnimationFrame(window.drawMeter);
}; // <-- THIS CLOSES window.drawMeter

// Initialize the render loop
requestAnimationFrame(window.drawMeter);

// --- v5.2.0 Dedicated Help Menu Launcher ---

window.openHelpMenu = function() {
    if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_03');
    viewingHelp = true;
    window.viewingHelp = true; // Safety redundancy
    helpIndex = 0;
    const panel = document.getElementById('help-panel');
    if (panel) panel.style.display = 'block';
    if (typeof window.renderHelpMenu === 'function') window.renderHelpMenu();
    if (typeof window.announceHelp === 'function') window.announceHelp();
};

window.renderHelpMenu = function() {
    const panel = document.getElementById('help-panel');
    if (!panel) return;
    panel.innerHTML = '<h2 style="color: #2196F3; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px;">Help & Keybindings</h2>';
    
    window.currentActiveHelp = gameMode === 'range' ? window.holoHelpData.concat(helpMenuText) : helpMenuText;
    
    window.currentActiveHelp.forEach((item, i) => {
        let el = document.createElement('div');
        el.id = `help-line-${i}`;
        el.style.padding = '8px 12px';
        el.style.marginBottom = '4px';
        el.style.borderRadius = '4px';
        el.style.transition = 'background-color 0.2s, color 0.2s';
        
        if (item.heading) {
            el.style.fontWeight = 'bold'; el.style.color = '#2196F3'; el.style.marginTop = '15px'; el.style.fontSize = '1.1em';
            el.innerText = item.text.replace(/: Heading Level [0-9]\./g, '');
        } else {
            el.style.color = '#ccc'; el.innerText = item.text;
        }
        panel.appendChild(el);
    });
    window.updateHelpHighlight();
};

window.updateHelpHighlight = function() {
    if (!window.currentActiveHelp) return;
    window.currentActiveHelp.forEach((_, i) => {
        let el = document.getElementById(`help-line-${i}`);
        if (el) {
            if (i === helpIndex) {
                el.style.backgroundColor = '#2196F3'; el.style.color = '#fff';
                let panel = document.getElementById('help-panel');
                let offset = el.offsetTop - panel.offsetTop - (panel.clientHeight / 2) + (el.clientHeight / 2);
                panel.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
            } else {
                el.style.backgroundColor = 'transparent';
                el.style.color = window.currentActiveHelp[i].heading ? '#2196F3' : '#ccc';
            }
        }
    });
};

window.announceHelp = function() {
    if (!window.currentActiveHelp) return;
    const line = window.currentActiveHelp[helpIndex];
    window.announce(line.text);
    document.getElementById('visual-output').innerText = line.text;
    window.updateHelpHighlight();
};
