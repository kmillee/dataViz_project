const ctx = {
    CHART_NB: 0,
    SVG_W: 1024,
    SVG_H: 900,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    current_key: "none",
    defaultDescription: `Click on Add to create a new chart!`,
    charts: []  // to stock created charts and move them dynamically

};


let selectedSVG = null; // track where to draw the chart


//called onloading
function createViz() {
    console.log("Using D3 v" + d3.version);
    createSVGGrid();
    createCategoryMenu();
};

//called onloading
function createSVGGrid() {
    const container = d3.select("#svgGrid");

    const svgWidth = 600;
    const svgHeight = 400;

    for (let i = 0; i < 4; i++) {
        const svg = container
            .append("svg") // Ajoute un élément SVG
            .attr("class", "chart-slot") // Ajoute une classe pour les styles et les événements
            .attr("data-id", i) // Attribue un ID unique pour chaque SVG
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .on("click", function () {
                d3.selectAll(".chart-slot").classed("selected", false);
                d3.select(this).classed("selected", true);

                // Met à jour le SVG sélectionné
                selectedSVG = d3.select(this);
                console.log("Selected SVG:", selectedSVG);
            });

        svg.append("text")
            .attr("x", svgWidth / 2)
            .attr("y", svgHeight / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16px")
            .attr("fill", "#aaa")
            .text(`Click to add a chart (${i + 1})`);
    }
}



function setupSVGListeners() {
    const svgElements = document.querySelectorAll(".chart-slot");
    svgElements.forEach(svg => {
        svg.addEventListener("click", () => {
            selectedSVG = svg; // Met à jour le SVG sélectionné
            svgElements.forEach(s => s.classList.remove("selected")); // Réinitialise les styles
            svg.classList.add("selected"); // Ajoute un style pour indiquer la sélection
        });
    });
}

function loadIndex() {
    return fetch("data/surveyData/index.json")
        .then(response => response.json());
}

function createCategoryMenu() {
    console.log("Loading category menu");
    loadIndex()
    .then(index => {
        console.log("index:", index); // Vérifiez si l'index est bien chargé
        
        const menu = document.getElementById("category");
         
        // Remplir le menu
        Object.keys(index).forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            menu.appendChild(option);
        });

        menu.addEventListener("change", function() {
            const selectedCategory = this.value;
            populateQuestions(index[selectedCategory]);
            console.log("Populate question called")
        });
    })
    .catch(error => {
        console.error("Failed to load index:", error);
    });
}

// //called onloading
function populateQuestions(questions) {
    console.log("Questions loaded")
    const questionMenu = document.getElementById("questionList"); 
    questionMenu.innerHTML = '';

    const defaultOption = document.createElement("option");
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a question';
    questionMenu.appendChild(defaultOption);

    console.log("Questions:", questions); // Vérifiez si questions est défini
    questions.forEach(([questionId, type]) => {
        const option = document.createElement('option');
        option.value = questionId;
        // const jsonfile = loadDataJsonFile(questionId);
        // option.textContent = jsonfile.title;
        option.textContent =  questionId;        
        questionMenu.appendChild(option);
    });
}

async function loadDataJson(questID,category) {
    console.log("called loadDataJson")
    const jsonFile = `data/surveyData/` + category+ `/${questID}.json`;
    console.log("jsonFile fetched: " + jsonFile)

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

async function addChart() {
    if (selectedSVG === null) {
        alert("Please select a chart slot before adding a chart.");
        return;
    }
    

    const chartType = document.getElementById("chartType").value; 
    const category = document.getElementById("category").value;
    const question = document.getElementById("questionList").value;

    if (!category || !question) {
        alert("Please select a valid category and question!");
        return;
    }

    // Charger les données pour le graphique
    loadDataJson(question, category).then((data) => {
        if (!data) {
            alert("Failed to load data for the selected question!");
            return;
        }

        // Dimensions pour le graphique
        const width = selectedSVG.attr("width");
        const height = selectedSVG.attr("height");

        // Supprime le contenu précédent du SVG
        selectedSVG.selectAll("*").remove();

        // Appelle la fonction correspondante pour générer le graphique
        if (chartType === "bar") {
            addBarPlot(
                selectedSVG,
                0, // Position x
                0, // Position y
                width,
                height,
                data.data, // Données extraites
                question // ID unique pour le graphique
            );
        } else {
            console.log("Other chart types not implemented yet.");
        }
    });
    ctx.CHART_NB++;

}
    


function addBarPlot(svg, x, y, width, height, data,chartId) {
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${x},${y})`)
        .attr("class", `chart ${chartId}`)    //to move the container
        .datum(data)

    const chartArea = g.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => (d.id).substring(0, 4)))
        .range([0, plotWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(Object.values(d.responses.percentage)))]) //take max value of percentage
        .nice()
        .range([plotHeight, 0]);
    
    // const barWidth = xScale.bandwidth() / Object.keys(data[0].responses.percentage).length;

    // Axes
    chartArea.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${plotHeight})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));

    chartArea.append("g")
        .attr("class", "axis y-axis") 
        .call(d3.axisLeft(yScale).ticks(5));

    const colorScale = d3.scaleSequential(d3.interpolateCool) 
    .domain([0, 1]);  

    const barWidth = (plotWidth) / data.length; 

    // Bars
    chartArea.selectAll(".bar")
        .data(data)
        .enter()
        .append("g")  // grouped by country (id)
        .attr("transform", (d, i) => `translate(${(i+1) * barWidth-15}, 0)`) 
        .attr("class", d => `bar ${d.id}`)
        .each(function(d) {
            // Sort percentages to see every rectangles
            const sortedEntries = Object.entries(d.responses.percentage)
                .filter(entry => !isNaN(entry[1]) && entry[1] !== null && entry[1] !== "-") 
                .sort((a, b) => b[1] - a[1]); 
    
            d3.select(this)
                .selectAll("rect")
                .data(sortedEntries)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("y", d => yScale(d[1]))
                .attr("width", barWidth * 0.6) 
                .attr("height", d => plotHeight - yScale(d[1]))
                .attr("fill", d => colorScale(d[1]))
                .style("opacity", 1); 
        });
    console.log("bar chart added")
}

function addLinePlot(data){}

function addScatterPlot(data){}



function goMap(){
    console.log("Going back to map");
    window.location.href = "main.html";
}



// function createChart(chartType, data) {
//     const svg = d3.select("svg");

//     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));
//     const numRows = Math.ceil(ctx.CHART_NB / numCols);

//     const width = ctx.SVG_W / numCols;
//     const height = ctx.SVG_H / numRows;

//     const x = ((ctx.CHART_NB - 1) % numCols) * width;
//     const y = Math.floor((ctx.CHART_NB - 1) / numCols) * height;

//     if (chartType === "bar") {
//         console.log("bar chart")
//         addBarPlot(svg, x, y, width, height, data, ctx.CHART_NB);
//     }
//     // if (chartType === "line") {
//     //     console.log("line chart")
//     //     addLinePlot(svg, x, y, width, height, data,ctx.CHART_NB);
//     // }
//     else{
//         console.log("other chart")
//         svg.append("rect")
//             .attr("class", `chart-${ctx.CHART_NB}`)  //keep an id
//             .attr("data-type", chartType)          
//             .attr("width", 0)                     
//             .attr("height", 0)
//             .attr("x", ctx.SVG_W / 2)  
//             .attr("y", ctx.SVG_H / 2)
//             .attr("fill", chartType === "bar" ? "steelblue" : chartType === "line" ? "orange" : "green")  // Couleurs différentes
//             .attr("rx", 10)      
//             .attr("ry", 10)
//             .style("opacity",0)
//     }

    
// }

// function rearrangeChart() {

//     const svg = d3.select("svg");

//     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));  
//     const numRows = Math.ceil(ctx.CHART_NB / numCols);  

//     const width = ctx.SVG_W / numCols;   // Largeur par graphique
//     const height = ctx.SVG_H / numRows;  // Hauteur par graphique

//     svg.selectAll(".chart")
//         .data(d3.range(ctx.CHART_NB))
//         .transition()  
//         .duration(500)
//         .attr("transform", (d, i) => {
//             const col = i % numCols;
//             const row = Math.floor(i / numCols);
//             return `translate(${col * width}, ${row * height})`; // Positionner chaque graphe dans la grille
//         })
//         .each(function(d) {
//             const g = d3.select(this);
//             const data = g.datum();  // Récupérer les données associées à ce graphique

//             console.log("Vérification des données associées au graphique : ", data);  // Ajoutez cette ligne pour déboguer
//             if (!Array.isArray(data)) {
//                 console.error("Les données ne sont pas un tableau !", data);
//                 return;
//             }

//             // Marges + dimensions recalculées
//             const margin = { top: 10, right: 10, bottom: 50, left: 10 };
//             const plotWidth = width - margin.left - margin.right;  // Largeur du graphique
//             const plotHeight = height - margin.top - margin.bottom; // Hauteur du graphique

//             // Recalcul des échelles x et y
//             const xScale = d3.scaleBand()
//                 .domain(data.map(d => d.id))  // Utiliser les IDs des pays pour l'échelle x
//                 .range([0, plotWidth])
//                 .padding(0.1);

//             const yScale = d3.scaleLinear()
//                 .domain([0, d3.max(data, d => d3.max(Object.values(d.responses.percentage)))])  // Max valeur des pourcentages
//                 .nice()
//                 .range([plotHeight, 0]);

//             // Réajuster les axes avec les nouvelles dimensions
//             g.select(".x-axis")
//                 .transition()
//                 .duration(500)
//                 .attr("transform", `translate(${margin.left},${margin.top + plotHeight})`) // Nouvelle position de l'axe X
//                 .call(d3.axisBottom(xScale).tickSizeOuter(0));

//             g.select(".y-axis")
//                 .transition()
//                 .duration(500)
//                 .attr("transform", `translate(${margin.left},${margin.top})`) // Nouvelle position de l'axe Y
//                 .call(d3.axisLeft(yScale).ticks(5));

//             // Calculer la largeur des barres en fonction du nombre de pays dans le dataset
//             const barWidth = (plotWidth) / data.length;  // Largeur de chaque barre, calculée en fonction du nombre de pays

//             // Réajuster la position et la taille des barres avec une transition fluide
//             g.selectAll(".bar")
//                 .transition()
//                 .duration(500)
//                 .attr("x", (d, i) => xScale(d.id) + margin.left)  // Position des barres en fonction de l'échelle x
//                 .attr("y", d => yScale(d[1]) + margin.top)  // Position des barres en fonction de la valeur
//                 .attr("width", barWidth)  // Largeur des barres, calculée
//                 .attr("height", d => plotHeight - yScale(d[1]))  // Hauteur des barres en fonction de la valeur
//                 .style("opacity", 1);  // Visibilité des barres
//         });
// }


