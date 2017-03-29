var geocoder = new google.maps.Geocoder();
var directions = new google.maps.DirectionsService();

var WhereToBuy = WhereToBuy || {};
var WhereToBuy = {

    // Map config
    map: null,
    mapCentroid: [41.9, -88],
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
                color: '#2c6b86',
                weight: 2,
                opacity: 0.5,
                fillColor: '#2c6b86',
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
        // Define the HTML for the modal
        $('#property-info').html(msg);
        $('.modal').modal();

        // If the user has set a place of work, calculate a commute time estimate
        if (WhereToBuy.workplace) {
            var workplaceString = WhereToBuy.toPlainString($.address.parameter('workplace'));
            WhereToBuy.customTravelTime(community+', IL', workplaceString)
              .done(function(results) {
                var markup = "<div id='travel-time style='display:none;'>";
                if (results.driving.time) {
                    markup += "<h4>Driving time to workplace:</h4><p>" + results.driving.time + "</p>";
                } else if (typeof(results.driving) === 'string') {
                    markup += "<h4>Driving error:</h4><p>" + results.driving + "</p>";
                } else {
                    markup += "<p>Could not find driving time...</p>";
                }
                if (results.transit.time) {
                    markup += "<h4>Transit time to workplace:</h4><p>" + results.transit.time + "</p>";
                } else if (typeof(results.transit) === 'string') {
                    markup += "<h4>Transit error:</h4><p>" + results.transit + "</p>";
                } else {
                    markup += "<p>Could not find transit time...</p>";
                }
                markup += "</div>";
                $('#property-info').append(markup).show('slow');
                console.log(results);
            });
        }
    },

    customTravelTime: function(origin, destination) {
        // Takes coordinates, returns a dict with trip information while driving and on transit.

        // Make a JQuery promise object
        var deferred = $.Deferred();

        var drivingOptions = {
            origin: origin,
            destination: destination,
            travelMode: 'DRIVING'
        };

        var transitOptions = {
            origin: origin,
            destination: destination,
            travelMode: 'TRANSIT'
        };

        var driving, drivingErr,
            transit, transitErr;

        WhereToBuy.getDirections(drivingOptions, origin, destination)
          .then(function(drivingValues) {
            driving = drivingValues;
            WhereToBuy.getDirections(transitOptions, origin, destination)
              .then(function(transitValues) {
                transit = transitValues;
                deferred.resolve({
                    'driving': driving,
                    'transit': transit
                });
            }, function(err) {
                deferred.resolve({
                    'driving': driving,
                    'transit': err
                });
            });
        }, function(err) {
            drivingErr = err;
            WhereToBuy.getDirections(transitOptions, origin, destination)
              .then(function(transitValues) {
                transit = transitValues;
                deferred.resolve({
                    'driving': drivingErr,
                    'transit': transit
                });
            }, function(err2) {
                transitErr = err2;
                deferred.resolve({
                    'driving': drivingErr,
                    'transit': transitErr
                });
            });
        });
        
        return deferred.promise();
    
    },

    getDirections: function(routeOptions) {
        // Uses Google Maps Directions Service to get directions between two locations.

        // Make a JQuery promise object
        var deferred = $.Deferred();

        var travelTime,
            directionsLine,
            warning,
            copyright;

        directions.route(routeOptions, function(results, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                // Get copyrights and warnings
                if (results.routes[0].warnings && results.routes[0].warnings.length) {
                    copyright = results.routes[0].copyrights;
                    warning = results.routes[0].warnings.join(';');
                }
                // Get travel time estimate
                if (results.routes[0].legs && results.routes[0].legs.length > 1) {
                    var time = 0;
                    for (var t=0; t<results.routes[0].legs.length; t++) {
                        time += results.routes[0].legs[i].duration.value;
                    }
                    travelTime = WhereToBuy.secondsToTimeString(time);
                } else {
                    travelTime = results.routes[0].legs[0].duration.text;
                }
                // Get directions line
                if (results.routes[0].overview_path && results.routes[0].overview_path.length) {
                    var pathPoints = [];
                    for (var y=0; y<results.routes[0].overview_path.length; y++) {
                        pathPoints.push([
                                            results.routes[0].overview_path[y].lat(),
                                            results.routes[0].overview_path[y].lng(),
                                        ]);
                    }
                    directionsLine = L.polyline(pathPoints);
                } else {
                    directionsLine = null;
                }

                var returnValues = {
                        'time': travelTime,
                        'line': directionsLine,
                        'warning': warning,
                        'copyright': copyright
                    };

                deferred.resolve(returnValues);
            } else {
                errorString = "We could not find a " + routeOptions.travelMode.toLowerCase() +
                             " route between this community and your workplace. " +
                             '(Error: "' + status + '")';
                deferred.reject(errorString);
            }
        });

        return deferred.promise();
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

    secondsToTimeString: function(d) {
        // Thanks to Wilson Lee on Stackoverflow for this concise piece of code:
        // http://stackoverflow.com/questions/37096367/how-to-convert-seconds-to-minutes-and-hours-in-javascript
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return hDisplay + mDisplay + sDisplay;
    }

};