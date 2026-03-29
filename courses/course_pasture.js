// course_pasture.js - The Pasture Course Data (v5.31.4)
window.courses = window.courses || [];
window.courses.push({
    name: "The Pasture",
    holes: [
        { par: 4, distance: 350, greenRadius: 12, pinX: 0, pinY: 350, hazards: ['sand', 'tractor'], zones: [{x:0, y:200, w:40, h:40}], bgMusic: 'audio/courses/pasture/mu_pasture1.mp3', bgAmbient: 'audio/courses/pasture/am_farm1.mp3', loreName: "Clifford's Shortcut" },
        { par: 4, distance: 380, greenRadius: 14, pinX: -10, pinY: 380, hazards: ['sand', 'cows'], zones: [{x:-10, y:220, w:40, h:40}], bgMusic: 'audio/courses/pasture/mu_pasture2.mp3', bgAmbient: 'audio/courses/pasture/am_cow1.mp3', loreName: "The Bovine Bounce" },
        { par: 5, distance: 520, greenRadius: 15, pinX: 10, pinY: 520, hazards: ['water', 'chickens'], zones: [{x:0, y:250, w:40, h:40}, {x:10, y:450, w:30, h:30}], bgMusic: 'audio/courses/pasture/mu_pasture3.mp3', bgAmbient: 'audio/courses/pasture/am_coop1.mp3', loreName: "Foul Plate" },
        ...Array.from({length: 15}, () => ({ par: 4, distance: 400, greenRadius: 12, pinX: 0, pinY: 400, hazards: ['sand'], zones: [{x:0, y:250, w:40, h:40}] }))
    ]
});
