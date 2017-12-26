var barSvg;
var baselines;
var interval;
var block_dataset = [];
var overlay_dataset = [];
var legend_dataset = [];
var legend;

var block_size = 200; // each block represents 100 counties
var barcanvas = {width:960,
  height:600,
  margin:{top:10, right:10, bottom:10, left:10}};

  var topojsonData;
  var countyBoundary;
  var startColor = '#0b355b';
  var midColor = '#eaf5ff';
  var endColor = '#a50000'
  var colorScale = d3.scaleLinear().domain([-10, 0,10]).range([startColor,midColor,endColor]);
  var canvasWidth = 1000;
  var canvasHeight = 600;

  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  var zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  var countyNames = [];
  var counties = {};

  var current = d3.select(null);

  var canvas = {width:1000,
    height:600};

    var chloro = {width:500,
      height:500};

      var legend = {width:200,
        height:30};

        var svg;
        var chloroG;
        var legendG;

        var interval;

        var currentYear = 0;
        var currentMonth = 0;

        var monthInput, yearStart, yearEnd = 0;
        var btnText;

        var tip;

        function closeOverlay(){
          $("#tutorial").fadeOut(500);
        }

        function play(){

          $("#inputStuff").fadeOut(500);
          $("#currentTimeInfo").fadeIn(500);

          monthInput = document.getElementById("month_input").value;
          yearStart = document.getElementById("year_start_input").value;

          yearEnd = document.getElementById("year_end_input").value;

          currentYear = parseInt(yearStart);
          currentMonth = parseInt(monthInput);

          reload_temp();
        }

        function pause(){

          btnText = document.getElementById("pauseBtn");
          if(btnText.value == "PAUSE"){
            btnText.value = "PLAY";
            clearInterval(interval);
          }else{
            btnText.value = "PAUSE";
            reload_temp();
          }

        }

        function restart(){
          $("#inputStuff").fadeIn(500);
          $("#currentTimeInfo").fadeOut(500);
        }

        function zeroPad(num, places) {
          var zero = places - num.toString().length + 1;
          return Array(+(zero > 0 && zero)).join("0") + num;
        }

        function reload_temp(){

          reload_barchart(currentMonth, yearStart, yearEnd);

        }

        function init(){


          main_url = '/baselines';
          d3.json(main_url, function(error, baseline_getter) {
            baselines = baseline_getter

            var year_range_min=1960;
            var year_range_max = 2016;

            //add year start
            var year_start_div = document.getElementById('year_start_input');
            var year_end_div = document.getElementById('year_end_input');
            for (var year_start_val = year_range_min; year_start_val<=year_range_max; year_start_val++){
              var option = document.createElement("option");
              option.text = year_start_val;
              option.value = year_start_val;
              year_start_div.appendChild(option);
              var option = document.createElement("option");
              option.text = year_start_val;
              option.value = year_start_val;
              if(year_start_val == 2016){
                option.selected = "selected";
              }
              year_end_div.appendChild(option);
            }

            svg = d3.select("#vis").append("svg").attr("width",canvas.width).attr("height",canvas.height);

            legend = d3.select("#barchart")
            .append("svg")
            .attr("width", barcanvas.width)
            .attr("height", 125);


            barSvg = d3.select("#barchart")
            .append("svg")
            .attr("width", barcanvas.width)
            .attr("height", barcanvas.height);
            chloroG = svg.append("g");

            d3.json("/static/us-10m.v1.json", function(error,data){
              topojsonData = data;
              setup_map(topojsonData);
            });

            d3.csv("/static/counties.csv", function(countyNames){
              countyNames.forEach(function(i){
                counties[zeroPad(i.FIPS,5)] = i.NAME;
              })
            });
          });
        }

        //sets up the map with the nation, state, and county outlines
        function setup_map(data){

          countyBoundary  = d3.geoPath();


          chloroG.append("path")
          .attr("class", "nation")
          .attr("d", countyBoundary(topojson.feature(data, data.objects.nation)));


          chloroG.append("path")
          .attr("class", "states")
          .attr("d", countyBoundary(topojson.mesh(data, data.objects.states, function(a, b) { return a !== b; })));


          chloroG.append("path")
          .attr("class", "county-borders")
          .attr("d", countyBoundary(topojson.mesh(data, data.objects.counties, function(a, b) { return a !== b; })));

          //this is the code that makes the map able to change sizes
          chloroG.attr("transform", "scale(" + $("#vis").width()/1000 + ")");

          main_url = '/hist?yearmin=1960&yearmax=2016&month=1&step=2';
          d3.json(main_url, function(error, tempGetter) {
            updateBarChart(tempGetter, parseInt(1960), parseInt(2016));
          })

        }

        //bar chart is reloaded - this also starts the timelapse interval
        function reload_barchart(month, year_min, year_max){
          main_url = '/hist?yearmin='+year_min+'&yearmax='+year_max+"&month="+month+"&step=2";
          d3.json(main_url, function(error, tempGetter) {
            updateBarChart(tempGetter, parseInt(year_min), parseInt(year_max));

            interval = setInterval(function() {
              reload_map(currentMonth, currentYear);
              changeCurrent(currentMonth, currentYear);
            }, 2000);

          });
        }

        //this is called everything the map needs to be reloaded
        function reload_map(month,year){


          main_url = '/get?month='+month+'&year='+year;

          d3.json(main_url,function(error,tempGetter){


            chloroG.selectAll('g').remove();
            chloroG.append("g").attr("class","county")
            .selectAll("path")
            .data(topojson.feature(topojsonData,topojsonData.objects.counties).features)
            .enter().append("path")
            .attr("d",countyBoundary)
            .style("stroke","white")
            .style("stroke-width", "0.25px")
            .style("fill",function(d){
              if (zeroPad(d.id,5) in tempGetter){
                return colorScale(tempGetter[zeroPad(d.id,5)]);
              }
              else{
                return "#F7F7F7";
              }
            })
            .on("mouseover", function(d){
              var current = d3.select(this);
              current.style("opacity","0.3");
              current.style("cursor","pointer");
            })
            .on("mouseout", function(d){
              var current = d3.select(this);
              current.style("opacity","1");
            })
            .on("click", function(d){

              current.style("fill",function(d){
                if (zeroPad(d.id,5) in tempGetter){
                  return colorScale(tempGetter[zeroPad(d.id,5)]);
                }
                else{
                  return "#F7F7F7";
                }
              });

              current = d3.select(this);

              //this is the selected county - yellow was chosen to really highlight it
              current.style("fill","yellow");

              $("#currentTimeInfo").fadeOut(500);
              $("#countyInfo").fadeIn(500);

              $("#countyCode").text(counties[zeroPad(d.id,5)]);

              var tempText = baselines[zeroPad(d.id,5)][currentMonth]+tempGetter[zeroPad(d.id,5)];
              var tempTextFixed = tempText.toFixed(2);

              $("#countyTemperature").text("In " + monthNames[currentMonth-1] + " " + currentYear + ", the temperature was " + tempTextFixed + " degrees Celcius. This is a " + tempGetter[zeroPad(d.id,5)].toFixed(2) + " difference from the county's baseline.");

              var bounds = countyBoundary.bounds(d),
              dx = bounds[1][0] - bounds[0][0],
              dy = bounds[1][1] - bounds[0][1],
              x = (bounds[0][0] + bounds[1][0]) / 2,
              y = (bounds[0][1] + bounds[1][1]) / 2,
              scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / canvasWidth, dy / canvasHeight))),
              translate = [canvasWidth / 2 - scale * x, canvasHeight / 2 - scale * y];

              chloroG.transition()
              .duration(500)
              .call(zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale));

            })

            //add states over it
            chloroG.append("g").attr("class","states-new")
            .selectAll("path")
            .data(topojson.feature(topojsonData,topojsonData.objects.states).features)
            .enter().append("path")
            .attr("d", countyBoundary)
            .style("stroke","#F7F7F7")
            .style("stroke-width","1px")
            .style("fill","none")

          });

          chloroG.attr("transform", "scale(" + $("#vis").width()/1000 + ")");

          currentYear = currentYear + 1;

          if(currentYear > yearEnd){
            clearInterval(interval);
            $("#pauseBtn").fadeOut(100);
            $("#restartBtn").fadeIn(100);
          };

        }

        //Function to change the currentMonth and currentYear variables
        function changeCurrent(mo, yr){
          document.getElementById('currentMonth').innerHTML = monthNames[mo-1];
          document.getElementById('currentYear').innerHTML = yr;
        }

        //Zoom functionality help from https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
        function zoomed(){
          chloroG.style("stroke-width", 1.5 / d3.event.transform.k + "px");
          chloroG.attr("transform", d3.event.transform);
        }

        function goBack(){
          chloroG.transition().duration(750).call( zoom.transform, d3.zoomIdentity);
          $("#currentTimeInfo").fadeIn(500);
          $("#countyInfo").fadeOut(500);
          d3.json(main_url, function(error, tempGetter) {
            current.style("fill",function(d){
              if (zeroPad(d.id,5) in tempGetter){
                return colorScale(tempGetter[zeroPad(d.id,5)]);
              }
              else{
                return "#F7F7F7";
              }
            })
          })
        }

        function updateBarChart(barchart_json, year_min, year_max) {
          block_dataset=[];
          var interval_min = barchart_json["smallest"];
          var interval_max = barchart_json["largest"];
          var num_years = year_max - year_min + 1;
          var num_intervals = Math.abs(interval_min) + Math.abs(interval_max) + 1;

          // populate block_dataset
          for (var year = year_min; year < year_max + 1; year++) {
            var num_blocks_above = 0;
            var num_blocks_below = 0;
            for (var interval = 0; interval < interval_max + 1; interval++) {
              var num_counties = barchart_json["data"][year][interval];
              var num_blocks = Math.floor(num_counties / block_size);
              if ((num_counties % block_size) > 0) {
                num_blocks++; // place leftover counties in their own block
              }
              for (var i = 0;  i < num_blocks; i++) {
                var block_datapoint = {
                  year: year,
                  y_position: num_blocks_above,
                  type: 'above',
                  interval: interval
                }

                num_blocks_above++;
                block_dataset.push(block_datapoint);
              }
            }

            for (interval = -1; interval > interval_min; interval--) {
              var num_counties = barchart_json["data"][year][interval];
              var num_blocks = Math.floor(num_counties / block_size);
              if ((num_counties % block_size) > 0) {
                num_blocks++; // place leftover counties in their own block
              }
              for (var i = 0;  i < num_blocks; i++) {
                var block_datapoint = {
                  year: year,
                  y_position: num_blocks_below,
                  type: 'below',
                  interval: interval
                }

                num_blocks_below++;
                block_dataset.push(block_datapoint);
              }
            }

            var overlay_datapoint = {
              year: year,
              y_position: num_blocks_above,
              num_blocks_covered: num_blocks_above + num_blocks_below
            }
            overlay_dataset.push(overlay_datapoint);
          }

          for (var i = 0; i < interval_max; i++) {
            var legend_datapoint = {
              x_position: 0,
              y_position: i,
              type: "above",
              text: i*3 + "-" + (i*3+3) + " C above baseline"
            }
            legend_dataset.push(legend_datapoint);
          }

          for (var i = 0; i < interval_max; i++) {
            var legend_datapoint = {
              x_position: 1,
              y_position: i,
              type: "below",
              text: i*3 + "-" + (i*3+3) + " C below baseline"
            }
            legend_dataset.push(legend_datapoint);
          }

          drawBarChart(num_years, interval_min, interval_max);
        }

        function drawBarChart(num_years, interval_min, interval_max) {
          var width = barcanvas.width;
          var height = barcanvas.height;
          var legend_height = 300;
          var canvas_padding = 20;
          var barcanvas_padding = 40;
          var legend_padding = 20;
          var block_padding = 5;
          var xStep = (width - barcanvas_padding * 2) / num_years;
          var yStep = 8;

          var tip = d3.tip()
          .attr('class', 'tooltip')
          .html(function(d) {
            var tip_html = d.year;

            return tip_html;
          });

          barSvg.call(tip);

          barSvg.selectAll('*').remove();
          var xScale = d3.scaleLinear()
          .domain(d3.extent(block_dataset, function(d) {
            return d.year;
          }))
          .range([barcanvas_padding, (width - barcanvas_padding) - xStep]);

          var yScale_above = function(y_position) {
            return ((height / 2) - legend_padding) - ((yStep + block_padding) * y_position);
          };

          var yScale_below = function(y_position) {
            return ((height / 2) + legend_padding) + ((yStep + block_padding) * y_position);
          };

          var legendOpacityScale = d3.scaleLinear()
          .domain([0, 2])
          .range([.33, 1]); // hard code

          var formatxAxis = d3.format('.0f');

          var xAxis = d3.axisBottom()
          .scale(xScale)
          // .tickFormat(formatxAxis)
          .tickFormat(function(d){
            return "'" + d.toString().slice(2,4);
          })
          .ticks(num_years);

          legend.selectAll(".legend_bar")
          .data(legend_dataset)
          .enter()
          .append("rect")
          .attr("x", function(d) {
            return canvas_padding + (d.x_position * (canvas_padding + (width - canvas_padding)) / 4);
          })
          .attr("y", function(d) {
            return d.y_position * 25;
          })
          .attr("width", 20)
          .attr("height", 20)
          .attr("fill", function(d) {
            if (d.type == "above") {
              return "#a50000";
            } else {
              return "#0b355b";
            }
          })
          .attr("opacity", function(d) {
            return legendOpacityScale(d.y_position);
          })
          .attr("transform", "translate(" + ((canvas_padding + (width - canvas_padding)) / 4) + "," + 0 + ")");


          legend.selectAll(".legend_label")
          .data(legend_dataset)
          .enter()
          .append("text")
          .attr("x", function(d) {
            return canvas_padding + (d.x_position * (canvas_padding + (width - canvas_padding)) / 4) + 25;
          })
          .attr("y", function(d) {
            return d.y_position * 25 + 5; // hard coded
          })
          .attr("alignment-baseline", "hanging")
          .text(function(d) {
            return d.text;
          })
          .attr("transform", "translate(" + ((canvas_padding + (width - canvas_padding)) / 4) + "," + 0 + ")");


          var blocks = barSvg.selectAll(".rect")
          .data(block_dataset); // JOIN

          blocks.exit()
          .remove(); // REMOVE

          blocks.enter() // ENTER + UPDATE
          .append("rect")
          .attr("class", "block")
          .attr("x", function(d) {
            return xScale(d.year);
          })
          .attr("y", function(d) {
            if (d.type == "above") {
              return yScale_above(d.y_position);
            } else {
              return yScale_below(d.y_position);
            }
          })
          .attr("width", xStep - block_padding)
          .attr("height", yStep)
          .attr("fill", function(d) {
            if (d.type=="above") {
              return "#a50000";
            } else {
              return "#0b355b";
            }
          })
          .attr("opacity", function(d) {
            if (d.interval >= 0) {
              return ((d.interval + 1) / (interval_max + 1)); // 0, 1 -> 0.5, 1; 0, 1, 2 -> 0.33, 0.67, 1; 0, 1, 2, 3 -> 0.25, 0.5, .75, 1
            } else {
              return (Math.abs(d.interval) / (Math.abs(interval_min) + 1)); // -1, -2 -> 0.33, 0.67; -1, -2, -3 -> 0.25, 0.5, .75 // to match above color changes; that is, opacity step change for above bar is same amount for opacity step change for below bars
            }
          })
          .on('click', function(d) {
            reload_map(currentMonth, d.year);
          });

          barSvg.append("g")
          .attr("class", "axis")
          .attr("id", "barchart_axis")
          .attr("transform", "translate(" + ((xStep / 2) - 5) + "," + ((height / 2)-10) + ")")
          .call(xAxis);

          barSvg.selectAll('#barchart_axis .tick')
          .on('click', function(d) {

            $("#inputStuff").fadeOut(500);
            $("#currentTimeInfo").fadeIn(500);

            monthInput = document.getElementById("month_input").value;
            currentMonth = parseInt(monthInput);

            reload_map(currentMonth, d.year);
            changeCurrent(currentMonth, d.year);
            // yearStart = d.year;
            currentYear = d.year;

          }); // clicking on year tick reloads map to that year

          var overlays = barSvg.selectAll('.overlay')
          .data(overlay_dataset); // JOIN

          overlays.exit()
          .remove(); // REMOVE

          overlays.enter() // ENTER + UPDATE
          .append("rect")
          .attr("class", "overlay")
          .attr("x", function(d) {
            return xScale(d.year);
          })
          .attr("y", function(d) {
            return yScale_above(d.y_position) + yStep;
          })
          .attr("width", xStep - block_padding)
          .attr("height", function(d) {
            return (d.num_blocks_covered + 3) * (yStep + block_padding);
          })
          .on('click', function(d) {

            $("#inputStuff").fadeOut(500);
            $("#currentTimeInfo").fadeIn(500);

            monthInput = document.getElementById("month_input").value;
            currentMonth = parseInt(monthInput);

            reload_map(currentMonth, d.year);
            changeCurrent(currentMonth, d.year);

            currentYear = d.year;
          })
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);

        }
