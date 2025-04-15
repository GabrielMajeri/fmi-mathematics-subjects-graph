document.addEventListener("DOMContentLoaded", function () {
  // Sample course data
  const courses = [
    { id: "CS101", name: "Introduction to Computer Science", credits: 4 },
    { id: "CS102", name: "Data Structures", credits: 4 },
    { id: "CS201", name: "Algorithms", credits: 4 },
    { id: "CS202", name: "Database Systems", credits: 4 },
    { id: "CS301", name: "Operating Systems", credits: 4 },
    { id: "CS302", name: "Computer Networks", credits: 4 },
    { id: "MATH101", name: "Calculus I", credits: 4 },
    { id: "MATH102", name: "Discrete Mathematics", credits: 4 },
    { id: "PHYS101", name: "Physics I", credits: 4 },
  ];

  // Course dependencies (prerequisites and optional follow-ups)
  const links = [
    // Prerequisites (solid lines)
    { source: "CS101", target: "CS102", type: "prerequisite" },
    { source: "CS102", target: "CS201", type: "prerequisite" },
    { source: "CS102", target: "CS202", type: "prerequisite" },
    { source: "CS201", target: "CS301", type: "prerequisite" },
    { source: "CS201", target: "CS302", type: "prerequisite" },
    { source: "MATH101", target: "PHYS101", type: "prerequisite" },
    { source: "MATH101", target: "CS101", type: "prerequisite" },
    { source: "MATH102", target: "CS102", type: "prerequisite" },

    // Optional follow-ups (dotted lines)
    { source: "CS202", target: "CS302", type: "optional" },
    { source: "CS301", target: "CS302", type: "optional" },
    { source: "CS101", target: "PHYS101", type: "optional" },
  ];

  // Set up the SVG container
  const width = document.getElementById("graph-container").clientWidth;
  const height = document.getElementById("graph-container").clientHeight;

  const svg = d3
    .select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create a tooltip div
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Set up the simulation
  const simulation = d3
    .forceSimulation(courses)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(60));

  // Draw the links
  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", (d) => `link ${d.type === "optional" ? "optional" : ""}`)
    .attr("stroke-width", 2);

  // Create node groups
  const node = svg
    .append("g")
    .selectAll("g")
    .data(courses)
    .join("g")
    .call(drag(simulation));

  // Add circles to nodes
  node
    .append("circle")
    .attr("r", 25)
    .attr("class", "node")
    .attr("fill", "#69b3a2")
    .on("mouseover", showTooltip)
    .on("mouseout", hideTooltip);

  // Add text to nodes
  node
    .append("text")
    .attr("dy", 4)
    .attr("text-anchor", "middle")
    .text((d) => d.id)
    .style("fill", "white")
    .style("pointer-events", "none");

  // Update positions on each tick
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Tooltip functions
  function showTooltip(event, d) {
    // Show tooltip
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
      .html(`<strong>${d.id}</strong><br/>${d.name}<br/>Credits: ${d.credits}`)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");

    // Highlight the hovered node
    d3.select(event.currentTarget).classed("highlighted", true);

    // Highlight prerequisites (orange)
    const prereqLinks = links.filter(
      (l) => l.target === d.id && l.type === "prerequisite"
    );
    const prereqNodes = prereqLinks.map((l) => l.source);

    link.classed("highlight-prereq", (l) => prereqLinks.includes(l));
    node
      .select("circle")
      .classed("highlight-prereq", (n) => prereqNodes.includes(n.id));

    // Highlight follow-up courses (blue)
    const followupLinks = links.filter((l) => l.source === d.id);
    const followupNodes = followupLinks.map((l) => l.target);

    link.classed("highlight-followup", (l) => followupLinks.includes(l));
    node
      .select("circle")
      .classed("highlight-followup", (n) => followupNodes.includes(n.id));
  }

  function hideTooltip(event) {
    // Hide tooltip
    tooltip.transition().duration(500).style("opacity", 0);

    // Remove all highlights
    d3.select(event.currentTarget).classed("highlighted", false);
    link
      .classed("highlight-prereq", false)
      .classed("highlight-followup", false);
    node
      .select("circle")
      .classed("highlight-prereq", false)
      .classed("highlight-followup", false);
  }

  // Drag functions
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
});
