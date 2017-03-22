var geocoder = new google.maps.Geocoder();

var WhereToBuy = WhereToBuy || {};
var WhereToBuy = {

    // Map config
    map: null,
    map_centroid: [41.790, -87.636],
    defaultZoom: 8,
    lastClickedLayer: null,
    legend: null,
    locationScope: 'Chicago',

    // Carto databases
    community_areas: 'chicago_community_areas',

    // Layer styles
    boundaries: {
        cartocss: $('#boundary-styles').html().trim(),
        color: '#ffffcc',
        opacity: 0.75
    },

    initialize: function() {

        var google_map_styles = [
            {
                stylers: [
                    { saturation: -100 },
                    { lightness: 40 }
                ]
            }
        ];

        if (!WhereToBuy.map) {
            // Initialize a Leaflet map
            WhereToBuy.map = L.map('map', {
                center: WhereToBuy.map_centroid,
                zoom: WhereToBuy.defaultZoom,
                dragging: true,
                touchZoom: true,
                zoomControl: true,
                tap: true,
                scrollWheelZoom: false
            });
        }

        // Add streets to the map
        WhereToBuy.streets = new L.Google('ROADMAP', {mapOptions: {styles: google_map_styles}});
        WhereToBuy.map.addLayer(WhereToBuy.streets);
    }

};