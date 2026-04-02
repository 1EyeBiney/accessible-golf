// course_pasture.js - The Pasture Course Data (v5.68.0)
window.courses = window.courses || [];
window.courses.push({
    name: "The Pasture",
    holes: [
        {
            number: 1, par: 4, distance: 350, greenRadius: 12, pinX: 0, pinY: 350,
            greenType: "The Welcoming Bowl",
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
        { par: 4, distance: 380, greenRadius: 14, pinX: -10, pinY: 380, greenType: "Back-to-Front", hazards: [{ type: "Bunker", distance: 200, depth: 15, offset: -15, width: 15 }, { type: "Bovine Herd" }], zones: [{x:-10, y:220, w:40, h:40}], bgMusic: 'audio/courses/pasture/mu_pasture2.mp3', bgAmbient: 'audio/courses/pasture/am_cow1.mp3', loreName: "The Bovine Bounce" },
        { par: 5, distance: 485, greenRadius: 15, approachWidth: 15, pinX: 10, pinY: 485,
          greenType: "The False Front",
          description: "A highly strategic 485-yard Par 5. The green is reachable in two, but the approach is severely choked by deep bunkers.",
          fairwayDescription: "A wide fairway that crosses a water hazard at 280 yards. The layup zone is safe, but the neck of the green shrinks to just 15 yards wide.",
          hazards: [
              { type: "Water", distance: 280, depth: 20, offset: 0, width: 60 },
              { type: "Bunker", distance: 470, depth: 15, offset: -12, width: 12 },
              { type: "Bunker", distance: 470, depth: 15, offset: 12, width: 12 },
              { type: "Chicken Flock" }
          ],
          zones: [{x:0, y:250, w:40, h:40}, {x:10, y:410, w:30, h:30}], bgMusic: 'audio/courses/pasture/mu_pasture3.mp3', bgAmbient: 'audio/courses/pasture/am_coop1.mp3', loreName: "Foul Plate" },
        {
            par: 3, distance: 165, greenRadius: 35, pinX: 0, pinY: 165, greenType: "The Pig Tiers",
            loreName: "Floyd's Mud Bowl",
            description: "Welcome to Floyd's Mud Bowl. A 165-yard Par 3 featuring a massive, severely contoured three-tier green. Missing the putting surface means landing in the deep wallow of Clifford's prize-winning boar, Floyd. Mud is a devastating new terrain: the ball sinks deep, killing all roll, drastically slashing your swing's sweet spot, and massively increasing shot dispersion. You'll have to chop it out and pray!",
            fairwayDescription: "There is no fairway. It is a forced carry to the giant green, which is completely surrounded by Floyd's thick mud wallow.",
            bgMusic: 'audio/courses/pasture/mu_pasture4.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_pig.mp3',
            bgAmbientPostGreen: 'audio/courses/pasture/am_farm1.mp3',
            hazards: [
                { type: "Floyd the Boar (Spectating)", distance: 205, depth: 10, offset: -20, width: 15 }
            ],
            zones: [{x:0, y:165, w:70, h:70}]
        },
        {
            par: 4, distance: 460, greenRadius: 18, pinX: 15, pinY: 460, greenType: "Turtleback",
            loreName: "The Pecking Order",
            description: "Welcome to the scratching yard. This 460-yard Par 4 bends sharply around Clifford's massive chicken coop. The rough here has been scratched down to bare, packed earth by the roaming flock. Play safe to the wide left fairway, or try to cut the corner over the coop—just be prepared for some wicked bounces on the hard dirt.",
            fairwayDescription: "A dogleg right that hinges around a 40-foot coop. The surrounding packed earth gives massive roll-outs, so account for the extra skip when approaching the crowned green.",
            bgMusic: 'audio/courses/pasture/mu_pasture5.mp3',
            bgAmbient: 'audio/courses/pasture/am_coop1.mp3',
            trees: [
                { name: "The Chicken Coop", x: 25, y: 260, radius: 15, height: 40 }
            ],
            hazards: [
                { type: "Bunker", distance: 440, depth: 15, offset: 15, width: 20 },
                { type: "Chicken Flock" },
                { type: "Free-Range Flock (Spectating)", distance: 480, offset: -45 }
            ],
            landingZones: [{ name: "Safe Left Fairway", x: -15, y: 260 }, { name: "Aggressive Corner Cut", x: 15, y: 310 }],
            zones: [{x:-15, y:260, w:30, h:30}, {x:15, y:310, w:30, h:30}]
        },
        {
            number: 6, par: 4, distance: 380, greenRadius: 16, pinX: 0, pinY: 380, greenType: "The Egg",
            fairwayWidth: 45, pinLocation: "Center",
            loreName: "Clifford's Box Fan",
            description: "Clifford's farmhouse A/C broke last week, so he hooked a V8 engine to the old windmill to cool his back porch. It now blasts a relentless 15mph gale straight down this 380-yard fairway. Keep your shots dead center, or the fan's outward draft will blow your ball into the next county. A massive catch-bunker awaits anything hit long over the egg-shaped green.",
            fairwayDescription: "You are staring right down the barrel of the windmill. The wind is howling in your face. The green is wide in the front with a brutal false front, but narrows sharply in the back.",
            bgMusic: 'audio/courses/pasture/mu_pasture6.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_windmill.mp3',
            bgAmbientPostGreen: 'audio/courses/pasture/am_farm1.mp3',
            hazards: [
                { type: "Bunker", distance: 400, depth: 20, offset: 0, width: 60 }
            ],
            landingZones: [{ name: "Fight the Wind", x: 0, y: 220 }, { name: "Aggressive Approach", x: 0, y: 280 }],
            zones: [{x:0, y:220, w:30, h:30}, {x:0, y:280, w:30, h:30}]
        },
        {
            number: 7, par: 4, distance: 400, greenRadius: 12, pinX: 0, pinY: 400,
            loreName: "Revenge of the Marquis",
            description: "In the Fight Club episode of the Dusty Farts podcast, John and Fred were slappin' some goats. Remember how you all laughed at that? Well ... now it's time for the Revenge of the Marquis of Sheepsberry Hill. For every stroke on this hole, the Marquis will unleash his goats and let them try to distract you during your swing. That will teach you all what happens when you mess with goats. Good luck on this normally easy par 4.",
            bgMusic: 'audio/courses/pasture/mu_pasture7.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_goats.mp3',
            bgAmbientPostGreen: 'audio/courses/pasture/am_farm1.mp3',
            hazards: ['sand'], zones: [{x:0, y:250, w:40, h:40}]
        },
        {
            number: 8, par: 3, distance: 195, greenRadius: 35, pinX: 0, pinY: 195, pinZ: -40,
            greenType: "The Porcelain Swirl",
            fairwayWidth: 80, pinLocation: "Center-Dome",
            loreName: "The Royal Bowl",
            description: "Welcome to The Royal Bowl. Clifford's attempt to build a luxurious Roman-style outhouse collapsed under its own weight, leaving a 40-yard deep crater. At the bottom lies a massive 35-yard green featuring a steep center dome surrounded by 'The Porcelain Swirl' moat. Miss the putting surface, and the crater walls will funnel your ball violently down into the bowl. Club down drastically, and prepare for a royal flush.",
            bgMusic: 'audio/courses/pasture/mu_pasture8.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_toilet.mp3',
            bgAmbientPostGreen: 'audio/courses/pasture/am_farm1_toilet.mp3',
            hazards: [],
            landingZones: [{ name: "Center Green", x: 0, y: 195, z: -40 }],
            zones: [{name: "Center Green", x: 0, y: 195}]
        },
        {
            number: 9, par: 3, distance: 180, greenRadius: 17.5, pinX: 0, pinY: 180, pinZ: 25,
            greenType: "The Highway Ridge",
            fairwayWidth: 80, pinLocation: "Front-Center",
            loreName: "This Sign for Rent",
            description: "A 180-yard Par 3 squeezed in to finish the front nine. The tee box sits directly over the active cart return path. The green is a 35-yard wide but incredibly shallow 12-yard deep ledge carved into the highway embankment, playing 25 yards straight uphill. Miss long, and you hit the highway fence for a penalty. Miss short, and you're buried in the mud ditches. Welcome to the turn.",
            bgMusic: 'audio/courses/pasture/mu_pasture9.mp3',
            bgAmbient: 'audio/courses/pasture/am_farm1_golfcarts.mp3',
            bgAmbientPostTee: 'audio/courses/pasture/am_farm1_highway.mp3',
            bgAmbientPostGreen: 'audio/courses/pasture/am_farm1.mp3',
            hazards: [
                { type: "Cart Path", distance: 10, depth: 20, offset: 0, width: 100 },
                { type: "Scrub Brush", distance: 175, depth: 20, offset: -25, width: 35 },
                { type: "Scrub Brush", distance: 175, depth: 20, offset: 25, width: 35 },
                { type: "Highway Fence", distance: 195, depth: 5, offset: 0, width: 150 }
            ],
            landingZones: [{ name: "Center Green", x: 0, y: 180, z: 25 }],
            zones: [{name: "Center Green", x: 0, y: 180}]
        },
        ...Array.from({length: 9}, () => ({ par: 4, distance: 400, greenRadius: 12, pinX: 0, pinY: 400, hazards: ['sand'], zones: [{x:0, y:250, w:40, h:40}] }))
    ]
});
