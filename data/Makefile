PG_DB = wtb

include map_layers.mk

.PHONY: all clean

all: final/places.geojson final/community_areas.geojson

geojson: final/places.geojson final/community_areas.geojson

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"