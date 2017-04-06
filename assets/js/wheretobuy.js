var geocoder = new google.maps.Geocoder();
var directions = new google.maps.DirectionsService();

var WhereToBuy = WhereToBuy || {};
var WhereToBuy = {

    // Map config
    map: null,
    infoMap: null,
    infoMapLayer: null,
    geography: 'both',
    mapCentroid: [41.9, -88],
    chicagoCentroid: [41.8, -87.62],
    defaultZoom: 8,
    locationScope: 'Chicago',

    googleStyles: [{
        stylers: [
            { saturation: -100 },
            { lightness: 40 }
        ]
    }],
    layerStyle: {
        'color': '#FF6600',
        'weight': 0.5,
        'opacity': 0.5,
        'fillColor': '#FF6600',
        'fillOpacity': 0.5
    },

    dataDir: '../../data/final/',
    suburbLayer: null,
    chicagoLayer: null,
    chicagoData: null,
    chicagoScores: null,

    suburbData: null,
    suburbScores: null,

    communityData: null,
    bestCommunities: null,

    info: null,
    workplace: null,
    layerMap: {},
    spellingMap: {},
    priorities: [],
    rankings: [],
    workMarker: null,
    placeMarker: null,
    rankingMarkers: [],



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

        if (!WhereToBuy.infoMap) {
            WhereToBuy.infoMap = L.map('info-map', {
                center: WhereToBuy.mapCentroid,
                zoom: WhereToBuy.defaultZoom,
                dragging: true,
                touchZoom: true,
                zoomControl: false,
                tap: true,
                scrollWheelZoom: false
            });
        }

        // Add streets to the map
        WhereToBuy.streets = new L.Google('ROADMAP', {mapOptions: {styles: WhereToBuy.googleStyles}});
        WhereToBuy.infoStreets = new L.Google('ROADMAP', {mapOptions: {styles: WhereToBuy.googleStyles}});

        WhereToBuy.map.addLayer(WhereToBuy.streets);
        WhereToBuy.infoMap.addLayer(WhereToBuy.infoStreets);

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

            layer.setStyle(WhereToBuy.layerStyle);
        };

        // Bind GeoJSON UX to the feature
        var onEachFeature = function(feature, layer) {
            if (feature.properties && (feature.properties.name || feature.properties.community)) {
                if (feature.properties.name) {
                    WhereToBuy.layerMap[WhereToBuy.toCommunityString(feature.properties.name)] = layer;
                } else if (feature.properties.community) {
                    WhereToBuy.layerMap[WhereToBuy.toCommunityString(feature.properties.community)] = layer;
                }

                var props = feature.properties;
                var communityName = props.name ? props.name : props.community;

                // Bind hover events
                layer.on('mouseover', function(e) {
                    highlightFeature(e);
                    WhereToBuy.info.update(props);
                });
                layer.on('mouseout', function(e) {
                    resetHighlight(e);
                    WhereToBuy.info.clear();
                });
                layer.on('click', function(e) {
                    WhereToBuy.selectCommunity(WhereToBuy.toCommunityString(communityName));
                });
            }
        };

        var layerOpts = {
            style: WhereToBuy.layerStyle,
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
            // Add each layer to the map
            WhereToBuy.suburbLayer = L.geoJson(suburbGeojson, layerOpts).addTo(WhereToBuy.map);
            WhereToBuy.chicagoLayer = L.geoJson(chicagoGeojson, layerOpts).addTo(WhereToBuy.map);

            // Allow ranking list to interact with the map
            $('.ranking').on('mouseover', function() {
                var community = $(this).children('span').html();
                highlightFeature(WhereToBuy.layerMap[community]);
                WhereToBuy.info.update(WhereToBuy.layerMap[community].feature.properties);
            });
            $('.ranking').on('mouseout', function() {
                var community = $(this).children('span').html();
                resetHighlight(WhereToBuy.layerMap[community]);
                WhereToBuy.info.clear();
            });

            // Get community data and display a ranking
            $.when(
                $.get(WhereToBuy.dataDir + 'chicago.csv', function(data) {
                    WhereToBuy.chicagoData = $.csv.toObjects(data);
                    for (var i=0; i<WhereToBuy.chicagoData.length; i++) {
                        var chicagoName = WhereToBuy.toCommunityString(WhereToBuy.chicagoData[i].community);
                        WhereToBuy.spellingMap[chicagoName] = WhereToBuy.chicagoData[i].community;
                        WhereToBuy.chicagoData[i].community = chicagoName;
                    }
                }),
                $.get(WhereToBuy.dataDir + 'suburb.csv', function(data) {
                    WhereToBuy.suburbData = $.csv.toObjects(data);
                    for (var i=0; i<WhereToBuy.suburbData.length; i++) {
                        var suburbName = WhereToBuy.toCommunityString(WhereToBuy.suburbData[i]["Place"]);
                        WhereToBuy.spellingMap[suburbName] = WhereToBuy.suburbData[i]["Place"];
                        WhereToBuy.suburbData[i]["Place"] = suburbName;
                    }
                }),
                $.get(WhereToBuy.dataDir + 'chicago_data.csv', function(data) {
                    WhereToBuy.chicagoScores = $.csv.toObjects(data);
                }),
                $.get(WhereToBuy.dataDir + 'suburb_data.csv', function(data) {
                    WhereToBuy.suburbScores = $.csv.toObjects(data);
                })
            ).then(function() {
                // Update the priority state and rankings
                var chicagoScores = $.extend([], WhereToBuy.chicagoScores);
                var suburbScores = $.extend([], WhereToBuy.suburbScores);
                WhereToBuy.communityData = chicagoScores.concat(suburbScores);
                WhereToBuy.updatePriorityState();
                WhereToBuy.displayRanking(WhereToBuy.rankCommunities());
            });
        });

        // Check for workplace parameter in the URL
        if ($.address.parameter('workplace')) {
            $("#search-address").val(WhereToBuy.toPlainString($.address.parameter('workplace')));
            WhereToBuy.addressSearch();
        }

        // Prep modal map for display
        $('.modal').on('shown.bs.modal', function() {
            WhereToBuy.infoMap.invalidateSize();
        });
    },

    updateMapChoropleth: function() {
        // Updates map choropleth based on the current priorities and geography

        var layers;
        // Figure out which geographies we're concerned with
        switch(true) {
            case (WhereToBuy.geography == 'chicago'):
                layers = [WhereToBuy.chicagoLayer];
                break;
            case (WhereToBuy.geography == 'suburbs'):
                layers = [WhereToBuy.suburbLayer];
                break;
            case (WhereToBuy.geography == 'both'):
                layers = [WhereToBuy.chicagoLayer, WhereToBuy.suburbLayer];
                break;
            default:
                layers = [WhereToBuy.chicagoLayer, WhereToBuy.suburbLayer];
        }

        // Only do big iteration if we need to look through all communities
        for (var i=0; i<layers.length; i++) {
            var comm = (layers[i] == WhereToBuy.chicagoLayer) ? 'community' : 'name';
            layers[i].eachLayer(function(layer) {
                var communityName = WhereToBuy.toCommunityString(layer.feature.properties[comm]);
                // Find the ranking of this community
                var ranking;
                for (var i=0; i<WhereToBuy.rankings.length; i++) {
                    if (WhereToBuy.toCommunityString(WhereToBuy.rankings[i].community) == communityName) {
                        ranking = i;
                        break;
                    }
                }
                layer.setStyle(WhereToBuy.getStyle(ranking, WhereToBuy.rankings.length));
                // Redo the event listeners to use new styles
                layer.off('mouseout');
                layer.on('mouseout', function(e) {
                    e.target.setStyle(WhereToBuy.getStyle(ranking, WhereToBuy.rankings.length));
                });
            });
        }

    },

    getStyle: function(position, total) {
        var factor;
        switch(true) {
            case (WhereToBuy.geography == 'chicago'):
                factor = 20;
                break;
            case (WhereToBuy.geography == 'suburbs'):
                factor = 50;
                break;
            case (WhereToBuy.geography == 'both'):
                factor = 75;
                break;
            default:
                factor = 75;
        }
        return {
            color: 'white',
            weight: 0.5,
            opacity: 0.5,
            fillColor: '#FF6600',
            fillOpacity: (total/((position+1)*total))*factor
        };
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

                    if (WhereToBuy.workMarker)
                        WhereToBuy.map.removeLayer(WhereToBuy.workMarker);

                    var workIcon = L.divIcon({
                        className: 'div-icon',
                        html: '<div class="work-icon">' +
                                '<h4><i class="fa fa-briefcase" style="margin-top:5px"></i></h4>' +
                              '</div>',
                        riseOnHover: true

                    });

                    var closeIcon = L.divIcon({
                        className: 'div-icon',
                        html: '<div class="work-icon-red">' +
                                '<h4><i class="fa fa-times" style="margin-top:4px"></i></h4>' +
                              '</div'
                    });

                    WhereToBuy.workMarker = L.marker(WhereToBuy.workplace, {icon: workIcon}).addTo(WhereToBuy.map);

                    // WIP: Bind marker interactions
                    WhereToBuy.workMarker.on('mouseover', function(e) {
                        e.target.setIcon(closeIcon);
                        console.log('marker hover fired!');
                    });
                    WhereToBuy.workMarker.on('mouseout', function(e) {
                        e.target.setIcon(workIcon);
                    });
                }
                else {
                    alert("We could not find your work address: " + status);
                }
            });
        }
    },

    viewProfile: function(id) {
        // Matches a real estate profile to a specific priority order
        var profileID = id;
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
        WhereToBuy.reorderPriorities(priorities);
    },

    rankPriorities: function() {
        // Gets priority order based on the layout
        var items = $('.grid').packery('getItemElements');
        $(items).each(function(i, item) {
            $(item).removeClass('rank-1 rank-2 rank-3 rank-4 rank-5').addClass('rank-' + (i+1).toString());
            $(item).find('span.badge').html(i+1);
        });
        WhereToBuy.updatePriorityState();
    },

    reorderPriorities: function(priorities) {
        // Rearranges priority list, reloads packery, and ranks communities
        $('#' + priorities[4]).prependTo( $('#grid') );
        for (var i=3; i>=0; i--) {
            $('#' + priorities[i]).insertBefore( $('#' + priorities[i+1]) );
        }
        $('.grid').packery('reloadItems').packery();
        WhereToBuy.updatePriorityState();
        $('.grid').trigger('profileSelected');
    },

    updatePriorityState: function() {
        // Updates persistent state of priorities based on the DOM interactions
        WhereToBuy.priorities = [];
        var items = $('.grid').packery('getItemElements');
        $(items).each(function(i, item) {
            WhereToBuy.priorities.push($(item).attr('id'));
        });
    },

    rankCommunities: function(p) {
        // Takes a priority list and returns a list of top communities based on those priorities
        // Also assigns a global variable to a complete list of rankings

        var priorities = p ? p : WhereToBuy.priorities;
        
        var dataSource;
        switch(true) {
            case (WhereToBuy.geography == 'chicago'):
                dataSource = WhereToBuy.chicagoScores;
                break;
            case (WhereToBuy.geography == 'suburbs'):
                dataSource = WhereToBuy.suburbScores;
                break;
            case (WhereToBuy.geography == 'both'):
                dataSource = WhereToBuy.communityData;
                break;
            default:
                dataSource = WhereToBuy.communityData;
        }

        var weights = [
            0.5,
            0.4,
            0.3,
            0.2,
            0.1
        ];

        WhereToBuy.rankings = [];
        var topCommunities = [];
        for (var i=0; i<dataSource.length; i++) {
            // Score the community based on the priorities
            var communityScore = 0;
            for (var j=0; j<5; j++) {
                // Handle null values (only price, right now)
                if (dataSource[i][priorities[j]]) {
                    communityScore += (weights[j]*dataSource[i][priorities[j]]);
                } else {
                    console.log('Null value for priority type ' + priorities[j]);
                    communityScore += 0;
                }
            }

            // If this is the first community considered, rank it first automatically
            // Ranking format: array(community, score)
            var communityPair = {
                'community': dataSource[i].community,
                'score': communityScore
            };
            if (topCommunities.length === 0) {
                topCommunities.push(communityPair);
            }

            // See if this community beats any of the top communities
            for (var k=0; k<topCommunities.length; k++) {
                if (communityScore > topCommunities[k]['score']) {
                    topCommunities.splice(k, 0, communityPair);
                    break;
                }
            }

            // Place this community in a global list of rankings
            var last = true;
            if (WhereToBuy.rankings.length === 0) {
                WhereToBuy.rankings.push(communityPair);
            } else {
                for (var m=0; m<WhereToBuy.rankings.length; m++) {
                    if (communityScore > WhereToBuy.rankings[m]['score']) {
                        WhereToBuy.rankings.splice(m, 0, communityPair);
                        last = false;
                        break;
                    }
                }
            }
            if (last) {
                WhereToBuy.rankings.push(communityPair);
            }

            // We need at least five communities...
            if (topCommunities.length < 5) {
                topCommunities.push(communityPair);
            // ... but no more than five!
            } else if (topCommunities.length > 5) {
                topCommunities.pop();
            }
        }

        return topCommunities;
    },

    summaryStats: function(priority) {
        // Calculates min, max, quartiles, and median for a given priority

        var dataSource;
        switch(true) {
            case (WhereToBuy.geography == 'chicago'):
                dataSource = WhereToBuy.chicagoScores;
                break;
            case (WhereToBuy.geography == 'suburbs'):
                dataSource = WhereToBuy.suburbScores;
                break;
            case (WhereToBuy.geography == 'both'):
                dataSource = WhereToBuy.communityData;
                break;
            default:
                dataSource = WhereToBuy.communityData;
        }

        var omega = [];
        for (i=0; i<dataSource.length; i++) {
            omega.push(parseFloat(dataSource[i][priority]));
        }

        omega.sort(function(a, b) {return a-b;});
        var mid = omega.length / 2;

        var out = {
            'min': omega[0],
            'median': (mid % 1) ? omega[mid-0.5] : (omega[mid-1] + omega[mid]) / 2,
            'max': omega[omega.length-1],
        };

        var lower = (omega.length % 2) ? omega.slice(0, mid-0.5) : omega.slice(0, out[mid-1]);
        var lowerMid = lower.length / 2;
        var upper = (omega.length % 2) ? omega.slice(mid-0.5, omega.length-1) : omega.slice(out[mid], omega.length-1);
        var upperMid = upper.length / 2;

        out['firstQ'] = (lowerMid % 1) ? lower[lowerMid-0.5] : (lower[lowerMid-1] + lower[lowerMid]) / 2;
        out['secondQ'] = (upperMid % 1) ? upper[upperMid-0.5] : (upper[upperMid-1] + upper[upperMid]) / 2;

        return out;
    },

    displayRanking: function(ranking) {
        // Takes an ordered list of communities as input, then ranks them in the UI
        WhereToBuy.bestCommunities = [];
        for (var i=0; i<5; i++) {
            var community = ranking[i]['community'];
            var score = ranking[i]['score'];
            $('#rank-' + (i+1)).html(WhereToBuy.toCommunityString(community));
            WhereToBuy.bestCommunities.push({'community': community, 'score': score});
        }

        // Remove ranking markers from the map
        if (WhereToBuy.rankingMarkers.length) {
            for (k=0; k<WhereToBuy.rankingMarkers.length; k++) {
                WhereToBuy.map.removeLayer(WhereToBuy.rankingMarkers[k]);
            }
        }

        // Display the top communities with markers on the map
        WhereToBuy.rankingMarkers = [];
        for (j=0; j<WhereToBuy.bestCommunities.length; j++) {
            var communityName = WhereToBuy.toCommunityString(WhereToBuy.bestCommunities[j].community);
            var communityLayer = WhereToBuy.layerMap[communityName];
            var coords = communityLayer.getBounds().getCenter();
            var centroid = [coords.lat, coords.lng];
            var num = L.divIcon({
                className: 'div-icon',
                html: '<h5 class="ranking-icon">' + (j+1) + '</h5>'
            });
            WhereToBuy.rankingMarkers.push(L.marker(centroid, {icon: num})
                                          .addTo(WhereToBuy.map));
        }

        // Update map choropleth
        WhereToBuy.updateMapChoropleth();
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
                    for (var i=0; i<WhereToBuy.chicagoData.length; i++) {
                        var chicagoName = WhereToBuy.toCommunityString(WhereToBuy.chicagoData[i].community);
                        WhereToBuy.spellingMap[chicagoName] = WhereToBuy.chicagoData[i].community;
                        WhereToBuy.chicagoData[i].community = chicagoName;
                    }
                }),
                $.get(WhereToBuy.dataDir + 'suburb.csv', function(data) {
                    WhereToBuy.suburbData = $.csv.toObjects(data);
                    for (var i=0; i<WhereToBuy.suburbData.length; i++) {
                        var suburbName = WhereToBuy.toCommunityString(WhereToBuy.suburbData[i]["Place"]);
                        WhereToBuy.spellingMap[suburbName] = WhereToBuy.suburbData[i]["Place"];
                        WhereToBuy.suburbData[i]["Place"] = suburbName;
                    }
                })
            ).then(function() {
                WhereToBuy.showCommunityInfo(community);
            });
        }
    },

    showCommunityInfo: function(community) {
        // Displays a modal with information about a selected community
        var communityInfo,
            communityScores,
            location;

        // Fetch the proper map layer and display it on the info map
        if (WhereToBuy.infoMapLayer) {
            WhereToBuy.infoMap.removeLayer(WhereToBuy.infoMapLayer);
        }
        var styles = {
            // 'color': '#616161',
            'color': '#cf3e30',
            'weight': 2,
            'opacity': 1,
            'fillColor': '#cf3e30',
            'fillOpacity': 1
        };
        var coords = WhereToBuy.layerMap[community].getBounds().getCenter();
        var centroid = [coords.lat, coords.lng];

        if (WhereToBuy.placeMarker)
            WhereToBuy.infoMap.removeLayer(WhereToBuy.placeMarker);

        WhereToBuy.placeMarker = L.marker(centroid).addTo(WhereToBuy.infoMap);

        var feature = WhereToBuy.layerMap[community].feature;
        WhereToBuy.infoMapLayer = L.geoJson(feature, {style: styles});
        WhereToBuy.infoMapLayer.addTo(WhereToBuy.infoMap);

        // Find the relevant data
        var msg = 'No data found.';
        found = false;
        // First, look in the scoring data
        for (var k=0; k<WhereToBuy.communityData.length; k++) {
            if (WhereToBuy.toCommunityString(WhereToBuy.communityData[k].community) == community) {
                communityScores = $.extend({}, WhereToBuy.communityData[k]);
                break;
            }
        }
        // Search Chicago data
        for (var i=0; i<WhereToBuy.chicagoData.length; i++) {
            if (WhereToBuy.chicagoData[i].community == community) {
                communityInfo = $.extend({}, WhereToBuy.chicagoData[i]);
                location = 'chicago';
                found = true;
                break;
            }
        }
        // Search suburb data
        if (!found) {
            for (var j=0; j<WhereToBuy.suburbData.length; j++) {
                if (WhereToBuy.suburbData[j]["Place"] == community) {
                    communityInfo = $.extend({}, WhereToBuy.suburbData[j]);
                    location = 'suburb';
                    found = true;
                    break;
                }
            }
        }

        var shortDescription;
        if (found) {
            $.getJSON(WhereToBuy.dataDir + 'short_descriptions.json', function(descriptions) {
                console.log(descriptions);
                shortDescription = descriptions[communityScores.community];
                $('#short-description').html(shortDescription);

                // String data
                var commute = communityInfo["Avg Commute Time"] ? communityInfo["Avg Commute Time"] : communityInfo["Average Commute"];
                var diversity = communityInfo["Diversity Index"];

                // Score data
                var crime,
                    schools,
                    price;
                var crimeScore = parseFloat(communityScores["crime"]);
                var schoolsScore = parseFloat(communityScores["schools"]);
                var priceScore = communityScores["price"].length ? communityScores["price"] : "Price data not found.";

                msg +=  "<tr>" +
                          "<td class='col-xs-4'><strong><i class='fa fa-fw fa-car'></i> Typical commute</strong></td>" +
                          "<td>" + parseInt(commute) + " minutes</td>" +
                        "</tr>" +
                        "<tr>" +
                          "<td class='col-xs-4'><strong><i class='fa fa-fw fa-users'></i> Diversity index</strong></td>" +
                          "<td>" + parseFloat(diversity).toFixed(2) + "</td>" +
                        "</tr>" +
                        "<tr>" +
                          "<td class='col-xs-4'><strong><i class='fa fa-fw fa-balance-scale'></i> Crime score</strong></td>" +
                          "<td>" + crimeScore + "</td>" +
                        "</tr>" +
                        "<tr>" +
                          "<td class='col-xs-4'><strong><i class='fa fa-fw fa-graduation-cap'></i> School score</strong></td>" +
                          "<td>" + schoolsScore + "</td>" +
                        "</tr>" +
                        "<tr>" +
                          "<td class='col-xs-4'><strong><i class='fa fa-fw fa-usd'></i> Price score</strong></td>" +
                          "<td>" + priceScore + "</td>" +
                        "</tr>";

                // Update the DOM
                $('#short-description').html(shortDescription);
                $('#community-info-label').html(community);
                $('#community-stats').html(msg);
                $('.modal').modal();
            });
        } else {
            // Update the DOM
            $('#community-info-label').html(community);
            $('#community-stats').html(msg);
            $('.modal').modal();
        }

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

    toCommunityString: function(text) {
        // Converts community names to display-friendly values
        var string = WhereToBuy.titleCase(text);
        string = string.replace(' City, Illinois', '');
        string = string.replace(' Village, Illinois', '');
        string = string.replace(' Town, Illinois', '');
        if (~string.indexOf('Mc')) {
            string = 'Mc' + string.charAt(2).toUpperCase() + string.slice(3);
        }
        return string;
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