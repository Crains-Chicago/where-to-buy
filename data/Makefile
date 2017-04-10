PG_DB = wtb

include map_layers.mk community_data.mk real_estate.mk

.PHONY: all clean

all: final/places.geojson final/community_areas.geojson final/community_data.csv

geojson: final/places.geojson final/community_areas.geojson

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	rm -Rf chicago_crime_index.csv chicago_school_index.csv
	rm -Rf suburb_crime_*.csv suburb_school_*.csv
	rm -Rf final/community_data.csv
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"

final/short_descriptions.json : places.csv final/chicago.csv
	csvstack $^ | python scripts/get_wiki_descriptions.py > $@