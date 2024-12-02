const ctx = {
    MAP_W: 1024,
    MAP_H: 1024,
    YEAR: "2020",
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
    d3.select("#mapContainer").append("svg")
                              .attr("width", ctx.MAP_W)
                              .attr("height", ctx.MAP_H);
    loadData();
};

// NUTS data as JSON from https://github.com/eurostat/Nuts2json (translated from topojson to geojson)
// density data from https://data.europa.eu/data/datasets/gngfvpqmfu5n6akvxqkpw?locale=en
