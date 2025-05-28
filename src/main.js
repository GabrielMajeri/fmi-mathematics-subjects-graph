import Sigma from "sigma";
import { Graph } from "graphology";
import EdgeCurveProgram, {
  EdgeCurvedArrowProgram,
  EdgeCurvedDoubleArrowProgram,
} from "@sigma/edge-curve";
import {
  EdgeArrowProgram,
  EdgeDoubleArrowProgram,
  EdgeRectangleProgram,
} from "sigma/rendering";

import { NodeImageProgram, NodePictogramProgram } from "@sigma/node-image";

function svgToDataURI(svg) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return URL.createObjectURL(blob);
}

class SVGCircleGenerator {
  constructor() {
    this.defaultOptions = {
      radius: 100,
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      textColor: "#000000",
      circleColor: "#ffffff",
      strokeColor: "#000000",
      strokeWidth: 2,
      padding: 10,
      lineSpacing: 1.2,
    };
  }
  generateSVG(text, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const {
      radius,
      fontSize,
      fontFamily,
      textColor,
      circleColor,
      strokeColor,
      strokeWidth,
      padding,
      lineSpacing,
    } = opts;

    const svgSize = radius * 2;
    const centerX = radius;
    const centerY = radius;

    // Wrap text to fit in circle
    const lines = this.wrapTextInCircle(text, radius, fontSize, padding);

    // Calculate text positioning
    const lineHeight = fontSize * lineSpacing;
    const totalTextHeight = lines.length * lineHeight;
    const startY = centerY - totalTextHeight / 2 + fontSize / 2;

    // Start building SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle -->
  <circle
    cx="${centerX}"
    cy="${centerY}"
    r="${radius - strokeWidth / 2}"
    fill="${circleColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
  />

  <!-- Text -->
  <g font-family="${fontFamily}" font-size="${fontSize}" fill="${textColor}" text-anchor="middle">`;

    // Add each line of text
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      svg += `
    <text x="${centerX}" y="${y}">${this.escapeXML(line)}</text>`;
    });

    svg += `
  </g>
</svg>`;

    return svg;
  }
  escapeXML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  getTextWidth(text, fontSize) {
    return text.length * fontSize * 0.6;
  }

  wrapTextInCircle(text, radius, fontSize, padding) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    const maxWidth = (radius - padding) * 1.4;

    for (let word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.getTextWidth(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}

// Initialize graph
const graph = new Graph();

// Track courses per year
let coursesPerYear = { 1: 0, 2: 0, 3: 0 };

//adaugati din json, hardcidat momentan
const courses = [
  {
    name: "Algebra 1",
    id: "1_1_alg1",
    year: 1,
    sem: 1,
    specialization: "mate",
    keywords: [
      "Sisteme de ecuatii",
      "Matrice si determinanti",
      "Spatii vectoriale",
      "Transformari liniare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=10",
  },
  {
    name: "Analiza matematica 1",
    id: "1_1_anm1",
    year: 1,
    sem: 1,
    specialization: "mate",
    keywords: [
      "Limite si continuitate",
      "Derivate",
      "Integrale",
      "Teoreme fundamentale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=12",
  },
  {
    name: "Geometrie 1",
    id: "1_1_geo1",
    year: 1,
    sem: 1,
    specialization: "mate",
    keywords: ["Vectori", "Dreapta si plan", "Conice", "Cuadrice"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=14",
  },
  {
    name: "Programare 1 (C)",
    id: "1_1_prg1",
    year: 1,
    sem: 1,
    specialization: "mate",
    keywords: [
      "Variabile si tipuri",
      "Structuri de control",
      "Functii",
      "Pointeri",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=18",
  },
  {
    name: "Logica matematica",
    id: "1_1_lgm",
    year: 1,
    sem: 1,
    specialization: "mate",
    keywords: [
      "Propozitii si predicat",
      "Demonstratii logice",
      "Teoria multimilor",
      "Relatii si functii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=16",
  },
  {
    name: "Algebra 2",
    id: "1_2_alg_2",
    year: 1,
    sem: 2,
    specialization: "mate",
    pre: ["1_1_alg1"],
    keywords: ["Grupuri", "Inele", "Polinoame", "Corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=11",
  },
  {
    name: "Analiza matematica 2",
    id: "1_2_anm_2",
    year: 1,
    sem: 2,
    specialization: "mate",
    pre: ["1_1_anm1"],
    keywords: [
      "Serii numerice",
      "Functii de mai multe variabile",
      "Integrale multiple",
      "Ecuatii diferentiale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=13",
  },
  {
    name: "Geometrie 2",
    id: "1_2_geo_2",
    year: 1,
    sem: 2,
    specialization: "mate",
    pre: ["1_1_geo1"],
    keywords: [
      "Geometrie diferentiala",
      "Curbe si suprafete",
      "Metrici",
      "Transformari geometrice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Structuri de date",
    id: "1_2_sdd",
    year: 1,
    sem: 2,
    specialization: "mate",
    pre: ["1_1_prg1"],
    keywords: ["Liste", "Stive si cozi", "Arbori", "Algoritmi de sortare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=22",
  },
  {
    name: "Analiza matematica 3",
    id: "mt_2_1_anm_3",
    year: 2,
    sem: 1,
    specialization: "mate",
    pre: ["1_2_anm_2"],
    keywords: [
      "Spatii metrice",
      "Integrala Lebesgue",
      "Serii de functii",
      "Analiza functionala",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=23",
  },
  {
    name: "Algebra liniara",
    id: "mt_2_1_all",
    year: 2,
    sem: 1,
    specialization: "mate",
    pre: ["1_1_alg1"],
    keywords: [
      "Forme biliniare",
      "Forme cuadratice",
      "Diagonalizare",
      "Valori proprii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=24",
  },
  {
    name: "Probabilitati si statistica",
    id: "mt_2_1_pss",
    year: 2,
    sem: 1,
    specialization: "mate",
    pre: ["1_1_anm1"],
    keywords: [
      "Variabile aleatoare",
      "Distributii",
      "Teste de ipoteza",
      "Regresie",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=30",
  },
  {
    name: "Ecuatii diferentiale",
    id: "mt_2_1_ecd",
    year: 2,
    sem: 1,
    specialization: "mate",
    pre: ["1_2_anm_2"],
    keywords: [
      "Ecuatii liniare",
      "Sisteme diferentiale",
      "Stabilitate",
      "Metode numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=26",
  },
  {
    name: "Analiza numerica",
    id: "mt_2_2_ann",
    year: 2,
    sem: 2,
    specialization: "mate",
    pre: ["1_2_anm_2"],
    keywords: [
      "Interpolare",
      "Aproximare",
      "Metode iterative",
      "Erori numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=27",
  },
  {
    name: "Structuri algebrice",
    id: "mt_2_2_sta",
    year: 2,
    sem: 2,
    specialization: "mate",
    pre: ["1_2_alg_2"],
    keywords: ["Teoria Galois", "Module", "Algebre", "Extensii de corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Geometrie diferentiala",
    id: "mt_2_2_gmd",
    year: 2,
    sem: 2,
    specialization: "mate",
    pre: ["1_2_geo_2"],
    keywords: ["Varietati", "Tensoare", "Curbura", "Aplicatii geometrice"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=28",
  },
  {
    name: "Programare orientata pe obiecte",
    id: "mt_2_2_poo",
    year: 2,
    sem: 2,
    specialization: "mate",
    pre: ["1_1_prg1"],
    keywords: ["Clase si obiecte", "Mostenire", "Polimorfism", "Encapsulare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=20",
  },
  {
    name: "Analiza complexa",
    id: "mt_3_1_anc",
    year: 3,
    sem: 1,
    specialization: "mate",
    pre: ["mt_2_1_anm_3"],
    keywords: [
      "Functii analitice",
      "Integrale complexe",
      "Teorema reziduurilor",
      "Transformari conforme",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=31",
  },
  {
    name: "Topologie",
    id: "mt_3_1_top",
    year: 3,
    sem: 1,
    specialization: "mate",
    pre: ["mt_2_1_anm_3"],
    keywords: ["Spatii topologice", "Conexitate", "Compactitate", "Omotopie"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=32",
  },
  {
    name: "Teoria numerelor",
    id: "mt_3_1_tnr",
    year: 3,
    sem: 1,
    specialization: "mate",
    pre: ["1_2_alg_2"],
    keywords: [
      "Numere prime",
      "Congruente",
      "Functii aritmetice",
      "Ecuatii diofantiene",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=33",
  },
  {
    name: "Modele matematice",
    id: "mt_3_1_mmt",
    year: 3,
    sem: 1,
    specialization: "mate",
    pre: ["mt_2_1_ecd"],
    keywords: [
      "Modelare fizica",
      "Modelare biologica",
      "Simulari",
      "Optimizare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=34",
  },
  {
    name: "Analiza functionala",
    id: "mt_3_2_anf",
    year: 3,
    sem: 2,
    specialization: "mate",
    pre: ["mt_2_1_anm_3"],
    keywords: [
      "Spatii Banach",
      "Spatii Hilbert",
      "Operatori",
      "Teorema Hahn-Banach",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=35",
  },
  {
    name: "Geometrie algebrica",
    id: "mt_3_2_gma",
    year: 3,
    sem: 2,
    specialization: "mate",
    pre: ["mt_2_2_sta"],
    keywords: [
      "Varietati algebrice",
      "Inele de polinoame",
      "Curbe algebrice",
      "Singularitati",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=36",
  },
  {
    name: "Matematica computationala",
    id: "mt_3_2_mtc",
    year: 3,
    sem: 2,
    specialization: "mate",
    pre: ["mt_2_2_ann"],
    keywords: [
      "Algoritmi numerici",
      "Simulari computationale",
      "Programare matematica",
      "Erori si stabilitate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=37",
  },
  {
    name: "Practica",
    id: "mt_3_2_prc",
    year: 3,
    sem: 2,
    specialization: "mate",
    pre: ["mt_3_1_mmt", "mt_3_2_mtc"],
    keywords: [
      "Aplicarea cunostintelor",
      "Proiect individual",
      "Analiza de date",
      "Prezentare rezultate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=38",
  },
  {
    name: "Algebra 1",
    id: "ma_1_1_alg1",
    year: 1,
    sem: 1,
    specialization: "mate_aplicata",
    keywords: [
      "Sisteme de ecuatii",
      "Matrice si determinanti",
      "Spatii vectoriale",
      "Transformari liniare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=10",
  },
  {
    name: "Analiza matematica 1",
    id: "ma_1_1_anm1",
    year: 1,
    sem: 1,
    specialization: "mate_aplicata",
    keywords: [
      "Limite si continuitate",
      "Derivate",
      "Integrale",
      "Teoreme fundamentale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=12",
  },
  {
    name: "Geometrie 1",
    id: "ma_1_1_geo1",
    year: 1,
    sem: 1,
    specialization: "mate_aplicata",
    keywords: ["Vectori", "Dreapta si plan", "Conice", "Cuadrice"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=14",
  },
  {
    name: "Programare 1 (C)",
    id: "ma_1_1_prg1",
    year: 1,
    sem: 1,
    specialization: "mate_aplicata",
    keywords: [
      "Variabile si tipuri",
      "Structuri de control",
      "Functii",
      "Pointeri",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=18",
  },
  {
    name: "Logica matematica",
    id: "ma_1_1_lgm",
    year: 1,
    sem: 1,
    specialization: "mate_aplicata",
    keywords: [
      "Propozitii si predicat",
      "Demonstratii logice",
      "Teoria multimilor",
      "Relatii si functii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=16",
  },
  {
    name: "Algebra 2",
    id: "ma_1_2_alg2",
    year: 1,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_alg1"],
    keywords: ["Grupuri", "Inele", "Polinoame", "Corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=11",
  },
  {
    name: "Analiza matematica 2",
    id: "ma_1_2_anm2",
    year: 1,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_anm1"],
    keywords: [
      "Serii numerice",
      "Functii de mai multe variabile",
      "Integrale multiple",
      "Ecuatii diferentiale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=13",
  },
  {
    name: "Geometrie 2",
    id: "ma_1_2_geo2",
    year: 1,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_geo1"],
    keywords: [
      "Geometrie diferentiala",
      "Curbe si suprafete",
      "Metrici",
      "Transformari geometrice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Structuri de date",
    id: "ma_1_2_sdd",
    year: 1,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_prg1"],
    keywords: ["Liste", "Stive si cozi", "Arbori", "Algoritmi de sortare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=22",
  },
  {
    name: "Probabilitati de baza",
    id: "ma_1_2_pba",
    year: 1,
    sem: 2,
    specialization: "mate_aplicata",
    keywords: [
      "Evenimente aleatoare",
      "Probabilitati conditionate",
      "Variabile aleatoare",
      "Distributii simple",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=50",
  },
  {
    name: "Analiza matematica 3",
    id: "ma_2_1_anm3",
    year: 2,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_1_2_anm2"],
    keywords: [
      "Spatii metrice",
      "Integrala Lebesgue",
      "Serii de functii",
      "Analiza functionala",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=23",
  },
  {
    name: "Algebra liniara",
    id: "ma_2_1_all",
    year: 2,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_alg1"],
    keywords: [
      "Forme biliniare",
      "Forme cuadratice",
      "Diagonalizare",
      "Valori proprii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=24",
  },
  {
    name: "Probabilitati si statistica",
    id: "ma_2_1_pss",
    year: 2,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_anm1", "ma_1_2_pba"],
    keywords: [
      "Variabile aleatoare",
      "Distributii",
      "Teste de ipoteza",
      "Regresie",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=30",
  },
  {
    name: "Ecuatii diferentiale",
    id: "ma_2_1_ecd",
    year: 2,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_1_2_anm2"],
    keywords: [
      "Ecuatii liniare",
      "Sisteme diferentiale",
      "Stabilitate",
      "Metode numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=26",
  },
  {
    name: "Metode numerice",
    id: "ma_2_1_mnr",
    year: 2,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_prg1"],
    keywords: [
      "Aproximare numerica",
      "Rezolvarea ecuatiilor",
      "Interpolare",
      "Integrare numerica",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=51",
  },
  {
    name: "Analiza numerica",
    id: "ma_2_2_ann",
    year: 2,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_2_anm2", "ma_2_1_mnr"],
    keywords: [
      "Interpolare",
      "Aproximare",
      "Metode iterative",
      "Erori numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=27",
  },
  {
    name: "Structuri algebrice",
    id: "ma_2_2_sta",
    year: 2,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_2_alg2"],
    keywords: ["Teoria Galois", "Module", "Algebre", "Extensii de corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Modelare matematica 1",
    id: "ma_2_2_mdm_1",
    year: 2,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_ecd"],
    keywords: [
      "Modele fizice",
      "Modele economice",
      "Simulari simple",
      "Optimizare de baza",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=52",
  },
  {
    name: "Programare orientata pe obiecte",
    id: "ma_2_2_poo",
    year: 2,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_1_1_prg1"],
    keywords: ["Clase si obiecte", "Mostenire", "Polimorfism", "Encapsulare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=20",
  },
  {
    name: "Statistica aplicata",
    id: "ma_2_2_ssa",
    year: 2,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_pss"],
    keywords: [
      "Analiza datelor",
      "Teste statistice",
      "Regresie multipla",
      "Interpretare rezultate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=53",
  },
  {
    name: "Analiza complexa",
    id: "ma_mm_3_1_anc",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_anm3"],
    keywords: [
      "Functii analitice",
      "Integrale complexe",
      "Teorema reziduurilor",
      "Transformari conforme",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=31",
    module: "Modelare matematica",
  },
  {
    name: "Modelare matematica 2",
    id: "ma_mm_3_1_mdm_2",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_2_mdm_1"],
    keywords: [
      "Modele dinamice",
      "Sisteme neliniare",
      "Simulari avansate",
      "Aplicatii tehnice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=54",
    module: "Modelare matematica",
  },
  {
    name: "Mecanica teoretica",
    id: "ma_mm_3_1_mct",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_ecd"],
    keywords: [
      "Legile miscarii",
      "Sisteme lagrangiene",
      "Oscilatii",
      "Stabilitate mecanica",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=55",
    module: "Modelare matematica",
  },
  {
    name: "Matematica computationala",
    id: "ma_mm_3_1_mtc",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_2_ann"],
    keywords: [
      "Algoritmi numerici",
      "Simulari computationale",
      "Programare matematica",
      "Erori si stabilitate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=37",
    module: "Modelare matematica",
  },
  {
    name: "Optimizare",
    id: "ma_mm_3_1_opt",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_all"],
    keywords: [
      "Programare liniara",
      "Metode gradient",
      "Optimizare neliniara",
      "Aplicatii practice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=56",
    module: "Modelare matematica",
  },
  {
    name: "Analiza complexa",
    id: "ma_ps_3_1_anc",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_anm3"],
    keywords: [
      "Functii analitice",
      "Integrale complexe",
      "Teorema reziduurilor",
      "Transformari conforme",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=31",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Statistica matematica",
    id: "ma_ps_3_1_stm",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_pss"],
    keywords: [
      "Estimatori",
      "Teoria probabilitatilor",
      "Teste avansate",
      "Distributii multivariate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=57",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Procese stocastice",
    id: "ma_ps_3_1_pst",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_pss"],
    keywords: [
      "Lanturi Markov",
      "Miscare browniana",
      "Procese Poisson",
      "Aplicatii financiare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=58",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Matematica computationala",
    id: "ma_ps_3_1_mtc_1",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_2_ann"],
    keywords: [
      "Algoritmi numerici",
      "Simulari computationale",
      "Programare matematica",
      "Erori si stabilitate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=37",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Optimizare",
    id: "ma_ps_3_1_opt_1",
    year: 3,
    sem: 1,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_all"],
    keywords: [
      "Programare liniara",
      "Metode gradient",
      "Optimizare neliniara",
      "Aplicatii practice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=56",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Analiza functionala",
    id: "ma_mm_3_2_anf",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_anm3"],
    keywords: [
      "Spatii Banach",
      "Spatii Hilbert",
      "Operatori",
      "Teorema Hahn-Banach",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=35",
    module: "Modelare matematica",
  },
  {
    name: "Modelare matematica 3",
    id: "ma_mm_3_2_mdm_3",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_mm_3_1_mdm_2"],
    keywords: [
      "Modele complexe",
      "Simulari numerice",
      "Aplicatii interdisciplinare",
      "Validare modele",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=59",
    module: "Modelare matematica",
  },
  {
    name: "Metode avansate de optimizare",
    id: "ma_mm_3_2_mao",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_mm_3_1_opt"],
    keywords: [
      "Algoritmi genetici",
      "Optimizare combinatorie",
      "Metode stocastice",
      "Aplicatii ingineresti",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=60",
    module: "Modelare matematica",
  },
  {
    name: "Practica",
    id: "ma_mm_3_2_prc",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_mm_3_1_mdm_2", "ma_mm_3_1_mct", "ma_mm_3_1_opt"],
    keywords: [
      "Aplicarea cunostintelor",
      "Proiect individual",
      "Analiza de date",
      "Prezentare rezultate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=38",
    module: "Modelare matematica",
  },
  {
    name: "Analiza functionala",
    id: "ma_ps_3_2_anf",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_2_1_anm3"],
    keywords: [
      "Spatii Banach",
      "Spatii Hilbert",
      "Operatori",
      "Teorema Hahn-Banach",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=35",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Statistica computationala",
    id: "ma_ps_3_2_stc",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_2_2_ssa"],
    keywords: [
      "Analiza datelor mari",
      "Simulari Monte Carlo",
      "Software statistic",
      "Interpretare avansata",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=61",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Modelare stocastica",
    id: "ma_ps_3_2_mds",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_ps_3_1_pst"],
    keywords: [
      "Modele financiare",
      "Simulari stocastice",
      "Aplicatii economice",
      "Validare modele",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=62",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Practica",
    id: "ma_ps_3_2_prc_1",
    year: 3,
    sem: 2,
    specialization: "mate_aplicata",
    pre: ["ma_ps_3_1_stm", "ma_ps_3_1_pst"],
    keywords: [
      "Aplicarea cunostintelor",
      "Proiect individual",
      "Analiza de date",
      "Prezentare rezultate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=38",
    module: "Probabilitati-Statistica",
  },
  {
    name: "Algebra 1",
    id: "mi_1_1_alg1",
    year: 1,
    sem: 1,
    specialization: "mate_info",
    keywords: [
      "Sisteme de ecuatii",
      "Matrice si determinanti",
      "Spatii vectoriale",
      "Transformari liniare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=10",
  },
  {
    name: "Analiza matematica 1",
    id: "mi_1_1_anm1",
    year: 1,
    sem: 1,
    specialization: "mate_info",
    keywords: [
      "Limite si continuitate",
      "Derivate",
      "Integrale",
      "Teoreme fundamentale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=12",
  },
  {
    name: "Geometrie 1",
    id: "mi_1_1_geo1",
    year: 1,
    sem: 1,
    specialization: "mate_info",
    keywords: ["Vectori", "Dreapta si plan", "Conice", "Cuadrice"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=14",
  },
  {
    name: "Programare 1 (C)",
    id: "mi_1_1_prg1",
    year: 1,
    sem: 1,
    specialization: "mate_info",
    keywords: [
      "Variabile si tipuri",
      "Structuri de control",
      "Functii",
      "Pointeri",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=18",
  },
  {
    name: "Logica matematica",
    id: "mi_1_1_lgm",
    year: 1,
    sem: 1,
    specialization: "mate_info",
    keywords: [
      "Propozitii si predicat",
      "Demonstratii logice",
      "Teoria multimilor",
      "Relatii si functii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=16",
  },
  {
    name: "Algebra 2",
    id: "mi_1_2_alg2",
    year: 1,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_1_alg1"],
    keywords: ["Grupuri", "Inele", "Polinoame", "Corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=11",
  },
  {
    name: "Analiza matematica 2",
    id: "mi_1_2_anm2",
    year: 1,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_1_anm1"],
    keywords: [
      "Serii numerice",
      "Functii de mai multe variabile",
      "Integrale multiple",
      "Ecuatii diferentiale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=13",
  },
  {
    name: "Structuri de date",
    id: "mi_1_2_sdd",
    year: 1,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_1_prg1"],
    keywords: ["Liste", "Stive si cozi", "Arbori", "Algoritmi de sortare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=22",
  },
  {
    name: "Geometrie 2",
    id: "mi_1_2_geo2",
    year: 1,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_1_geo1"],
    keywords: [
      "Geometrie diferentiala",
      "Curbe si suprafete",
      "Metrici",
      "Transformari geometrice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Fundamentele informaticii",
    id: "mi_1_2_fi",
    year: 1,
    sem: 2,
    specialization: "mate_info",
    keywords: [
      "Aritmetica binara",
      "Logica digitala",
      "Automate finite",
      "Limbaje formale",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=19",
  },
  {
    name: "Analiza matematica 3",
    id: "mi_2_1_anm_3",
    year: 2,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_2_anm2"],
    keywords: [
      "Spatii metrice",
      "Integrala Lebesgue",
      "Serii de functii",
      "Analiza functionala",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=23",
  },
  {
    name: "Algebra liniara",
    id: "mi_2_1_all",
    year: 2,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_1_alg1"],
    keywords: [
      "Forme biliniare",
      "Forme cuadratice",
      "Diagonalizare",
      "Valori proprii",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=24",
  },
  {
    name: "Probabilitati si statistica",
    id: "mi_2_1_pss",
    year: 2,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_1_anm1"],
    keywords: [
      "Variabile aleatoare",
      "Distributii",
      "Teste de ipoteza",
      "Regresie",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=30",
  },
  {
    name: "Programare orientata pe obiecte",
    id: "mi_2_1_poo",
    year: 2,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_1_prg1"],
    keywords: ["Clase si obiecte", "Mostenire", "Polimorfism", "Encapsulare"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=20",
  },
  {
    name: "Sisteme de operare",
    id: "mi_2_1_sdo",
    year: 2,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_1_prg1"],
    keywords: [
      "Procese si thread-uri",
      "Gestionare memorie",
      "Sincronizare",
      "Sistem de fisiere",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=28",
  },
  {
    name: "Analiza numerica",
    id: "mi_2_2_ann",
    year: 2,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_2_anm2"],
    keywords: [
      "Interpolare",
      "Aproximare",
      "Metode iterative",
      "Erori numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=27",
  },
  {
    name: "Structuri algebrice",
    id: "mi_2_2_sta",
    year: 2,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_2_alg2"],
    keywords: ["Teoria Galois", "Module", "Algebre", "Extensii de corpuri"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=15",
  },
  {
    name: "Baze de date",
    id: "mi_2_2_bdd",
    year: 2,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_2_sdd"],
    keywords: ["Model relational", "SQL", "Normalizare", "Tranzactii"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=25",
  },
  {
    name: "Ecuatii diferentiale",
    id: "mi_2_2_ecd",
    year: 2,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_1_2_anm2"],
    keywords: [
      "Ecuatii liniare",
      "Sisteme diferentiale",
      "Stabilitate",
      "Metode numerice",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=26",
  },
  {
    name: "Retele de calculatoare",
    id: "mi_2_2_rdc",
    year: 2,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_2_1_sdo"],
    keywords: ["Protocoale", "Adresare IP", "Topologii", "Securitate retele"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=29",
  },
  {
    name: "Analiza complexa",
    id: "mi_3_1_anc",
    year: 3,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_2_1_anm_3"],
    keywords: [
      "Functii analitice",
      "Integrale complexe",
      "Teorema reziduurilor",
      "Transformari conforme",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=31",
  },
  {
    name: "Topologie",
    id: "mi_3_1_top",
    year: 3,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_2_1_anm_3"],
    keywords: ["Spatii topologice", "Conexitate", "Compactitate", "Omotopie"],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=32",
  },
  {
    name: "Teoria numerelor",
    id: "mi_3_1_tnr",
    year: 3,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_1_2_alg2"],
    keywords: [
      "Numere prime",
      "Congruente",
      "Functii aritmetice",
      "Ecuatii diofantiene",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=33",
  },
  {
    name: "Programare avansata",
    id: "mi_3_1_pra",
    year: 3,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_2_1_poo"],
    keywords: [
      "Design patterns",
      "Algoritmi complecsi",
      "Optimizare cod",
      "Structuri avansate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=40",
  },
  {
    name: "Modele matematice",
    id: "mi_3_1_mmt",
    year: 3,
    sem: 1,
    specialization: "mate_info",
    pre: ["mi_2_2_ecd"],
    keywords: [
      "Modelare fizica",
      "Modelare biologica",
      "Simulari",
      "Optimizare",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=34",
  },
  {
    name: "Analiza functionala",
    id: "mi_3_2_anf",
    year: 3,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_2_1_anm_3"],
    keywords: [
      "Spatii Banach",
      "Spatii Hilbert",
      "Operatori",
      "Teorema Hahn-Banach",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=35",
  },
  {
    name: "Matematica computationala",
    id: "mi_3_2_mtc",
    year: 3,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_2_2_ann"],
    keywords: [
      "Algoritmi numerici",
      "Simulari computationale",
      "Programare matematica",
      "Erori si stabilitate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=37",
  },
  {
    name: "Inteligenta artificiala",
    id: "mi_3_2_ina",
    year: 3,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_2_1_pss"],
    keywords: [
      "Invatare automata",
      "Retele neuronale",
      "Procesare date",
      "Algoritmi genetici",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=41",
  },
  {
    name: "Practica",
    id: "mi_3_2_prc",
    year: 3,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_3_1_pra", "mi_3_2_ina", "mi_2_2_bdd"],
    keywords: [
      "Aplicarea cunostintelor",
      "Proiect individual",
      "Analiza de date",
      "Prezentare rezultate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=38",
  },
  {
    name: "Securitate informatica (optional)",
    id: "mi_3_2_sci",
    year: 3,
    sem: 2,
    specialization: "mate_info",
    pre: ["mi_2_2_rdc"],
    keywords: [
      "Criptografie",
      "Atacuri cibernetice",
      "Protectie date",
      "Audit securitate",
    ],
    details_url: "https://cursuri.fmi.unibuc.ro/course/view.php?id=42",
  },
];

const yearColor = {
  1: {
    1: "#34e1eb",
    2: "#1d69cc",
  },
  2: {
    1: "#d4d26e",
    2: "#d4a73d",
  },
  3: {
    1: "#04cc2f",
    2: "#07691c",
  },
};

const generator = new SVGCircleGenerator();

for (let course of courses) {
  coursesPerYear[course.year] += 1;

  graph.addNode(course.id, {
    x: coursesPerYear[course.year] * 3,
    y: (3 - course.year) * 3,
    type: "image",
    image: svgToDataURI(
      generator.generateSVG(course.name, {
        radius: 90,
        textColor: "#000",
        strokeWidth: 0,
        circleColor: yearColor[course.year][course.sem],
      })
    ),
  });
}

for (let course of courses) {
  if (course.pre) {
    for (let p of course.pre) {
      graph.addEdge(p, course.id, {
        type: "curvedArrow",
        size: 5,
        curved: true,
        dashArray: [5, 5],
      });
    }
  }
}

const sidebar = document.getElementById("sidebar");

function updateSidebar(course) {
  if (course) {
    sidebar.innerHTML = `
      <h2 style="margin-bottom: 12px;">${course.name}</h2>
      <div style="line-height: 1.7;">
        <p><strong>An:</strong> ${course.year}</p>
        <p><strong>Semestru:</strong> ${course.sem}</p>
        <p><strong>Tip:</strong> ${
          course.optional ? "Opțională" : "Obligatorie"
        }</p>
        ${
          course.pre
            ? `<p><strong>Preliminare:</strong> ${course.pre
                .map((id) => courses.find((c) => c.id === id)?.name || id)
                .join(", ")}</p>`
            : ""
        }
        ${
          course.description
            ? `<p><strong>Description:</strong> ${course.description}</p>`
            : ""
        }
      </div>
    `;
  } else {
    sidebar.innerHTML = `
      <h2>Course Information</h2>
      <p class="placeholder">Hover over a node to see course details here.</p>
    `;
  }
}

// Initialize renderer
const container = document.getElementById("container");

const renderer = new Sigma(graph, container, {
  allowInvalidContainer: true,
  defaultEdgeType: "straightNoArrow",
  edgeProgramClasses: {
    straightNoArrow: EdgeRectangleProgram,
    curvedNoArrow: EdgeCurveProgram,
    straightArrow: EdgeArrowProgram,
    curvedArrow: EdgeCurvedArrowProgram,
    straightDoubleArrow: EdgeDoubleArrowProgram,
    curvedDoubleArrow: EdgeCurvedDoubleArrowProgram,
  },

  nodeProgramClasses: {
    image: NodeImageProgram,
    pictogram: NodePictogramProgram,
  },
});

// State management
const state = { searchQuery: "" };

function setHoveredNode(node) {
  if (node) {
    state.hoveredNode = node;

    const highlightNodes = new Set();

    const prerequisiteNodes = new Set();
    const prereqQueue = [node];

    while (prereqQueue.length > 0) {
      const current = prereqQueue.shift();
      if (prerequisiteNodes.has(current)) continue;

      if (current !== node) {
        prerequisiteNodes.add(current);
      }

      graph.inboundNeighbors(current).forEach((n) => prereqQueue.push(n));
    }

    const dependentNodes = new Set();
    const dependentQueue = [node];

    while (dependentQueue.length) {
      const current = dependentQueue.shift();
      if (dependentNodes.has(current)) continue;

      if (current !== node) {
        dependentNodes.add(current);
      }

      graph.outboundNeighbors(current).forEach((n) => dependentQueue.push(n));
    }

    prerequisiteNodes.forEach((n) => highlightNodes.add(n));
    dependentNodes.forEach((n) => highlightNodes.add(n));

    state.hoveredPrereq = prerequisiteNodes;
    state.hoveredDependents = dependentNodes;
    state.hoveredNodes = highlightNodes;

    const course = courses.find((c) => c.id === node);
    updateSidebar(course);
  } else {
    state.hoveredNode = undefined;
    state.hoveredPrereq = undefined;
    state.hoveredDependents = undefined;
    state.hoveredNodes = undefined;
  }
  renderer.refresh({ skipIndexation: true });
}
renderer.on("enterNode", ({ node }) => setHoveredNode(node));
renderer.on("leaveNode", () => setHoveredNode(undefined));

renderer.setSetting("nodeReducer", (node, data) => {
  const res = { ...data };
  res.size = 50;

  if (node === state.hoveredNode) {
  } else {
    res.labelSize = 12;
    res.labelColor = "#333";
    res.labelBackground = "rgba(255,255,255,0.7)";
    res.labelPadding = 3;
  }

  if (
    state.hoveredNodes &&
    !state.hoveredNodes.has(node) &&
    state.hoveredNode !== node
  ) {
    res.hidden = true; 
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (
    state.hoveredNodes &&
    state.hoveredNodes.has(node) &&
    node !== state.hoveredNode
  ) {
    res.highlighted = true;
    res.size = 50;
  }

  if (node === state.hoveredNode) {
    res.highlighted = true;
    res.size = 60;
  }

  return res;
});

renderer.setSetting("edgeReducer", (edge, data) => {
  const res = { ...data };

  const source = graph.source(edge);
  const target = graph.target(edge);

  if (
    state.hoveredNodes &&
    (!state.hoveredNodes.has(source) || !state.hoveredNodes.has(target)) &&
    source !== state.hoveredNode &&
    target !== state.hoveredNode
  ) {
    res.hidden = true;
  }

  if (state.hoveredPrereq && state.hoveredPrereq.has(source)) {
    res.color = "#FFA500";
    res.size = 5;
  }

  if (state.hoveredDependents && state.hoveredDependents.has(target)) {
    res.color = "#32CD32";
    res.size = 5;
  }

  return res;
});

const legend = document.createElement("div");
legend.id = "legend";
legend.style.position = "absolute";
legend.style.top = "10px";
legend.style.right = "10px";
legend.style.background = "rgba(255, 255, 255, 0.9)";
legend.style.border = "1px solid #ddd";
legend.style.borderRadius = "5px";
legend.style.padding = "10px";
legend.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
legend.style.fontFamily = "Arial, sans-serif";
legend.style.fontSize = "14px";

let legendContent = `<h3 style="margin: 0 0 10px; font-size: 16px;">Legend</h3><ul style="list-style: none; padding: 0; margin: 0;">`;
for (const year in yearColor) {
  for (const sem in yearColor[year]) {
    const color = yearColor[year][sem];
    legendContent += `
      <li style="display: flex; align-items: center; margin-bottom: 5px;">
        <div style="width: 20px; height: 20px; background: ${color}; margin-right: 10px; border: 1px solid #ccc;"></div>
        Year ${year}, Semester ${sem}
      </li>`;
  }
}
legendContent += `</ul>`;
legend.innerHTML = legendContent;

container.style.position = "relative";
container.appendChild(legend);

const specializari = Array.from(new Set(courses.map((c) => c.specialization)));
const pickerWrapper = document.createElement("div");
pickerWrapper.style.position = "absolute";
pickerWrapper.style.top = "10px";
pickerWrapper.style.left = "50%";
pickerWrapper.style.transform = "translateX(-50%)";
pickerWrapper.style.zIndex = "1000";
pickerWrapper.style.background = "rgba(255,255,255,0.95)";

pickerWrapper.style.fontSize = "12px";

const select = document.createElement("select");
select.id = "specializare-select";
select.style.margin = "10px";
select.style.fontSize = "12px";
select.style.padding = "2px 6px";
specializari.forEach((spec) => {
  const opt = document.createElement("option");
  opt.value = spec;
  opt.textContent = spec;
  select.appendChild(opt);
});
pickerWrapper.appendChild(select);
container.appendChild(pickerWrapper);

function renderGraphForSpecialization(spec) {
  graph.clear();
  let coursesPerYear = { 1: 0, 2: 0, 3: 0 };
  for (let course of courses.filter((c) => c.specialization === spec)) {
    coursesPerYear[course.year] += 1;
    graph.addNode(course.id, {
      x: coursesPerYear[course.year] *0.3,
      y: (3 - course.year)*0.3,
      type: "image",
      image: svgToDataURI(
        generator.generateSVG(course.name, {
          radius: 95,
          textColor: "#000",
          strokeWidth: 0,
          circleColor: yearColor[course.year][course.sem],
        })
      ),
    });
  }
  for (let course of courses.filter((c) => c.specialization === spec)) {
    if (course.pre) {
      for (let p of course.pre) {
        graph.addEdge(p, course.id, {
          type: "curvedArrow",
          size: 5,
          curved: true,
          dashArray: [5, 5],
        });
      }
    }
  }
  renderer.refresh();
}

select.addEventListener("change", (e) => {
  renderGraphForSpecialization(e.target.value);
});

renderGraphForSpecialization(specializari[0]);
