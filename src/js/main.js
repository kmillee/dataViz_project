const ctx = {
    MAP_W: 1024,
    MAP_H: 1024,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    defaultDescription: `
        <h2>Discriminations au sein de l'UE</h2>
        <p>La carte ci-contre montre l'indice global de discrimination dans les différents pays de l'union européenne.
        Cet indice regroupe les discriminations liées à l'ethnie, à l'orientation sexuelle et à la religion.</p>
    `
};


function makeMap(){
    let graticule = ctx.data[0];
    let countries = ctx.data[1];
    let countryBorders = ctx.data[2];

    // define projection and path projection method
    ctx.proj = d3.geoIdentity()
                 .reflectY(true)
                 .fitSize([ctx.MAP_W, ctx.MAP_H], graticule);
    let path4proj = d3.geoPath()
                      .projection(ctx.proj);


    let svgEl = d3.select("svg");

    // country areas
    svgEl.append("g")
         .attr("id", "countryAreas")
         .selectAll("path")
         .data(countries.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "countryArea")
         .attr("id", d => `${d.properties.CNTR_ID}`)
         .on("click", function(event, d) { 
            const countryCode = d.properties.CNTR_ID; 
            console.log("Country code:", countryCode);
            //updateMapData(countryCode); 
        });
        
    // country borders
    svgEl.append("g")
         .attr("id", "countryBorders") 
         .selectAll("path")
         .data(countryBorders.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "countryBorder");

};

function loadData(){
    let promises = [d3.json("data/gra.geojson"),
                    d3.json("data/cleaned_eu_countries.geojson"),
                    d3.json("data/CNTR_BN_20M_2024_3035.geojson")];
    Promise.all(promises).then(function(data){
        
        ctx.data = data;
        precomputeColorScale();
        makeMap();
        createLegend();
    }).catch(function(error){console.log(error)});
};

function createViz() {
    console.log("Using D3 v" + d3.version);

    const mapContainer = document.getElementById("mapContainer");
    ctx.MAP_W = mapContainer.clientWidth;
    ctx.MAP_H = mapContainer.clientHeight;

    d3.select("#mapContainer").append("svg")
                              .attr("width", ctx.MAP_W)
                              .attr("height", ctx.MAP_H);
    loadData();
};

function goHome() {
    console.log("Home button clicked!");
}

function changeText(type) {
    const descriptionContainer = document.getElementById("descriptionContainer");
    const dropdownContainer = document.getElementById("dropdownsContainer");

    if (type == 'global') {
        console.log("ici");
        descriptionContainer.innerHTML = ctx.defaultDescription;
        dropdownContainer.innerHTML = '';
        return
    }

    descriptionContainer.innerHTML = `<h2>${dropdownData[type].title}</h2>`;

    let dropdownHTML = '';
    dropdownData[type].questions.forEach((q, i) => {
        dropdownHTML += `
            <p>${q["question"]}</p>
        `;
        q["options"].forEach((option, j) => {
            dropdownHTML += `
            <div>
                <input type="radio" id="radio_${j}" name="question" value='${option.label}' onclick="updateMapData('${option.dataKey}')">
                <label for="radio_${j}">${option.label}</label>
                <br>
            </div>
        `;
        })
    });

    dropdownContainer.innerHTML = dropdownHTML;
}

function createLegend() {

    const svg = d3.select("svg");
    const legendGroup = svg.append("g")
        .attr("id", "legendGroup")
        .attr("transform", `translate(${ctx.legendMargin.left}, ${ctx.MAP_H - ctx.legendMargin.bottom - ctx.legendHeight})`);

    const legendSvg = Legend(ctx.color, {
        title: "Niveau de confort",
        tickSize: 6,
        width: ctx.legendWidth,
        height: ctx.legendHeight, 
        marginTop: 18,
        marginBottom: 20,
        ticks:6, 
        tickFormat: d3.format(".1f") 
    });

    legendGroup.node().appendChild(legendSvg);
}


function updateMapData(dataKey) {
    const data_filename = 'data/' + dataKey + '.json';

    d3.json(data_filename)
        .then(function (data) {
            console.log("Loaded data:", data);

            // Map to store calculated average percentage for each country
            const countryMedians = {};

            data.data.forEach(d => {
                let median = computeMedian(d);
                countryMedians[d.id] = median;
            });

            console.log("Country averages:", countryMedians);

        
            d3.selectAll(".countryArea")
                .transition()
                .duration(500)
                .style("fill", d => {
                    const countryId = d.properties.CNTR_ID;
                    const value = countryMedians[countryId];
                    return value !== undefined ? ctx.color(ctx.rescale(value)) : "#ddd"; 
                });
        })
        .catch(function (error) {
            console.log("Error loading data:", error);
        });
}

function computeMedian(d) {
    const responses = d.responses.percentage;
    let weightedResponses = [];
    // Generate a weighted array of response levels
    for (let i = 1; i <= 10; i++) {
        const key = `${i}`; // Response level as string
        if (responses[key] !== undefined && responses[key] !== "-") {
            const percentage = parseFloat(responses[key]); // Percentage as a fraction
            for (let j = 0; j < percentage * 1000; j++) {
                weightedResponses.push(i);
            }
        }

        // Sort the array to calculate the median
        weightedResponses.sort((a, b) => a - b);
    }

    // Calculate the median for this country
    let median;
    const n = weightedResponses.length;
    if (n % 2 === 0) {
        median = (weightedResponses[n / 2 - 1] + weightedResponses[n / 2]) / 2;
    } else {
        median = weightedResponses[Math.floor(n / 2)];
    }

    return median;
}  

function precomputeColorScale() {

    let surveyFiles = ["QB12_2", "QB12_3", "QB12_10", "QB12_11", "QB12_5", "QB12_6", "QB12_7", "QB12_8", "QB12_9", "QB12_10", "QB12_11", "QB13_2", "QB13_3", "QB13_10", "QB13_11", "QB13_5", "QB13_6", "QB13_7", "QB13_8", "QB13_9", "QB13_10", "QB13_11"];
    let promises = surveyFiles.map(key => d3.json(`data/${key}.json`));

    Promise.all(promises).then(function (datasets) {
        let questionCountryMedians = {}; 
        let allMedians = []; 

        datasets.forEach((data, index) => {
            let questionKey = surveyFiles[index];
            questionCountryMedians[questionKey] = {};

            data.data.forEach(d => {
                
                let median = computeMedian(d);
                questionCountryMedians[questionKey][d.id] = median;
                allMedians.push(median); 
            });
        });

        console.log("Medians per question and country:", questionCountryMedians);

        const extent = d3.extent(allMedians);
        console.log("Global extent of medians:", extent);
        ctx.rescale = d3.scaleLinear(extent, [0,1]);

        ctx.questionCountryMedians = questionCountryMedians;
    });
    ctx.color = d3.scaleSequential(d3.interpolatePiYG);
}


    // TODO: créer un fichier séparé pour répertorier questions, options et dataKeys
    const dropdownData = {
        ethnie: {
            title: "Discrimination ethnique",
            questions: [
                { question: "Que vous travailliez ou non, pouvez-vous me dire si vous vous sentiriez à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants en utilisant une échelle allant de 1 à 10 ?",
                  options: [
                    { 
                        label: "Une personne noire",
                        dataKey: "QB12_2" 
                    },
                    { 
                        label: "Une personne asiatique", 
                        dataKey: "QB12_3" 
                    }]},
                { question: "Question 2",
                options: [
                    { 
                        label: "Option 1",
                        dataKey: "0" 
                    },
                    { 
                          label: "Option 2", 
                          dataKey: "0" 
                    }]},
            ],
        },
        orientation: {
            title: "Discrimination liée à l'orientation sexuelle",
            questions: [
                { question: "Que vous travailliez ou non, pouvez-vous me dire si vous vous sentiriez à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants en utilisant une échelle allant de 1 à 10 ?",
                  options: [
                    { 
                        label: "Une personne lesbienne, gay ou bisexuelle",
                        dataKey: "QB12_10" 
                    },
                    { 
                        label: "Une personne transgenre ou intersexe", 
                        dataKey: "QB12_11" 
                    }]},
            ],
        },
        religion: {
            title: "Discrimination religieuse",
            questions: [
                { question: "Que vous travailliez ou non, pouvez-vous me dire si vous vous sentiriez à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants en utilisant une échelle allant de 1 à 10 ?",
                  options: [
                    {
                        label:  "Une personne juive",
                        dataKey: "QB12_5" 

                    },
                    {
                        label:  "Une personne musulmane",
                        dataKey: "QB12_6" 

                    }]},
            ],
        },
    };


// NUTS data as JSON from https://github.com/eurostat/Nuts2json (translated from topojson to geojson)
// density data from https://data.europa.eu/data/datasets/gngfvpqmfu5n6akvxqkpw?locale=en
