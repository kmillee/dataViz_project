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
    if (ctx.CHART_NB === 10){
        console.log("Too many charts, please make some room before continuing.");
    }
    else{
        const chartType = document.getElementById("chartType").value; 
        const selectedQuestion = document.getElementById("questionList").value;
        loadDataJson(selectedQuestion).then(selectedData => {
            ctx.CHART_NB++;  
            createChart(chartType, selectedData);
            rearrangeChart();
        }); 
    }
}

// function createChart(chartType, data) {

//     console.log(`Creating chart #${ctx.CHART_NB} of type ${chartType} with data:`, data);

//     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB)); 
//     const numRows = Math.ceil(ctx.CHART_NB / numCols); 

//     const width = ctx.SVG_W / numCols; 
//     const height = ctx.SVG_H / numRows

//     const svg = d3.select("svg");

//     //select every existing rectangular + new one, update their positions
//     svg.selectAll("rect")  
//     .data(d3.range(ctx.CHART_NB))  // going through all rects
//     .join(
//         enter => {
//             const newRect = enter.append("rect")
//                 .attr("width", width)
//                 .attr("height", height)
//                 .attr("fill", "steelblue")
//                 .attr("x", (d, i) => (i % numCols) * width) 
//                 .attr("y", (d, i) => Math.floor(i / numCols) * height)
//                 .attr("rx", 10)
//                 .attr("ry", 10);
            
//             return newRect;
//         },
//         update => {
//             update.transition() 
//                 .attr("width", width)
//                 .attr("height", height)
//                 .attr("x", (d, i) => (i % numCols) * width) 
//                 .attr("y", (d, i) => Math.floor(i / numCols) * height); 

//             return update;
//         }
//     );


//     // if (chartType === "bar") {
//     //     console.log("Bar chart");

//     //     const shape = svg.append("rect")  // Créer un carré
//     //     .attr("x", width)  // Position X en fonction du nombre de graphiques
//     //     .attr("y", height)  // Position Y fixe pour l'instant (on peut aussi l'adapter)
//     //     .attr("width", 50)  // Largeur du carré
//     //     .attr("height", 50)  // Hauteur du carré
//     //     .attr("fill", "steelblue");  // Couleur de remplissage

//     //     // const x = d3.scaleBand().domain(data.map(d => d.id)).range([0, 400]).padding(0.1);
//     //     // const y = d3.scaleLinear().domain([0, d3.max(data, d => d.number_of_respondents)]).nice().range([300, 0]);

//     //     // svg.selectAll(".bar")
//     //     //     .data(data)
//     //     //     .enter().append("rect")
//     //     //     .attr("x", d => x(d.id))
//     //     //     .attr("y", d => y(d.number_of_respondents))
//     //     //     .attr("width", x.bandwidth())
//     //     //     .attr("height", d => 300 - y(d.number_of_respondents))
//     //     //     .attr("fill", "steelblue");
        
//     //     // svg.append("g")
//     //     //     .attr("transform", "translate(0,300)")
//     //     //     .call(d3.axisBottom(x));

//     //     // svg.append("g")
//     //     //     .call(d3.axisLeft(y));
//     // }
//     // else if (chartType === "line"){
//     //     console.log("Line chart");

//     //     const shape = svg.append("rect")  // Créer un carré
//     //     .attr("x", (ctx.CHART_NB - 1) * width)  // Position X en fonction du nombre de graphiques
//     //     .attr("y", 0)  // Position Y fixe pour l'instant (on peut aussi l'adapter)
//     //     .attr("width", width)  // Largeur du carré
//     //     .attr("height", height)  // Hauteur du carré
//     //     .attr("fill", "green");  // Couleur de remplissage
//     // }
//     // else if (chartType === "scatter"){
//     //     console.log("Scatter plot");

//     //     const shape = svg.append("rect")  // Créer un carré
//     //     .attr("x", (ctx.CHART_NB - 1) * width)  // Position X en fonction du nombre de graphiques
//     //     .attr("y", 0)  // Position Y fixe pour l'instant (on peut aussi l'adapter)
//     //     .attr("width", width)  // Largeur du carré
//     //     .attr("height", height)  // Hauteur du carré
//     //     .attr("fill", "red");  // Couleur de remplissage
//     // }

//     // Ajouter d'autres types de graphiques selon le chartType...
// }

function createChart(chartType, data) {
    const svg = d3.select("svg");

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

function rearrangeChart() {
    const svg = d3.select("svg");

    const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));  
    const numRows = Math.ceil(ctx.CHART_NB / numCols);  

    const width = ctx.SVG_W / numCols;
    const height = ctx.SVG_H / numRows;

    svg.selectAll("rect")
        .data(d3.range(ctx.CHART_NB))  //each rect has its index
        .transition()  
        .duration(500)
        .attr("width", width)
        .attr("height", height)
        .attr("x", (d, i) => (i % numCols) * width)  
        .attr("y", (d, i) => Math.floor(i / numCols) * height)
        .style("opacity",1)
}


function addBarPlot(data){}

function addLinePlot(data){}

function addScatterPlot(data){}



function goMap(){
    console.log("Going back to map");
    window.location.href = "main.html";
}