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

    // Carto databases
    chicagoBoundaries: 'nf_qia_boundary',
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

        // Construct Carto query
        //var fields = "";
        var layerOpts = {
            user_name: 'datamade',
            type: 'cartodb',
            sublayers: [{
                sql: "SELECT * FROM " + WhereToBuy.suburbBoundaries,
                cartocss: WhereToBuy.boundaries.cartocss,
                //interactivity: fields
            }]
            // , {
            //     sql: "SELECT * FROM " + WhereToBuy.suburbBoundaries,
            //     cartocss: WhereToBuy.boundaries.cartocss,
            //     //interactivity: fields
            // }]
        };

        L.tileLayer('https://cartocdn-ashbu.global.ssl.fastly.net/datamade/api/v1/map/413e234246f257a11f5aa25f70741231:1490206179638/0/{z}/{x}/{y}.png').addTo(WhereToBuy.map);

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