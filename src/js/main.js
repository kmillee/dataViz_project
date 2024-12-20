const ctx = {
    MAP_W: 1024,
    MAP_H: 1024,
    YEAR: "2020",
    legendWidth: 300,
    legendHeight: 60,
    legendMargin: { top: 10, right: 10, bottom: 20, left: 30 },
    current_key: "none",
    current_measure: "median",
    current_category: "global",
    mode: "1",
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
        let dataFile = 'data/surveyData/' + ctx.current_category + '/' + ctx.current_key + '.json';

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
        makeMap();
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

function changeText(category) {

    ctx.current_category = category;
    precomputeColorScale("1");

    let data = ctx.textData[category];
    console.log(data);
    
    const descriptionContainer = document.getElementById("descriptionContainer");
    const dropdownContainer = document.getElementById("dropdownsContainer");
    

    if (category == 'global') {
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
        let mode;
        if (q["question"].startsWith("To what extent")) {
            mode = "2";
        } else {
            mode = "1";
        }

        q["options"].forEach((option, j) => {
            dropdownHTML += `
            <div>
                <input type="radio" id="radio_${j}" name="question" value='${option.label}' onclick="updateMapData('${option.dataKey}', ${mode})">
                <label for="radio_${j}">${option.label}</label>
                <br>
            </div>
        `;
        })
    });

    dropdownContainer.innerHTML = dropdownHTML;

    
}

function createLegend(title) {

    const svg = d3.select("svg");
    svg.select("#legendGroup").remove();

    const legendGroup = svg.append("g")
        .attr("id", "legendGroup")
        .attr("transform", `translate(${ctx.legendMargin.left}, ${ctx.MAP_H - ctx.legendMargin.bottom - ctx.legendHeight})`);

    //d3.scaleOrdinal([1, 2, 3, 4, 5, 6, 7, 8, 9], d3.schemePiYG[9])
    const legendSvg = Legend(ctx.color, {
        title: title,
        width: ctx.legendWidth,
        height: ctx.legendHeight, 
        marginTop: 18,
        marginBottom: 20,
        tickSize: 0
    });

    legendGroup.node().appendChild(legendSvg);
}


function updateMapData(dataKey, mode) {

    ctx.current_key = dataKey;
    if (mode != ctx.mode) {
        precomputeColorScale(mode);
        ctx.mode = mode;
    }

    // load the right file
    console.log(dataKey);
    console.log(mode);
    const data_filename = 'data/surveyData/' + ctx.current_category + '/' + dataKey + '.json';

    d3.json(data_filename)
        .then(function (data) {

            console.log("Loaded data:", data);
            let malaises = computeIndiceMalaise(data, mode);

            console.log("malaises: ", malaises);
        
            d3.selectAll(".countryArea")
                .transition()
                .duration(500)
                .style("fill", d => {
                    const countryId = d.properties.CNTR_ID;
                    const val = parseFloat(malaises[countryId]);
                    return val !== undefined ? ctx.color(val) : "#ddd"; 
                });

                //console.log("Country medians:", countryMedians);
        })
        .catch(function (error) {
            console.log("Error loading data:", error);
        });
}

function computeIndiceMalaise(data, mode) {

    let pourcentagesMalaise = {};

    data.data.forEach(d => {
        if (mode == "1") {
            pourcentagesMalaise[d.id] = parseFloat(d.responses.percentage["Total 'Uncomfortable'"]);
        } else if (mode == "2") {
            pourcentagesMalaise[d.id] = parseFloat(d.responses.percentage["Total 'Disagree'"]);
        }
        
    });

    let extent = d3.extent(Object.values(pourcentagesMalaise));
    console.log("individual extent: ", extent);
    let reference = parseFloat(pourcentagesMalaise["UE27\nEU27"]);
 
 
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
    //console.log(len);


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


function precomputeColorScale(mode) {
    
    d3.csv("data/surveyData/index_light.csv").then(data => {

        console.log(ctx.current_category);
        let ordinalFiles;
        let title = "";
        
        if (mode == "1") {
            title = "Percentage of people who answered 'Really uncomfortable'";
            ordinalFiles = data
            .filter(row => row.type === "ordinal") 
            .filter(row => row.category === ctx.current_category)
            .map(row => row.file);
        } else if (mode == "2") {
            title = "Percentage of people who 'Totally disagree'",
            console.log(mode);
            ordinalFiles = data
            .filter(row => row.type === "ordinal") 
            .filter(row => row.category === ctx.current_category)
            .filter(row => row.question_eng.startsWith("To what extent"))
            .map(row => row.file);
            console.log(ordinalFiles);
        }
       
        let allMeasures = [];

        let promises = ordinalFiles.map(key => d3.json(`data/surveyData/${ctx.current_category}/${key}.json`));
        
        // we want a color scale that does not change accross different survey questions to compare levels of acceptation regarding different subjects
        // therefore the color scale is computed with answers to all the survey questions in this category
        Promise.all(promises).then(function (datum) {
    
            datum.forEach((data, index) => {
                let measures = Object.values(computeIndiceMalaise(data, mode));
                measures.forEach((m,i) => {
                    if (!isNaN(m) && m !== undefined) {
                        allMeasures.push(parseFloat(m));
                    }
                });
            })
            const extent = d3.extent(allMeasures);
            const reference = d3.mean(allMeasures);
            console.log(extent);
 
            ctx.color = d3.scaleDiverging()
                .domain([parseFloat(extent[0]), reference, parseFloat(extent[1])])
                .interpolator(t => d3.interpolatePiYG(1 - t))

            createLegend(title);
            
        }).catch(error => {
            console.error(error);
        });
        
    });
    

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
            },
            'socio': {
                'title': "Sociological Data",
                'questions': []
            }
        }
        let questions_encountered = []

        // for now only ordinal data
        data.forEach(function(d,i) {

            if (d['type'] == 'ordinal') {

                if (questions_encountered.includes(d['category']+d['question_eng'])) {
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

// NUTS data as JSON from https://github.com/eurostat/Nuts2json (translated from topojson to geojson)
// density data from https://data.europa.eu/data/datasets/gngfvpqmfu5n6akvxqkpw?locale=en
