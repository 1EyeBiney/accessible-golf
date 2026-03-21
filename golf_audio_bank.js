// golf_audio_bank.js - Categorized golf-focused sound bank (~100 cues)
(function () {
    const categories = [
        {
            id: 'ui-navigation',
            label: 'UI Navigation',
            cues: [
                { id: 'ui_nav_01', name: 'Menu Move Soft', source: 'soundtester-1', recipe: 'tone', args: [420, 'sine', 0.08, 0.18] },
                { id: 'ui_nav_02', name: 'Menu Move Bright', source: 'soundtester-10', recipe: 'tone', args: [1100, 'sine', 0.04, 0.1] },
                { id: 'ui_nav_03', name: 'Panel Open', source: 'new', recipe: 'echo', args: ['triangle', 420, 700, 0.16, 0.13, 0.12] },
                { id: 'ui_nav_04', name: 'Panel Close', source: 'new', recipe: 'echo', args: ['triangle', 700, 420, 0.16, 0.13, 0.12] },
                { id: 'ui_nav_05', name: 'Tab Forward', source: 'soundtester-70', recipe: 'tone', args: [700, 'triangle', 0.06, 0.12] },
                { id: 'ui_nav_06', name: 'Tab Back', source: 'new', recipe: 'tone', args: [620, 'triangle', 0.06, 0.12] },
                { id: 'ui_nav_07', name: 'Cycle Target', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [480, 620], 0.07, 0.15] },
                { id: 'ui_nav_08', name: 'Cycle Club', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [620, 480], 0.07, 0.15] },
                { id: 'ui_nav_09', name: 'Toggle On', source: 'soundtester-72', recipe: 'tone', args: [430, 'sine', 0.1, 0.16] },
                { id: 'ui_nav_10', name: 'Toggle Off', source: 'soundtester-73', recipe: 'tone', args: [650, 'sine', 0.1, 0.16] },
                { id: 'bunker_03', name: 'Floor Up', source: 'bunker-3', recipe: 'sweep', args: [300, 600, 600, 0.15, 0.25, 'triangle'] },
                { id: 'bunker_04', name: 'Floor Down', source: 'bunker-4', recipe: 'sweep', args: [600, 300, 300, 0.15, 0.25, 'triangle'] },
                { id: 'bunker_11', name: 'Low Boop', source: 'bunker-11', recipe: 'tone', args: [150, 'sine', 0.15, 0.4] },
                { id: 'bunker_33', name: 'Close Menus', source: 'bunker-33', recipe: 'echo', args: ['triangle', 300, 30, 0.6, 0.3, 0.4] }
            ]
        },
        {
            id: 'menu-state',
            label: 'Menus And State',
            cues: [
                { id: 'menu_01', name: 'Confirm Select', source: 'soundtester-23', recipe: 'sequence', args: [['square', 'square'], [200, 300], 0.09, 0.06] },
                { id: 'menu_02', name: 'Back Cancel', source: 'new', recipe: 'echo', args: ['triangle', 340, 180, 0.22, 0.1, 0.14] },
                { id: 'menu_03', name: 'Menu Open', source: 'new', recipe: 'chord', args: [[390, 523], 0.2, 0.17, 'sine'] },
                { id: 'menu_04', name: 'Menu Close', source: 'new', recipe: 'chord', args: [[523, 390], 0.2, 0.14, 'sine'] },
                { id: 'menu_05', name: 'Locked Action', source: 'soundtester-54', recipe: 'sequence', args: [['square', 'sine'], [600, 220], 0.2, 0.12] },
                { id: 'menu_06', name: 'Unlocked Action', source: 'soundtester-55', recipe: 'sequence', args: [['sine', 'square'], [220, 600], 0.2, 0.12] },
                { id: 'menu_07', name: 'Save Snapshot', source: 'new', recipe: 'echo', args: ['sine', 600, 900, 0.14, 0.15, 0.09] },
                { id: 'menu_08', name: 'Load Snapshot', source: 'new', recipe: 'echo', args: ['sine', 900, 600, 0.14, 0.15, 0.09] },
                { id: 'menu_09', name: 'Quick Status', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [500, 620, 760], 0.06, 0.13] },
                { id: 'menu_10', name: 'Help Mode', source: 'new', recipe: 'tone', args: [980, 'triangle', 0.08, 0.1] }
            ]
        },
        {
            id: 'club-targeting',
            label: 'Club And Targeting',
            cues: [
                { id: 'club_01', name: 'Driver Equipped', source: 'new', recipe: 'tone', args: [180, 'triangle', 0.15, 0.22] },
                { id: 'club_02', name: 'Iron Equipped', source: 'new', recipe: 'tone', args: [320, 'triangle', 0.12, 0.2] },
                { id: 'club_03', name: 'Wedge Equipped', source: 'new', recipe: 'tone', args: [520, 'triangle', 0.1, 0.18] },
                { id: 'club_04', name: 'Putter Equipped', source: 'new', recipe: 'tone', args: [740, 'triangle', 0.08, 0.16] },
                { id: 'club_05', name: 'Stance Forward', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [460, 700], 0.08, 0.12] },
                { id: 'club_06', name: 'Stance Back', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [700, 460], 0.08, 0.12] },
                { id: 'club_07', name: 'Aim Left', source: 'new', recipe: 'pan-blip', args: [680, -0.85, 0.07, 0.16] },
                { id: 'club_08', name: 'Aim Right', source: 'new', recipe: 'pan-blip', args: [680, 0.85, 0.07, 0.16] },
                { id: 'club_09', name: 'Target Locked', source: 'soundtester-37', recipe: 'echo', args: ['sine', 620, 840, 0.2, 0.17, 0.13] },
                { id: 'club_10', name: 'Auto Equip Confirm', source: 'new', recipe: 'chord', args: [[392, 523, 659], 0.22, 0.2, 'sine'] }
            ]
        },
        {
            id: 'swing-rhythm',
            label: 'Swing Rhythm',
            cues: [
                { id: 'swing_01', name: 'Backswing Start', source: 'existing-rule', recipe: 'tone', args: [600, 'triangle', 0.15, 0.2] },
                { id: 'swing_02', name: 'Hinge Mark', source: 'existing-rule', recipe: 'tone', args: [880, 'sine', 0.07, 0.14] },
                { id: 'swing_03', name: 'Power Tick 25', source: 'existing-rule', recipe: 'tone', args: [220, 'square', 0.18, 0.14] },
                { id: 'swing_04', name: 'Power Tick 50', source: 'existing-rule', recipe: 'tone', args: [440, 'triangle', 0.16, 0.16] },
                { id: 'swing_05', name: 'Power Tick 75', source: 'existing-rule', recipe: 'sequence', args: [['triangle', 'triangle'], [660, 660], 0.1, 0.16] },
                { id: 'swing_06', name: 'Power Tick 100', source: 'existing-rule', recipe: 'tone', args: [1200, 'sine', 0.35, 0.2] },
                { id: 'swing_07', name: 'Overpower Warning', source: 'existing-rule', recipe: 'tone', args: [150, 'sawtooth', 0.25, 0.22] },
                { id: 'swing_08', name: 'Drop Window Open', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [520, 620, 720], 0.05, 0.12] },
                { id: 'swing_09', name: 'Perfect Tempo', source: 'new', recipe: 'chord', args: [[523, 659], 0.12, 0.15, 'triangle'] },
                { id: 'swing_10', name: 'Whiff Recovery', source: 'new', recipe: 'sweep', args: [500, 140, 240, 0.4, 0.12, 'sine'] }
            ]
        },
        {
            id: 'contact-flight',
            label: 'Contact And Flight',
            cues: [
                { id: 'flight_01', name: 'Clean Strike', source: 'new', recipe: 'chord', args: [[260, 390, 520], 0.1, 0.22, 'triangle'] },
                { id: 'flight_02', name: 'Thin Strike', source: 'new', recipe: 'tone', args: [980, 'square', 0.07, 0.17] },
                { id: 'flight_03', name: 'Fat Strike', source: 'new', recipe: 'tone', args: [130, 'sine', 0.12, 0.2] },
                { id: 'flight_04', name: 'High Flight', source: 'new', recipe: 'sweep', args: [700, 1300, 900, 0.4, 0.11, 'sine'] },
                { id: 'flight_05', name: 'Low Punch', source: 'new', recipe: 'sweep', args: [240, 500, 300, 0.3, 0.13, 'triangle'] },
                { id: 'flight_06', name: 'Draw Shape', source: 'new', recipe: 'pan-sweep', args: [560, 860, 500, -0.6, 0.4, 0.45, 0.12] },
                { id: 'flight_07', name: 'Fade Shape', source: 'new', recipe: 'pan-sweep', args: [560, 860, 500, 0.6, -0.4, 0.45, 0.12] },
                { id: 'flight_08', name: 'Carry Peak', source: 'new', recipe: 'tone', args: [1180, 'sine', 0.1, 0.11] },
                { id: 'flight_09', name: 'Descent Callout', source: 'new', recipe: 'sweep', args: [880, 500, 280, 0.28, 0.12, 'sine'] },
                { id: 'flight_10', name: 'Flight End Marker', source: 'new', recipe: 'tone', args: [420, 'triangle', 0.1, 0.12] }
            ]
        },
        {
            id: 'lie-hazard',
            label: 'Lie And Hazards',
            cues: [
                { id: 'hazard_01', name: 'Fairway Land', source: 'new', recipe: 'tone', args: [240, 'sine', 0.08, 0.16] },
                { id: 'hazard_02', name: 'Rough Land', source: 'new', recipe: 'noise', args: [0.16, 0.1, false] },
                { id: 'hazard_03', name: 'Bunker Enter', source: 'new', recipe: 'noise-tone', args: [0.2, 0.14, 180, 'sine', 0.2, 0.12] },
                { id: 'hazard_04', name: 'Bunker Escape', source: 'new', recipe: 'noise-sweep', args: [0.12, 0.1, 220, 900, 600, 0.25, 0.11] },
                { id: 'hazard_05', name: 'Water Splash', source: 'existing-playSplash', recipe: 'splash', args: [0.22] },
                { id: 'hazard_06', name: 'Tree Hit', source: 'new', recipe: 'noise-tone', args: [0.06, 0.14, 160, 'square', 0.11, 0.12] },
                { id: 'hazard_07', name: 'Branch Deflect', source: 'new', recipe: 'echo', args: ['triangle', 920, 620, 0.14, 0.12, 0.08] },
                { id: 'hazard_08', name: 'Cart Path Bounce', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [900, 1200, 860], 0.06, 0.09] },
                { id: 'hazard_09', name: 'Out Of Bounds', source: 'new', recipe: 'chord', args: [[220, 262, 311], 0.45, 0.16, 'square'] },
                { id: 'hazard_10', name: 'Penalty Applied', source: 'new', recipe: 'sequence', args: [['square', 'square'], [300, 150], 0.18, 0.14] }
            ]
        },
        {
            id: 'putting',
            label: 'Putting And Roll',
            cues: [
                { id: 'putt_01', name: 'Putt Address', source: 'new', recipe: 'tone', args: [520, 'sine', 0.08, 0.1] },
                { id: 'putt_02', name: 'Putt Start', source: 'new', recipe: 'tone', args: [300, 'triangle', 0.07, 0.13] },
                { id: 'putt_03', name: 'Smooth Roll', source: 'new', recipe: 'roll-loop', args: [0.9, 0.09] },
                { id: 'putt_04', name: 'Fast Roll', source: 'new', recipe: 'roll-loop', args: [0.55, 0.12] },
                { id: 'putt_05', name: 'Cup Edge', source: 'new', recipe: 'echo', args: ['sine', 1400, 900, 0.08, 0.08, 0.05] },
                { id: 'putt_06', name: 'Lip Out', source: 'new', recipe: 'sequence', args: [['sine', 'square'], [780, 220], 0.12, 0.12] },
                { id: 'putt_07', name: 'Made Putt Short', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [494, 740], 0.15, 0.15] },
                { id: 'putt_08', name: 'Made Putt Long', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [392, 523, 784], 0.15, 0.14] },
                { id: 'putt_09', name: 'Pace Too Soft', source: 'new', recipe: 'tone', args: [260, 'sine', 0.2, 0.11] },
                { id: 'putt_10', name: 'Pace Too Firm', source: 'new', recipe: 'tone', args: [920, 'square', 0.1, 0.1] }
            ]
        },
        {
            id: 'scoring-moments',
            label: 'Scoring Moments',
            cues: [
                { id: 'score_01', name: 'Hole Complete', source: 'new', recipe: 'chord', args: [[392, 523, 659], 0.5, 0.2, 'sine'] },
                { id: 'score_02', name: 'Par Save', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [440, 660], 0.14, 0.16] },
                { id: 'score_03', name: 'Birdie', source: 'soundtester-45', recipe: 'chord', args: [[440, 554, 659, 880], 0.6, 0.2, 'sine'] },
                { id: 'score_04', name: 'Eagle', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine', 'sine'], [392, 523, 659, 1047], 0.11, 0.18] },
                { id: 'score_05', name: 'Albatross', source: 'new', recipe: 'chord', args: [[392, 523, 659, 784], 0.8, 0.26, 'sine'] },
                { id: 'score_06', name: 'Bogey', source: 'new', recipe: 'sequence', args: [['triangle', 'triangle'], [420, 280], 0.2, 0.13] },
                { id: 'score_07', name: 'Double Bogey', source: 'new', recipe: 'chord', args: [[220, 262, 311], 0.5, 0.17, 'triangle'] },
                { id: 'score_08', name: 'Round Saved', source: 'new', recipe: 'echo', args: ['sine', 580, 880, 0.18, 0.14, 0.12] },
                { id: 'score_09', name: 'Round Loaded', source: 'new', recipe: 'echo', args: ['sine', 880, 580, 0.18, 0.14, 0.12] },
                { id: 'score_10', name: 'Personal Best', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine', 'sine'], [523, 659, 784, 988], 0.12, 0.18] }
            ]
        },
        {
            id: 'coaching-status',
            label: 'Caddy And Status',
            cues: [
                { id: 'caddy_01', name: 'Caddy Tip', source: 'new', recipe: 'tone', args: [640, 'sine', 0.09, 0.1] },
                { id: 'caddy_02', name: 'Oracle Tip', source: 'new', recipe: 'chord', args: [[500, 700], 0.13, 0.14, 'triangle'] },
                { id: 'caddy_03', name: 'Hazard Warning', source: 'soundtester-16', recipe: 'sequence', args: [['sine', 'sine'], [820, 820], 0.08, 0.14] },
                { id: 'caddy_04', name: 'Wind Update', source: 'new', recipe: 'noise-sweep', args: [0.08, 0.08, 300, 1200, 500, 0.22, 0.08] },
                { id: 'caddy_05', name: 'Lie Update', source: 'new', recipe: 'sequence', args: [['triangle', 'triangle', 'triangle'], [240, 320, 400], 0.06, 0.12] },
                { id: 'caddy_06', name: 'Distance Callout', source: 'new', recipe: 'tone', args: [560, 'triangle', 0.12, 0.12] },
                { id: 'caddy_07', name: 'Strategy Ready', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [300, 450, 680], 0.07, 0.13] },
                { id: 'caddy_08', name: 'Green Read', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [700, 820, 760], 0.07, 0.1] },
                { id: 'caddy_09', name: 'Explore Mode On', source: 'new', recipe: 'tone', args: [980, 'sine', 0.12, 0.09] },
                { id: 'caddy_10', name: 'Explore Mode Off', source: 'new', recipe: 'tone', args: [340, 'sine', 0.12, 0.09] }
            ]
        },
        {
            id: 'practice-modes',
            label: 'Practice Modes',
            cues: [
                { id: 'practice_01', name: 'Enter Range', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine'], [280, 420, 640], 0.11, 0.14] },
                { id: 'practice_02', name: 'Enter Chipping', source: 'new', recipe: 'sequence', args: [['triangle', 'triangle', 'triangle'], [420, 620, 860], 0.1, 0.14] },
                { id: 'practice_03', name: 'Enter Putting', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [520, 780], 0.12, 0.12] },
                { id: 'practice_04', name: 'Exit Practice', source: 'new', recipe: 'sequence', args: [['sine', 'sine'], [780, 420], 0.12, 0.12] },
                { id: 'practice_05', name: 'Spawn Target', source: 'new', recipe: 'echo', args: ['triangle', 760, 980, 0.1, 0.1, 0.1] },
                { id: 'practice_06', name: 'Reset Ball', source: 'new', recipe: 'tone', args: [360, 'triangle', 0.1, 0.11] },
                { id: 'practice_07', name: 'Tree Spawn', source: 'new', recipe: 'noise-tone', args: [0.06, 0.1, 380, 'triangle', 0.2, 0.08] },
                { id: 'practice_08', name: 'Tree Height Set', source: 'new', recipe: 'sweep', args: [500, 980, 720, 0.24, 0.1, 'triangle'] },
                { id: 'practice_09', name: 'Telemetry Copy', source: 'new', recipe: 'sequence', args: [['sine', 'sine', 'sine', 'sine'], [700, 900, 1100, 1300], 0.04, 0.1] },
                { id: 'practice_10', name: 'Practice Session End', source: 'new', recipe: 'chord', args: [[262, 330, 392], 0.35, 0.15, 'sine'] }
            ]
        }
    ];

    const cueMap = {};
    categories.forEach((cat) => cat.cues.forEach((cue) => {
        cue.categoryId = cat.id;
        cue.categoryLabel = cat.label;
        cueMap[cue.id] = cue;
    }));

    function ensureAudio() {
        if (typeof window.initAudio === 'function') window.initAudio();
    }

    function panBlip(freq, pan, dur, vol) {
        ensureAudio();
        if (window.playPanTone) {
            window.playPanTone(freq, 'sine', dur, vol, pan);
            return;
        }
        if (window.playTone) window.playTone(freq, 'sine', dur, vol);
    }

    function rollLoop(duration, vol) {
        ensureAudio();
        if (!window.playNoise || !window.playTone) return;
        const slices = Math.max(3, Math.floor(duration / 0.1));
        for (let i = 0; i < slices; i++) {
            setTimeout(() => {
                window.playNoise(0.07, vol, true);
                window.playTone(140 + (i % 3) * 15, 'sine', 0.05, vol * 0.75);
            }, i * 90);
        }
    }

    function playRecipe(recipe, args) {
        ensureAudio();
        switch (recipe) {
            case 'tone':
                if (window.playTone) window.playTone(args[0], args[1], args[2], args[3]);
                break;
            case 'echo':
                if (window.playEcho) window.playEcho(args[0], args[1], args[2], args[3], args[4], args[5]);
                break;
            case 'sequence':
                if (window.playSequence) window.playSequence(args[0], args[1], args[2], args[3]);
                break;
            case 'chord':
                if (window.playChord) window.playChord(args[0], args[1], args[2], args[3]);
                break;
            case 'sweep':
                if (window.playSweep) window.playSweep(args[0], args[1], args[2], args[3], args[4], args[5]);
                break;
            case 'noise':
                if (window.playNoise) window.playNoise(args[0], args[1], args[2]);
                break;
            case 'noise-tone':
                if (window.playNoise) window.playNoise(args[0], args[1], false);
                setTimeout(() => {
                    if (window.playTone) window.playTone(args[2], args[3], args[4], args[5]);
                }, 30);
                break;
            case 'noise-sweep':
                if (window.playNoise) window.playNoise(args[0], args[1], false);
                setTimeout(() => {
                    if (window.playSweep) window.playSweep(args[2], args[3], args[4], args[5], args[6], 'sine');
                }, 50);
                break;
            case 'splash':
                if (window.playSplash) window.playSplash(args[0]);
                break;
            case 'pan-blip':
                panBlip(args[0], args[1], args[2], args[3]);
                break;
            case 'pan-sweep':
                if (window.playSweep) window.playSweep(args[0], args[1], args[2], args[5], args[6], 'sine');
                setTimeout(() => panBlip(args[2], args[4], 0.08, args[6]), 140);
                break;
            case 'roll-loop':
                rollLoop(args[0], args[1]);
                break;
            default:
                break;
        }
    }

    window.golfAudioBank = {
        version: '1.0.0',
        totalCues: categories.reduce((sum, cat) => sum + cat.cues.length, 0),
        categories,
        cueMap,
        play(cueId) {
            const cue = cueMap[cueId];
            if (!cue) return false;
            playRecipe(cue.recipe, cue.args);
            return true;
        }
    };

    window.playGolfSound = function (cueId) {
        return window.golfAudioBank.play(cueId);
    };
})();
