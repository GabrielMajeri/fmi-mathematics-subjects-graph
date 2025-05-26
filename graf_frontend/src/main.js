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

const courses = [
  { name: "Algebra 1", id: "alg1", year: 1, sem: 1 },
  { name: "Algebra 2", id: "alg2", year: 1, sem: 2, pre: ["alg1"] },
  { name: "Analiza 1", id: "an1", year: 1, sem: 1 },
  { name: "Analiza 2", id: "an2", year: 1, sem: 2, pre: ["an1"] },
  { name: "Logica", id: "logica", year: 1, sem: 2 },
  { name: "Criptografie", id: "cripto", year: 3, sem: 1, optional: true },
  { name: "Inteligenta artificiala", id: "ai", year: 2, sem: 2, pre: ["an2"] },
  {
    name: "Elemente de securitate",
    id: "esla",
    year: 3,
    sem: 2,
    pre: ["logica", "cripto"],
    optional: true,
  },
  { name: "Geometrie", id: "geom", year: 2, sem: 1, pre: ["alg2"] },
  {
    name: "Grafica pe calculator",
    id: "geomCalc",
    year: 3,
    sem: 1,
    pre: ["geom"],
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

// Add nodes to graph
const generator = new SVGCircleGenerator();

for (let course of courses) {
  coursesPerYear[course.year] += 1;

  graph.addNode(course.id, {
    x: coursesPerYear[course.year],
    y: 3 - course.year,
    type: "image",
    image: svgToDataURI(
      generator.generateSVG(course.name, {
        radius: 80,
        textColor: "#000",
        strokeWidth: 0,
        circleColor: yearColor[course.year][course.sem],
      })
    ),
  });
}

// Add edges to graph
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
      <h2>${course.name}</h2>
      <p><strong>Year:</strong> ${course.year}</p>
      <p><strong>Semester:</strong> ${course.sem}</p>
      <p><strong>Type:</strong> ${
        course.optional ? "Optional" : "Mandatory"
      }</p>
      ${
        course.pre
          ? `<p><strong>Prerequisites:</strong> ${course.pre
              .map((id) => courses.find((c) => c.id === id)?.name || id)
              .join(", ")}</p>`
          : ""
      }
      ${
        course.description
          ? `<p><strong>Description:</strong> ${course.description}</p>`
          : ""
      }
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

    // Combine both sets
    prerequisiteNodes.forEach((n) => highlightNodes.add(n));
    dependentNodes.forEach((n) => highlightNodes.add(n));

    state.hoveredPrereq = prerequisiteNodes;
    state.hoveredDependents = dependentNodes;
    state.hoveredNodes = highlightNodes;

    // Update sidebar
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
    const course = courses.find((c) => c.id === node);
    // if (course) {
    //   // Create multi-line label with structured formatting
    //   const yearSemLine = `📅 Year ${course.year}, Semester ${course.sem}`;
    //   const statusLine = `${course.optional ? "🔸 Optional" : "🔶 Mandatory"}`;
    //   const descLine = `📝 ${course.description}`;

    //   res.label = `${course.name}\n${yearSemLine}\n${statusLine}\n${descLine}`;

    //   // Enhanced styling for expanded label
    //   res.labelSize = 13;
    //   res.labelColor = "#2c3e50";
    //   res.labelBackground = "rgba(255, 255, 255, 0.95)";
    //   res.labelPadding = 8;
    //   res.labelBorderRadius = 6;
    //   res.labelBorderColor = "#3498db";
    //   res.labelBorderSize = 2;
    //   res.labelMaxWidth = 250;
    //   res.labelLineHeight = 1.4;
    // }
  } else {
    // Default label styling
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

// Build the legend content
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

// Append the legend to the container
container.style.position = "relative"; // Ensure the container is positioned
container.appendChild(legend);
