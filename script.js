// Configuration
const config = {
    jsonUrl: 'courses.json', // Path to the JSON file
    nodeSize: 80,
    edgeWidth: 2,
    profiles: {
        'mate': { color: '#4e73df' },
        'info': { color: '#1cc88a' },
        'mate-info': { color: '#f6c23e' },
        'cti': { color: '#e74a3b' }
    }
};

// State
let coursesData = [];
let cy = null;
let dependenciesCy = null;
let currentProfile = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Fetch course data
        coursesData = await fetchCourseData();
        
        // Initialize the main graph
        initMainGraph();
        
        // Initialize overlay graph
        initOverlayGraph();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Failed to initialize the application. Please check the console for details.');
    }
}

async function fetchCourseData() {
    try {
        const response = await fetch(config.jsonUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch course data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching course data:', error);
        // Provide sample data for testing if fetch fails
        return getSampleData();
    }
}

function initMainGraph() {
    // Initialize Cytoscape instance
    cy = cytoscape({
        container: document.getElementById('cy'),
        style: getCytoscapeStyle(),
        layout: {
            name: 'dagre',
            rankDir: 'TB', // Top to bottom layout
            nodeSep: 80,
            rankSep: 100,
            fit: true,
            padding: 50
        },
        elements: generateCytoscapeElements(),
        wheelSensitivity: 0.2
    });

    // Add click event for nodes
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const courseId = node.id();
        showCourseDetails(courseId);
    });
}

function initOverlayGraph() {
    // Initialize dependencies graph
    dependenciesCy = cytoscape({
        container: document.getElementById('dependencies-graph'),
        style: getCytoscapeStyle(),
        layout: {
            name: 'concentric',
            minNodeSpacing: 50,
            concentric: function(node) {
                return node.data('concentric');
            },
            levelWidth: function() { return 1; }
        },
        elements: [],
        wheelSensitivity: 0.2
    });
}

function setupEventListeners() {
    // Profile selector change event
    const profileSelector = document.getElementById('profile-selector');
    profileSelector.addEventListener('change', function() {
        currentProfile = this.value;
        updateMainGraph();
    });

    // Reset graph button click event
    const resetButton = document.getElementById('reset-graph');
    resetButton.addEventListener('click', function() {
        cy.fit();
        cy.center();
    });

    // Close button for overlay
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        document.getElementById('course-overlay').style.display = 'none';
    });

    // Close overlay when clicking outside content
    const overlay = document.getElementById('course-overlay');
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.style.display = 'none';
        }
    });
}

function updateMainGraph() {
    cy.elements().remove();
    cy.add(generateCytoscapeElements());
    cy.layout({
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 80,
        rankSep: 100,
        fit: true,
        padding: 50
    }).run();
}

function showCourseDetails(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    // Update overlay content
    document.getElementById('overlay-title').textContent = course.title;
    document.getElementById('overlay-description').textContent = course.description || 'No description available.';
    
    // Display profile
    const profileContainer = document.getElementById('overlay-profile');
    profileContainer.innerHTML = '';
    
    if (course.profile) {
        const profileEl = document.createElement('span');
        profileEl.className = `course-profile profile-${course.profile}`;
        profileEl.textContent = course.profile.toUpperCase();
        profileContainer.appendChild(profileEl);
    }

    // Generate centered dependency graph
    generateCenteredDependencyGraph(course);
    
    // Show overlay
    document.getElementById('course-overlay').style.display = 'block';
    
    // Force resize to ensure proper rendering
    window.setTimeout(() => {
        dependenciesCy.resize();
        dependenciesCy.fit();
    }, 100);
}

function generateCenteredDependencyGraph(centerCourse) {
    // Clear previous elements
    dependenciesCy.elements().remove();
    
    const elements = [];
    // Track visited nodes and edges for both prerequisite and dependent DFS
    const prereqVisitedNodes = new Set();
    const depVisitedNodes = new Set();
    const prereqVisitedEdges = new Set();
    const depVisitedEdges = new Set();
    
    // Add the main course node
    elements.push({
        data: {
            id: centerCourse.id,
            label: centerCourse.title,
            profile: centerCourse.profile,
            isMainNode: true,
            dfsLevel: 0 // Center node
        }
    });
    
    // 1. DFS for prerequisites - Backwards traversal
    function dfsPrerequisites(courseId, path = []) {
        prereqVisitedNodes.add(courseId);
        const course = coursesData.find(c => c.id === courseId);
        
        if (!course || !course.prerequisites || course.prerequisites.length === 0) {
            return;
        }
        
        course.prerequisites.forEach(prereqId => {
            const prereq = coursesData.find(c => c.id === prereqId);
            if (!prereq) return;
            
            // Add edge to our visited edges
            const edgeId = `${prereqId}-to-${courseId}`;
            prereqVisitedEdges.add(edgeId);
            
            // Add node if we haven't seen it yet
            if (!prereqVisitedNodes.has(prereqId)) {
                // Continue DFS traversal
                dfsPrerequisites(prereqId, [...path, courseId]);
            }
        });
    }
    
    // 2. DFS for dependent courses - Forward traversal
    function dfsDependents(courseId, path = []) {
        depVisitedNodes.add(courseId);
        
        // Find courses that depend on this one
        const dependents = coursesData.filter(c => 
            c.prerequisites && c.prerequisites.includes(courseId)
        );
        
        dependents.forEach(dep => {
            // Add edge to our visited edges
            const edgeId = `${courseId}-to-${dep.id}`;
            depVisitedEdges.add(edgeId);
            
            // Add node if we haven't seen it yet
            if (!depVisitedNodes.has(dep.id)) {
                // Continue DFS traversal
                dfsDependents(dep.id, [...path, courseId]);
            }
        });
    }
    
    // Run DFS from the center node
    dfsPrerequisites(centerCourse.id);
    dfsDependents(centerCourse.id);
    
    // Now add all visited nodes from prerequisite traversal
    for (const nodeId of prereqVisitedNodes) {
        if (nodeId === centerCourse.id) continue; // Already added
        
        const course = coursesData.find(c => c.id === nodeId);
        if (course) {
            elements.push({
                data: {
                    id: nodeId,
                    label: course.title,
                    profile: course.profile,
                    type: 'prerequisite'
                }
            });
        }
    }
    
    // Add all visited nodes from dependent traversal
    for (const nodeId of depVisitedNodes) {
        if (nodeId === centerCourse.id) continue; // Already added
        if (prereqVisitedNodes.has(nodeId)) continue; // Skip if already added as prerequisite
        
        const course = coursesData.find(c => c.id === nodeId);
        if (course) {
            elements.push({
                data: {
                    id: nodeId,
                    label: course.title,
                    profile: course.profile,
                    type: 'dependent'
                }
            });
        }
    }
    
    // Add edges from prerequisite traversal
    for (const edgeId of prereqVisitedEdges) {
        const [source, target] = edgeId.split('-to-');
        elements.push({
            data: {
                id: edgeId,
                source: source,
                target: target,
                type: 'prerequisite'
            }
        });
    }
    
    // Add edges from dependent traversal
    for (const edgeId of depVisitedEdges) {
        const [source, target] = edgeId.split('-to-');
        elements.push({
            data: {
                id: edgeId,
                source: source,
                target: target,
                type: 'dependent'
            }
        });
    }
    
    // Add elements to the graph
    dependenciesCy.add(elements);
    
    // Apply dagre layout for hierarchical display
    dependenciesCy.layout({
        name: 'dagre',
        rankDir: 'TB', // Top to bottom direction
        rankSep: 120,  // Distance between ranks (increased)
        nodeSep: 100,  // Distance between nodes (increased)
        edgeSep: 60,   // Distance between parallel edges (increased)
        ranker: 'network-simplex', // Algorithm for ranking nodes
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 60
    }).run();
}

function generateCytoscapeElements() {
    const elements = [];
    
    // Filter courses by profile if needed
    const visibleCourses = currentProfile === 'all' 
        ? coursesData 
        : coursesData.filter(course => course.profile === currentProfile);
    
    // Process courses for display
    if (currentProfile === 'all') {
        // When showing all profiles, we need to handle course deduplication
        // Group courses by title
        const coursesByTitle = {};
        visibleCourses.forEach(course => {
            if (!coursesByTitle[course.title]) {
                coursesByTitle[course.title] = [];
            }
            coursesByTitle[course.title].push(course);
        });
        
        // For each unique title, create one node and store all related course IDs
        Object.entries(coursesByTitle).forEach(([title, courses]) => {
            // Use the first course of each title as the representative
            const representativeCourse = courses[0];
            
            // Create a node for this course
            elements.push({
                data: {
                    id: representativeCourse.id,
                    label: title,
                    profile: 'multiple',
                    allCourseIds: courses.map(c => c.id) // Store all IDs for edge creation
                }
            });
            
            // Add edges for this course
            courses.forEach(course => {
                if (course.prerequisites && course.prerequisites.length > 0) {
                    course.prerequisites.forEach(prereqId => {
                        // Find the prerequisite course
                        const prereq = coursesData.find(c => c.id === prereqId);
                        if (!prereq) return;
                        
                        // Find the representative course for this prerequisite
                        const prereqRepCourse = coursesData.find(c => 
                            c.title === prereq.title && 
                            coursesData.filter(x => x.title === prereq.title)[0].id === c.id
                        );
                        
                        if (prereqRepCourse) {
                            // Add edge from the prerequisite representative to this course representative
                            elements.push({
                                data: {
                                    id: `${prereqRepCourse.id}-to-${representativeCourse.id}`,
                                    source: prereqRepCourse.id,
                                    target: representativeCourse.id
                                }
                            });
                        }
                    });
                }
            });
        });
    } else {
        // When filtering by profile, display is simpler
        // Add nodes for all visible courses
        visibleCourses.forEach(course => {
            elements.push({
                data: {
                    id: course.id,
                    label: course.title,
                    profile: course.profile
                }
            });
        });
        
        // Add edges between visible courses
        visibleCourses.forEach(course => {
            if (course.prerequisites && course.prerequisites.length > 0) {
                course.prerequisites.forEach(prereqId => {
                    // Only add edge if prerequisite is also in visible courses
                    const prereq = visibleCourses.find(c => c.id === prereqId);
                    if (prereq) {
                        elements.push({
                            data: {
                                id: `${prereqId}-to-${course.id}`,
                                source: prereqId,
                                target: course.id
                            }
                        });
                    }
                });
            }
        });
    }
    
    return elements;
}

function getCytoscapeStyle() {
    return [
        {
            selector: 'node',
            style: {
                'width': config.nodeSize,
                'height': config.nodeSize,
                'background-color': '#666',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '12px',
                'text-wrap': 'wrap',
                'text-max-width': '70px',
                'shape': 'ellipse',
                'border-width': 2,
                'border-color': '#ddd'
            }
        },
        {
            selector: 'node[profile="mate"]',
            style: {
                'background-color': config.profiles.mate.color
            }
        },
        {
            selector: 'node[profile="info"]',
            style: {
                'background-color': config.profiles.info.color
            }
        },
        {
            selector: 'node[profile="mate-info"]',
            style: {
                'background-color': config.profiles['mate-info'].color
            }
        },
        {
            selector: 'node[profile="cti"]',
            style: {
                'background-color': config.profiles.cti.color
            }
        },
        {
            selector: 'node[profile="multiple"]',
            style: {
                'background-color': '#888',
                'border-width': 3,
                'border-color': '#aaa'
            }
        },
        {
            selector: 'node[isMainNode]',
            style: {
                'border-width': 3,
                'border-color': '#ff5722',
                'background-color': '#ff9800',
                'width': config.nodeSize * 1.2,
                'height': config.nodeSize * 1.2,
                'font-size': '14px',
                'font-weight': 'bold'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': config.edgeWidth,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: 'edge[type="prerequisite"]',
            style: {
                'line-color': '#aaaaff',
                'target-arrow-color': '#aaaaff'
            }
        },
        {
            selector: 'edge[type="dependent"]',
            style: {
                'line-color': '#ffaa88',
                'target-arrow-color': '#ffaa88'
            }
        }
    ];
}

// Sample data function for testing
function getSampleData() {
    return [];
}