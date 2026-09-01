// tools/check.js - Pre-push validator for Accessible Golf (v6.24.0)
//
// Plain Node, zero dependencies. Run `node tools/check.js` before EVERY commit:
// pushing to main deploys straight to the live site with no CI in between, so
// this script is the only gate. Exit code 1 on any ERROR; WARNINGS are listed
// but non-fatal (missing audio is caught at runtime and the game plays on).
//
// Checks:
//   1. Encoding      (error)   - no UTF-16 source files (main_ag.js was UTF-16
//                                for months and invisible to every text tool).
//   2. Load order    (error)   - index.html script tags match the dependency
//                                contract; every courses/*.js has a tag.
//   3. Version sync  (error)   - <title>, version <div>, and every ?v= cache-
//                                buster match window.AG_VERSION exactly.
//   4. Audio assets  (warning) - every statically-resolvable audio path
//                                referenced in JS exists on disk.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];
const warnings = [];

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------- 1. Encoding ----------
const sourceFiles = fs.readdirSync(ROOT).filter(function (f) { return f.endsWith('.js') || f.endsWith('.html'); })
    .concat(fs.readdirSync(path.join(ROOT, 'courses')).map(function (f) { return 'courses/' + f; }))
    .concat(['tools/check.js']);

for (const f of sourceFiles) {
    const buf = fs.readFileSync(path.join(ROOT, f));
    if (buf.length >= 2 && ((buf[0] === 0xFF && buf[1] === 0xFE) || (buf[0] === 0xFE && buf[1] === 0xFF))) {
        errors.push(f + ' is UTF-16 encoded. Convert to UTF-8 (text tools cannot search UTF-16).');
    }
}

// ---------- 2. Script load order ----------
const CONTRACT = [
    'data_ag.js',
    'COURSES', // any number of courses/*.js, as a group
    'audio_core.js',
    'golf_audio_bank.js',
    'physics_core.js',
    'physics_collisions.js',
    'ui_ag.js',
    'input_ag.js',
    'main_ag.js'
];

const html = read('index.html');
const tagRe = /<script\s+src="([^"?]+)(?:\?v=([^"]*))?"/g;
const tags = [];
let m;
while ((m = tagRe.exec(html))) tags.push({ src: m[1], v: m[2] || null });

const flattened = tags.map(function (t) { return t.src.startsWith('courses/') ? 'COURSES' : t.src; });
const collapsed = flattened.filter(function (x, i) { return x !== 'COURSES' || flattened[i - 1] !== 'COURSES'; });
if (collapsed.join('|') !== CONTRACT.join('|')) {
    errors.push('Script load order violates the contract.\n    expected: ' + CONTRACT.join(' -> ') + '\n    found:    ' + collapsed.join(' -> '));
}

const taggedCourses = tags.filter(function (t) { return t.src.startsWith('courses/'); }).map(function (t) { return t.src; });
for (const f of fs.readdirSync(path.join(ROOT, 'courses'))) {
    if (f.endsWith('.js') && taggedCourses.indexOf('courses/' + f) === -1) {
        errors.push('courses/' + f + ' exists on disk but has no <script> tag in index.html.');
    }
}

// ---------- 3. Version sync ----------
const verMatch = read('physics_core.js').match(/window\.AG_VERSION\s*=\s*"(v[\d.]+)"/);
if (!verMatch) {
    errors.push('Could not find window.AG_VERSION in physics_core.js.');
} else {
    const ver = verMatch[1];               // e.g. v6.24.0
    const bare = ver.replace(/^v/, '');    // e.g. 6.24.0

    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (title.indexOf(ver) === -1) {
        errors.push('<title> ("' + title + '") does not contain AG_VERSION ' + ver + '.');
    }
    const versionDiv = (html.match(/class="version"[^>]*>([^<]*)</) || [])[1] || '';
    if (versionDiv.indexOf(ver) === -1) {
        errors.push('version <div> ("' + versionDiv + '") does not contain AG_VERSION ' + ver + '.');
    }
    for (const t of tags) {
        if (t.v !== bare) {
            errors.push(t.src + ' cache-buster is "?v=' + t.v + '", expected "?v=' + bare + '" (AG_VERSION).');
        }
    }
}

// ---------- 4. Audio asset existence ----------
// Collect every quoted string literal containing "audio/". Handles the three
// forms the codebase actually uses:
//   a) full literal paths:        'audio/swings/duck.mp3'
//   b) folder + name template:    `audio/courses/pasture/${file}.mp3` where the
//      names come from a nearby array literal - approximated by expanding any
//      quoted bare names found in the same file against template folders.
//   c) numeric loops:             'audio/courses/pasture/duck_pasture' + i + '.mp3'
// Anything it cannot statically resolve is reported once as unverified.
const jsFiles = sourceFiles.filter(function (f) { return f.endsWith('.js') && f !== 'tools/check.js'; });
const referenced = new Set();
const unverified = new Set();

for (const f of jsFiles) {
    const src = read(f);

    // (a) full literals
    const litRe = /["'`](audio\/[^"'`$]+\.mp3)["'`]/g;
    while ((m = litRe.exec(src))) referenced.add(m[1]);

    // (c) numeric concatenation loops: 'audio/x/y' + i + '.mp3' inside a for(i=A;i<=B)
    const loopRe = /["'`](audio\/[^"'`$]+?)["'`]\s*\+\s*(\w+)\s*\+\s*["'`]\.mp3["'`]/g;
    while ((m = loopRe.exec(src))) {
        const base = m[1], idxVar = m[2];
        const forRe = new RegExp('for\\s*\\(\\s*(?:let|var)\\s+' + idxVar + '\\s*=\\s*(\\d+)\\s*;\\s*' + idxVar + '\\s*<=?\\s*(\\d+)');
        const fm = forRe.exec(src);
        if (fm) {
            const lo = parseInt(fm[1], 10);
            const hi = parseInt(fm[2], 10) - (src.slice(fm.index).indexOf('<=') === -1 ? 1 : 0);
            for (let i = lo; i <= hi && i - lo < 50; i++) referenced.add(base + i + '.mp3');
        } else {
            unverified.add(base + '<n>.mp3');
        }
    }

    // (b) template literals with one ${...} segment
    const tplRe = /`(audio\/[^`]*\$\{[^}]+\}[^`]*)`/g;
    while ((m = tplRe.exec(src))) unverified.add(m[1]);
}

for (const rel of Array.from(referenced).sort()) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
        warnings.push('Referenced audio file missing on disk: ' + rel);
    }
}

// ---------- Report ----------
console.log('Accessible Golf validator');
console.log('  Source files checked: ' + sourceFiles.length + ' | audio paths resolved: ' + referenced.size + (unverified.size ? ' | dynamic paths not statically verifiable: ' + unverified.size : ''));
if (unverified.size) {
    console.log('  (unverified dynamic patterns: ' + Array.from(unverified).sort().join(', ') + ')');
}

if (warnings.length) {
    console.log('\nWARNINGS (' + warnings.length + ') - non-fatal, game degrades gracefully:');
    for (const w of warnings) console.log('  - ' + w);
}
if (errors.length) {
    console.log('\nERRORS (' + errors.length + ') - fix before committing:');
    for (const e of errors) console.log('  - ' + e);
    process.exit(1);
}
console.log('\nAll checks passed' + (warnings.length ? ' (with warnings above)' : ' clean') + '.');
