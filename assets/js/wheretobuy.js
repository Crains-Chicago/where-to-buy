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
    info: null,

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

        // Create the community infobox and define its interactivity
        WhereToBuy.info = L.control({position: 'topright'});

        WhereToBuy.info.onAdd = function() {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        WhereToBuy.info.update = function(props) {
            var text = '<p class="small">Hover over a community</p>';
            if (props) {
                text = '';
                if (props.name) {
                    text += '<p class="small">' + props.name + '</p>';
                }
            }
            this._div.innerHTML = text;
        };

        WhereToBuy.info.clear = function() {
            this._div.innerHTML = '<p class="small">Hover over a community</p>';
        };

        WhereToBuy.info.addTo(WhereToBuy.map);

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

        // Bind GeoJSON UX to the feature
        var onEachFeature = function(feature, layer) {
            // Bind popup on click
            // if (feature.properties && feature.properties.name) {
            //     layer.bindPopup(feature.properties.name);
            // }

            if (feature.properties && feature.properties.name) {
                var props = feature.properties;
                layer.on('mouseover', function(e) {
                    highlightFeature(e);
                    WhereToBuy.info.update(props);
                });
                layer.on('mouseout', function(e) {
                    resetHighlight(e);
                    WhereToBuy.info.clear(props);
                });
            }

            // layer.on({
            //     mouseover: highlightFeature,
            //     mouseout: resetHighlight,
            // });
        };

        var layerOpts = {
            style: layerStyle,
            onEachFeature: onEachFeature
        };

        // Get boundaries as GeoJSON and add them to the map
        $.getJSON(WhereToBuy.dataDir + 'places.geojson', function(data) {
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