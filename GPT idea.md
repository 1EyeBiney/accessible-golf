You said:

I have aske Gemini the following prompt and want to see your feedback as well: After our work these last few weeks on other projects, I keep coming back to the idea o f mkaing an accessible golf game using many of the principles that we've started using in YaY, The Bunker and Keyboard Commander. I can think mechanically of somethings to incorporate, like aiming using left/right, adjusting ball placement with up/down arrows to simulate the arc that the takes when the ball is positioned forward or back in the stance. Having had played golf for 35 years, therr are a lot of nuances that I understnd about playing golf in the real world. Things like slope of the gground, wind, wind blockage, all kinds of things that go into playing golf and actually making the decisions that ffect game play. I need some feedback, e especially regarding the mechanics and physics of what we could accomplish using JS and a browser.

Copy message

Edit message



ChatGPT said:

I’m checking what the browser can realistically do now for physics, audio, and performance so I can separate good design ideas from things that would fight the platform.

I’ve got the main split now: the strong idea is not “build a physics sandbox,” it’s “build a golf decision engine with believable outcomes.” That keeps the realism where it matters and avoids browser pain.

Thought for 1m 29s

Your idea is solid.

The big thing is this: do not build this as a full physics sim first. Build it as an accessible golf decision game with believable shot outcomes. That is absolutely doable in JS in a browser, and it lines up much better with what makes golf interesting anyway: club choice, lie, wind, slope, shape, risk, and recovery.

What I would aim for is a hybrid model:

1\. 

The player makes golf decisions.

2\. 

The game computes a shot result from a set of formulas and modifiers.

3\. 

The browser animates or reports the result.

4\. 

The realism comes from the math and the course data, not from brute-force real-time simulation.

That matters because true golf-ball physics gets ugly fast. Real spin, launch angle, descent angle, bounce, roll, turf firmness, wind layers, tree interaction, and uneven lies can spiral out of control. In a browser, you can fake the parts that matter to the player and still make it feel very golf-like.

What you can absolutely do well

A browser game can handle these very nicely:

• 

aiming with left and right

• 

shot power and tempo

• 

ball position in stance affecting launch, spin, and shape tendency

• 

club selection

• 

wind direction and strength

• 

slope at ball and slope at landing area

• 

rough, fairway, bunker, trees, water, cart path

• 

blocked shots and punch shots

• 

green firmness and roll-out

• 

putting break and speed

• 

audio-based feedback and keyboard-only play

That is already enough to make a serious golf game, not just a toy.

What I would not try to do literally

I would not try to simulate:

• 

true 3D ball aerodynamics in detail

• 

highly realistic collision against complex tree geometry

• 

full terrain mesh physics

• 

per-frame spin decay and turf interaction at simulation depth

You can get 90% of the feel with a much smarter shortcut:

Example shot model

Instead of simulating everything continuously, compute outcomes in phases:

At address

• 

lie type

• 

lie slope

• 

wind

• 

elevation difference

• 

ground firmness

• 

obstruction check

At swing

• 

power

• 

tempo

• 

face/path error

• 

strike quality

• 

ball position effect

• 

intended shot type

In flight

• 

launch angle

• 

carry distance

• 

start line

• 

curvature

• 

apex

• 

wind drift

At landing

• 

landing angle

• 

bounce

• 

rollout

• 

surface change

• 

local slope influence

That gives you believable golf without needing a monster engine.

The smartest mechanic you mentioned

Your idea about ball forward/back in stance with up/down arrows is one of the best parts.

That can control several things at once:

• 

forward in stance: higher launch, more carry, maybe more fade tendency

• 

back in stance: lower launch, less carry, more rollout, easier punch, maybe more draw tendency

That is much more interesting than a simple “hit harder” system.

I would also add:

• 

open/closed stance or clubface bias

• 

shot type: normal, punch, chip, flop, draw, fade

• 

commitment/risk meter: safer shots reduce max gain but reduce dispersion

That gives the player meaningful golf decisions instead of arcade inputs.

A very workable accessible design model

I would make it mostly turn-based with short animation, not twitch-based.

Each shot could work like this:

• 

Arrow left/right: aim

• 

Arrow up/down: ball position in stance

• 

Page up/page down: club

• 

Shift plus left/right: intentional shape

• 

Space: start swing

• 

Space again: set power

• 

Space a third time: set tempo/impact

Then the game reports something like:

“150 to center, 142 front, 165 back. Wind 12 miles per hour left to right. Ball slightly below feet. Fairway. Green slopes back to front. Trees guard right side.”

That is where the game becomes great for blind players: information architecture.

Not just “what happened,” but:

• 

what matters

• 

what is dangerous

• 

what is likely if you miss

The part most people miss

The hardest part is not the physics.

It is the course-information system.

You need a clean way to describe:

• 

hole layout

• 

landing zones

• 

hazards

• 

green shape

• 

slope

• 

risk/reward

You do not want the player drowning in words.

So I would build a layered caddie system:

• 

brief summary

• 

detailed hole info

• 

hazard scan

• 

green read

• 

recommended shot

That is probably more important than the flight math.

Physics approach I would recommend

Use a 2D course map plus hidden numeric models.

Think of the course as:

• 

a top-down layout for position

• 

a terrain grid for slope and elevation

• 

a surface map for fairway/rough/bunker/green

• 

a few obstruction objects like trees

• 

a wind vector

• 

a shot solver

That is far better than trying to render true 3D first.

You can still produce really satisfying shot outcomes:

• 

pulled into left rough

• 

clipped a branch and dropped short

• 

landed pin high and released 12 feet

• 

bunker shot checked early because of soft sand

• 

putt started on line and broke late right

That will feel like golf.

Things you may not have thought about yet

A few mechanics worth adding:

• 

dispersion instead of pure randomness

Good players should still miss, just in tighter patterns.

• 

course management memory

Let players review prior shots on the hole.

• 

wind blockage as a simplified rule

Trees or terrain can reduce wind effect by a percentage instead of true fluid simulation.

• 

lie severity bands

Don’t overcomplicate. Light rough, heavy rough, fairway bunker, plugged bunker, downhill lie, sidehill lie.

• 

green-reading model

Use a clock-face or cup-relative system for break.

• 

practice mode with deterministic seeds

Repeat the same shot conditions for learning.

• 

shot replay summary

“Started 4 degrees right, curved back 7 yards, landed 8 yards short, rolled out 11.”

That last one would be excellent for learning and debugging.

My blunt recommendation

Start with this scope:

Version 1

• 

9 holes

• 

top-down hidden course logic

• 

keyboard-only

• 

club selection

• 

aim

• 

power

• 

ball position

• 

wind

• 

basic lie system

• 

fairway/rough/bunker/green/water

• 

putting

• 

strong spoken feedback

Do not start with:

• 

full 18 holes

• 

true 3D rendering

• 

elaborate animation

• 

highly detailed swing mechanics

• 

multiplayer

Get one hole feeling good first.

Your original prompt could be sharper

What you asked Gemini is good for brainstorming, but it is broad. I would tighten it like this:

“Help me design an accessible keyboard-only golf game for blind players in JavaScript and the browser. I want realistic golf decision-making without requiring a full 3D physics simulation. Propose a hybrid system that models aim, club choice, wind, lie, slope, ball position in stance, shot shape, carry, bounce, and roll. Explain which parts should use simplified formulas versus real-time physics, and suggest control schemes, audio feedback systems, and data structures for representing holes, terrain, hazards, and greens.”

That should get you much better output.

My overall answer: yes, this is absolutely possible, and it is actually a better fit for browser JS than trying to build a visual golf sim first. The winning move is to make the golf thinking deep and the physics believable, not literal.

If you want, I’ll sketch a concrete shot calculation model next, with example formulas for carry, curve, lie penalties, and rollout.

Copy response

Good response

Bad response

Share

Switch model

More actions

&#x20;

Ask anything

Add files and more

Extended thinking, click to remove

Extended thinking

Dictate button

Start Voice

ChatGPT can make mistakes. Check important info.

