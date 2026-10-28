import createConstellation, { meta } from "./pieces/constellation-word.js";

// ASCII Magic's Matrix recipe is a settings string, not executable web code.
// Its binary character set and bloom are adapted here to KTP purple.
// https://www.ascii-magic.com/recipes/matrix-code-generator
const matrixRecipe = "recipe:v1:eyJ2IjoxLCJmb250U2l6ZSI6NDIsImNoYXJTZXQiOiIwMSIsImNvdmVyYWdlIjo5NiwiZWRnZUVtcGhhc2lzIjo0MCwib3ZlcmxheUNvbG9yIjoiIzAwZmY2NiIsIm92ZXJsYXlPcGFjaXR5Ijo1OSwib3ZlcmxheUJ sZW5kIjoib3ZlcmxheSIsInBmeCI6eyJzY2FuTGluZXMiOnsiZW5hYmxlZCI6dHJ1ZSwiaW50ZW5zaXR5IjoyOH0sImNydEN1cnZlIjp7ImVuYWJsZWQiOnRydWUsImludGVuc2l0eSI6MTB9LCJjaGFyQmxvb20iOnsiZW5hYmxlZCI6dHJ1ZSwiaW50ZW5zaXR5IjoxMDB9LCJjaGFyQ2hyb21hIjp7ImVuYWJsZWQiOnRydWUsIm9mZnNldCI6MTZ9LCJmaWxtR3JhaW4iOnsiZW5hYmxlZCI6dHJ1ZSwiaW50ZW5zaXR5IjoxMDB9LCJnbGl0Y2giOnsiZW5hYmxlZCI6dHJ1ZX0sInBpeGVsYXRlIjp7InNpemUiOjEzfSwiaGFsZnRvbmUiOnsiZW5hYmxlZCI6dHJ1ZSwic2l6ZSI6N319fQ".replace(" ", "");
const encodedRecipe = matrixRecipe.split(":")[2];
const recipe = JSON.parse(atob(encodedRecipe.replace(/-/g, "+").replace(/_/g, "/")));
const requestedStyle = new URLSearchParams(window.location.search).get("style");
const style = ["cross", "dots", "blocks"].includes(requestedStyle) ? requestedStyle : "classic";
const spaceScene = new URLSearchParams(window.location.search).get("scene") === "space";
document.documentElement.dataset.style = style;

const canvas = document.querySelector("#constellation");
const context = canvas.getContext("2d");
const skyCanvas = document.querySelector("#ascii-sky");
const skyContext = skyCanvas.getContext("2d");
const drawConstellation = createConstellation();
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const sample = document.createElement("canvas");
sample.width = 184;
sample.height = 70;
const sampleContext = sample.getContext("2d", { willReadFrequently: true });
const logo = new Image();
let logoPixels = null;
let hiddenNames = [];
logo.onload = () => {
  sampleContext.drawImage(logo, 0, 0, sample.width, sample.height);
  logoPixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
  const findRun = (word, start, end) => {
    let best = { score: -1, x: start, y: 0 };
    for (let y = 2; y < sample.height - 2; y++) {
      for (let x = start; x + word.length <= end; x++) {
        let score = 0;
        for (let i = 0; i < word.length; i++) score += logoPixels[(y * sample.width + x + i) * 4 + 3];
        if (score > best.score) best = { score, x, y };
      }
    }
    return { ...best, word };
  };
  hiddenNames = [findRun("ROMIR", 0, Math.floor(sample.width * .32)), findRun("MOHAN", Math.floor(sample.width * .70), sample.width)];
  if (motionPreference.matches) draw(5);
};
logo.src = "./ktp-logo.png";

// A quiet field of stars surrounds the selected animated scene.
function drawSky(t) {
  const bounds = skyCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (skyCanvas.width !== Math.round(width * ratio) || skyCanvas.height !== Math.round(height * ratio)) {
    skyCanvas.width = Math.round(width * ratio);
    skyCanvas.height = Math.round(height * ratio);
  }
  skyContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  skyContext.clearRect(0, 0, width, height);
  skyContext.font = '12px "KTP Terminal", monospace';
  skyContext.textBaseline = "middle";
  const glyphs = style === "cross" ? "+×✕.*" : ".·+*✦:01";
  const count = Math.max(100, Math.round(width * height / 3800));
  const random = (n) => { const value = Math.sin(n * 127.1 + 57.7) * 43758.5453; return value - Math.floor(value); };
  for (let i = 0; i < count; i++) {
    const x = random(i * 3 + 1) * width;
    const y = random(i * 3 + 2) * height;
    const glyph = glyphs[Math.floor(random(i * 3 + 3) * glyphs.length)];
    const brightness = .08 + .18 * (0.5 + 0.5 * Math.sin(t * .6 + i));
    skyContext.fillStyle = `rgba(197, 159, 238, ${brightness})`;
    skyContext.fillText(glyph, x, y);
  }

  if (spaceScene) {
    const still = motionPreference.matches;
    if (!still) {
      // Two staggered shooting stars pass briefly through the outer sky.
      [{ offset: 3, period: 16, x: .03, y: .12, dx: .22, dy: .06 },
       { offset: 11, period: 23, x: .68, y: .72, dx: .20, dy: -.06 }].forEach((star) => {
        const phase = (t + star.offset) % star.period;
        if (phase >= 1.8) return;
        const progress = phase / 1.8;
        const x = width * (star.x + star.dx * progress), y = height * (star.y + star.dy * progress);
        skyContext.globalAlpha = .5 * Math.sin(progress * Math.PI);
        skyContext.fillStyle = "#e4d0ff";
        skyContext.fillText("·  .  +  *", x, y);
        skyContext.globalAlpha = 1;
      });
    }
  }
  if (spaceScene) return;

  const fish = [
    { phase: .2, speed: .25, tint: "#ddbbf5", accent: "#a975da" },
    { phase: Math.PI + .4, speed: .21, tint: "#b7a9ee", accent: "#e4a7d7" },
  ];
  for (const koi of fish) {
    const angle = t * koi.speed + koi.phase;
    const rx = Math.max(0, width * .42 - 30);
    const ry = Math.max(0, height * .39 - 30);
    const x = width / 2 + Math.cos(angle) * rx;
    const y = height / 2 + Math.sin(angle) * ry;
    const heading = Math.atan2(Math.cos(angle) * ry, -Math.sin(angle) * rx);
    const scale = Math.min(1, width / 500);
    skyContext.save();
    skyContext.translate(x, y);
    skyContext.rotate(heading);
    skyContext.scale(scale, scale);
    skyContext.font = '13px "KTP Terminal", monospace';
    skyContext.globalAlpha = .75;
    // A tapered body of text characters with colored patches and a flexing tail.
    for (let col = -5; col <= 5; col++) {
      const radius = Math.sqrt(Math.max(0, 1 - (col / 6) ** 2)) * 2.4;
      for (let row = -2; row <= 2; row++) {
        if (Math.abs(row) > radius) continue;
        const patch = (col + row * 2 + 20) % 7 < 3;
        const chars = patch ? "#%*+" : "@&o:";
        skyContext.fillStyle = patch ? koi.accent : koi.tint;
        skyContext.fillText(chars[Math.abs(col * 7 + row * 11 + 40) % chars.length], col * 7, row * 10);
      }
    }
    skyContext.fillStyle = "#f8ecff";
    skyContext.fillText("·", 35, -8);
    skyContext.fillText("·", 35, 8);
    skyContext.fillStyle = koi.tint;
    const tail = Math.sin(t * 3 + koi.phase) * 5;
    skyContext.fillText("<", -48, tail - 5);
    skyContext.fillText("<", -48, tail + 5);
    skyContext.globalAlpha = 1;
    skyContext.restore();
  }
}

function draw(t) {
  drawSky(t);
  const frame = drawConstellation(t);
  const text = frame.text.split("\n");
  const colors = frame.color.split("\n");
  const cw = canvas.width / meta.cols;
  const ch = canvas.height / meta.rows;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "middle";
  context.font = '15px "KTP Terminal", monospace';
  context.globalAlpha = 0.35;
  text.forEach((line, y) => [...line].forEach((char, x) => {
    // Keep the drifting star field from the template, but leave out the
    // constellation's connecting strokes so nothing crosses the logo.
    if (![".", "·", "+"].includes(char) || !["3", "4", "7"].includes(colors[y][x])) return;
    context.fillStyle = meta.palette[colors[y][x]] || "#9670ce";
    context.fillText(char, x * cw, (y + .5) * ch);
  }));
  if (!logoPixels) return;
  // The existing KTP logo is sampled into a dense brightness-to-glyph grid.
  const ramp = style === "cross" ? " .:++×✕╋" : style === "dots" ? " .·∙•●" : style === "blocks" ? " .░▒▓█" : " .,:;i1tfLCG08@";
  const cellWidth = canvas.width / 200;
  const cellHeight = canvas.height / 84;
  context.font = '6.5px "KTP Terminal", monospace';
  const tick = motionPreference.matches ? 0 : Math.floor(t * 4);
  for (let y = 0; y < sample.height; y++) {
    for (let x = 0; x < sample.width; x++) {
      const index = (y * sample.width + x) * 4;
      const alpha = logoPixels[index + 3] / 255;
      if (alpha < .12) continue;
      const luminosity = (logoPixels[index] * .21 + logoPixels[index + 1] * .72 + logoPixels[index + 2] * .07) / 255;
      const strength = Math.min(.99, alpha * (.62 + luminosity * .35));
      const variation = (x * 13 + y * 7) % 3 - 1;
      const solidCharacters = "@#%&$*+=?<>ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const name = hiddenNames.find((entry) => y === entry.y && x >= entry.x && x < entry.x + entry.word.length);
      const seed = x * 17 + y * 29 + (x * y) % 13;
      const changing = (x * 11 + y * 7) % 3 === 0 ? Math.floor((tick + (x * 3 + y * 7) % 9) / 3) : 0;
      const character = name ? name.word[x - name.x] : style === "classic" && alpha > .7
        ? solidCharacters[(seed + changing * 11) % solidCharacters.length]
        : ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(strength * (ramp.length - 1)) + variation))];
      const highlight = (x * 7 + y * 11) % 11 < 2;
      context.fillStyle = style === "cross" ? "#d6b0f5" : style === "dots" ? "#a7bbff" : style === "blocks" ? "#d0a4ff" : highlight ? "#e2ccff" : "#c8a4f5";
      context.globalAlpha = .75 + alpha * .25;
      context.fillText(character, (x + 8) * cellWidth, (y + 8) * cellHeight);
    }
  }
  context.globalAlpha = 1;
}

let animationFrame = 0;
let lastFrame = 0;
let sceneVisible = true;
function animate(now) {
  if (now - lastFrame >= 1000 / 24) { draw(now / 1000); lastFrame = now; }
  animationFrame = window.requestAnimationFrame(animate);
}
function updateMotion() {
  window.cancelAnimationFrame(animationFrame);
  if (document.hidden || !sceneVisible) return;
  if (motionPreference.matches) draw(5);
  else animationFrame = window.requestAnimationFrame(animate);
}
motionPreference.addEventListener("change", updateMotion);
window.addEventListener("resize", updateMotion);
document.addEventListener("visibilitychange", () => {
  updateMotion();
});
if ("IntersectionObserver" in window) {
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    sceneVisible = entry.isIntersecting;
    updateMotion();
  }, { threshold: 0 });
  visibilityObserver.observe(canvas);
}
updateMotion();

// Match the existing front page's Chicago calendar-month countdown.
const chicagoDate = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });
const target = Date.UTC(2027, 0, 11);
function updateCountdown() {
  const parts = chicagoDate.formatToParts(new Date());
  const part = (type) => Number(parts.find((value) => value.type === type).value);
  const year = part("year"), month = part("month") - 1, day = part("day");
  const hour = part("hour"), minute = part("minute"), second = part("second");
  const now = Date.UTC(year, month, day, hour, minute, second);
  let months = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
  if (now < target) {
    const afterMonths = (count) => {
      const first = new Date(Date.UTC(year, month + count, 1));
      const end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
      return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, end), hour, minute, second);
    };
    months = (2027 - year) * 12 - month;
    if (afterMonths(months) > target) months--;
    const remainingSeconds = Math.floor((target - afterMonths(months)) / 1000);
    days = Math.floor(remainingSeconds / 86400);
    hours = Math.floor((remainingSeconds % 86400) / 3600);
    minutes = Math.floor((remainingSeconds % 3600) / 60);
    seconds = remainingSeconds % 60;
  }
  document.querySelector("#months").textContent = String(months).padStart(2, "0");
  document.querySelector("#days").textContent = String(days).padStart(2, "0");
  document.querySelector("#hours").textContent = String(hours).padStart(2, "0");
  document.querySelector("#minutes").textContent = String(minutes).padStart(2, "0");
  document.querySelector("#seconds").textContent = String(seconds).padStart(2, "0");
  document.querySelector("#clock").setAttribute("aria-label", now >= target ? "Winter Rush 2027 has started" : `${months} months, ${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds until Winter Rush 2027`);
}
updateCountdown();
window.setInterval(updateCountdown, 1000);
window.addEventListener("focus", updateCountdown);
