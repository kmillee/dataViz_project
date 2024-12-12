const ctx = {
    MAP_W: 1024,
    MAP_H: 1024,
    YEAR: "2020",
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

    /*let densityExtent = d3.extent(nutsRegions.features, (d) => (d.properties.density));
    const densityLogScale = d3.scaleLog().domain(densityExtent);
    const densityColorScale = d3.scaleSequential((d) => d3.interpolateViridis(densityLogScale(d)));*/

    let svgEl = d3.select("svg");

    // country areas
    svgEl.append("g")
         .attr("id", "countryAreas")
         .selectAll("path")
         .data(countries.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "countryArea");


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

    // Create dropdowns for the selected type
    let dropdownHTML = '';
    dropdownData[type].questions.forEach((q, i) => {
        dropdownHTML += `
            <p>${q["question"]}</p>
        `;
        q["options"].forEach((option, j) => {
            console.log(option);
            dropdownHTML += `
            <div>
                <input type="radio" id="radio_${j}" name="question${j}" value='${option.label}' onclick="updateMapData()">
                <label for="radio_${j}">${option.label}</label>
                <br>
            </div>
        `;
        })
    });

    dropdownContainer.innerHTML = dropdownHTML;
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
