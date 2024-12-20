
 function createChart(chartType, data) {
     const svg = d3.select("svg");

     const numCols = Math.ceil(Math.sqrt(ctx.CHART_NB));
     const numRows = Math.ceil(ctx.CHART_NB / numCols);

     const width = ctx.SVG_W / numCols;
     const height = ctx.SVG_H / numRows;

     const x = ((ctx.CHART_NB - 1) % numCols) * width;
     const y = Math.floor((ctx.CHART_NB - 1) / numCols) * height;

     if (chartType === "bar") {
         console.log("bar chart")
         addBarPlot(svg, x, y, width, height, data, ctx.CHART_NB);
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

 const width = ctx.SVG_W / numCols;   // Largeur par graphique
 const height = ctx.SVG_H / numRows;  // Hauteur par graphique

 svg.selectAll(".chart")
     .data(d3.range(ctx.CHART_NB))
     .transition()  
     .duration(500)
     .attr("transform", (d, i) => {
         const col = i % numCols;
         const row = Math.floor(i / numCols);
         return `translate(${col * width}, ${row * height})`; // Positionner chaque graphe dans la grille
     })
     .each(function(d) {
         const g = d3.select(this);
         const data = g.datum();  // Récupérer les données associées à ce graphique

         console.log("Vérification des données associées au graphique : ", data);  // Ajoutez cette ligne pour déboguer
         if (!Array.isArray(data)) {
             console.error("Les données ne sont pas un tableau !", data);
             return;
         }

         // Marges + dimensions recalculées
         const margin = { top: 10, right: 10, bottom: 50, left: 10 };
         const plotWidth = width - margin.left - margin.right;  // Largeur du graphique
         const plotHeight = height - margin.top - margin.bottom; // Hauteur du graphique

         // Recalcul des échelles x et y
         const xScale = d3.scaleBand()
             .domain(data.map(d => d.id))  // Utiliser les IDs des pays pour l'échelle x
             .range([0, plotWidth])
             .padding(0.1);

         const yScale = d3.scaleLinear()
             .domain([0, d3.max(data, d => d3.max(Object.values(d.responses.percentage)))])  // Max valeur des pourcentages
             .nice()
             .range([plotHeight, 0]);

         // Réajuster les axes avec les nouvelles dimensions
         g.select(".x-axis")
             .transition()
             .duration(500)
             .attr("transform", `translate(${margin.left},${margin.top + plotHeight})`) // Nouvelle position de l'axe X
             .call(d3.axisBottom(xScale).tickSizeOuter(0));

         g.select(".y-axis")
             .transition()
             .duration(500)
             .attr("transform", `translate(${margin.left},${margin.top})`) // Nouvelle position de l'axe Y
             .call(d3.axisLeft(yScale).ticks(5));

         // Calculer la largeur des barres en fonction du nombre de pays dans le dataset
         const barWidth = (plotWidth) / data.length;  // Largeur de chaque barre, calculée en fonction du nombre de pays

         // Réajuster la position et la taille des barres avec une transition fluide
         g.selectAll(".bar")
             .transition()
             .duration(500)
             .attr("x", (d, i) => xScale(d.id) + margin.left)  // Position des barres en fonction de l'échelle x
             .attr("y", d => yScale(d[1]) + margin.top)  // Position des barres en fonction de la valeur
             .attr("width", barWidth)  // Largeur des barres, calculée
             .attr("height", d => plotHeight - yScale(d[1]))  // Hauteur des barres en fonction de la valeur
             .style("opacity", 1);  // Visibilité des barres
     });
}


function addBarPlot(svg, x, y, width, height, data,chartId) {
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    console.log(plotHeight);

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
    .append("g")  // Grouped by country (id)
    .attr("transform", (d, i) => `translate(${(i+1) * barWidth - 25}, 0)`) 
    .attr("class", d => `bar ${d.id}`)
    .each(function(d) {
        // Sort percentages to see every rectangle
        const sortedEntries = Object.entries(d.responses.percentage)
            .filter(entry => !isNaN(entry[1]) && entry[1] !== null && entry[1] !== "-") 
            .sort((a, b) => b[1] - a[1]);  // Sort in descending order

        let cumulativeHeight = 0; // To accumulate the height of each rect

        d3.select(this)
            .selectAll("rect")
            .data(sortedEntries)
            .enter()
            .append("rect")
            .attr("class", "bar")
            // Position each rect based on the cumulative height
            .attr("y", function(d, i) {
                console.log("rect "+i+":"+sortedEntries[i]+" ///// "+sortedEntries[i][1]);
                const yPosition = i === 0 ? yScale(d[1]) : yScale(sortedEntries[i - 1][1]) - plotHeight+ yScale(d[1]);
                return yPosition;
            })
            .attr("width", barWidth * 0.6)  // Set the width of the bars
            .attr("height", d => plotHeight - yScale(d[1]))  // Height of each rect based on the scale
            .attr("fill", d => colorScale(d[1]))  // Color of the bar based on the value
            .style("opacity", 1);
    });

    console.log("Bar chart added");
    //pb : yScale(sortedEntries[i - 1][1]), au lieu de prendre yScale(sortedEntries[i - 1][1]), on devrait prendre la somme pour tous les i précédents


}

function addLinePlot(data){}

function addScatterPlot(data){}


// function createChart(selectedSVG, questionData, socioData) {
 const margin = { top: 20, right: 20, bottom: 50, left: 40 };
 const width = ctx.SVG_W - margin.left - margin.right;
 const height = ctx.SVG_H - margin.top - margin.bottom;

 const svg = selectedSVG.append("g")
     .attr("transform", `translate(${margin.left}, ${margin.top})`);

 // Get keys
 const countries = Object.keys(socioData.data);
    
 // Scale
 const xScale = d3.scaleBand()
     .domain(countries)
     .range([0, width])
     .padding(0.1);

 const yScale = d3.scaleLinear()
     .domain([0, d3.max(countries, country => socioData.data[country] + questionData[country])])
     .nice()
     .range([height, 0]);

 // Axis
 svg.append("g")
     .attr("class", "x-axis")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(xScale));

 svg.append("g")
     .attr("class", "y-axis")
     .call(d3.axisLeft(yScale));

 // Stacked Bars
 const stackData = countries.map(country => {
     return {
         country,
         socioValue: socioData.data[country],
         questionValue: questionData[country]
     };
 });

 const stack = d3.stack()
     .keys(["socioValue", "questionValue"])
     .order(d3.stackOrderNone)
     .offset(d3.stackOffsetNone);

 const series = stack(stackData);

 svg.selectAll(".stack")
     .data(series)
     .enter()
     .append("g")
     .attr("class", "stack")
     .attr("fill", (d, i) => i === 0 ? "steelblue" : "orange")  
     .selectAll("rect")
     .data(d => d)
     .enter()
     .append("rect")
     .attr("x", d => xScale(d.data.country))
     .attr("y", d => yScale(d[1]))
     .attr("width", xScale.bandwidth())
     .attr("height", d => yScale(d[0]) - yScale(d[1]))
     .style("opacity", 0.8);

 svg.selectAll(".text")
     .data(stackData)
     .enter()
     .append("text")
     .attr("x", d => xScale(d.country) + xScale.bandwidth() / 2)
     .attr("y", d => yScale(d.socioValue + d.questionValue) - 10)
     .attr("text-anchor", "middle")
     .attr("fill", "#000")
     .text(d => d.country);
//  }
