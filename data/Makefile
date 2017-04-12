PG_DB = wtb

include map_layers.mk community_data.mk real_estate.mk

.PHONY: all clean geojson yearly_price_data

geojson: final/places.geojson final/community_areas.geojson

yearly_price_data: final/chicago_yearly_price_data.csv final/suburb_yearly_price_data.csv

all: final/places.geojson final/community_areas.geojson final/community_data.csv

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	rm -Rf chicago_crime_index.csv chicago_school_index.csv
	rm -Rf suburb_crime_*.csv suburb_school_*.csv
	rm -Rf final/community_data.csv
	rm -Rf raw/pdfs/ pdfs
	rm -Rf raw/csvs/ cleaned_csvs raw_csvs conversion_errors.csv
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"

final/short_descriptions.json : places.csv final/chicago.csv
	csvstack $^ | python scripts/get_wiki_descriptions.py > $@