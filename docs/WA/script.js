// Initialize a set to keep track of added words and a score variable
const addedWords = new Set();
let score = 0;

// Function to update the score display
function updateScoreDisplay() {
    document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
}

// Add an event listener to the input field to handle the "Enter" key press
document.getElementById('wordInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        generateWordCloud();
    }
});

async function generateWordCloud() {
    const wordInput = document.getElementById('wordInput').value.trim();
    const wordCloudContainer = document.getElementById('wordCloud');

    if (!wordInput) {
        alert('Please enter a word');
        return;
    }

    // Check if the word is already in the cloud
    if (addedWords.has(wordInput)) {
        alert('This word is already in the cloud. Please enter a different word.');
        score--;  // Subtract 1 point for a duplicate word
        updateScoreDisplay();  // Update the score display
        return;
    }

    // Fetch an associated word using Datamuse API
    const response = await fetch(`https://api.datamuse.com/words?rel_trg=${wordInput}`);
    const data = await response.json();

    if (!data.length) {
        wordCloudContainer.innerHTML = '<p>No associated words found.</p>';
        return;
    }

    // Get the first associated word
    const associatedWord = data[0].word;

    // Check if the associated word is already in the cloud
    if (addedWords.has(associatedWord)) {
        alert('The associated word is already in the cloud. Please enter a different word.');
        return;
    }

    // Add the words to the set of added words
    addedWords.add(wordInput);
    addedWords.add(associatedWord);
    score += 1;  // Add 2 points for two new words
    updateScoreDisplay();  // Update the score display

    // Prepare nodes and links for the force simulation
    const nodes = Array.from(addedWords).map((word, index) => ({ id: word, group: index }));
    const links = [];

    // Add links for each new word association
    for (let i = 1; i < nodes.length; i++) {
        links.push({ source: nodes[i - 1].id, target: nodes[i].id });
    }

      // Clear the word cloud container and prepare SVG for rendering
      wordCloudContainer.innerHTML = '';
      const width = window.innerWidth;
      const height = window.innerHeight;
      const svg = d3.select('#wordCloud').append('svg')
          .attr('width', width)
          .attr('height', height);

    // Set up the force simulation with random initial velocities and positions
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX().strength(() => Math.random() * 0.2 - 0.1))
        .force('y', d3.forceY().strength(() => Math.random() * 0.2 - 0.1))
        .velocityDecay(0.8) // Reduce velocity decay for continuous movement
        .on('tick', ticked);

    // Apply random initial velocities and positions
    nodes.forEach(node => {
        node.vx = Math.random() * 2 - 1; // Random velocity x
        node.vy = Math.random() * 2 - 1; // Random velocity y
        node.x = Math.random() * width;  // Random initial position x
        node.y = Math.random() * height; // Random initial position y
    });

    // Draw the links (lines)
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke-width', 2)
        .attr('stroke', '#000');

    // Draw the nodes (words)
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('class', 'word-node')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.id)
        .style('font-size', '14px')
        .style('font-family', 'Arial')
        .style('fill', '#333')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    function ticked() {
        link.attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('x', d => d.x)
            .attr('y', d => d.y);
    }

    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Clear the input field and prompt for another word input
    document.getElementById('wordInput').value = '';
}
