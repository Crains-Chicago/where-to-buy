PG_DB = wtb

include map_layers.mk community_data.mk

.PHONY: all clean

all: final/places.geojson final/community_areas.geojson

geojson: final/places.geojson final/community_areas.geojson

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	rm -Rf final/community_data.csv
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"