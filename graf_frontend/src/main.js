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
for (let course of courses) {
  coursesPerYear[course.year] += 1;
  graph.addNode(course.id, {
    label: course.name,
    color: yearColor[course.year][course.sem],
    x: coursesPerYear[course.year],
    y: 3 - course.year,
    size: 20,
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

// Initialize renderer
const container = document.getElementById("container");

const renderer = new Sigma(graph, container, {
  allowInvalidContainer: true,
  defaultEdgeType: "straightNoArrow",
  renderEdgeLabels: true,
  edgeProgramClasses: {
    straightNoArrow: EdgeRectangleProgram,
    curvedNoArrow: EdgeCurveProgram,
    straightArrow: EdgeArrowProgram,
    curvedArrow: EdgeCurvedArrowProgram,
    straightDoubleArrow: EdgeDoubleArrowProgram,
    curvedDoubleArrow: EdgeCurvedDoubleArrowProgram,
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
  if (node === state.hoveredNode) {
    const course = courses.find((c) => c.id === node);
    if (course) {
      res.label =
        `${course.name}\n` +
        `Anul ${course.year}, Semestrul ${course.sem}\n` +
        `${course.optional ? "Optional" : "Mandatory"}` +
        ` ++  descriere`;

      // Style for the extended label
      res.labelSize = 14;
      res.labelColor = "#333";
      res.labelBackground = "rgba(255,255,255,0.9)";
      res.labelPadding = 5;
      res.labelBorderRadius = 5;
      res.labelBorderColor = "#ddd";
      res.labelBorderSize = 1;
    }
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
    res.size = 25;
  }

  if (node === state.hoveredNode) {
    res.highlighted = true;
    res.size = 30;
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
