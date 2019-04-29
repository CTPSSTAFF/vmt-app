/**
 *	Boston Region MPO Vehicle Miles Traveled and Emissions Data Browser
 *	
 *	Application description:
 *		This application may be used to browse CTPS's database of modeled vehicle miles 
 *		traveled (VMT), vehicle hours traveled (VHT), and emissions data for the 101 cities 
 *		and towns in the Boston Region Metropolitan Planning Organization (MPO).
 *
 *	Last update:
 *		09/2017 -- EKE
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

function vmtAppInit() {
	
	var CTPS = {};
	CTPS.vmtApp = {};
	CTPS.vmtApp.data = {};
	CTPS.vmtApp.currentTown = '';
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	0)	Constants, definitions, and lookup tables
	//
	//////////////////////////////////////////////////////////////////////////////////////
	// Files to be loaded by App
	var jsonData = "data_old/MA_TOWNS_MPO101.json";
	var MAoutline = "data_old/MA_TOWNS_NON_MPO101.json";
	CTPS.vmtApp.csvData = '';
	var csvData_2012 = "data_old/CTPS_TOWNS_MAPC_VMT_2012.csv";
	var csvData_2020 = "data_old/CTPS_TOWNS_MAPC_VMT_2020.csv";
	var csvData_2040 = "data_old/CTPS_TOWNS_MAPC_VMT_2040.csv";
	/*
	//FOR SWITCH TO 97 TOWNS - EKE 11/2017
	var jsonData = "data/MA_TOWNS_MPO97.json";
	var MAoutline = "data/MA_TOWNS_NON_MPO97.json";
	CTPS.vmtApp.csvData = '';
	var csvData_2012 = "data/CTPS_TOWNS_MAPC_97_VMT_2012.csv";
	var csvData_2020 = "data/CTPS_TOWNS_MAPC_97_VMT_2020.csv";
	var csvData_2040 = "data/CTPS_TOWNS_MAPC_97_VMT_2040.csv";
	//*/
	
	var helpData = "vmtAppHelp.html";
	
	// Pre-defined constants
	var i,
		width = $('#map').width(),
		height = $('#map').height(),
		legend_width = 240,
		legend_height = 120,
		legendRectSize = 16,
		legendSpacing = 4;
	
	// Array of map themes
	CTPS.vmtApp.themes = [
		"THEME_VMT",
		"THEME_VHT",
		"THEME_VOC",
		"THEME_NOX", 
		"THEME_CO", 
		"THEME_CO2"
	];

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

	// Data "stores" for the accessible grids - really just arrays of objects (key/value pairs).
	CTPS.vmtApp.vmtStore = [];
	CTPS.vmtApp.vhtStore = [];
	CTPS.vmtApp.vocStore = [];
	CTPS.vmtApp.noxStore = [];
	CTPS.vmtApp.coStore  = [];
	CTPS.vmtApp.co2Store = []; 
		
	//Accessible Table Row Names
	CTPS.vmtApp.aRowNames = [
		'Single Occupant Vehicles',
		'High Occupant Vehicles',
		'Trucks',
		'Total (SOV, HOV, Trucks)'
	];
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	1)	Utility Functions
	//
	//////////////////////////////////////////////////////////////////////////////////////	
	// Function to open URL in new window -- used for "Help Button"
	function popup(url) {
		popupWindow = window.open(url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=yes')
	};
	
	//Functions to Hide/Unhide Tabs -- exists this way to remove individual class names if multiple exist
	function hideTab() {
		var e = document.getElementById('mytabs');
		e.className += ' hidden';
	};
	function unhideTab() {
		var e = document.getElementById('mytabs');
		e.className = e.className.replace(/hidden/gi,"");
	};
	
	// Function to capitalize only first letter of Town names
	// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/196991#196991
	function toTitleCase(str) {
		return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};
	
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
	};
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	2)	Populate combo boxes
	//
	//////////////////////////////////////////////////////////////////////////////////////
	// Populate "Select Map Theme" combo box
	for (i = 0; i < CTPS.vmtApp.themes.length; i++) {
		$("#selected_theme").append(
			$("<option />")
				.val(CTPS.vmtApp.themes[i])
				.text(CTPS.vmtApp.themesLookup[CTPS.vmtApp.themes[i]]["mapTheme"])
		);
	};
	
	// Populate "Select A Municipality" combo box
	for (i = 0; i < CTPSUTILS.aMpoTowns.length; i++) {
		$("#selected_town").append(
			$("<option />")
				.val(CTPSUTILS.aMpoTowns[i][0])
				.text(toTitleCase(CTPSUTILS.aMpoTowns[i][1]))
		);
	};

	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	3)	Functions to Create/Update Accessible Table
	//
	//////////////////////////////////////////////////////////////////////////////////////
	CTPS.vmtApp.renderTown = function() {
		var iTownId = +$('#selected_town :selected').val();
		
		if (!iTownId > 0){
			alert('No city or town selected. Please try selecting a theme again from either the dropdown or the map.');
			return;
		} else {
			// Log and save Town Name for Table caption
			CTPS.vmtApp.currentTown = $('#selected_town :selected').text();
			
			// Display table with selected data for town
			for (i=0; i<CTPS.vmtApp.data.length; i++) {
				if (+(CTPS.vmtApp.data[i].properties.TOWN_ID) === iTownId){
					CTPS.vmtApp.displayTable(CTPS.vmtApp.data[i].properties);
					break;
				};
			};
			
			// Change highlighted town on map to reflect selected town
			$(".towns").each(function(i) {
				if ( +this.id === +iTownId ) {
					// Outline clicked town in red, bring to front
					d3.select(this.parentNode.appendChild(this))
						.transition().duration(100)
							.style("stroke-width", "4px")
							.style("stroke", "#ff0000");
					for (var i=0; i<CTPS.vmtApp.data.length; i++) {
						if (+CTPS.vmtApp.data[i].properties.TOWN_ID === +this.id) {
							// Reorder data so selected town moved to last element in array.
							// Needed in order to properly update data, d3 thinks this town
							// was drawn last and will improperly update the map otherwise
							CTPS.vmtApp.data.move(i, CTPS.vmtApp.data.length-1);
						};
					};
				} else {
					this.style.strokeWidth = "1px";
					this.style.stroke = "#000";
				};
			});
		};
	};	//CTPS.vmtApp.renderTown()
	
	// Function to initialize the Table Grids
	CTPS.vmtApp.initializeGrids = function() {
		var colDesc = [ { header : 'Mode', 		dataIndex : 'title' }, 
						{ header : '6AM-9AM', 	dataIndex : 'am' }, 
						{ header : '9AM-3PM', 	dataIndex : 'md' }, 
						{ header : '3PM-6PM', 	dataIndex : 'pm' },
						{ header : '6PM-6AM', 	dataIndex : 'nt' },
						{ header : 'Daily', 	dataIndex : 'total' }
						];
		
		CTPS.vmtApp.vmtGrid = new AccessibleGrid( { divId 		:	'vmt_grid',
													tableId 	:	'vmt_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total vehicle miles',
													caption		:	'Vehicle Miles of Travel for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.vmtGrid.loadArrayData(CTPS.vmtApp.vmtStore);

		CTPS.vmtApp.vhtGrid = new AccessibleGrid( { divId 		:	'vht_grid',
													tableId 	:	'vht_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total vehicle hours of travel',
													caption		:	'Vehicle Hours of Travel for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.vhtGrid.loadArrayData(CTPS.vmtApp.vhtStore);
		
		CTPS.vmtApp.vocGrid = new AccessibleGrid( { divId 		:	'voc_grid',
													tableId 	:	'voc_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total grams of V O C',
													caption		:	'Volatile Organic Compounds, grams, for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.vocGrid.loadArrayData(CTPS.vmtApp.vocStore);
		
		CTPS.vmtApp.noxGrid = new AccessibleGrid( { divId 		:	'nox_grid',
													tableId 	:	'nox_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total grams of N O X',
													caption		:	'Nitrogen Oxides, grams, for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.noxGrid.loadArrayData(CTPS.vmtApp.noxStore);
		
		CTPS.vmtApp.coGrid = new AccessibleGrid( { divId 		:	'co_grid',
													tableId 	:	'co_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total kilograms of C O',
													caption		:	'Carbon Monoxide, grams, for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.coGrid.loadArrayData(CTPS.vmtApp.coStore);
		
		CTPS.vmtApp.co2Grid = new AccessibleGrid( { divId 		:	'co2_grid',
													tableId 	:	'co2_table',
													summary		: 	'Table columns are daily peak and off peak period divisions plus daily totals, rows are 3 vehicle types, cells are total kilograms of C O 2',
													caption		:	'Carbon Dioxide, grams, for ' + CTPS.vmtApp.currentTown,
													ariaLive	:	'assertive',
													colDesc		: 	colDesc
										});								
		CTPS.vmtApp.co2Grid.loadArrayData(CTPS.vmtApp.co2Store);

		return { "vmtGrid": CTPS.vmtApp.vmtGrid,
				 "vhtGrid": CTPS.vmtApp.vhtGrid,
				 "vocGrid": CTPS.vmtApp.vocGrid,
				 "noxGrid": CTPS.vmtApp.noxGrid,
				 "coGrid" : CTPS.vmtApp.coGrid,
				 "co2Grid": CTPS.vmtApp.co2Grid	}
	};

	// Function to load the Table data into the data stores
	CTPS.vmtApp.populateDataStores = function(aAttrs) {
		// #1 VMT data		
		CTPS.vmtApp.vmtStore = [];
		CTPS.vmtApp.vmtStore[0] = { title	: CTPS.vmtApp.aRowNames[0],                                
									am		: (+(+aAttrs.VMT_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VMT_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VMT_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VMT_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VMT_SOV_AM)+(+aAttrs.VMT_SOV_MD)+(+aAttrs.VMT_SOV_PM)+(+aAttrs.VMT_SOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.vmtStore[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.VMT_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VMT_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VMT_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VMT_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VMT_HOV_AM)+(+aAttrs.VMT_HOV_MD)+(+aAttrs.VMT_HOV_PM)+(+aAttrs.VMT_HOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.vmtStore[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.VMT_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VMT_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VMT_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VMT_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VMT_TRK_AM)+(+aAttrs.VMT_TRK_MD)+(+aAttrs.VMT_TRK_PM)+(+aAttrs.VMT_TRK_NT)).toFixed(0)).toLocaleString() };
	
		CTPS.vmtApp.vmtStore[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.VMT_SOV_AM)+(+aAttrs.VMT_HOV_AM)+(+aAttrs.VMT_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.VMT_SOV_MD)+(+aAttrs.VMT_HOV_MD)+(+aAttrs.VMT_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.VMT_SOV_PM)+(+aAttrs.VMT_HOV_PM)+(+aAttrs.VMT_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.VMT_SOV_NT)+(+aAttrs.VMT_HOV_NT)+(+aAttrs.VMT_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.VMT_TOTAL).toFixed(0)).toLocaleString() };
									
		// #2 VHT data			
		CTPS.vmtApp.vhtStore = []; 
		CTPS.vmtApp.vhtStore[0] = { title	: CTPS.vmtApp.aRowNames[0],
									am		: (+(+aAttrs.VHT_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VHT_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VHT_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VHT_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VHT_SOV_AM)+(+aAttrs.VHT_SOV_MD)+(+aAttrs.VHT_SOV_PM)+(+aAttrs.VHT_SOV_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.vhtStore[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.VHT_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VHT_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VHT_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VHT_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VHT_HOV_AM)+(+aAttrs.VHT_HOV_MD)+(+aAttrs.VHT_HOV_PM)+(+aAttrs.VHT_HOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.vhtStore[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.VHT_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VHT_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VHT_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VHT_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VHT_TRK_AM)+(+aAttrs.VHT_TRK_MD)+(+aAttrs.VHT_TRK_PM)+(+aAttrs.VHT_TRK_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.vhtStore[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.VHT_SOV_AM)+(+aAttrs.VHT_HOV_AM)+(+aAttrs.VHT_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.VHT_SOV_MD)+(+aAttrs.VHT_HOV_MD)+(+aAttrs.VHT_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.VHT_SOV_PM)+(+aAttrs.VHT_HOV_PM)+(+aAttrs.VHT_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.VHT_SOV_NT)+(+aAttrs.VHT_HOV_NT)+(+aAttrs.VHT_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.VHT_TOTAL).toFixed(0)).toLocaleString() };
									
		// #3 VOC data	
		CTPS.vmtApp.vocStore = [];
		CTPS.vmtApp.vocStore[0] = { title	: CTPS.vmtApp.aRowNames[0],
									am		: (+(+aAttrs.VOC_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VOC_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VOC_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VOC_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VOC_SOV_AM)+(+aAttrs.VOC_SOV_MD)+(+aAttrs.VOC_SOV_PM)+(+aAttrs.VOC_SOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.vocStore[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.VOC_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VOC_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VOC_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VOC_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VOC_HOV_AM)+(+aAttrs.VOC_HOV_MD)+(+aAttrs.VOC_HOV_PM)+(+aAttrs.VOC_HOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.vocStore[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.VOC_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.VOC_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.VOC_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.VOC_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.VOC_TRK_AM)+(+aAttrs.VOC_TRK_MD)+(+aAttrs.VOC_TRK_PM)+(+aAttrs.VOC_TRK_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.vocStore[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.VOC_SOV_AM)+(+aAttrs.VOC_HOV_AM)+(+aAttrs.VOC_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.VOC_SOV_MD)+(+aAttrs.VOC_HOV_MD)+(+aAttrs.VOC_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.VOC_SOV_PM)+(+aAttrs.VOC_HOV_PM)+(+aAttrs.VOC_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.VOC_SOV_NT)+(+aAttrs.VOC_HOV_NT)+(+aAttrs.VOC_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.VOC_TOTAL).toFixed(0)).toLocaleString() };
									
		// #4 NOX data				
		CTPS.vmtApp.noxStore = [];
		CTPS.vmtApp.noxStore[0] = {	title	: CTPS.vmtApp.aRowNames[0],	
									am		: (+(+aAttrs.NOX_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.NOX_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.NOX_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.NOX_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.NOX_SOV_AM)+(+aAttrs.NOX_SOV_MD)+(+aAttrs.NOX_SOV_PM)+(+aAttrs.NOX_SOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.noxStore[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.NOX_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.NOX_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.NOX_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.NOX_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.NOX_HOV_AM)+(+aAttrs.NOX_HOV_MD)+(+aAttrs.NOX_HOV_PM)+(+aAttrs.NOX_HOV_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.noxStore[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.NOX_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.NOX_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.NOX_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.NOX_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.NOX_TRK_AM)+(+aAttrs.NOX_TRK_MD)+(+aAttrs.NOX_TRK_PM)+(+aAttrs.NOX_TRK_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.noxStore[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.NOX_SOV_AM)+(+aAttrs.NOX_HOV_AM)+(+aAttrs.NOX_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.NOX_SOV_MD)+(+aAttrs.NOX_HOV_MD)+(+aAttrs.NOX_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.NOX_SOV_PM)+(+aAttrs.NOX_HOV_PM)+(+aAttrs.NOX_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.NOX_SOV_NT)+(+aAttrs.NOX_HOV_NT)+(+aAttrs.NOX_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.NOX_TOTAL).toFixed(0)).toLocaleString() };
									
		// #5 CO data				
		CTPS.vmtApp.coStore = [];
		CTPS.vmtApp.coStore[0] = { title	: CTPS.vmtApp.aRowNames[0],
									am		: (+(+aAttrs.CO_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO_SOV_AM)+(+aAttrs.CO_SOV_MD)+(+aAttrs.CO_SOV_PM)+(+aAttrs.CO_SOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.coStore[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.CO_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO_HOV_AM)+(+aAttrs.CO_HOV_MD)+(+aAttrs.CO_HOV_PM)+(+aAttrs.CO_HOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.coStore[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.CO_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO_TRK_AM)+(+aAttrs.CO_TRK_MD)+(+aAttrs.CO_TRK_PM)+(+aAttrs.CO_TRK_NT)).toFixed(0)).toLocaleString() };

		CTPS.vmtApp.coStore[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.CO_SOV_AM)+(+aAttrs.CO_HOV_AM)+(+aAttrs.CO_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.CO_SOV_MD)+(+aAttrs.CO_HOV_MD)+(+aAttrs.CO_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.CO_SOV_PM)+(+aAttrs.CO_HOV_PM)+(+aAttrs.CO_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.CO_SOV_NT)+(+aAttrs.CO_HOV_NT)+(+aAttrs.CO_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.CO_TOTAL).toFixed(0)).toLocaleString() };
									
		// #6 CO2 data				
		CTPS.vmtApp.co2Store = [];
		CTPS.vmtApp.co2Store[0] = { title	: CTPS.vmtApp.aRowNames[0],
									am		: (+(+aAttrs.CO2_SOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO2_SOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO2_SOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO2_SOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO2_SOV_AM)+(+aAttrs.CO2_SOV_MD)+(+aAttrs.CO2_SOV_PM)+(+aAttrs.CO2_SOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.co2Store[1] = { title	: CTPS.vmtApp.aRowNames[1],
									am		: (+(+aAttrs.CO2_HOV_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO2_HOV_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO2_HOV_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO2_HOV_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO2_HOV_AM)+(+aAttrs.CO2_HOV_MD)+(+aAttrs.CO2_HOV_PM)+(+aAttrs.CO2_HOV_NT)).toFixed(0)).toLocaleString() };
									
		CTPS.vmtApp.co2Store[2] = { title	: CTPS.vmtApp.aRowNames[2],
									am		: (+(+aAttrs.CO2_TRK_AM).toFixed(0)).toLocaleString(),
									md		: (+(+aAttrs.CO2_TRK_MD).toFixed(0)).toLocaleString(),
									pm		: (+(+aAttrs.CO2_TRK_PM).toFixed(0)).toLocaleString(),
									nt		: (+(+aAttrs.CO2_TRK_NT).toFixed(0)).toLocaleString(),
									total	: (+((+aAttrs.CO2_TRK_AM)+(+aAttrs.CO2_TRK_MD)+(+aAttrs.CO2_TRK_PM)+(+aAttrs.CO2_TRK_NT)).toFixed(0)).toLocaleString() };
		
		CTPS.vmtApp.co2Store[3] = { title	: CTPS.vmtApp.aRowNames[3],
									am		: (+((+aAttrs.CO2_SOV_AM)+(+aAttrs.CO2_HOV_AM)+(+aAttrs.CO2_TRK_AM)).toFixed(0)).toLocaleString(),
									md		: (+((+aAttrs.CO2_SOV_MD)+(+aAttrs.CO2_HOV_MD)+(+aAttrs.CO2_TRK_MD)).toFixed(0)).toLocaleString(),
									pm		: (+((+aAttrs.CO2_SOV_PM)+(+aAttrs.CO2_HOV_PM)+(+aAttrs.CO2_TRK_PM)).toFixed(0)).toLocaleString(),
									nt		: (+((+aAttrs.CO2_SOV_NT)+(+aAttrs.CO2_HOV_NT)+(+aAttrs.CO2_TRK_NT)).toFixed(0)).toLocaleString(),
									total	: (+(+aAttrs.CO2_TOTAL).toFixed(0)).toLocaleString() };
									
		return { "vmtStore": CTPS.vmtApp.vmtStore,
				 "vhtStore": CTPS.vmtApp.vhtStore,
				 "vocStore": CTPS.vmtApp.vocStore,
				 "noxStore": CTPS.vmtApp.noxStore,
				 "coStore": CTPS.vmtApp.coStore,
				 "co2Store": CTPS.vmtApp.co2Store };
	};
	
	//Function to clear Table Grids
	CTPS.vmtApp.clearGrids = function() {
		$('#vmt_grid').html("");
		$('#vht_grid').html("");
		$('#voc_grid').html("");
		$('#nox_grid').html("");
		$('#co_grid').html("");
		$('#co2_grid').html("");
	};

	//Function to display Table (called above on click)
	CTPS.vmtApp.displayTable = function(data) {
		
		//Reset and unhide table
		hideTab();
		CTPS.vmtApp.clearGrids();
		unhideTab();
		
		//Initialize Grid and Data Store						
		CTPS.vmtApp.initializeGrids();
		
		//Load Data Store and populate Grid
		CTPS.vmtApp.populateDataStores(data);
		CTPS.vmtApp.vmtGrid.loadArrayData(CTPS.vmtApp.vmtStore);
		CTPS.vmtApp.vhtGrid.loadArrayData(CTPS.vmtApp.vhtStore);
		CTPS.vmtApp.vocGrid.loadArrayData(CTPS.vmtApp.vocStore);
		CTPS.vmtApp.noxGrid.loadArrayData(CTPS.vmtApp.noxStore);
		CTPS.vmtApp.coGrid.loadArrayData(CTPS.vmtApp.coStore);
		CTPS.vmtApp.co2Grid.loadArrayData(CTPS.vmtApp.co2Store);
		
	};

	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	4)	Map and Map Legend Initialization/Rendering Functions
	//
	//////////////////////////////////////////////////////////////////////////////////////
	CTPS.vmtApp.initMap = function() {
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
				var topoOutline = results[2];
				CTPS.vmtApp.topoOutline = topojson.feature(topoOutline, topoOutline.objects.MA_TOWNS_NON_MPO101).features;
				
				// Merge CSV data with JSON data to create JSON object ('CTPS.vmtApp.data') for app
				var topotowns = results[0];
				var csv = results[1];
				var towns = topojson.feature(topotowns, topotowns.objects.MA_TOWNS_MPO101).features;
				for (var i=0; i<towns.length; i++) {
					for (var j=0; j<csv.length; j++) {
						if (+towns[i].properties.TOWN_ID === +csv[j].TOWN_ID) {
							towns[i].properties = csv[j];
						};
					};
				};
				CTPS.vmtApp.data = towns;	// CSV data merged with JSON data to create JSON object with CTPS.vmtApp.data for app
				
				// Create SVG <path> for towns
				mpo.selectAll("path")
					.data(CTPS.vmtApp.data)
					.enter()
					.append("path")
						.attr("id", function(d, i) { return +(d.properties.TOWN_ID); })
						.attr("class", "towns")
						.attr("d", function(d, i) { return geoPath(d); })
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
							for (var i=0; i<CTPS.vmtApp.data.length; i++) {
								if (+CTPS.vmtApp.data[i].properties.TOWN_ID === +this.id) {
									// Reorder data so selected town moved to last element in array.
									// Needed in order to properly update data, d3 thinks this town
									// was drawn last and will improperly update the map otherwise
									CTPS.vmtApp.data.move(i, CTPS.vmtApp.data.length-1);
								};
							};
							
							// Log and save Town Name for Table caption
							CTPS.vmtApp.currentTown = toTitleCase(d.properties.TOWN);
							
							// Load Table to display relevent table
							$("#selected_town").val(+d.properties.TOWN_ID);
							CTPS.vmtApp.displayTable(d.properties);
						});

				// Create SVG <path> for MA State Outline
				state.selectAll("#vmtState")
					.data(CTPS.vmtApp.topoOutline)
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
				};
				
				var pixels_10mi = pixelLength(topojson.feature(topotowns, topotowns.objects.MA_TOWNS_MPO101), projection, 10);
				
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
			});	
	};	//CTPS.vmtApp.initMap()
	
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
	};	//CTPS.vmtApp.initLegend()
	
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
	};
	
	CTPS.vmtApp.initHandlers = function() {
		// Load data on new year select 
		$("#display_year").change(function(e) {
			// Select CSV with data from selected year
			var year = +$('#display_year :selected').val();
			CTPS.vmtApp.csvData = CTPS.vmtApp.displayYear(year);
			
			// Load and Store Data
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
		
		// Display Data Table for Municipality
		$("#selected_town").change(function(e) {
			CTPS.vmtApp.renderTown();
		});
		
		// Help Button
		$('#help_button').click(function(e) {
			popup(helpData);
		});
		
		// Download Data Button
		$('#download_button_2012, #download_button_2020, #download_button_2040').each(function() { 
			$(this).click(function() {
				window.location = $(this).find('a').attr('href');
			});	
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

	};
	
	//////////////////////////////////////////////////////////////////////////////////////
	//
	//	6)	Application Initialization, Data Selection
	//
	//////////////////////////////////////////////////////////////////////////////////////
	CTPS.vmtApp.displayYear = function(year) {
		switch (year) {
			case 2012:
				return csvData_2012;
				break;
			case 2020:
				return csvData_2020;
				break;
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
		CTPS.vmtApp.csvData = CTPS.vmtApp.displayYear(2012); //load 2012 data on start
		CTPS.vmtApp.initMap();
		
		// Set the "alt" and "title" attributes of the page element containing the map.
		$('#map').attr("alt","Map of Boston Region MPO town boundaries");
		$('#map').attr("title","Map of Boston Region MPO town boundaries");
		
		// Initialize Map Legend
		CTPS.vmtApp.initLegend();
		
		// Initialize Table
		CTPS.vmtApp.initializeGrids();
		
		// Initialize Event Handlers
		CTPS.vmtApp.initHandlers();
	};
	
	// Initialize App!
	CTPS.vmtApp.init();
	
};



