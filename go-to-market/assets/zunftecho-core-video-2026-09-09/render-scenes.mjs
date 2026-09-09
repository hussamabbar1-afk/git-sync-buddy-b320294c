import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "../../..");
const markPath = path.join(projectRoot, "public", "zunftecho-mark.png");
const demoPath = path.join(scriptDir, "demo-desktop-tall.png");
const checkDir = path.join(
  projectRoot,
  "go-to-market",
  "assets",
  "anfrage-check-video-a-2026-09-09",
);

const WIDTH = 1920;
const HEIGHT = 1080;
const font = "Segoe UI, Arial, sans-serif";

const palette = {
  navy: "#06233B",
  text: "#08213B",
  blue: "#087EAA",
  cyan: "#38BDF8",
  orange: "#F2A34C",
  pale: "#F7FBFF",
  warm: "#FFF5E8",
  line: "#D8E2EA",
  secondary: "#607286",
  success: "#22C55E",
  white: "#FFFFFF",
};

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(lines, x, y, size, color, weight = 400, lineHeight = 1.18, anchor = "start") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${xml(line)}</tspan>`,
    )
    .join("")}</text>`;
}

function bullet(label, x, y, color = palette.blue, textColor = palette.text) {
  return `<circle cx="${x}" cy="${y - 8}" r="8" fill="${color}"/>${textLines([label], x + 26, y, 31, textColor, 600)}`;
}

function baseSvg({ kicker, title, body = [], dark = false, progress = 1 }) {
  const bgA = dark ? palette.navy : palette.pale;
  const bgB = dark ? "#041827" : palette.warm;
  const titleColor = dark ? palette.white : palette.text;
  const bodyColor = dark ? "#C9D8E6" : palette.secondary;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bgA}"/>
        <stop offset="1" stop-color="${bgB}"/>
      </linearGradient>
      <radialGradient id="halo">
        <stop offset="0" stop-color="${dark ? palette.cyan : palette.cyan}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="${dark ? palette.cyan : palette.cyan}" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#001629" flood-opacity="0.16"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <circle cx="1640" cy="90" r="520" fill="url(#halo)"/>
    <path d="M0 0 H1920" stroke="${palette.cyan}" stroke-width="7"/>
    <g opacity="0.35">
      <path d="M80 980 H1840" stroke="${dark ? "#21435B" : palette.line}" stroke-width="1"/>
      <path d="M80 1000 H1840" stroke="${dark ? "#21435B" : palette.line}" stroke-width="1"/>
    </g>
    ${textLines(["ZunftEcho"], 168, 115, 38, titleColor, 700)}
    ${textLines(["FÜR SHK-BETRIEBE"], 168, 151, 19, dark ? "#9FC2D8" : palette.secondary, 700)}
    <rect x="88" y="206" width="220" height="46" rx="23" fill="${dark ? "#0D3853" : "#E4F5FD"}" stroke="${dark ? "#205876" : "#A9DDF3"}"/>
    ${textLines([kicker.toUpperCase()], 198, 238, 20, dark ? palette.cyan : palette.blue, 700, 1, "middle")}
    ${textLines(title, 88, 360, 70, titleColor, 700, 1.08)}
    ${body.length ? textLines(body, 88, 535, 32, bodyColor, 400, 1.42) : ""}
    <rect x="88" y="1012" width="1744" height="6" rx="3" fill="${dark ? "#17394D" : palette.line}"/>
    <rect x="88" y="1012" width="${1744 * progress}" height="6" rx="3" fill="${palette.blue}"/>
    ${textLines([`${Math.round(progress * 100)} %`], 1832, 1046, 18, bodyColor, 600, 1, "end")}
  </svg>`;
}

async function productFrame(input, width, height, position = "north") {
  return sharp(input).resize(width, height, { fit: "cover", position }).png().toBuffer();
}

async function renderScene(number, svg, composites = []) {
  const mark = await sharp(markPath).resize(64, 64, { fit: "contain" }).png().toBuffer();
  const output = path.join(scriptDir, `scene-${String(number).padStart(2, "0")}.png`);
  await sharp(Buffer.from(svg))
    .composite([{ input: mark, left: 88, top: 68 }, ...composites])
    .png()
    .toFile(output);
  return output;
}

async function main() {
  await fs.access(markPath);
  await fs.access(demoPath);

  const scene1 = baseSvg({
    kicker: "Website-Anfragen",
    title: ["„Heizung kaputt.“", "Reicht das für den Betrieb?"],
    body: ["Eine kurze Nachricht ist noch keine", "planbare Anfrage."],
    dark: true,
    progress: 0.125,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)">
      <rect x="1060" y="260" width="700" height="350" rx="34" fill="#FFFFFF"/>
      <circle cx="1120" cy="322" r="12" fill="${palette.orange}"/>
      ${textLines(["NEUE WEBSITE-NACHRICHT"], 1150, 331, 20, palette.secondary, 700)}
      ${textLines(["Heizung kaputt.", "Können Sie heute kommen?"], 1120, 430, 50, palette.text, 700, 1.22)}
      ${textLines(["Einsatzort? Dringlichkeit? Erreichbarkeit?"], 1120, 560, 25, palette.secondary, 500)}
    </g></svg>`,
  );
  await renderScene(1, scene1);

  const scene2 = baseSvg({
    kicker: "Das Problem",
    title: ["Vier Angaben fehlen", "vor dem Rückruf"],
    body: [
      "Ein allgemeines Kontaktformular sammelt Text.",
      "Der Betrieb braucht einen Arbeitsstand.",
    ],
    progress: 0.25,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)">
      <rect x="1050" y="220" width="720" height="620" rx="34" fill="#FFFFFF" stroke="${palette.line}"/>
      ${bullet("Einsatzort", 1120, 340)}
      ${bullet("Dringlichkeit", 1120, 445, palette.orange)}
      ${bullet("Erreichbarkeit", 1120, 550)}
      ${bullet("Terminwunsch", 1120, 655)}
      <rect x="1120" y="725" width="560" height="62" rx="31" fill="#EAF7FD"/>
      ${textLines(["vollständig statt nur eingegangen"], 1400, 765, 25, palette.blue, 700, 1, "middle")}
    </g></svg>`,
  );
  await renderScene(2, scene2);

  const demoFull = await productFrame(demoPath, 810, 760, "north");
  const scene3 = baseSvg({
    kicker: "1 · Kundenanfrage",
    title: ["Der Ablauf beginnt", "mit dem echten Anliegen"],
    body: ["ZunftEcho fragt schrittweise nach –", "ohne eine Ferndiagnose zu behaupten."],
    progress: 0.375,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)"><rect x="1018" y="180" width="854" height="804" rx="30" fill="#FFFFFF" stroke="${palette.line}" stroke-width="2"/></g></svg>`,
  );
  await renderScene(3, scene3, [{ input: demoFull, left: 1040, top: 202 }]);

  const urgentFrame = await productFrame(path.join(checkDir, "03-frage-4.png"), 610, 760, "north");
  const scene4 = baseSvg({
    kicker: "2 · Qualifizierung",
    title: ["Dringend erkennen.", "Sicher übergeben."],
    body: [
      "Hinweise werden priorisiert.",
      "Gefahren bleiben Sache von Menschen",
      "und zuständigen Notdiensten.",
    ],
    progress: 0.5,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)"><rect x="1118" y="174" width="654" height="812" rx="30" fill="#FFFFFF" stroke="${palette.line}" stroke-width="2"/></g></svg>`,
  );
  await renderScene(4, scene4, [{ input: urgentFrame, left: 1140, top: 196 }]);

  const demoLower = await productFrame(demoPath, 840, 720, "south");
  const scene5 = baseSvg({
    kicker: "3–4 · Kontakt & Routing",
    title: ["Aus Antworten wird", "ein klarer Vorgang"],
    body: ["Anliegen · Einsatzort · Kontakt", "Priorität · zuständiges Team"],
    progress: 0.625,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)"><rect x="998" y="210" width="884" height="764" rx="30" fill="#FFFFFF" stroke="${palette.line}" stroke-width="2"/></g></svg>`,
  );
  await renderScene(5, scene5, [{ input: demoLower, left: 1020, top: 232 }]);

  const confirmFrame = await productFrame(path.join(checkDir, "04-frage-7.png"), 610, 760, "north");
  const scene6 = baseSvg({
    kicker: "5 · Nächster Schritt",
    title: ["Ein Terminwunsch", "ist keine Bestätigung"],
    body: [
      "Der Kunde sieht, was angekommen ist.",
      "Der Betrieb bestätigt, was wirklich möglich ist.",
    ],
    progress: 0.75,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)"><rect x="1118" y="174" width="654" height="812" rx="30" fill="#FFFFFF" stroke="${palette.line}" stroke-width="2"/></g></svg>`,
  );
  await renderScene(6, scene6, [{ input: confirmFrame, left: 1140, top: 196 }]);

  const scene7 = baseSvg({
    kicker: "Die Grenze",
    title: ["Der Mensch", "behält die Entscheidung"],
    body: ["Automatisierung strukturiert.", "Der Betrieb prüft und übernimmt."],
    dark: true,
    progress: 0.875,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)">
      <rect x="1030" y="220" width="750" height="610" rx="34" fill="#0B3048" stroke="#235974" stroke-width="2"/>
      ${bullet("Keine Ferndiagnose", 1110, 360, palette.cyan, palette.white)}
      ${bullet("Keine automatische Terminzusage", 1110, 480, palette.cyan, palette.white)}
      ${bullet("Klare Übergabe an das Team", 1110, 600, palette.success, palette.white)}
      <rect x="1110" y="690" width="590" height="76" rx="38" fill="${palette.blue}"/>
      ${textLines(["prüfbar · nachvollziehbar · menschlich"], 1405, 738, 25, palette.white, 700, 1, "middle")}
    </g></svg>`,
  );
  await renderScene(7, scene7);

  const scene8 = baseSvg({
    kicker: "Kostenlos prüfen",
    title: ["Wie gut nimmt Ihre", "Website Anfragen auf?"],
    body: ["8 Fragen · 3 konkrete Verbesserungen", "ohne Anmeldung · ohne Speicherung"],
    dark: true,
    progress: 1,
  }).replace(
    "</svg>",
    `<g filter="url(#shadow)">
      <rect x="1030" y="290" width="750" height="300" rx="34" fill="#FFFFFF"/>
      ${textLines(["ZUNFTECHO.DE/ANFRAGE-CHECK"], 1405, 420, 34, palette.text, 700, 1, "middle")}
      <rect x="1160" y="478" width="490" height="70" rx="35" fill="${palette.blue}"/>
      ${textLines(["Jetzt anonym prüfen  →"], 1405, 523, 28, palette.white, 700, 1, "middle")}
      ${textLines(["Quelle: youtube-product-core-01"], 1405, 650, 20, "#9FC2D8", 500, 1, "middle")}
    </g></svg>`,
  );
  await renderScene(8, scene8);

  const sceneFiles = Array.from({ length: 8 }, (_, index) =>
    path.join(scriptDir, `scene-${String(index + 1).padStart(2, "0")}.png`),
  );
  const thumbs = await Promise.all(
    sceneFiles.map((file) => sharp(file).resize(480, 270, { fit: "cover" }).png().toBuffer()),
  );
  await sharp({
    create: { width: 1920, height: 540, channels: 4, background: palette.navy },
  })
    .composite(
      thumbs.map((input, index) => ({
        input,
        left: (index % 4) * 480,
        top: Math.floor(index / 4) * 270,
      })),
    )
    .png()
    .toFile(path.join(scriptDir, "contact-sheet.png"));
}

await main();
