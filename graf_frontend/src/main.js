// Import sigma.js and its plugins
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

// Set up search functionality
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");

// State management
const state = { searchQuery: "" };

// Feed the datalist autocomplete values
searchSuggestions.innerHTML = graph
  .nodes()
  .map(
    (node) =>
      `<option value="${graph.getNodeAttribute(node, "label")}"></option>`
  )
  .join("\n");

// Actions
function setSearchQuery(query) {
  state.searchQuery = query;
  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.suggestions = undefined;
      const nodePosition = renderer.getNodeDisplayData(state.selectedNode);
      renderer.getCamera().animate(nodePosition, { duration: 500 });
    } else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  } else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }
  renderer.refresh({ skipIndexation: true });
}

function setHoveredNode(node) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }
  renderer.refresh({ skipIndexation: true });
}

// Event listeners
searchInput.addEventListener("input", () =>
  setSearchQuery(searchInput.value || "")
);
searchInput.addEventListener("blur", () => setSearchQuery(""));

renderer.on("enterNode", ({ node }) => setHoveredNode(node));
renderer.on("leaveNode", () => setHoveredNode(undefined));

// Render settings
renderer.setSetting("nodeReducer", (node, data) => {
  const res = { ...data };
  if (
    state.hoveredNeighbors &&
    !state.hoveredNeighbors.has(node) &&
    state.hoveredNode !== node
  ) {
    res.label = "";
    res.color = "#f6f6f6";
  }
  if (state.selectedNode === node) {
    res.highlighted = true;
  } else if (state.suggestions) {
    if (state.suggestions.has(node)) {
      res.forceLabel = true;
    } else {
      res.label = "";
      res.color = "#f6f6f6";
    }
  }
  return res;
});

renderer.setSetting("edgeReducer", (edge, data) => {
  const res = { ...data };
  if (
    state.hoveredNode &&
    !graph
      .extremities(edge)
      .every(
        (n) =>
          n === state.hoveredNode || graph.areNeighbors(n, state.hoveredNode)
      )
  ) {
    res.hidden = true;
  }
  if (
    state.suggestions &&
    (!state.suggestions.has(graph.source(edge)) ||
      !state.suggestions.has(graph.target(edge)))
  ) {
    res.hidden = true;
  }
  return res;
});
