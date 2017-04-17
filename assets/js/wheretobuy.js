var geocoder = new google.maps.Geocoder();
var directions = new google.maps.DirectionsService();

var WhereToBuy = WhereToBuy || {};
var WhereToBuy = {

    // Map config
    map: null,
    infoMap: null,
    infoMapLayer: null,
    geography: 'chicago',
    mapCentroid: [41.9, -88],
    chicagoCentroid: [41.8, -87.62],
    defaultZoom: 9,
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

    charts: [],
    binSize: 0.5,

    initialize: function() {

        // Initialize a Leaflet map
        if (!WhereToBuy.map) {
            WhereToBuy.map = L.map('map', {
                center: WhereToBuy.chicagoCentroid,
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
                dragging: false,
                touchZoom: false,
                zoomControl: false,
                tap: false,
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
            WhereToBuy.suburbLayer = L.geoJson(suburbGeojson, layerOpts);
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

                    var searchZoom = (WhereToBuy.geography == 'suburbs') ? 8 : 9;
                    WhereToBuy.map.setView(WhereToBuy.workplace, searchZoom);

                    if (WhereToBuy.workMarker)
                        WhereToBuy.map.removeLayer(WhereToBuy.workMarker);

                    var workIcon = L.divIcon({
                        className: 'div-icon',
                        html: '<div class="work-icon">' +
                                '<h4><i class="fa fa-briefcase" style="margin-top:5px"></i></h4>' +
                              '</div>',
                    });

                    var closeIcon = L.divIcon({
                        className: 'div-icon',
                        html: '<div class="work-icon-red">' +
                                '<h4><i class="fa fa-times" style="margin-top:4px"></i></h4>' +
                              '</div'
                    });
                    var markerOpts = {
                        icon: workIcon,
                        riseOnHover: true
                    };

                    WhereToBuy.workMarker = L.marker(WhereToBuy.workplace, markerOpts).addTo(WhereToBuy.map);

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
            case "weekender":
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
        // Rearranges priority list and modal rows, reloads packery, and ranks communities
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
        // (Also reorers rows in the modal to match the current state)
        WhereToBuy.priorities = [];
        var items = $('.grid').packery('getItemElements');
        $(items).each(function(i, item) {
            WhereToBuy.priorities.push($(item).attr('id'));
        });
        // Find commute and remove it
        editedPriorities = WhereToBuy.priorities.slice();
        var commuteIndex = $.inArray('commute', editedPriorities);
        if (commuteIndex > -1) {
            console.log('Reordering modal rows...');
            editedPriorities.splice(commuteIndex, 1);
            // Reorder modal rows
            $('#' + editedPriorities[3] + '-row').prependTo( $('#community-stats') );
            for (var j=2; j>=0; j--) {
                $('#' + editedPriorities[j] + '-row').insertBefore( $('#' + editedPriorities[j+1] + '-row') );
            }
        }
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
            var markerOpts = {
                icon: num,
                riseOnHover: true
            };
            WhereToBuy.rankingMarkers.push(L.marker(centroid, markerOpts)
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

        var dataSource = WhereToBuy.getDataSource();

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
        var bounds = WhereToBuy.layerMap[community].getBounds();

        WhereToBuy.infoMapLayer = L.geoJson(feature, {style: styles});
        WhereToBuy.infoMapLayer.addTo(WhereToBuy.infoMap);
        // WhereToBuy.infoMap.fitBounds(bounds);

        // Find the relevant data
        var msg = 'No data found.';
        found = false;

        // First, look for the scoring data
        for (var k=0; k<dataSource.length; k++) {
            if (WhereToBuy.toCommunityString(dataSource[k].community) == community) {
                communityScores = $.extend({}, dataSource[k]);
                break;
            }
        }
        // Search Chicago data for extra vars
        for (var i=0; i<WhereToBuy.chicagoData.length; i++) {
            if (WhereToBuy.chicagoData[i].community == community) {
                communityInfo = $.extend({}, WhereToBuy.chicagoData[i]);
                location = 'chicago';
                found = true;
                break;
            }
        }
        // Search suburb data for extra vars
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

        // Start to pull together variables
        var shortDescription;
        if (found) {
            $.getJSON(WhereToBuy.dataDir + 'short_descriptions.json', function(descriptions) {
                shortDescription = descriptions[communityScores.community]['text'];
                $('#short-description').html(shortDescription);
                $('#wikipedia-link').attr('href', descriptions[communityScores.community]['url']);

                // Figure out commute time
                var commute = communityInfo["Avg Commute Time"] ? communityInfo["Avg Commute Time"] : communityInfo["Average Commute"];
                commute = parseInt(commute);
                $('#commute-score').html(commute + ' mins');

                // Use the input workplace, if it exists
                if (WhereToBuy.workplace) {
                    var destination = WhereToBuy.toPlainString($.address.parameter('workplace'));
                    var origin = (WhereToBuy.isChicago(community)) ? community + ', Chicago, IL' : community + ', IL';
                    WhereToBuy.customTravelTime(origin, destination)
                      .done(function(results) {
                        if (results.driving.time) {
                            commute = results.driving.time;
                            $('#commute-info').attr('data-content', 'We used Google Maps to get an estimate for travel time between this community and the workplace you provided. Note that this estimate is affected by current traffic conditions.');
                            $('#commute-type').html('Your commute');
                            $('#commute-score').html(commute);
                        } else if (typeof(results.driving) === 'string') {
                            // Show errors in console, but use the old time
                            console.log("Driving error: ", results.driving);
                        } else {
                            // Mystery errors – requires more debugging
                            console.log("Could not find driving time");
                        }
                    });
                }

                // Score data
                var diversityScore = parseFloat(communityInfo["Diversity Index"]).toFixed(2);
                var crimeScore = parseFloat(communityScores["crime"]);
                var schoolsScore = parseFloat(communityScores["schools"]);
                var priceScore = parseFloat(communityScores["price"]);

                if (WhereToBuy.isChicago(communityScores.community)) {
                    var detachedPrice = communityScores.detached_median_price.length ?
                                                    communityScores.detached_median_price
                                                    : "Price data for freestanding homes is not available" +
                                                      " for this community.";
                    var attachedPrice = communityScores.attached_median_price.length ?
                                                    communityScores.attached_median_price
                                                    : "Price data for apartments is not available" +
                                                      " for this community.";
                    $('#median-price').html(detachedPrice);
                } else {
                    var medianPrice = communityScores.median_price.length ? communityScores.median_price
                                            : "Price data is not available for this community.";
                    $('#median-price').html(medianPrice);
                }

                // Calculate bar chart positions and update charts
                var scoreMap = {
                    'diversity': diversityScore,
                    'crime': crimeScore,
                    'schools': schoolsScore,
                    'price': priceScore
                };
                $('.modal').on('shown.bs.modal', function() {
                    WhereToBuy.makeBarCharts(scoreMap);
                    $(window).resize(WhereToBuy.makeBarCharts(scoreMap));
                });
                
                // Allow the user to change the chart type
                $('.distribution-toggle').click(function() {
                    // Case charts are currently bars
                    if (! ($(this).hasClass('active')) ) {
                        // Update the toggle button
                        $(this).addClass('active');
                        $(this).html('View charts as bar graphs');

                        // Change the chart type
                        WhereToBuy.charts = [];
                        // Update each chart to make a sparkline
                        $('.sparkline').each(function() {
                            var currentID = $(this).attr('id');
                            var priority = $(this).attr('id').replace('-score', '');
                            var priorityScores = WhereToBuy.getHistogram(priority, WhereToBuy.binSize);
                            var dataPoint = scoreMap[priority];
                            var chart = WhereToBuy.makeSparkLine(currentID, dataPoint, priorityScores, priority);
                            WhereToBuy.charts.push({
                                'chart': chart,
                                'dataPoint': dataPoint,
                                'scores': priorityScores,
                                'priority': priority
                            });
                        });
                        // Update the first chart to add the appropriate key
                        $first = WhereToBuy.charts[0];
                        var redLine = parseFloat($first.dataPoint);
                        var p = $first.priority;
                        var s = $first.scores;
                        var l = WhereToBuy.getLabels(p, s);
                        var leftside = (p == 'crime') ? 'High crime'
                                     : (p == 'schools') ? 'Low performing'
                                     : (p == 'diversity') ? 'Low diversity'
                                     : 'Low growth';
                        var rightside = (p == 'crime') ? 'Low crime'
                                      : (p == 'schools') ? 'High performing'
                                      : (p == 'diversity') ? 'High diversity'
                                      : 'Solid growth';
                        var align = (community == 'Lincoln Park' || community == 'Archer Heights') ? 'right' : 'center';
                        var labelStyle = {
                            'background-color': '#f9f9f9',
                            'padding': '1px',
                            'border-radius': '3px'
                        };
                        $first.chart.update({
                            xAxis: {
                                plotLines: [{
                                    color: '#FF0000',
                                    width: 2,
                                    value: redLine,
                                    label: {
                                        useHTML: true,
                                        text: community,
                                        rotation: 0,
                                        verticalAlign: 'top',
                                        align: align,
                                        style: labelStyle
                                    }
                                }, {
                                    color: '#aaaaaa',
                                    width: 1,
                                    value: 0,
                                    dashStyle: 'ShortDash',
                                    label: {
                                        text: 'Average',
                                        rotation: 0,
                                        verticalAlign: 'middle',
                                        align: 'center'
                                    }
                                }, {
                                    color: null,
                                    width: 0,
                                    value: l.min - WhereToBuy.binSize,
                                    label: {
                                        text: l.leftside,
                                        verticalAlign: 'bottom',
                                        rotation: 0,
                                        useHTML: true,
                                        style: {
                                            'font-size': '0.6em'
                                        }
                                    }
                                }, {
                                    color: null,
                                    width: 0,
                                    value: l.max + WhereToBuy.binSize,
                                    label: {
                                        text: l.rightside,
                                        verticalAlign: 'bottom',
                                        align: 'right',
                                        rotation: 0,
                                        useHTML: true,
                                        style: {
                                            'font-size': '0.6em'
                                        }
                                    }
                                }]
                            }
                        });
                    // Case charts are currently distributions
                    } else {
                        // Update the toggle button
                        $(this).removeClass('active');
                        $(this).html('View charts as distributions');

                        // Remove charts
                        for (var z=0; i<WhereToBuy.charts.length; z++) {
                            WhereToBuy.charts[z].chart.destroy();
                        }

                        // Add bars back in 
                        WhereToBuy.makeBarCharts(scoreMap);
                    }
                });

                // Update the modal with information
                $('#short-description').html(shortDescription);
                $('#community-info-label, .community-name').html(community);
                $('.modal').modal();
            });
        } else {
            // Update the modal
            $('#community-info-label').html(community);
            $('#community-stats').html(msg);
            $('.modal').modal();
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

    getDataSource: function() {
        // Returns the proper data source based on current global vars
        // (Data must have been fetched already)

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
        return dataSource;
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
    },

    isChicago: function(community) {
        // Simple function to determine if a community is in Chicago or not.
        for (var i=0; i<WhereToBuy.chicagoScores.length; i++) {
            var c = WhereToBuy.chicagoScores[i].community;
            if (c == community) {
                return true;
            } else if (WhereToBuy.toCommunityString(c) == community) {
                return true;
            }
        }
        return false;
    },

    /**
     * Create a constructor for sparklines that takes some sensible defaults and merges in the individual
     * chart options. This function is also available from the jQuery plugin as $(element).highcharts('SparkLine').
     */
    makeSparkLine: function (a, b, c, priority) {
        // a: id of the div to generate a chart in
        // b: point at which to draw a line
        // c: series data for the sparkline
        // d: the priority that this chart represents
        var l = WhereToBuy.getLabels(priority, c);
        var options = {
                chart: {
                    reflow: false,
                    renderTo: a,
                    backgroundColor: null,
                    borderWidth: 0,
                    type: 'areaspline',
                    margin: [2, 0, 2, 0],
                    height: 80,
                    style: {
                        overflow: 'visible'
                    },

                    // small optimalization, saves 1-2 ms each sparkline
                    skipClone: true
                },
                series: [{
                    data: c
                }],
                title: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    max: l.max + WhereToBuy.binSize,
                    min: l.min - WhereToBuy.binSize,
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null
                    },
                    startOnTick: false,
                    endOnTick: false,
                    plotLines: [{
                        color: '#FF0000',
                        width: 2,
                        value: b,
                    }, {
                        color: '#aaaaaa',
                        width: 1,
                        value: 0,
                        dashStyle: 'ShortDash',
                    }, {
                        color: null,
                        width: 0,
                        value: l.min - WhereToBuy.binSize,
                        label: {
                            text: l.leftside,
                            verticalAlign: 'bottom',
                            rotation: 0,
                            useHTML: true,
                            style: {
                                'font-size': '0.6em'
                            }
                        }
                    }, {
                        color: null,
                        width: 0,
                        value: l.max + WhereToBuy.binSize,
                        label: {
                            text: l.rightside,
                            verticalAlign: 'bottom',
                            align: 'right',
                            rotation: 0,
                            useHTML: true,
                            style: {
                                'font-size': '0.6em'
                            }
                        }
                    }],
                    tickPositions: []
                },
                yAxis: {
                    endOnTick: false,
                    startOnTick: false,
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null
                    },
                    tickPositions: [0]
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        animation: false,
                        lineWidth: 1,
                        shadow: false,
                        states: {
                            hover: {
                                enabled: false,
                            }
                        },
                        marker: {
                            enabled: false,
                        },
                        fillOpacity: 0.25
                    },
                    areaspline: {
                        fillOpacity: 0.5
                    },
                    column: {
                        negativeColor: '#910000',
                        borderColor: 'silver'
                    }
                }
            };

        return new Highcharts.Chart(a, options);
    },

    // Function to generate bar charts in the table div
    makeBarCharts: function(scoreMap) {
        // Get summary statistics for current data source
        var stats = {};
        for (var m=0; m<WhereToBuy.priorities.length; m++) {
            stats[WhereToBuy.priorities[m]] = WhereToBuy.getSummaryStats(WhereToBuy.priorities[m]);
        }

        // Update each chart div to add a chart
        $('.sparkline').each(function() {
            $(this).html('<span class="bar-chart">' +
                            '<span class="bar"></span>' +
                            '<span class="tick average"></span>' +
                         '</span>' +
                         '<span class="bar-label leftside"></span>' +
                         '<span class="bar-label rightside"></span>' +
                         '<span class="bar-label average-tick">Average</span>');
            var priority = $(this).attr('id').replace('-score', '');
            var priorityStats = stats[priority];
            var priorityScores = WhereToBuy.getHistogram(priority, WhereToBuy.binSize);
            var range = priorityStats.max - priorityStats.min;

            var labels = WhereToBuy.getLabels(priority, priorityScores);
            var dataPoint = scoreMap[priority];
            
            // Add bar for current community
            var bar = parseInt(((scoreMap[priority] - priorityStats.min) / range) * 100);
            $(this).find('span.bar').css('width', bar + '%');

            // Add tick for the average
            var average = parseInt(((0 - priorityStats.min) / range) * 100);
            $(this).find('span.average').css('left', average + '%');

            // Add labels
            $(this).find('.bar-label.leftside').html(labels.leftside);
            $(this).find('.bar-label.rightside').html(labels.rightside);

            // Get position for average label
            var tdwidth = $('#' + priority + '-title').width();
            var avgleft = $(this).find('span.average').position().left;
            var tablewidth = $('#community-stats').width();
            var averageTick = parseInt(((tdwidth + 16 + avgleft - 12) / tablewidth) * 100);
            console.log(averageTick);
            $(this).find('.bar-label.average-tick').css('left', averageTick + '%');
        });
    },

    getLabels: function(priority, c) {
        // Returns chart label data for a given priority and scores.
        var leftside,
            rightside;
        if ($(window).width() > 420) {
            leftside = (priority == 'crime') ? 'High crime'
                         : (priority == 'schools') ? 'Low performing'
                         : (priority == 'diversity') ? 'Low diversity'
                         : 'Low growth';
            rightside = (priority == 'crime') ? 'Low crime'
                         : (priority == 'schools') ? 'High performing'
                         : (priority == 'diversity') ? 'High diversity'
                         : 'Solid growth';
        } else {
            leftside = (priority == 'crime') ? 'High'
                         : (priority == 'schools') ? 'Bad'
                         : (priority == 'diversity') ? 'Low'
                         : 'Low';
            rightside = (priority == 'crime') ? 'Low'
                         : (priority == 'schools') ? 'Good'
                         : (priority == 'diversity') ? 'High'
                         : 'Solid';
        }
        var scores = c.map(function(x) { return x[0]; });
        var max = Math.max.apply(null, scores);
        var min = Math.min.apply(null, scores);

        return {
            'leftside': leftside,
            'rightside': rightside,
            'scores': scores,
            'max': max,
            'min': min
        };
    },

    getHistogram: function(priority, step) {
        // Returns distribution of the current data source for a given priority

        var dataSource = WhereToBuy.getDataSource();

        var data = [];
        for (var i=0; i<dataSource.length; i++) {
            data.push(parseFloat(dataSource[i][priority]));
        }

        var histo = {},
            arr = [],
            x;

        // Group down based on step resolution
        for (var j=0; j<data.length; j++) {
            x = Math.floor(data[j] / step) * step;
            if (!histo[x]) {
                histo[x] = 0;
            }
            histo[x]++;
        }

        // Make the histo group into an array
        for (x in histo) {
            if (histo.hasOwnProperty((x))) {
                arr.push([parseFloat(x), histo[x]]);
            }
        }

        // Finally, sort the array
        arr.sort(function (a, b) {
            return a[0] - b[0];
        });

        return arr;
    },

    getSummaryStats: function(priority) {
        // Calculates min, max, quartiles, and median for a given priority

        var dataSource = WhereToBuy.getDataSource();

        var omega = [];
        for (var i=0; i<dataSource.length; i++) {
            omega.push(parseFloat(dataSource[i][priority]));
        }

        omega.sort(function(a, b) {return a-b;});
        var mid = omega.length / 2;

        var out = {
            'min': omega[0],
            'median': (mid % 1) ? omega[mid-0.5] : (omega[mid-1] + omega[mid]) / 2,
            'max': omega[omega.length - 1],
        };

         var lower = (omega.length % 2) ? omega.slice(0, mid-0.5) : omega.slice(0, out[mid-1]);
         var lowerMid = lower.length / 2;
         var upper = (omega.length % 2) ? omega.slice(mid-0.5, omega.length-1) : omega.slice(out[mid], omega.length-1);
         var upperMid = upper.length / 2;

         out['firstQ'] = (lowerMid % 1) ? lower[lowerMid-0.5] : (lower[lowerMid-1] + lower[lowerMid]) / 2;
         out['secondQ'] = (upperMid % 1) ? upper[upperMid-0.5] : (upper[upperMid-1] + upper[upperMid]) / 2;

         return out;
    },
};