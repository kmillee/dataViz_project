const ctx = {
    CHART_NB: 0,
    SVG_W: 1024,
    SVG_H: 900,
    svgWidth: 600,
    svgHeight: 400,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    current_key: "none",
    defaultDescription: `Click on Add to create a new chart!`,
    index: null, 
    questionDir: "src/data/surveyData/",
    socioDir:"src/data/surveyData/socio/"
};


let selectedSVG = null; // track where to draw the chart
let selectedCategory = null;

//called onloading
function createSVGGrid() {
    const container = d3.select("#svgGrid");

  

    for (let i = 0; i < 4; i++) {
        const svg = container
            .append("svg") // Ajoute un élément SVG
            .attr("class", "chart-slot") // Ajoute une classe pour les styles et les événements
            .attr("data-id", i) // Attribue un ID unique pour chaque SVG
            .attr("width", ctx.svgWidth)
            .attr("height", ctx.svgHeight)
            .on("click", function () {
                d3.selectAll(".chart-slot").classed("selected", false);
                d3.select(this).classed("selected", true);

                selectedSVG = d3.select(this);
                console.log("Selected SVG:", selectedSVG);
            });

        svg.append("text")
            .attr("x", ctx.svgWidth / 2)
            .attr("y", ctx.svgHeight / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16px")
            .attr("fill", "#aaa")
            .text(`Click to select this display zone`);
    }
}


//called onloading
async function createViz() {
    console.log("Using D3 v" + d3.version);
    createSVGGrid();  // Crée la grille SVG
    await loadIndex(); // Attend que les données de l'index soient chargées
    setupListeners();  // Configure les écouteurs de catégories après le chargement
    console.log("index ", ctx.indexByCategory)
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
        console.log(ctx.indexByCategory);
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
function setupListeners() {

    const categoryButtons = document.querySelectorAll(".categoryButton");

    categoryButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            ctx.selectedCategory = event.target.textContent.trim().toLowerCase().replace(/\s+/g, '_');
            console.log(`Category selected: ${ctx.selectedCategory}`);
            
            if (ctx.indexByCategory && ctx.selectedCategory in ctx.indexByCategory) {
                populateQuestions(ctx.indexByCategory[ctx.selectedCategory]);
            } else {
                console.warn("No questions found for category:", ctx.selectedCategory);
            }
        });
    });

    document.getElementById("questionList").addEventListener("change", (event) => {
        const selectedQuestion = event.target.value; 
        console.log("Selected question:", selectedQuestion);
    
        if (selectedQuestion) 
            ctx.questionFile = selectedQuestion;
       
    });

    document.getElementById("socio").addEventListener("change", (event) => {
        const selectedSocio = event.target.value; 
        console.log("Selected socio itel:", selectedSocio);
    
        if (selectedSocio)
            ctx.socioFile = selectedSocio;
    
    });
}

function populateSocioMenu() {
    const socioMenu = document.getElementById("socio");

    const defaultOption = document.createElement("option");
    defaultOption.value = '';
    defaultOption.textContent = 'Please select a question';
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
        option.textContent = item.item_text;
        questionMenu.appendChild(option);
    });
    console.log("Questions populated for category:", questions);
}


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

    console.log("Category: " + ctx.selectedCategory)
    console.log("Socio: " + ctx.socioFile)
    console.log("Question: " + ctx.questionFile)

    if (!ctx.selectedCategory || !ctx.socioFile || !ctx.questionFile) {
        alert("Please select valid values for category, socio, and question!");
        return;
    }

    loadDataJson(ctx.questionFile, ctx.selectedCategory, ctx.socioFile).then((data) => {
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

        console.log(selectedSVG);

        createScatterPlot(selectedSVG, scatterData);

    });
    ctx.CHART_NB++;

}


function prepareScatterData(questionData, socioData) {

    console.log("questionData: ", questionData);
    console.log("socioData: ", socioData)

    if (ctx.socioFile == "D70")
        ctx.socioCriteria = "Total 'Not satisfied'";
    else if (ctx.socioFile == "D1")
        ctx.socioCriteria = "10 Right";
    else
        ctx.socioCriteria = "Never";

    let agreeFiles = ['QB17_6', 'QB17_7', 'QB15_1', 'QB15_2', 'QB15_3', 'QB15_4', 'QB17_1', 'QB17_2', 'QB17_3']
    if (agreeFiles.includes(ctx.questionFile)) {
        ctx.questionCriteria = "Total 'Disagree'";
    } else {
        ctx.questionCriteria = "Total 'Uncomfortable'";
    }

    const scatterData = [];
    for (let i=0; i<questionData.data.length; i++) {
        let scatterPoint = {
            id: questionData.data[i].id,
            comfortValue: questionData.data[i].responses.percentage[ctx.questionCriteria], 
            socioValue: socioData.data[i].responses.percentage[ctx.socioCriteria] 
        };
        scatterData.push(scatterPoint);

    }
    return scatterData;
}


function createScatterPlot(svg, data) {

    let socioIndex = ctx.indexByCategory['socio'];
    let socioText = "";

    for (i in socioIndex) {
        if (socioIndex[i].file == ctx.socioFile) {
            socioText = socioIndex[i].question_eng;
            break
        }  
    }

    let questionIndex = ctx.indexByCategory[ctx.selectedCategory]
    let questionText = "";

    for (i in questionIndex) {
        if (questionIndex[i].file == ctx.questionFile) {
            questionText = questionIndex[i].item_text;
            break
        }  
    }

    const margin = { top: 30, right: 30, bottom: 60, left: 70 };  
    const width = ctx.svgWidth - margin.left - margin.right;  
    const height = ctx.svgHeight - margin.top - margin.bottom; 

    const graphGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 0.6]) 
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 0.6]) 
        .range([height, 0]);

    graphGroup.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.socioValue))  
        .attr("cy", d => yScale(d.comfortValue)) 
        .attr("r", 4)
        .style("fill", "steelblue")
        .append("title")
        .text(function(d) { 
            return d.id; 
        });

    graphGroup.append("g")
        .attr("transform", `translate(0,${height})`)  
        .call(d3.axisBottom(xScale))  
        .attr("font-size", "10px");  

    graphGroup.append("g")
        .call(d3.axisLeft(yScale))  
        .attr("font-size", "10px"); 

    graphGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)  
        .style("text-anchor", "middle")
        .attr("font-size", "10px") 
        .text(socioText);

    graphGroup.append("text")
        .attr("transform", "rotate(-90)")  
        .attr("x", -height / 2)
        .attr("y", -35)  
        .style("text-anchor", "middle")
        .attr("font-size", "10px") 
        .text("Percentage of people answering '" + ctx.questionCriteria + "'");

    graphGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)  
        .style("text-anchor", "middle")
        .attr("font-size", "10px")  
        .text("Percentage of people answering '" + ctx.socioCriteria + "'");

    graphGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)  
        .style("text-anchor", "middle")
        .attr("font-size", "10px")  
        .text(questionText);
}



function goMap(){
    console.log("Going back to map");
    window.location.href = "main.html";
}





