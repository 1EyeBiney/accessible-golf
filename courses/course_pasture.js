// course_pasture.js - The Pasture Course Data (v5.36.1)
window.courses = window.courses || [];
window.courses.push({
    name: "The Pasture",
    holes: [
        {
            number: 1, par: 4, distance: 350, greenRadius: 12, pinX: 0, pinY: 350,
            fairwayWidth: 50, pinLocation: "Center",
            loreName: "Clifford's Shortcut",
            description: "A 350-yard par 4 straight down the farm road. Watch out for Clifford and his tractor crossing the fairway!",
            fairwayDescription: "Wide 50-yard fairway all the way to the green. The tractor crosses the landing zone at around 190 yards. Time your drive to avoid it, or take the free bounce!",
            bgMusic: 'audio/courses/pasture/mu_pasture1.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_tractor.mp3',
            bgAmbientPostTee: 'audio/courses/pasture/am_farm1.mp3',
            hazards: [
                { type: "Bunker", distance: 210, depth: 20, offset: -22, width: 18 }
            ],
            landingZones: [{ name: "Drive Target", x: 0, y: 200 }, { name: "Approach", x: 0, y: 310 }],
            zones: [{x:0, y:200, w:40, h:40}]
        },
        { par: 4, distance: 380, greenRadius: 14, pinX: -10, pinY: 380, hazards: [{ type: "Bunker", distance: 200, depth: 15, offset: -15, width: 15 }, { type: "Bovine Herd" }], zones: [{x:-10, y:220, w:40, h:40}], bgMusic: 'audio/courses/pasture/mu_pasture2.mp3', bgAmbient: 'audio/courses/pasture/am_cow1.mp3', loreName: "The Bovine Bounce" },
        { par: 5, distance: 485, greenRadius: 15, approachWidth: 15, pinX: 10, pinY: 485,
          description: "A highly strategic 485-yard Par 5. The green is reachable in two, but the approach is severely choked by deep bunkers.",
          fairwayDescription: "A wide fairway that crosses a water hazard at 280 yards. The layup zone is safe, but the neck of the green shrinks to just 15 yards wide.",
          hazards: [
              { type: "Water", distance: 280, depth: 20, offset: 0, width: 60 },
              { type: "Bunker", distance: 470, depth: 15, offset: -12, width: 12 },
              { type: "Bunker", distance: 470, depth: 15, offset: 12, width: 12 },
              { type: "Chicken Flock" }
          ],
          zones: [{x:0, y:250, w:40, h:40}, {x:10, y:410, w:30, h:30}], bgMusic: 'audio/courses/pasture/mu_pasture3.mp3', bgAmbient: 'audio/courses/pasture/am_coop1.mp3', loreName: "Foul Plate" },
        ...Array.from({length: 15}, () => ({ par: 4, distance: 400, greenRadius: 12, pinX: 0, pinY: 400, hazards: ['sand'], zones: [{x:0, y:250, w:40, h:40}] }))
    ]
});
