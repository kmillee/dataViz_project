const ctx = {
    CHART_NB: 0,
    SVG_W: 1024,
    SVG_H: 1024,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    current_key: "none",
    defaultDescription: `Click on Add to create a new chart!`,
    //charts: []  // to stock created charts and move them dynamically

};




const dataJson = {"1" : "data/QB12_2.json",
                "2" : "data/QB13_2.json",
                "3":"data/QB13_3.json"
                 };


//called onloading
function createViz() {
    console.log("Using D3 v" + d3.version);
    populateQuestions();
    createSvg();
};

//called onloading
function createSvg(){
    let svgEl = d3.select("#chartContainer").append("svg");
    svgEl.attr("width", ctx.SVG_W);
    svgEl.attr("height", ctx.SVG_H);

}

//called onloading
function populateQuestions() {
    const questionSelect = document.getElementById("questionList");

    // On vide d'abord les options existantes
    questionSelect.innerHTML = '';

    // On crée une option vide au début (pour éviter qu'aucune question ne soit sélectionnée par défaut)
    const defaultOption = document.createElement("option");
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a question';
    questionSelect.appendChild(defaultOption);

    // On génère une option pour chaque fichier JSON dans dataJson
    Object.keys(dataJson).forEach((key, index) => {
        const option = document.createElement("option");
        option.value = key;  // Correspond à la clé des fichiers JSON, ex. "1", "2", "3"
        option.textContent = `Question ${key}`;  // Nom de la question basé sur la clé
        questionSelect.appendChild(option);
    });
}

async function loadDataJson(questID) {
    const jsonFile = dataJson[questID];
    if (!jsonFile) return null;

    try {
        const response = await fetch(jsonFile);
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error loading JSON data:", error);
        return null;
    }
}

function addChart() {
    if (ctx.CHART_NB === 12){
        console.log("Too many charts, please make some room before continuing.");
    }
    else{
        const chartType = document.getElementById("chartType").value; 
        const selectedQuestion = document.getElementById("questionList").value;

        loadDataJson(selectedQuestion).then(selectedData => {
            ctx.CHART_NB++;
            // Example of using sample data for a bar chart
            const sampleData = [
                { category: "A", value: 30 },
                { category: "B", value: 80 },
                { category: "C", value: 45 },
                { category: "D", value: 60 },
                { category: "E", value: 20 },
                { category: "F", value: 90 },
                { category: "G", value: 55 }
            ];

            createChart(chartType, sampleData);
            // createChart(chartType, selectedData);
            rearrangeChart();
        }); 
    }
}


function createChart(chartType, data) {
    const svg = d3.select("svg");

    const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));
    const numRows = Math.ceil(ctx.CHART_NB / numCols);

    const width = ctx.SVG_W / numCols;
    const height = ctx.SVG_H / numRows;

    const x = ((ctx.CHART_NB - 1) % numCols) * width;
    const y = Math.floor((ctx.CHART_NB - 1) / numCols) * height;
///////////
    if (chartType === "bar") {
        console.log("bar chart")
        addBarPlot(svg, x, y, width, height, data,ctx.CHART_NB);
    }
    // if (chartType === "line") {
    //     console.log("line chart")
    //     addLinePlot(svg, x, y, width, height, data,ctx.CHART_NB);
    // }
    else{
        console.log("other chart")
        svg.append("rect")
            .attr("class", `chart-${ctx.CHART_NB}`)  //keep an id
            .attr("data-type", chartType)          
            .attr("width", 0)                     
            .attr("height", 0)
            .attr("x", ctx.SVG_W / 2)  
            .attr("y", ctx.SVG_H / 2)
            .attr("fill", chartType === "bar" ? "steelblue" : chartType === "line" ? "orange" : "green")  // Couleurs différentes
            .attr("rx", 10)      
            .attr("ry", 10)
            .style("opacity",0)
    }

    
}

function rearrangeChart() {
    const svg = d3.select("svg");

    const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));  
    const numRows = Math.ceil(ctx.CHART_NB / numCols);  

    const width = ctx.SVG_W / numCols;
    const height = ctx.SVG_H / numRows;


    svg.selectAll(".chart")
        .data(d3.range(ctx.CHART_NB))
        .transition()  
        .duration(500)
        .attr("transform", (d, i) => {
            const col = i % numCols;
            const row = Math.floor(i / numCols);
            return `translate(${col * width}, ${row * height})`; 
        })
        // We have to recompute scales and margins every time
        .each(function() {
            const g = d3.select(this);

            // Margins + dimensions
            const margin = { top: 10, right: 10, bottom: 50, left: 10 };
            const plotWidth = width - margin.left - margin.right;
            const plotHeight = height - margin.top - margin.bottom;

            // Scales
            const xScale = d3.scaleBand()
                .domain(g.selectAll(".bar").data().map(d => d.category))
                .range([0, plotWidth])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(g.selectAll(".bar").data(), d => d.value)])
                .nice()
                .range([plotHeight, 0]);

            // Redraw axis
            g.select(".x-axis")
                .transition()
                .duration(500)
                .attr("transform", `translate(${margin.left},${margin.top + plotHeight})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));

            g.select(".y-axis")
                .transition()
                .duration(500)
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .call(d3.axisLeft(yScale).ticks(5));

            // update dimensions
            g.selectAll(".bar")
                .transition()
                .duration(500)
                .attr("x", d => xScale(d.category) + margin.left)
                .attr("y", d => yScale(d.value) + margin.top)
                .attr("width", xScale.bandwidth())
                .attr("height", d => plotHeight - yScale(d.value))
                .style("opacity", 1)
        });
}


function addBarPlot(svg, x, y, width, height, data,chartId) {
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${x},${y})`)
        .attr("class", `chart ${chartId}`);    //to move the container

    const chartArea = g.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, plotWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .range([plotHeight, 0]);

    // Axes
    chartArea.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));

    chartArea.append("g")
        .attr("class", "axis y-axis") 
        .call(d3.axisLeft(yScale).ticks(5));

    // Bars
    chartArea.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.category))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => plotHeight - yScale(d.value))
        .attr("fill", "steelblue")
        .style("opacity", 0)

}


function addLinePlot(data){}

function addScatterPlot(data){}



function goMap(){
    console.log("Going back to map");
    window.location.href = "main.html";
}