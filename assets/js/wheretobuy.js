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
    suburbLayer: null,
    chicagoLayer: null,
    info: null,
    workplace: null,
    layerMap: {},
    marker: null,
    chicagoData: null,
    suburbData: null,

    initialize: function() {

        // Initialize a Leaflet map
        if (!WhereToBuy.map) {
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
                } else if (props.community) {
                     text += '<p class="small">' + WhereToBuy.titleCase(props.community) + ' (Chicago)</p>';
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
            // Different behavior based on the input
            var layer;
            if (e.target) {
                layer = e.target;
            } else {
                layer = e;
            }

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
            // Different behavior based on the input
            var layer;
            if (e.target) {
                layer = e.target;
            } else {
                layer = e;
            }

            suburbLayer.resetStyle(layer);
            chicagoLayer.resetStyle(layer);
        };

        // Bind GeoJSON UX to the feature
        var onEachFeature = function(feature, layer) {
            if (feature.properties && (feature.properties.name || feature.properties.community)) {
                if (feature.properties.name) {
                    WhereToBuy.layerMap[feature.properties.name.toLowerCase()] = layer;
                } else if (feature.properties.community) {
                    WhereToBuy.layerMap[feature.properties.community.toLowerCase()] = layer;
                }

                var props = feature.properties;

                // Bind hover events
                layer.on('mouseover', function(e) {
                    highlightFeature(e);
                    WhereToBuy.info.update(props);
                });
                layer.on('mouseout', function(e) {
                    resetHighlight(e);
                    WhereToBuy.info.clear();
                });
            }
        };

        var layerOpts = {
            style: layerStyle,
            onEachFeature: onEachFeature
        };

        // Get boundaries as GeoJSON and add them to the map
        var suburbGeojson, chicagoGeojson;
        $.when(
            $.getJSON(WhereToBuy.dataDir + 'places.geojson', function(data) {
                suburbGeojson = data;
            }),
            $.getJSON(WhereToBuy.dataDir + 'community_areas.geojson', function(data) {
                chicagoGeojson = data;
            })
        ).then(function() {
            suburbLayer = L.geoJson(suburbGeojson, layerOpts).addTo(WhereToBuy.map);
            chicagoLayer = L.geoJson(chicagoGeojson, layerOpts).addTo(WhereToBuy.map);
        });

        // Allow ranking list to interact with the map
        $('.ranking').on('mouseover', function() {
            var community = $(this).children('span').html().toLowerCase();
            highlightFeature(WhereToBuy.layerMap[community]);
            WhereToBuy.info.update(WhereToBuy.layerMap[community].feature.properties);
        });
        $('.ranking').on('mouseout', function() {
            var community = $(this).children('span').html().toLowerCase();
            resetHighlight(WhereToBuy.layerMap[community]);
            WhereToBuy.info.clear();
        });

        // Check for workplace parameter in the URL
        if ($.address.parameter('workplace')) {
            $("#search-address").val(WhereToBuy.toPlainString($.address.parameter('workplace')));
            WhereToBuy.addressSearch();
        }
    },

    addressSearch: function (e) {
        if (e) e.preventDefault();
        var searchAddress = $("#search-address").val();
        if (searchAddress !== '') {

            if (WhereToBuy.locationScope && WhereToBuy.locationScope.length) {
                var checkaddress = searchAddress.toLowerCase();
                var checkcity = WhereToBuy.locationScope.split(",")[0].toLowerCase();
                if (checkaddress.indexOf(checkcity) == -1) {
                    searchAddress += ", " + WhereToBuy.locationScope;
                }
            }

            $.address.parameter('workplace', encodeURIComponent(searchAddress));

            geocoder.geocode({'address': searchAddress}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    WhereToBuy.workplace = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];

                    WhereToBuy.map.setView(WhereToBuy.workplace, 8);

                    if (WhereToBuy.marker)
                        WhereToBuy.map.removeLayer(WhereToBuy.marker);

                    WhereToBuy.marker = L.marker(WhereToBuy.workplace).addTo(WhereToBuy.map);
                }
                else {
                    alert("We could not find your address: " + status);
                }
            });
        }
    },

    viewProfile: function(e) {
        // Matches a real estate profile to a specific priority order
        if (e) e.preventDefault();
        var profileID = e.target.id;
        var priorities;
        switch (profileID) {
            case "suburban-home":
                priorities = [
                    'schools',
                    'crime',
                    'price',
                    'diversity',
                    'commute'
                ];
                break;
            case "city-home":
                priorities = [
                    'schools',
                    'diversity',
                    'crime',
                    'price',
                    'commute'
                ];
                break;
            case "downsized-home":
                priorities = [
                    'price',
                    'commute',
                    'diversity',
                    'crime',
                    'schools'
                ];
                break;
            case "in-town":
                priorities = [
                    'commute',
                    'price',
                    'crime',
                    'diversity',
                    'schools'
                ];
                break;
            case "vacation-home":
                priorities = [
                    'price',
                    'diversity',
                    'crime',
                    'schools',
                    'commute'
                ];
                break;
            default:
                alert("Sorry, something went wrong.");
        }
        WhereToBuy.priorityOrder(priorities);
    },

    priorityOrder: function(priorities) {
        // Rearranges priority list and reloads packery
        $('#' + priorities[4]).prependTo( $('#grid') );
        for (var i = 3; i >= 0; i--) {
            $('#' + priorities[i]).insertBefore( $('#' + priorities[i+1]) );
        }
        $('.grid').packery('reloadItems').packery();
    },

    selectCommunity: function(text) {
        // Parses which community was selected from the list
        var community = text;
        if ((WhereToBuy.chicagoData && WhereToBuy.chicagoData.length) && (WhereToBuy.suburbData && WhereToBuy.suburbData.length)) {
            WhereToBuy.showCommunityInfo(community);
        } else {
            $.when(
                $.get(WhereToBuy.dataDir + 'chicago.csv', function(data) {
                    WhereToBuy.chicagoData = $.csv.toObjects(data);
                }),
                $.get(WhereToBuy.dataDir + 'suburb.csv', function(data) {
                    WhereToBuy.suburbData = $.csv.toObjects(data);
                })
            ).then(function() {
                WhereToBuy.showCommunityInfo(community);
            });
        }
    },

    showCommunityInfo: function(community) {
        // Displays a modal with information about a selected community
        // TODO: better handling to figure out if the community is in Chicago or the suburbs
        var communityKey = community.toUpperCase();
        var communityData;
        var msg = 'No data found.';
        // Find the relevant data in the CSV object
        for (var i=0; i<WhereToBuy.chicagoData.length; i++) {
            if (WhereToBuy.chicagoData[i].community == communityKey) {
                communityData = $.extend({}, WhereToBuy.chicagoData[i]);
                msg = JSON.stringify(communityData, null, 2);
                break;
            }
        }
        $('#property-info').html(msg);
        $('.modal').modal();
    },

    titleCase: function(s) {
        // Takes a string and converts it to title case (first character of each word in caps)
        return s.replace(/\w\S*/g, function(text) {
            return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
        });
    },

    toPlainString: function(text) {
        // Converts a slug or query string into readable text
        if (text === undefined) return '';
        return decodeURIComponent(text);
    },

};