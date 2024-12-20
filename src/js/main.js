const ctx = {
    MAP_W: 1024,
    MAP_H: 1024,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    current_key: "none",
    current_measure: "median",
    current_type: "global",
    defaultDescription: `
        <h2>Discriminations au sein de l'UE</h2>
        <p>La carte ci-contre montre l'indice global de discrimination dans les différents pays de l'union européenne.
        Cet indice regroupe les discriminations liées à l'ethnie, à l'orientation sexuelle et à la religion.</p>
    `
};

function addWindow(countryCode) {
    let country = document.querySelector(`#${countryCode}`);
    let countryName = country ? country.querySelector("title").textContent : "Unknown Country";
    const modalTitle = document.getElementById("modalTitle");
    const modalText = document.getElementById("modalText");

    if (ctx.current_key == "none") {
        modalTitle.innerHTML = `<p>Select a question</p>`;
    } else {
        modalTitle.innerHTML = `<h2>${countryName}</h2>`;
        let dataFile = 'data/surveyData/' + ctx.current_key + '.json';

        let number_of_respondents;
        let transformedData;

        // find data corresponding to the country
        fetch(dataFile)
        .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
        })
        .then(data => {
            const countryData = data.data.find(item => item.id === countryCode);
            if (countryData) {

                number_of_respondents = countryData["number_of_respondents"];
                modalText.innerHTML = `<p>Number of respondents: ${number_of_respondents}</p>`;

                // refactor data
                transformedData = Object.entries(countryData["responses"]["cardinal"]).map((d, i) => ({
                    level: i + 1,   
                    cardinal: d[1]  
                }));

                transformedData = transformedData.filter((d) => d.level < 11);

                // add bar chart to modal
                vlSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

                    "data": {
                        "values": transformedData,
                    },
                    "mark": "bar",
                    "encoding": {
                        "y": {
                            "field": "level",
                            "type": "ordinal",  
                            "axis": {"title": "Level of comfort"} 
                        },
                        "x": {
                            "field": "cardinal",
                            "type": "quantitative", 
                            "axis": {"title": "Number of responses"}  
                        },
                    }
                
                };
                vlOpts = {width:300, height:300, actions:false};
                vegaEmbed("#modalViz", vlSpec, vlOpts);

            } else {
                console.log(`No data found for country code: ${countryCode}`);
            }
        })
        .catch(error => {
            console.error('Error loading JSON file:', error);
        });
    }

    document.getElementById("overlay").style.display = "block";
    document.getElementById("modal").style.display = "block";

    document.getElementById("closeModal").onclick = function () {
        closeModal();
    };

    document.getElementById("overlay").onclick = function () {
        closeModal();
    };
}

function closeModal() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("modal").style.display = "none";
}



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
         .append("title")
         .text(function(d) { 
            return d.properties.NAME_ENGL; 
        });


        svgEl.selectAll("path.countryArea")
        .on("click", function(event, d) { 
           const countryCode = d.properties.CNTR_ID; 
           console.log("Country code:", countryCode);
           addWindow(countryCode);
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
    let promises = [d3.json("data/mapData/gra.geojson"),
                    d3.json("data/mapData/cleaned_eu_countries.geojson"),
                    d3.json("data/mapData/CNTR_BN_20M_2024_3035.geojson")];
    Promise.all(promises).then(function(data){
        
        ctx.data = data;
        createTextData();
        //precomputeColorScale();
        makeMap();
        //createLegend();
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

    ctx.current_type = type;
    let data = ctx.textData[type];
    console.log(data);
    
    const descriptionContainer = document.getElementById("descriptionContainer");
    const dropdownContainer = document.getElementById("dropdownsContainer");
    

    if (type == 'global') {
        console.log("ici");
        descriptionContainer.innerHTML = ctx.defaultDescription;
        dropdownContainer.innerHTML = '';
        return
    } else {
        descriptionContainer.innerHTML = `<h2>${data.title}</h2>`
    } 

    let dropdownHTML = '';
    data.questions.forEach((q, i) => {
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

    //d3.scaleOrdinal([1, 2, 3, 4, 5, 6, 7, 8, 9], d3.schemePiYG[9])
    const legendSvg = Legend(ctx.color, {
        title: "Level of comfort",
        width: ctx.legendWidth,
        height: ctx.legendHeight, 
        marginTop: 18,
        marginBottom: 20,
        tickSize: 0
    });

    legendGroup.node().appendChild(legendSvg);
}


function updateMapData(dataKey) {

    ctx.current_key = dataKey;

    // load the right file
    console.log(dataKey);
    const data_filename = 'data/surveyData/' + ctx.current_type + '/' + dataKey + '.json';

    d3.json(data_filename)
        .then(function (data) {

            console.log("Loaded data:", data);
            let malaises = computeIndiceMalaise(data);
        
            d3.selectAll(".countryArea")
                .transition()
                .duration(500)
                .style("fill", d => {
                    const countryId = d.properties.CNTR_ID;
                    const val = parseFloat(malaises[countryId]);
                    console.log(val);
                    return val !== undefined ? ctx.color(val) : "#ddd"; 

                });

                //console.log("Country medians:", countryMedians);
        })
        .catch(function (error) {
            console.log("Error loading data:", error);
        });
}

function computeIndiceMalaise(data) {

    let pourcentagesMalaise = {};

    data.data.forEach(d => {
        pourcentagesMalaise[d.id] = parseFloat(d.responses.percentage["Total 'Uncomfortable'"]);
    });
    console.log(pourcentagesMalaise);

    let extent = d3.extent(Object.values(pourcentagesMalaise));
    let reference = parseFloat(pourcentagesMalaise["UE27\nEU27"]);
 

    console.log("ref: ",reference);

    ctx.color = d3.scaleDiverging()
        .domain([parseFloat(extent[0]), reference, parseFloat(extent[1])])
        .interpolator(t => d3.interpolatePiYG(1 - t))

    console.log(ctx.color(reference));
    console.log(pourcentagesMalaise);
 
    return pourcentagesMalaise;

}

function computeMedian(d) {
    
    const responses = d.responses.cardinal;

    // change ordinal keys into a number and keep categorical keys
    categorical_keys = ["Indifferent.e (SPONTANe)", "Cela depend (SPONTANe)", "Ne sait pas"];
    let refactored_responses = {};
    let counter = 1;
    let n_cat = 0;

    for (let key in responses) {
        if (categorical_keys.includes(key)) {
            refactored_responses[key] = responses[key];
            n_cat += 1;
        } else {
            refactored_responses[counter] = responses[key];
            counter++;
        }
    }

    // compute treshold for median : half number of respondents 
    no_level = responses["Indifferent.e (SPONTANe)"] + responses["Cela depend (SPONTANe)"] + responses["Ne sait pas"];
    const half_number_of_respondents = (d.number_of_respondents - no_level) / 2;

    // compute median


    let len = Object.keys(refactored_responses).length - n_cat;
    console.log(len);



    let count = 0;
    for (let i = 1; i <= len; i++) {
        const key = `${i}`;
        if (refactored_responses[key] !== undefined && refactored_responses[key] !== "-") {

            count = count + refactored_responses[key];
            if (count>half_number_of_respondents) {
                return key
            }
        }
    }
}  

function precomputeColorScale() {

    /*let surveyFiles = ["QB12_2", "QB12_3", "QB12_4", "QB12_5", "QB12_5", "QB12_6", "QB12_7", "QB12_8", "QB12_9", "QB12_10", "QB12_11", "QB13_2", "QB13_3", "QB13_4", "QB13_5", "QB13_6", "QB13_7", "QB13_8", "QB13_9", "QB13_10", "QB13_11"];*/
    
    d3.csv("src/data/surveyData/index_light.csv").then(data => {
        
        const ordinalFiles = data
            .filter(row => row.type === "ordinal") // Filter rows where type is "ordinal"
            .map(row => row.file);                // Map to the `file` field
    
        console.log(ordinalFiles);
    }).catch(error => {
        console.error("Error loading CSV file:", error);
    });
    
    
    /*let promises = surveyFiles.map(key => d3.json(`data/surveyData/${key}.json`));

    // we want a color scale that does not change accross different survey questions to compare levels of acceptation regarding different subjects
    // therefore the color scale is computed with answers to all the survey questions
    Promise.all(promises).then(function (datasets) {
        let measure; // median or average
        let questionCountryMeasure = {};  // measures of answers per question and per country stored here
        let allMeasures = []; // all measures without indicator of country or questions stored here

        datasets.forEach((data, index) => {
            let questionKey = surveyFiles[index];
            questionCountryMeasure[questionKey] = {};

            data.data.forEach(d => {
;
                if (ctx.current_measure == "median") {
                    measure = computeMedian(d);
                } else if (ctx.current_measure == "average") {
                    measure = computeAverage(d);
                }
                questionCountryMeasure[questionKey][d.id] = measure;
                if (measure !== undefined) {
                    allMeasures.push(measure);
                }
                
            });
        });

        const extent = d3.extent(allMeasures);
        console.log(extent);
        const start = parseInt(extent[0]);
        const end = parseInt(extent[1]);

        /*ctx.levels = [];
        for (let i = start; i <= end; i++) {
            ctx.levels.push(i);
        }*/
        //ctx.rescale = d3.scaleLinear(extent, [0,1]);
        //ctx.color = d3.scaleOrdinal(ctx.levels, d3.schemePiYG[ctx.levels.length]);
        //ctx.color = d3.scaleOrdinal([4, 5, 6, 7, 8, 9, 10], d3.schemePiYG[7]);

       

        /*createLegend();
        console.log(ctx.color(10))
        console.log(ctx.color(1))

        //ctx.questionCountryMeasure = questionCountryMeasure;
    });*/
    

}

function goChartPage(){
    console.log("Going to chart page");
    window.location.href = "second.html";
}

function createTextData() {
    const csvDir = 'data/surveyData/index_light.csv';

    d3.csv(csvDir).then(function(data) {

        //let refactored_data = []
        let refactored_data = {
            'ethnicity': {
                'title': "Ethnic discrimination",
                'questions': []
            },
            'sexual_orientation': {
                'title': "Discrimination based on sexual orientation or gender",
                'questions': []
            },
            'religion': {
                'title': "Religious discrimination",
                'questions': []
            }
        }
        let questions_encountered = []

        // for now only ordinal data
        data.forEach(function(d,i) {

            if (d['type'] == 'ordinal') {

                if (questions_encountered.includes(d['category']+d['question_eng'])) {
                    console.log("trouvé");
                    for (i in refactored_data[d['category']]['questions']) {

                        if (refactored_data[d['category']]['questions'][i]['question'] == d['question_eng']) {
                            
                            refactored_data[d['category']]['questions'][i]['options'].push(
                                {
                                    "label": d['answer'],
                                    "dataKey": d['file']
                                }
                                
                            );
                        }
                    }
                    
                } else {
                    questions_encountered.push(d['category']+d['question_eng']);
                    refactored_data[d['category']]['questions'].push(
                        {
                            "question": d['question_eng'],
                            "options": [
                                {
                                    "label": d['answer'],
                                    "dataKey": d['file']
                                }
                            ]
                        }
                    )
                }
            }
        })

        ctx.textData = refactored_data
        

    }).catch(function(error) {
        console.error(error);
    });
}
    // TODO: créer un fichier séparé pour répertorier questions, options et dataKeys
    const dropdownData = {
        ethnie: {
            title: "Discrimination ethnique",
            questions: [
                { question: "Vous sentiriez à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants ?",
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
                { question: "Vous sentiriez-vous à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants ?",
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
                { question: "Vous sentiriez-vous à l'aise ou non avec le fait qu'un collègue, avec lequel vous êtes quotidiennement en contact, appartienne à chacun des groupes suivants ?",
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
