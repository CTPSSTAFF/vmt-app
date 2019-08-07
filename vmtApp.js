/**
 *	Boston Region MPO Vehicle Miles Traveled and Emissions Data Browser
 *	
 *	Application description:
 *		This application may be used to browse CTPS's database of modeled vehicle miles 
 *		traveled (VMT), vehicle hours traveled (VHT), and emissions data for the 101 cities 
 *		and towns in the Boston Region Metropolitan Planning Organization (MPO).
 *
 *  Latest update:
 *      08/2019 -- Ben Krepp
 *	Previout update:
 *		09/2017 -- Ethan Ebinger
 *	
 *	Data sources: 
 *		1) Central Transportation Planning Staff of the Boston Region Metropolitan Planning Organization
 *		2) Massachusetts Office of Geographic Information (MassGIS)
 *
 *	This application depends on the following libraries:
 *		1) jQuery -- for DOM navigation
 *		2) d3 -- for map visualization, loading CSV data
 *		3) d3-tip -- for tooltips in d3 visualizations
 *		4) topojson -- for loading topojson data for map visualization
 *		5) Accessible Grid -- for rendering HTML tables that are navigable by screen readers
 *		6) Accessible Tabs -- for navigating HTML tables
 *		7) Simple Sliding Doors -- for navigating HTML tables
 *		8) ctpsutils -- custom library with arrays of towns in MPO region and in MA
 *	
 */
  
var CTPS = {};
CTPS.vmtApp = {};

// Data sources
var MPO_towns = "data/MA_TOWNS_MPO97.json";
var MA_outline = "data/MA_TOWNS_NON_MPO97.json";
var csvData_2016 = "data/CTPS_TOWNS_MAPC_97_VMT_2016.csv";
var csvData_2040 = "data/CTPS_TOWNS_MAPC_97_VMT_2040.csv";

// Data loaded by app
CTPS.vmtApp.tabularData_2016 = {};
CTPS.vmtApp.tabularData_2040 = {};

// Raw TopoJSON for MPO towns
CTPS.vmtApp.topoTowns = {};
// GeoJSON for MPO towns
CTPS.vmtApp.townFeatures = {};
// GeoJSON for MA outside of MPO region
CTPS.vmtApp.outsideMpoFeatures = {};

// Accessible grid
CTPS.vmtApp.data_grid;

// Array of names of map themes
CTPS.vmtApp.themes = ["THEME_VMT", "THEME_VHT", "THEME_VOC", "THEME_NOX", "THEME_CO",  "THEME_CO2" ];

// Lookup Table for Map and Legend palettes, text
// Domains emperically split on approximatley the 25th, 50th, and 75th percentile values -- for 2012 data
CTPS.vmtApp.themesLookup = {	
    "THEME_VMT": {	"threshold": d3.scaleThreshold()
                                    .domain([230000, 560000, 920000])
                                    .range(["#febfdc", "#fe80b9", "#d62e6c", "#a10048"]),
                    "mapTheme": "Vehicle Miles Traveled",
                    "total": "VMT_TOTAL",
                    "legendTheme": "Daily total of modeled vehicle miles traveled (VMT), per municipality.",
                    "legendText": ["< 230,000 miles", "230,000-560,000 miles", "560,000-920,000 miles", "> 920,000 miles"],
                    "legendDomain": [0, 300000, 700000, 2000000],
                    "legendRange": ["#febfdc", "#fe80b9", "#d62e6c", "#a10048"],
                    "tabSelect": "#vmt"
                },
    "THEME_VHT": {	"threshold": d3.scaleThreshold()
                                    .domain([7000, 16000, 28000])
                                    .range(["#d4ffd4", "#a9d6a8", "#53ad51", "#1d6b1b"]),
                    "mapTheme": "Vehicle Hours Traveled",
                    "total": "VHT_TOTAL",
                    "legendTheme": "Daily total of modeled vehicle hours traveled (VHT), per municipality.",
                    "legendText": ["< 7,000 hours","7,000-16,000 hours", "16,000-28,000 hours", "> 28,000 hours"],
                    "legendDomain": [0, 10000, 20000, 30000],
                    "legendRange": ["#d4ffd4", "#a9d6a8", "#53ad51", "#1d6b1b"],
                    "tabSelect": "#vht"
                },
    "THEME_VOC": {	"threshold": d3.scaleThreshold()
                                    .domain([25, 60, 100])
                                    .range(["#FEF7E7", "#E79484", "#BD4A39", "#8C0808"]),
                    "mapTheme": "Volatile Organic Compounds",
                    "total": "VOC_TOTAL",
                    "legendTheme": "Daily total of modeled grams of volatile organic compounds (VOC) emitted, per municipality.",
                    "legendText":  ["< 25 grams", "25-60 grams", "60-100 grams", "> 100 grams"], 
                    "legendDomain": [0, 30, 70, 200],
                    "legendRange": ["#FEF7E7", "#E79484", "#BD4A39", "#8C0808"],
                    "tabSelect": "#voc"
                },
    "THEME_NOX": {	"threshold": d3.scaleThreshold()
                                    .domain([150, 350, 600])
                                    .range(["#e7fec8", "#cffe91", "#86d51e", "#5e9515"]),
                    "mapTheme": "Nitrogen Oxides",
                    "total": "NOX_TOTAL",
                    "legendTheme": "Daily total of modeled grams of nitrogen oxides (NOX) emitted, per municipality.",
                    "legendText": ["< 150 grams", "150-350 grams", "350-600 grams", "> 600 grams"],
                    "legendDomain": [0, 200, 400, 2500],
                    "legendRange": ["#e7fec8", "#cffe91", "#86d51e", "#5e9515"],
                    "tabSelect": "#nox"
                },
    "THEME_CO" : {	"threshold": d3.scaleThreshold()
                                    .domain([700, 1700, 3000])
                                    .range(["#bffffe", "#80fffe", "#0fb3bc", "#006b6b"]),
                    "mapTheme": "Carbon Monoxide",
                    "total": "CO_TOTAL",
                    "legendTheme": "Daily total of modeled grams of carbon monoxide (CO) emitted, per municipality.",
                    "legendText": ["< 700 grams", "700-1,700 grams", "1,700-3,000 grams", "> 3,000 grams"],
                    "legendDomain": [0, 1000, 2000, 3500],
                    "legendRange": ["#bffffe", "#80fffe", "#0fb3bc", "#006b6b"],
                    "tabSelect": "#co"
                },
    "THEME_CO2": {	"threshold": d3.scaleThreshold()
                                    .domain([100000, 250000, 500000])
                                    .range(["#ecd9fe", "#d9b3f3", "#824aba", "#5b3482"]),
                    "mapTheme": "Carbon Dioxide",
                    "total": "CO2_TOTAL",
                    "legendTheme": "Daily total of modeled grams of carbon dioxide (CO2) emitted, per municipality.",
                    "legendText": ["< 100,000 grams", "100,000-250,000 grams", "250,000-500,000 grams", "> 500,000 grams"],
                    "legendDomain": [0, 200000, 450000, 2000000],
                    "legendRange": ["#ecd9fe", "#d9b3f3", "#824aba", "#5b3482"], 
                    "tabSelect": "#co2"
                }
};

//////////////////////////////////////////////////////////////////////////////////////
//  Utility Functions
//	
// Function to open URL in new window -- used for "Help Button"
function popup(url) {
    popupWindow = window.open(url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=yes');
}
//Functions to Hide/Unhide Tabs -- exists this way to remove individual class names if multiple exist
function hideTab() {
    var e = document.getElementById('mytabs');
    e.className += ' hidden';
}
function unhideTab() {
    var e = document.getElementById('mytabs');
    e.className = e.className.replace(/hidden/gi,"");
}
// Function to capitalize only first letter of Town names
// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/196991#196991
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
// Function to rearrage data array (needed for hover-highlighting b/c internal data order messed up 
// when you bring the selected town to the front of the SVG -- this corrects that bug)
// https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
}


CTPS.vmtApp.data = {};          // probably fossil
CTPS.vmtApp.csvData = '';       // probably fossil

CTPS.vmtApp.currentTown = '';  
CTPS.vmtApp.currentTownID = 0;  
var helpData = "vmtAppHelp.html";
    
function vmtAppInit() {
    // Arm on-click event handler for Help button
    $('#help_button').click(function(e) {
        popup(helpData);
    });
    // Arm on-click event handler for Download buttons
    $('#download_button_2016, #download_button_2040').each(function() { 
        $(this).click(function() {
            window.location = $(this).find('a').attr('href');
        });	
    });
	// Populate "Select Map Theme" combo box
	for (i = 0; i < CTPS.vmtApp.themes.length; i++) {
		$("#selected_theme").append(
			$("<option />")
				.val(CTPS.vmtApp.themes[i])
				.text(CTPS.vmtApp.themesLookup[CTPS.vmtApp.themes[i]]["mapTheme"])
		);
	}
	// Populate "Select A Municipality" combo box
	for (i = 0; i < CTPSUTILS.aMpoTowns.length; i++) {
		$("#selected_town").append(
			$("<option />")
				.val(CTPSUTILS.aMpoTowns[i][0])
				.text(toTitleCase(CTPSUTILS.aMpoTowns[i][1]))
		);
	}
    
    // Arm on-change event handler for select_town combo box
    $("#selected_town").change(function(e) {
        var i;
    	var iTownId = +$('#selected_town :selected').val();		
		if (!iTownId > 0){
			alert('No city or town selected. Please try selecting a town again from either the dropdown or the map.');
			return;
		} else {
			// Save town name and ID
			CTPS.vmtApp.currentTown = $('#selected_town :selected').text();
			CTPS.vmtApp.currentTownID = iTownId;
            
			// Harvest the 2016 and 2040 data for the selected town           
            var rec_2016 = _.find(CTPS.vmtApp.tabularData_2016, function(rec) { return rec.TOWN_ID === iTownId; });
            var rec_2040 = _.find(CTPS.vmtApp.tabularData_2040, function(rec) { return rec.TOWN_ID === iTownId; });
           
            // Create accessible grid
            var colDesc = [ { header : 'Metric', dataIndex : 'METRIC' }, 
                            { header : '2016', 	 dataIndex : 'DATA_2016' }, 
                            { header : '2040', 	 dataIndex : 'DATA_2040' }
            ]; 
            $('#town_data_grid').html('');
            CTPS.vmtApp.data_grid = new AccessibleGrid( 
                                        {   divId 	:	    'town_data_grid',
                                            tableId 	:	'town_table',
                                            summary		: 	'Table columns are name of metric, value of metric for 2016, and value of metric for 2040.',
                                            caption		:	'Data for ' + CTPS.vmtApp.currentTown,
                                            ariaLive	:	'assertive',
                                            colDesc		: 	colDesc
                                });
            
            // Load grid with data for town
            var dataToLoad = [];
            dataToLoad[0] = { 'METRIC' : 'VMT (miles)', 'DATA_2016' : rec_2016.VMT_TOTAL.toLocaleString(), 'DATA_2040' : rec_2040.VMT_TOTAL.toLocaleString() };
            dataToLoad[1] = { 'METRIC' : 'VHT (hours)', 'DATA_2016' : rec_2016.VHT_TOTAL.toLocaleString(), 'DATA_2040' : rec_2040.VHT_TOTAL.toLocaleString() };
            dataToLoad[2] = { 'METRIC' : 'VOC (kilograms)', 'DATA_2016' : rec_2016.VOC_TOTAL.toLocaleString(), 'DATA_2040' : rec_2040.VOC_TOTAL.toLocaleString() };
            dataToLoad[3] = { 'METRIC' : 'NOX (kilograms)', 'DATA_2016' : rec_2016.NOX_TOTAL.toLocaleString(), 'DATA_2040' : rec_2040.NOX_TOTAL.toLocaleString() };
            dataToLoad[4] = { 'METRIC' : 'CO (kilograms)', 'DATA_2016' : rec_2016.CO_TOTAL.toLocaleString(),  'DATA_2040' : rec_2040.CO_TOTAL.toLocaleString() };
            dataToLoad[5] = { 'METRIC' : 'CO2 (kilograms)', 'DATA_2016' : rec_2016.CO2_TOTAL.toLocaleString(), 'DATA_2040' : rec_2040.CO2_TOTAL.toLocaleString() };            
            CTPS.vmtApp.data_grid.loadArrayData(dataToLoad);
        

			// Change highlighted town on map to reflect selected town
			$(".towns").each(function(i) {
				if ( +this.id === +iTownId ) {
					// Outline clicked town in red, bring to front
					d3.select(this.parentNode.appendChild(this))
						.transition().duration(100)
							.style("stroke-width", "4px")
							.style("stroke", "#ff0000");
                    /*
					for (var i=0; i<CTPS.vmtApp.data.length; i++) {
						if (+CTPS.vmtApp.data[i].properties.TOWN_ID === +this.id) {
							// Reorder data so selected town moved to last element in array.
							// Needed in order to properly update data, d3 thinks this town
							// was drawn last and will improperly update the map otherwise
							CTPS.vmtApp.data.move(i, CTPS.vmtApp.data.length-1);
						}
					}
                    */
				} else {
					this.style.strokeWidth = "1px";
					this.style.stroke = "#000";
				};
			});
		} // if-else
	}); // On-change event handler for select_town combo box
      
	//////////////////////////////////////////////////////////////////////////////////////
	//
	// Load data, initialize data structures, and initialze SVG map
	//
    var q = d3.queue()
            .defer(d3.json, MPO_towns)          // OK
            .defer(d3.json, MA_outline)         // OK
            .defer(d3.csv, csvData_2016)        // OK
            .defer(d3.csv, csvData_2040)
            .awaitAll(function(error, results) { 
                if (error !== null) {
                    alert('Failure loading JSON or CSV file.\n' +
                          'Status: ' + error.status + '\n' +
                          'Status text: ' + error.statusText + '\n' +
                          'URL :' + error.responseURL);
                    return;
                }                   
                var topoTowns = results[0];     // Geometry of MPO towns
                var nonMpo = results[1];        // Geometry of MA outside MPO region                 
                CTPS.vmtApp.tabularData_2016 = results[2];
                CTPS.vmtApp.tabularData_2040 = results[3]; 

                // Process tabular data loaded               
                function parseCSV(rec) {
                    rec.TOWN_ID = +rec.TOWN_ID;
                    rec.VMT_TOTAL = +rec.VMT_TOTAL;
                    rec.VHT_TOTAL = +rec.VHT_TOTAL;
                    rec.VOC_TOTAL = +rec.VOC_TOTAL;
                    rec.NOX_TOTAL = +rec.NOX_TOTAL;
                    rec.CO_TOTAL  = +rec.CO_TOTAL;
                    rec.CO2_TOTAL = +rec.CO2_TOTAL;
                } // parseCSV()                
                CTPS.vmtApp.tabularData_2016.forEach(parseCSV);
                CTPS.vmtApp.tabularData_2040.forEach(parseCSV);
                 
                // Process spatial data loaded
                // Cache raw TopoJSON for MPO towns - it will be needed to render scale bar for map
                CTPS.vmtApp.topoTowns = topoTowns;
                // 'Inflate' the TopoJSON for MPO towns into GeoJSON
                CTPS.vmtApp.townFeatures = topojson.feature(topoTowns, topoTowns.objects.MA_TOWNS_MPO97).features;
                
                // 'Join' the GeoJSON data for each town with the corresponding tabular data for 2016 and 2040
                // Each feature in the GeoJSON gets two new properties: 'data_2016' and 'data_2040'
                var i, j, townFeature, townId, rec_2016, rec_2040;
                for (i = 0; i < CTPS.vmtApp.townFeatures.length; i++) {
                    feature = CTPS.vmtApp.townFeatures[i];
                    townId = feature.properties['TOWN_ID'];
                    rec_2016 = _.find(CTPS.vmtApp.tabularData_2016, function(rec) { return rec.TOWN_ID === townId; });
                    rec_2040 = _.find(CTPS.vmtApp.tabularData_2040, function(rec) { return rec.TOWN_ID === townId; });
                    feature.properties['data_2016'] = rec_2016;
                    feature.properties['data_2040'] = rec_2040;                   
                } // for each MPO town feature
                                           
                // 'Inflate' the TopoJSON for geometry of MA outside of the MPO region into GeoJSON
                CTPS.vmtApp.outsideMpoFeatures = topojson.feature(nonMpo, nonMpo.objects.MA_TOWNS_NON_MPO97).features;
                
                initMap();               
            }); // q.awaitAll()    
    

	
	// Pseudo-contants for map and legend rendering
	var width = $('#map').width(),
		height = $('#map').height(),
		legend_width = 240,
		legend_height = 120,
		legendRectSize = 16,
		legendSpacing = 4;

	//////////////////////////////////////////////////////////////////////////////////////
	//
	// Map and Map Legend Initialization/Rendering Functions
	//
	var initMap = function() {
		// Define projection: Mass State Plane NAD 83 Meters.
		// Standard parallels and rotation (grid origin latitude and longitude) from 
		//     NOAA Manual NOS NGS 5: State Plane Coordinate System of 1983, p. 67.
		// The scale and translation vector were determined empirically.
		var projection = d3.geoConicConformal()
							.parallels([41 + 43 / 60, 42 + 41 / 60])
							.rotate([71 + 30 / 60, -41 ])
							.scale([20000])
							.translate([80,780]);
		var geoPath = d3.geoPath(projection);
		
		//Define tooltip
		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-5, 0])
			.html(function(d) {
				return "<strong>" + toTitleCase(d.properties.TOWN) + "</strong>";
			});
		
		// Initialize Map
		var svg = d3.select("#map")
			.append("svg")
				.attr("id", "my_map_canvas")
				.attr("width", width)
				.attr("height", height);
		var clip = svg.append("svg:clipPath")		// Defined clip here because IE11 has a bug that doesn't clip the
			.attr("id", "clip")						// child SVG elements to the parent DIV.
			.append("svg:rect")						// See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Clipping_and_masking
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height);
		var state = svg.append("g")					// "g" element defined to display MA State background
			.attr("id", "vmtState")
			.attr("clip-path", "url(#clip)");
		var mpo = svg.append("g")					// "g" element defined to display MA towns in MAPC
			.attr("id", "vmtMap")
			.call(tip);
		CTPS.vmtApp.svgMPO = mpo;				// Saved for later updates in CTPS.vmtApp.renderTheme() 
		var scaleBar = svg.append("g")				// "g" element defined to display scale bar
			.attr("id", "distance_scale");

/*		
		d3.queue()
			.defer(d3.json, jsonData)
			.defer(d3.csv, CTPS.vmtApp.csvData)
			.defer(d3.json, MAoutline)
			.awaitAll(function(error, results) {
				// Check for errors
				if (error !== null) {
					alert('Failure loading JSON or CSV file.\n' +
						  'Status: ' + error.status + '\n' +
						  'Status text: ' + error.statusText + '\n' +
						  'URL :' + error.responseURL);
					return;
				}
				// No errors, bind data values 
                // *** NB 'topoOutline changed to CTPS.vmtApp.outsideMpoFeatures
				var topoOutline = results[2];
				CTPS.vmtApp.topoOutline = topojson.feature(topoOutline, topoOutline.objects.MA_TOWNS_NON_MPO97).features;
				
				// Merge CSV data with JSON data to create JSON object ('CTPS.vmtApp.data') for app
				var topotowns = results[0];
				var csv = results[1];
				var towns = topojson.feature(topotowns, topotowns.objects.MA_TOWNS_MPO97).features;
				for (var i=0; i<towns.length; i++) {
					for (var j=0; j<csv.length; j++) {
						if (+towns[i].properties.TOWN_ID === +csv[j].TOWN_ID) {
							towns[i].properties = csv[j];
						};
					};
				};
				CTPS.vmtApp.data = towns;	// CSV data merged with JSON data to create JSON object with CTPS.vmtApp.data for app
*/
				
        // Create SVG <path> for towns
        var towns = CTPS.vmtApp.townFeatures;
        mpo.selectAll("path")
            .data(towns)
            .enter()
            .append("path")
                .attr("id", function(d, i) { return +(d.properties.TOWN_ID); })
                .attr("class", "towns")
                .attr("d", function(d, i) { return geoPath(d); })
                .style("stroke", "#black")
                .style("stroke-width", "1px")
                .on("mouseenter", function(d) { 
                    tip.show(d); 
                    d3.select(this).style("cursor", "pointer")
                                   .style("fill-opacity", 0.3);
                })
                .on("mouseleave", function(d) { 
                    d3.select(this).style("fill-opacity", 1);
                    tip.hide(d);
                })
                .on("click", function(d) {
                    $(".towns").each(function(i) {
                        this.style.strokeWidth = "1px";
                        this.style.stroke = "#000";
                    });
                    d3.select(this.parentNode.appendChild(this))
                        .transition().duration(100)
                            .style("stroke-width", "4px")
                            .style("stroke", "#ff0000");
                    alert("Funky code by Ethan #1.");
                /*
                    for (var i=0; i<CTPS.vmtApp.data.length; i++) {
                        if (+CTPS.vmtApp.data[i].properties.TOWN_ID === +this.id) {
                            // Reorder data so selected town moved to last element in array.
                            // Needed in order to properly update data, d3 thinks this town
                            // was drawn last and will improperly update the map otherwise
                            CTPS.vmtApp.data.move(i, CTPS.vmtApp.data.length-1);
                        };
                    };
                */
                    alert("TBD: load table with data for town");
                /*                
                    // Log and save Town Name for Table caption
                    CTPS.vmtApp.currentTown = toTitleCase(d.properties.TOWN);
                    
                    // Load Table to display relevent table
                    $("#selected_town").val(+d.properties.TOWN_ID);
                    CTPS.vmtApp.displayTable(d.properties);
                */
                });

        // Create SVG <path> for MA State Outline
        state.selectAll("#vmtState")
            .data(CTPS.vmtApp.outsideMpoFeatures)
            .enter()
            .append("path")
                .attr("id", "MA_State_Outline")
                .attr("d", function(d, i) { return geoPath(d); })
                .style("fill", "#f0f0f0")
                .style("stroke", "#bdbdbd")
                .style("stroke-width", "0.2px");
				
        // Create Scale Bar
        // Code from: https://bl.ocks.org/ThomasThoren/6a543c4d804f35a240f9, but also check out:
        // https://stackoverflow.com/questions/44222003/how-to-add-or-create-a-map-scale-bar-to-a-map-created-with-d3-js
        // because maths might be more accurate
        function pixelLength(this_topojson, this_projection, miles) {
            // Calculates the window pixel length for a given map distance.
            // Not sure if math is okay, given arcs, projection distortion, etc.

            var actual_map_bounds = d3.geoBounds(this_topojson);

            var radians = d3.geoDistance(actual_map_bounds[0], actual_map_bounds[1]);
            var earth_radius = 3959;  // miles
            var arc_length = earth_radius * radians;  // s = r * theta

            var projected_map_bounds = [
                this_projection(actual_map_bounds[0]),
                this_projection(actual_map_bounds[1])
            ];

            var projected_map_width = projected_map_bounds[1][0] - projected_map_bounds[0][0];
            var projected_map_height = projected_map_bounds[0][1] - projected_map_bounds[1][1];
            var projected_map_hypotenuse = Math.sqrt(
                (Math.pow(projected_map_width, 2)) + (Math.pow(projected_map_height, 2))
            );

            var pixels_per_mile = projected_map_hypotenuse / arc_length;
            var pixel_distance = pixels_per_mile * miles;

            return pixel_distance;
        } // pixelLength()
                
        pixels_10mi = pixelLength(topojson.feature(CTPS.vmtApp.topoTowns, CTPS.vmtApp.topoTowns.objects.MA_TOWNS_MPO97), projection, 10);
				
        scaleBar.append("rect")
            .attr("x", $('#map').width() - 15 - pixels_10mi)
            .attr("y", $('#map').height() - 25)
            .attr("width", pixels_10mi)
            .attr("height", 2.5)
            .style("fill", "#000");
        scaleBar.append('text')
            .attr("x", $('#map').width() - 15 - pixels_10mi)
            .attr("y", $('#map').height() - 8)
            .attr("text-anchor", "start")
            .text("10 miles");

	} // initMap()
	
	// Initialize legend (hidden on load)
	CTPS.vmtApp.initLegend = function() {
		var svgLegend = d3.select("#legend_div")
			.append("svg")
			.attr("id", "my_legend")
			.attr("width", legend_width)
			.attr("height", legend_height);
		var legend = svgLegend.selectAll("#legend_div")
			.data([1,2,3,4])
			.enter()
			.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) {
					return "translate(0," + (i * (legendRectSize + legendSpacing) + 8) + ")";
				});
		legend.append("rect")
			.attr("id", "legend_rect")
			.attr("width", legendRectSize)
			.attr("height", legendRectSize);
		legend.append("text")
			.attr("id", "legend_text")
			.attr("x", legendRectSize + legendSpacing)
			.attr("y", legendRectSize - legendSpacing);
		CTPS.vmtApp.legend = legend;
	}	//CTPS.vmtApp.initLegend()
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	5)	Event Handlers
	//
	//////////////////////////////////////////////////////////////////////////////////////
	CTPS.vmtApp.renderTheme = function() {
		var themeVal = $('#selected_theme :selected').val();
		var themeText = $('#selected_theme :selected').text();
		if (themeText !== "Select Map Theme") {
			
			// Define color palette
			var pathcolor = CTPS.vmtApp.themesLookup[themeVal]["threshold"];
			
			// Update Map
			CTPS.vmtApp.svgMPO.selectAll("path")
				.data(CTPS.vmtApp.data)
				.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.style("fill", function(d, i) {
					return pathcolor(d.properties[CTPS.vmtApp.themesLookup[themeVal]["total"]]);
				});
			
			// Update Legend
			$("#legend_title").text(CTPS.vmtApp.themesLookup[themeVal].mapTheme);
			$('#pointer').text(CTPS.vmtApp.themesLookup[themeVal].legendTheme);
			CTPS.vmtApp.legend.select("rect")
				.data(CTPS.vmtApp.themesLookup[themeVal]["legendDomain"])
				.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.style("fill", function(d, i) { 
					return pathcolor(d);
				})
				.style("opacity", "0.7")
				.style("stroke", "#000");
			CTPS.vmtApp.legend.select("text")
				.data(CTPS.vmtApp.themesLookup[themeVal]["legendText"])
				.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.text(function(d, i) { 
					return CTPS.vmtApp.themesLookup[themeVal]["legendText"][i]; 
				});
			
			// Change Accessible Table Tab
			// From: http://blog.ginader.de/dev/jquery/accessible-tabs/open-tab-from-link-2.html
			// $(".tabs").showAccessibleTabSelector(CTPS.vmtApp.themesLookup[themeVal].tabSelect);
			
		} else {
			alert('No theme selected. Please try selecting a theme again from either the dropdown or the table.');
			return;
		};
	}; // CTPS.vmtApp.renderTheme()
	
	CTPS.vmtApp.initHandlers = function() {
		// Load data on new year select 
		$("#display_year").change(function(e) {
			// Select CSV with data from selected year
			var year = +$('#display_year :selected').val();
			CTPS.vmtApp.csvData = CTPS.vmtApp.displayYear(year);
			
			// Load TopoJSON and CSV data, and merge TopoJSON and CSV data for 97 MPO municipalities into CTSP.vmtApp.data
			d3.queue()
				.defer(d3.csv, CTPS.vmtApp.csvData)
				.awaitAll(function(error, results) {
					// Check for errors
					if (error !== null) {
						alert('Failure loading JSON or CSV file.\n' +
							  'Status: ' + error.status + '\n' +
							  'Status text: ' + error.statusText + '\n' +
							  'URL :' + error.responseURL);
						return;
					}
					// No errors, bind data values
					// Merge CSV data with JSON data to create JSON object ('CTPS.vmtApp.data') for app
					var csv = results[0];
					var towns = CTPS.vmtApp.data;
					for (var i=0; i<towns.length; i++) {
						for (var j=0; j<csv.length; j++) {
							if (+towns[i].properties.TOWN_ID === +csv[j].TOWN_ID) {
								towns[i].properties = csv[j];
							};
						};
					};
					CTPS.vmtApp.data = towns;	// CSV data merged with JSON data to create JSON object with CTPS.vmtApp.data for app
					
					// Render Map (if statement to bypass alert in function)
					if ($('#selected_theme :selected').val().length > 0) {
						CTPS.vmtApp.renderTheme();
					};
					
					// Render Table (if statement to bypass alert in function)
					var iTownId = +$('#selected_town :selected').val();
					if (iTownId > 0){
						CTPS.vmtApp.renderTown();
					};
				});
		});
		
		// Change Map Theme display on click (and update corresponding legend).
		// 	The event changes the tab, which then calls the 'CTPS.vmtApp.renderTheme' function. This is
		//	done because 'showAccessibleTabSelector' registers as a 'click' by the table. If the 
		//	'CTPS.vmtApp.renderTheme' function was to be called here directly it would send the page into
		//	an infinite loop where the page keeps trying to render the same map over and over.
		$('#selected_theme').change(function(e) {
			var themeVal = $('#selected_theme :selected').val();
			//Change Accessible Table Tab: http://blog.ginader.de/dev/jquery/accessible-tabs/open-tab-from-link-2.html
			if (!themeVal.length > 0){
				alert('No theme selected. Please try selecting a theme again from either the dropdown or the table.');
				return;
			} else {
				$(".tabs").showAccessibleTabSelector(CTPS.vmtApp.themesLookup[themeVal].tabSelect);
			};
		});
				
		// Bind theme names as class name to table tabs
		for (var i=0; i<CTPS.vmtApp.themes.length; i++) {
			$(CTPS.vmtApp.themesLookup[CTPS.vmtApp.themes[i]].tabSelect).addClass(CTPS.vmtApp.themes[i]);
		};
		// Change map theme display on table tab switch
		$('#vmt, #vht, #voc, #nox, #co, #co2').click(function(e) {
			$("#selected_theme").val(e.target.className);
			CTPS.vmtApp.renderTheme();
		});
	}; // CTPS.vmtApp.initHandlers()
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	6)	Application Initialization, Data Selection
	//
	//////////////////////////////////////////////////////////////////////////////////////
	CTPS.vmtApp.displayYear = function(year) {
		switch (year) {
			case 2016:
				return csvData_2016;
				break;;
			case 2040:
				return csvData_2040;
				break;
			default:
				alert("Please select a year from the dropdown.");
				break;
		};
	};
	
	CTPS.vmtApp.init = function() {   
		// Initialize Map
		CTPS.vmtApp.csvData = CTPS.vmtApp.displayYear(2016); //load 2016 data on start

		// CTPS.vmtApp.initMap();
		
		// Set the "alt" and "title" attributes of the page element containing the map.
		$('#map').attr("alt","Map of Boston Region MPO town boundaries");
		$('#map').attr("title","Map of Boston Region MPO town boundaries");
		
		// Initialize Map Legend
		CTPS.vmtApp.initLegend();

		// Initialize Event Handlers
		CTPS.vmtApp.initHandlers();
	};
	
	// Initialize App
	CTPS.vmtApp.init();
};