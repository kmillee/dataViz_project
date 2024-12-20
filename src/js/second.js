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
    index: null, 
};


let selectedSVG = null; // track where to draw the chart
let selectedCategory = null;

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


//called onloading
async function createViz() {
    console.log("Using D3 v" + d3.version);
    createSVGGrid();  // Crée la grille SVG
    await loadIndex(); // Attend que les données de l'index soient chargées
    setupCategoryListeners();  // Configure les écouteurs de catégories après le chargement
    ctx.index = ctx.indexByCategory
    console.log("index ", ctx.index)
    populateSocioMenu()
}


// Load index_light.csv file (+ byCategory version)
async function loadIndex() {
    try {
        const response = await fetch("data/surveyData/index_light.csv");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const csvData = await response.text();
        const parsedData = parseCSV(csvData);
        ctx.index = parsedData; 

        // Tversion where every category is a key
        ctx.indexByCategory = parsedData.reduce((acc, item) => {
            const category = item.category.toLowerCase();
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});

        console.log("Index loaded and transformed by category:", ctx.indexByCategory);
        ctx.Index = ctx.indexByCategory;
    } catch (error) {
        console.error("Failed to load index:", error);
    }
}


 // Convert CSV to objetc array
function parseCSV(csvText) {
    const lines = csvText.split("\n"); 
    const headers = lines[0].split(",");

    const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim();
        });
        return obj;
    });

    return rows.filter(row => Object.keys(row).length === headers.length);
}


function setupSVGListeners() {
    const svgElements = document.querySelectorAll(".chart-slot");
    svgElements.forEach(svg => {
        svg.addEventListener("click", () => {
            selectedSVG = svg;  // update selected SVG element
            svgElements.forEach(s => s.classList.remove("selected")); // Reset style
            svg.classList.add("selected"); // Add selected style
        });
    });
}

// Called on loading
function setupCategoryListeners() {
    const categoryButtons = document.querySelectorAll(".categoryButton");

    categoryButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            selectedCategory = event.target.textContent.trim().toLowerCase().replace(/\s+/g, '_');

            console.log(`Category selected: ${selectedCategory}`);


            if (ctx.indexByCategory && selectedCategory in ctx.indexByCategory) {
                populateQuestions(ctx.indexByCategory[selectedCategory]);
            } else {
                console.warn("No questions found for category:", selectedCategory);
            }
        });
    });
}

function populateSocioMenu() {
    const socioMenu = document.getElementById("socio");

    const defaultOption = document.createElement("option");
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a socio item';
    socioMenu.appendChild(defaultOption);

    const socioItems = ctx.indexByCategory["socio"];

    socioItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.file;   // id (country 2 digit code)
        option.textContent = item.question_eng;
        socioMenu.appendChild(option);
    });

    console.log("Socio items populated.");
}


function populateQuestions(questions) {
    const questionMenu = document.getElementById("questionList");
    questionMenu.innerHTML = ''; // Remove precedent options

    const defaultOption = document.createElement("option");
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a question';
    questionMenu.appendChild(defaultOption);

    console.log(questions)

    questions.forEach(item => {
        const option = document.createElement('option');
        option.value = item.file;
        option.textContent = item.question_eng;
        questionMenu.appendChild(option);
    });
    console.log("Questions populated for category:", questions);
}

// async function loadDataJson(questID,category,socio) {

//     console.log("called loadDataJson")
//     const jsonFile = `data/surveyData/` + category+ `/${questID}.json`;
//     console.log("jsonFile fetched: " + jsonFile)

//     if (!jsonFile) return null;

//     try {
//         const response = await fetch(jsonFile);
//         const jsonData = await response.json();
//         return jsonData;
//     } catch (error) {
//         console.error("Error loading JSON data:", error);
//         return null;
//     }
// }

async function loadDataJson(questID, category, socio) {
    console.log("called loadDataJson");

    // Chemin pour le fichier des questions
    const questionFile = `data/surveyData/${category}/${questID}.json`;
    console.log("Question file fetched: " + questionFile);

    // Chemin pour le fichier socio-économique
    const socioFile = `data/surveyData/socio/${socio}.json`;
    console.log("Socio file fetched: " + socioFile);

    if (!questionFile || !socioFile) return null;

    try {
        // Charger les deux fichiers en parallèle
        const [questionResponse, socioResponse] = await Promise.all([
            fetch(questionFile),
            fetch(socioFile)
        ]);

        // Vérifier si les deux réponses sont valides
        if (!questionResponse.ok || !socioResponse.ok) {
            throw new Error("Failed to load one or more files.");
        }

        // Convertir les réponses en JSON
        const questionData = await questionResponse.json();
        const socioData = await socioResponse.json();

        // Retourner les deux ensembles de données
        return {
            questionData,
            socioData
        };
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
    
    const socio = document.getElementById("socio").value; 
    const question = document.getElementById("questionList").value;
    const category = selectedCategory;

    console.log("Category: " + category)
    console.log("Socio: " + socio)
    console.log("Question: " + question)

    if (!category || !socio || !question) {
        alert("Please select valid values for category, socio, and question!");
        return;
    }

    loadDataJson(question, category, socio).then((data) => {
        if (!data) {
            alert("Failed to load data for the selected question!");
            return;
        }

        console.log("Question data:", data.questionData);
        console.log("Socio data:", data.socioData);
        // Préparer les données pour le scatter plot
        const scatterData = prepareScatterData(data.questionData, data.socioData);


        // Remove previous SVG content
        selectedSVG.selectAll("*").remove();

        createChart(selectedSVG,scatterData)

    });
    ctx.CHART_NB++;

}
    
function prepareScatterData(questionData, socioData) {

    const scatterData = [];
    console.log(questionData);
    questionData.forEach((question) => {
        const socioPercent = socioData.responses.percentage;
        const comfortPercent = question.responses.percentage;

        const socioValue = (socioPercent["jamais"] || 0) + (socioPercent["très rarement"] || 0); 
        const comfortValue = (comfortPercent["pas du tout"] || 0) + (comfortPercent["peu à l'aise"] || 0);

        // add point to the plot
        scatterData.push({
            socioValue: socioValue,
            comfortValue: comfortValue, 
            id: question.id  
        });
    });

    return scatterData;
}

function createScatterPlot(svg,data) {
    const width = 800, height = 600;

    const xScale = d3.scaleLinear()
        .domain([0, 1]) // De 0 à 1 pour l'axe des abscisses (socio)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 1]) // De 0 à 1 pour l'axe des ordonnées (confort)
        .range([height, 0]);

    // const svg = d3.select("#chartContainer").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);

    // Ajouter les points (circles)
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.socioValue))   // X : socio
        .attr("cy", d => yScale(d.comfortValue)) // Y : confort
        .attr("r", 5)
        .style("fill", "steelblue");

    // Ajouter des axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));
}













// function createChart(selectedSVG, questionData, socioData) {
// //     const margin = { top: 20, right: 20, bottom: 50, left: 40 };
// //     const width = ctx.SVG_W - margin.left - margin.right;
// //     const height = ctx.SVG_H - margin.top - margin.bottom;

// //     const svg = selectedSVG.append("g")
// //         .attr("transform", `translate(${margin.left}, ${margin.top})`);

// //     // Get keys
// //     const countries = Object.keys(socioData.data);
    
// //     // Scale
// //     const xScale = d3.scaleBand()
// //         .domain(countries)
// //         .range([0, width])
// //         .padding(0.1);

// //     const yScale = d3.scaleLinear()
// //         .domain([0, d3.max(countries, country => socioData.data[country] + questionData[country])])
// //         .nice()
// //         .range([height, 0]);

// //     // Axis
// //     svg.append("g")
// //         .attr("class", "x-axis")
// //         .attr("transform", `translate(0,${height})`)
// //         .call(d3.axisBottom(xScale));

// //     svg.append("g")
// //         .attr("class", "y-axis")
// //         .call(d3.axisLeft(yScale));

// //     // Stacked Bars
// //     const stackData = countries.map(country => {
// //         return {
// //             country,
// //             socioValue: socioData.data[country],
// //             questionValue: questionData[country]
// //         };
// //     });

// //     const stack = d3.stack()
// //         .keys(["socioValue", "questionValue"])
// //         .order(d3.stackOrderNone)
// //         .offset(d3.stackOffsetNone);

// //     const series = stack(stackData);

// //     svg.selectAll(".stack")
// //         .data(series)
// //         .enter()
// //         .append("g")
// //         .attr("class", "stack")
// //         .attr("fill", (d, i) => i === 0 ? "steelblue" : "orange")  
// //         .selectAll("rect")
// //         .data(d => d)
// //         .enter()
// //         .append("rect")
// //         .attr("x", d => xScale(d.data.country))
// //         .attr("y", d => yScale(d[1]))
// //         .attr("width", xScale.bandwidth())
// //         .attr("height", d => yScale(d[0]) - yScale(d[1]))
// //         .style("opacity", 0.8);

// //     svg.selectAll(".text")
// //         .data(stackData)
// //         .enter()
// //         .append("text")
// //         .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
// //         .attr("y", d => yScale(d.socioValue + d.questionValue) - 10)
// //         .attr("text-anchor", "middle")
// //         .attr("fill", "#000")
// //         .text(d => d.country);
//  }



function goMap(){
    console.log("Going back to map");
    window.location.href = "main.html";
}


// const socioData = [{"name": "Internet use per country",
//     data : {"1": 0.35,
//         "2": 0.67,
//         "3": 0.12,
//         "4": 0.89,
//         "5": 0.42,
//         "6": 0.58,
//         "7": 0.76,
//         "8": 0.11,
//         "9": 0.23,
//         "10": 0.99,
//         "11": 0.08,
//         "12": 0.64,
//         "13": 0.51,
//         "14": 0.73,
//         "15": 0.29,
//         "16": 0.44,
//         "17": 0.91,
//         "18": 0.05,
//         "19": 0.68,
//         "20": 0.87,
//         "21": 0.14,
//         "22": 0.39,
//         "23": 0.93,
//         "24": 0.26,
//         "25": 0.82,
//         "26": 0.49,
//         "27": 0.04
//     }
// }];





// // function createChart(chartType, data) {
// //     const svg = d3.select("svg");

// //     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));
// //     const numRows = Math.ceil(ctx.CHART_NB / numCols);

// //     const width = ctx.SVG_W / numCols;
// //     const height = ctx.SVG_H / numRows;

// //     const x = ((ctx.CHART_NB - 1) % numCols) * width;
// //     const y = Math.floor((ctx.CHART_NB - 1) / numCols) * height;

// //     if (chartType === "bar") {
// //         console.log("bar chart")
// //         addBarPlot(svg, x, y, width, height, data, ctx.CHART_NB);
// //     }
// //     // if (chartType === "line") {
// //     //     console.log("line chart")
// //     //     addLinePlot(svg, x, y, width, height, data,ctx.CHART_NB);
// //     // }
// //     else{
// //         console.log("other chart")
// //         svg.append("rect")
// //             .attr("class", `chart-${ctx.CHART_NB}`)  //keep an id
// //             .attr("data-type", chartType)          
// //             .attr("width", 0)                     
// //             .attr("height", 0)
// //             .attr("x", ctx.SVG_W / 2)  
// //             .attr("y", ctx.SVG_H / 2)
// //             .attr("fill", chartType === "bar" ? "steelblue" : chartType === "line" ? "orange" : "green")  // Couleurs différentes
// //             .attr("rx", 10)      
// //             .attr("ry", 10)
// //             .style("opacity",0)
// //     }

    
// // }

// // function rearrangeChart() {

// //     const svg = d3.select("svg");

// //     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));  
// //     const numRows = Math.ceil(ctx.CHART_NB / numCols);  

// //     const width = ctx.SVG_W / numCols;   // Largeur par graphique
// //     const height = ctx.SVG_H / numRows;  // Hauteur par graphique

// //     svg.selectAll(".chart")
// //         .data(d3.range(ctx.CHART_NB))
// //         .transition()  
// //         .duration(500)
// //         .attr("transform", (d, i) => {
// //             const col = i % numCols;
// //             const row = Math.floor(i / numCols);
// //             return `translate(${col * width}, ${row * height})`; // Positionner chaque graphe dans la grille
// //         })
// //         .each(function(d) {
// //             const g = d3.select(this);
// //             const data = g.datum();  // Récupérer les données associées à ce graphique

// //             console.log("Vérification des données associées au graphique : ", data);  // Ajoutez cette ligne pour déboguer
// //             if (!Array.isArray(data)) {
// //                 console.error("Les données ne sont pas un tableau !", data);
// //                 return;
// //             }

// //             // Marges + dimensions recalculées
// //             const margin = { top: 10, right: 10, bottom: 50, left: 10 };
// //             const plotWidth = width - margin.left - margin.right;  // Largeur du graphique
// //             const plotHeight = height - margin.top - margin.bottom; // Hauteur du graphique

// //             // Recalcul des échelles x et y
// //             const xScale = d3.scaleBand()
// //                 .domain(data.map(d => d.id))  // Utiliser les IDs des pays pour l'échelle x
// //                 .range([0, plotWidth])
// //                 .padding(0.1);

// //             const yScale = d3.scaleLinear()
// //                 .domain([0, d3.max(data, d => d3.max(Object.values(d.responses.percentage)))])  // Max valeur des pourcentages
// //                 .nice()
// //                 .range([plotHeight, 0]);

// //             // Réajuster les axes avec les nouvelles dimensions
// //             g.select(".x-axis")
// //                 .transition()
// //                 .duration(500)
// //                 .attr("transform", `translate(${margin.left},${margin.top + plotHeight})`) // Nouvelle position de l'axe X
// //                 .call(d3.axisBottom(xScale).tickSizeOuter(0));

// //             g.select(".y-axis")
// //                 .transition()
// //                 .duration(500)
// //                 .attr("transform", `translate(${margin.left},${margin.top})`) // Nouvelle position de l'axe Y
// //                 .call(d3.axisLeft(yScale).ticks(5));

// //             // Calculer la largeur des barres en fonction du nombre de pays dans le dataset
// //             const barWidth = (plotWidth) / data.length;  // Largeur de chaque barre, calculée en fonction du nombre de pays

// //             // Réajuster la position et la taille des barres avec une transition fluide
// //             g.selectAll(".bar")
// //                 .transition()
// //                 .duration(500)
// //                 .attr("x", (d, i) => xScale(d.id) + margin.left)  // Position des barres en fonction de l'échelle x
// //                 .attr("y", d => yScale(d[1]) + margin.top)  // Position des barres en fonction de la valeur
// //                 .attr("width", barWidth)  // Largeur des barres, calculée
// //                 .attr("height", d => plotHeight - yScale(d[1]))  // Hauteur des barres en fonction de la valeur
// //                 .style("opacity", 1);  // Visibilité des barres
// //         });
// // }


// // function addBarPlot(svg, x, y, width, height, data,chartId) {
// //     const margin = { top: 10, right: 10, bottom: 30, left: 40 };
// //     const plotWidth = width - margin.left - margin.right;
// //     const plotHeight = height - margin.top - margin.bottom;
// //     console.log(plotHeight);

// //     const g = svg.append("g")
// //         .attr("transform", `translate(${x},${y})`)
// //         .attr("class", `chart ${chartId}`)    //to move the container
// //         .datum(data)

// //     const chartArea = g.append("g")
// //         .attr("transform", `translate(${margin.left},${margin.top})`);

// //     // Scales
// //     const xScale = d3.scaleBand()
// //         .domain(data.map(d => (d.id).substring(0, 4)))
// //         .range([0, plotWidth])
// //         .padding(0.1);

// //     const yScale = d3.scaleLinear()
// //         .domain([0, d3.max(data, d => d3.max(Object.values(d.responses.percentage)))]) //take max value of percentage
// //         .nice()
// //         .range([plotHeight, 0]);
    
// //     // const barWidth = xScale.bandwidth() / Object.keys(data[0].responses.percentage).length;

// //     // Axes
// //     chartArea.append("g")
// //         .attr("class", "axis x-axis")
// //         .attr("transform", `translate(0,${plotHeight})`)
// //         .call(d3.axisBottom(xScale).tickSizeOuter(0));

// //     chartArea.append("g")
// //         .attr("class", "axis y-axis") 
// //         .call(d3.axisLeft(yScale).ticks(5));

// //     const colorScale = d3.scaleSequential(d3.interpolateCool) 
// //     .domain([0, 1]);  

// //     const barWidth = (plotWidth) / data.length; 

// //     // Bars
// //     chartArea.selectAll(".bar")
// //     .data(data)
// //     .enter()
// //     .append("g")  // Grouped by country (id)
// //     .attr("transform", (d, i) => `translate(${(i+1) * barWidth - 25}, 0)`) 
// //     .attr("class", d => `bar ${d.id}`)
// //     .each(function(d) {
// //         // Sort percentages to see every rectangle
// //         const sortedEntries = Object.entries(d.responses.percentage)
// //             .filter(entry => !isNaN(entry[1]) && entry[1] !== null && entry[1] !== "-") 
// //             .sort((a, b) => b[1] - a[1]);  // Sort in descending order

// //         let cumulativeHeight = 0; // To accumulate the height of each rect

// //         d3.select(this)
// //             .selectAll("rect")
// //             .data(sortedEntries)
// //             .enter()
// //             .append("rect")
// //             .attr("class", "bar")
// //             // Position each rect based on the cumulative height
// //             .attr("y", function(d, i) {
// //                 console.log("rect "+i+":"+sortedEntries[i]+" ///// "+sortedEntries[i][1]);
// //                 const yPosition = i === 0 ? yScale(d[1]) : yScale(sortedEntries[i - 1][1]) - plotHeight+ yScale(d[1]);
// //                 return yPosition;
// //             })
// //             .attr("width", barWidth * 0.6)  // Set the width of the bars
// //             .attr("height", d => plotHeight - yScale(d[1]))  // Height of each rect based on the scale
// //             .attr("fill", d => colorScale(d[1]))  // Color of the bar based on the value
// //             .style("opacity", 1);
// //     });

// // console.log("Bar chart added");
// // //pb : yScale(sortedEntries[i - 1][1]), au lieu de prendre yScale(sortedEntries[i - 1][1]), on devrait prendre la somme pour tous les i précédents


// // }

// // function addLinePlot(data){}

// // function addScatterPlot(data){}

