PG_DB = wtb

include map_layers.mk community_data.mk

.PHONY: all clean geojson community_data

geojson: final/places.geojson final/community_areas.geojson

community_data: final/chicago_data.csv final/suburb_data.csv final/short_descriptions.json

all: geojson community_data

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	rm -Rf chicago_crime_index.csv chicago_school_index.csv
	rm -Rf suburb_crime_*.csv suburb_school_*.csv
	rm -Rf final/chicago_data.csv final/suburb_data.csv
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"
