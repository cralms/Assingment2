
//Width and height
var w = 800;
var h = 800;
//coordinates of center
//var X = -122;
//var Y = 37;
var color_list = ['yellow','limegreen','red','brown','magenta','blue'];



var projection = d3.geo.mercator();

//we define our path generator
var path = d3.geo.path()
    .projection(projection);
for(var number_of_clusters = 2; number_of_clusters < 7; number_of_clusters++)
    graph(number_of_clusters);

function graph(number_of_clusters){
    //Create SVG element
    var svg = d3.select("#K"+number_of_clusters)//.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    //the first parameter is a string pointing to the path of the file to load in
    // Second, it takes a callback function that is fired when the JSON file has been loaded and parsed.
    d3.json("sfpddistricts.geojson", function(json) {
//sfpddistricts.geojson //us-states.json

        //centering the map
        var b = path.bounds(json),
            s = 0.95 / Math.max(
                    (b[1][0] - b[0][0]) / w,
                    (b[1][1] - b[0][1]) / h
                );
        //Use the d3.geo.bounds method to find the bounding box in map units:
        b = d3.geo.bounds(json);
        //Set the center of the projection to the center of the bounding box:
        projection.center([(b[1][0] + b[0][0]) / 2, (b[1][1] + b[0][1]) / 2]);
        //Use the translate method to move the center of the map to the center of the canvas:
        projection.translate([w / 2, h / 2]);
        //Scale ti fit all
        var scale = 55;
        var hscale = scale * w / (b[1][0] - b[0][0]);
        var vscale = scale * h / (b[1][1] - b[0][1]);
        scale = (hscale < vscale) ? hscale : vscale;
        projection.scale(scale);
        //new Path
        path = path.projection(projection);

        // add a rectangle to see the bound of the svg
        svg.append("rect").attr('width', w).attr('height', h)
            .style('stroke', 'black').style('fill', 'aliceblue');
//filling the svg element
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "cornflowerblue")
            .style("opacity", "0.5")
            .style("stroke-width", "1.5")
            .style("stroke", "black");
//Notice that last line, in which d (the path data attribute) is referred to our path generator, which magically takes the bound geodata and calculates all that crazy SVG code.

        var point_values = [];
        var x_values = [];
        var y_values = [];
        var district_midpoint = [];
        var midpoints_list = [];
        //calculating position of each district name
        for (index in json.features) {
            console.log(json.features[index].properties.DISTRICT);
            //getting x and y values in a single list
            if (json.features[index].geometry.coordinates.length > 1) {
                for (var list_index in json.features[index].geometry.coordinates)
                    point_values = point_values.concat([].concat.apply([], json.features[index].geometry.coordinates[list_index]));
            } else {
                point_values = [].concat.apply([], json.features[index].geometry.coordinates);
            }


            //getting the min and max value of x and y
            /*for(var list_index in point_values)
             (list_index%2 == 0)?x_values.push(point_coordinates_values[list_index]):y_values.push(point_coordinates_values[list_index])
             */
            x_values = point_values.map(function (obj){return obj[0]});
            y_values = point_values.map(function (obj){return obj[1]});
            /*district_midpoint = [
             (Math.max.apply(null, x_values) + Math.min.apply(null, x_values))/2,
             (Math.max.apply(null, y_values) + Math.min.apply(null, y_values))/2
             ];*/
            district_midpoint = [
                x_values.reduce(function(prev, cur) {
                    return prev + cur
                        ; })/x_values.length,
                y_values.reduce(function(prev, cur) {return prev + cur;})/y_values.length
            ];

            console.log(
                'The district midpoint is '+ district_midpoint);
            district_midpoint.name = json.features[index].properties.DISTRICT;
            midpoints_list.push(district_midpoint);

            /*  */
            point_values = [];
            x_values = [];
            y_values = [];
        }
        var nodes = svg.append("g")
            .attr("class", "nodes")
            .selectAll("text")//("circle")
            .data(midpoints_list)//(json.features)
            .enter()
            // Add one g element for each data node here.
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            //.attr("font-weight", "bold")
            .attr("fill", "grey")
            .text(function(midpoint) {
                return midpoint.name;
            })
            // Position the g element like the circle element used to be.
            .attr("transform", function(d, i) {
                // Set d.x and d.y here so that other elements can use it. d is
                // expected to be an object here.

                return "translate(" + projection(d) + ")";
                //NOTE: Using projection object to translate from lon/lat to pixel coordinates!!
            })
            ;

//acquiring and displaying data points
        d3.json("prost_locations.json", function(error, data) {

            var data_points = svg//.append('data_points')
                .selectAll('circle')
                .data(data)
                .enter()
                .append("circle")
                .attr("transform", function(d, i) {
                    return "translate(" + projection(d.slice(0,2)) + ")";
                    //NOTE: Using projection object to translate from lon/lat to pixel coordinates!!
                })
                .attr("r", 5)
                .style("fill", function(d){
                    return color_list[parseInt(d[number_of_clusters])];//K = 6
                })
            //.style("opacity", 0.75)
                ;

//acquiring and displaying Cluster Centers (AFTER points are displayed)
            d3.json("cluster_centers_locations.json", function(error, data) {

                var data_points = svg
                    .selectAll('cluster_center')
                    .data(data)
                    .enter()

                    //.append("use")
                    //.attr("xlink:href","#star_svg")
                    .append("svg:polygon")
                    .filter(function(d){ return parseInt(d[2]) == number_of_clusters; }) //K=6 true or false!
                    .attr("id", "star_1")
                    .attr("visibility", "visible")
                    .attr("points", function (d){
                        var cords = projection(d.slice(0,2));
                        return CalculateStarPoints(cords[0], cords[1], 5, 30, 15); //(centerX, centerY, arms, outerRadius, innerRadius)
                    })
                    .style("fill", function(d){
                        console.log('color in position '+parseInt(d[3]))
                        return color_list[parseInt(d[3])];//3 is the column of the cluster index
                    })
                    .style("stroke","black")
                    .style("stroke-width","3")
                    ;
                //text in the upper left corner
                var text_ul = svg
                    .append("text")
                    //.attr("text-anchor", "middle")
                    .attr("font-size", "40px")
                    //.attr("font-weight", "bold")
                    .attr("fill", "black")
                    .text('Clustering with K = '+number_of_clusters)
                    // Position the g element like the circle element used to be.
                    .attr('x', w/30)
                    .attr('y', h/15)
                    ;


            });
        });

    });
}

function CalculateStarPoints(centerX, centerY, arms, outerRadius, innerRadius)
{
    var results = "";

    var angle = Math.PI / arms;

    for (var i = 0; i < 2 * arms; i++)
    {
        // Use outer or inner radius depending on what iteration we are in.
        var r = (i & 1) == 0 ? outerRadius : innerRadius;

        var currX = centerX + Math.cos(i * angle) * r;
        var currY = centerY + Math.sin(i * angle) * r;

        // Our first time we simply append the coordinates, subsequet times
        // we append a ", " to distinguish each coordinate pair.
        if (i == 0)
        {
            results = currX + "," + currY;
        }
        else
        {
            results += ", " + currX + "," + currY;
        }
    }

    return results;
}

        