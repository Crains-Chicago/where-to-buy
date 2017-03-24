var geocoder = new google.maps.Geocoder();

var WhereToBuy = WhereToBuy || {};
var WhereToBuy = {

    // Map config
    map: null,
    mapCentroid: [41.9, -87.8],
    googleStyles: [{
                        stylers: [
                            { saturation: -100 },
                            { lightness: 40 }
                        ]
                      }],
    defaultZoom: 8,
    lastClickedLayer: null,
    legend: null,
    locationScope: 'Chicago',
    dataDir: '../../data/final/',
    geojsonLayer: null,

    // Carto databases
    chicagoBoundaries: 'chicago_community_areas',
    suburbBoundaries: 'suburb_boundaries',

    // Layer styles
    boundaries: {
        cartocss: $('#boundary-styles').html().trim(),
        color: '#ffffcc',
        opacity: 0.75
    },

    initialize: function() {

        if (!WhereToBuy.map) {
            // Initialize a Leaflet map
            WhereToBuy.map = L.map('map', {
                center: WhereToBuy.mapCentroid,
                zoom: WhereToBuy.defaultZoom,
                dragging: true,
                touchZoom: true,
                zoomControl: true,
                tap: true,
                scrollWheelZoom: false
            });
        }

        // Add streets to the map
        WhereToBuy.streets = new L.Google('ROADMAP', {mapOptions: {styles: WhereToBuy.googleStyles}});
        WhereToBuy.map.addLayer(WhereToBuy.streets);

        // Define GeoJSON styles
        var layerStyle = {
            'color': '#FF6600',
            'weight': 0.5,
            'opacity': 0.5,
            'fillColor': '#FF6600',
            'fillOpacity': 0.5
        };

        // Define GeoJSON feature UX

        var highlightFeature = function(e) {
            var layer = e.target;

            layer.setStyle({
                color: '#666',
                weight: 2,
                opacity: 0.5,
                fillColor: '#FF6600',
                fillOpacity: 1
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
        };

        var resetHighlight = function(e) {
            geojsonLayer.resetStyle(e.target);
        };

        var onEachFeature = function(feature, layer) {
            // Bind popup on click
            if (feature.properties && feature.properties.name) {
                layer.bindPopup(feature.properties.name);
            }

            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
            });
        };

        // Layer options for geoJSON
        var layerOpts = {
            style: layerStyle,
            onEachFeature: onEachFeature
        };

        // Get boundaries as geoJSON and add them to the map
        $.getJSON(WhereToBuy.dataDir + 'places.geojson', function(data) {
            console.log(data);
            geojsonLayer = L.geoJson(data, layerOpts).addTo(WhereToBuy.map);
        }).done(function() {

        });

        // Construct Carto query
        //var fields = "";
        // var layerOpts = {
        //     user_name: 'datamade',
        //     type: 'cartodb',
        //     sublayers: [{
        //         sql: "SELECT * FROM " + WhereToBuy.suburbBoundaries,
        //         cartocss: WhereToBuy.boundaries.cartocss,
        //         //interactivity: fields
        //     }]
            // , {
            //     sql: "SELECT * FROM " + WhereToBuy.suburbBoundaries,
            //     cartocss: WhereToBuy.boundaries.cartocss,
            //     //interactivity: fields
            // }]
        // };

        // L.tileLayer('https://cartocdn-ashbu.global.ssl.fastly.net/datamade/api/v1/map/413e234246f257a11f5aa25f70741231:1490206179638/0/{z}/{x}/{y}.png').addTo(WhereToBuy.map);

        // Query carto for boundaries
        // var boundaries = cartodb.createLayer(WhereToBuy.map, layerOpts, { https: true })
        //     .addTo(WhereToBuy.map);
        //     function(layer) {

        //         var sublayers = [];
        //         var sub1 = layer.getSubLayer(0);
        //         var sub2 = layer.getSubLayer(1);
        //         sublayers.push(sub1, sub2);

        //         sublayers.forEach(function(sublayer) {
        //             sublayer.setInteraction(true);
        //             // Set more interactions here
        //         });
        // }).on('done', function(layer) {
        //     console.log(layer);
        //     layer.addTo(WhereToBuy.map);
        // });
    }

};