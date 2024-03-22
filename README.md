# vmt-app
VMT/VHT/Emissions data browser for Boston Region MPO

This application may be used to browse CTPS's data on modeled vehicle miles 
traveled (VMT), vehicle hours traveled (VHT), and emissions data for the 97
(formerly 101) cities and towns in the Boston Region Metropolitan Planning 
Organization (MPO) region.

Major version 3: August 2019, by Ben Krepp

This version uses CSV and TopoJSON file data sources, and rendered data in the
client using the d3.js library. The CSV data sources supply a single "total"
data value for VMT, VHT, and the emissions factors, for each town. 

Major version 2: September 2017, by Ethan Ebinger

This version used CSV and TopoJSON file data sources, and rendered data in the
client using the d3.js library. The CSV data sources broke out VMT, VHT, and
emissions data for each town by time period (morning peak, mid-day, evening
peak, and night hours) and by vehicle class (single occupant vehicles, 
high occupant vehicles, trucks, and all vehicles.) The code for this version
is the 'baseline' checked into GitHub.

Major version 1: circa 2014, by Mary McShane

This version used data sources housed in an Oracle/ArcSDE database, published
by GeoServer as WFSs, and rendered data in the client by OpenLayers (version 2).
The source code for this version was never checked into GitHub.

This app depends upon the following external libraries:
  1. jQuery.js version 1.7.1
  2. underscore.js version 1.9.1
  3. d3.js version 4.8.0
  4. d3-tip - version for d3v4
  4. topojson.js version 3.0.0
  5. CTPS accessibleGrid.js
  6. CTPS ctpsutils.js

Previous versions of this app depended upon verion 1.9.4 of the jQuery accessibleTabs plugin.

## Colophon
Author: Ben Krepp (bkrepp@ctps.org)
Last revision: August 2019
Location: Cyberspace
