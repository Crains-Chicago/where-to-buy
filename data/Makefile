PG_DB = wtb
CHECK_RELATION = psql -d $(PG_DB) -c "\d $@" > /dev/null 2>&1

.PHONY: all clean

all: final/places.geojson

clean:
	rm -Rf raw/shapefiles/ final/places.geojson all_places raw/cb_2015_17_place_500k.zip
	psql -d $(PG_DB) -c "DROP TABLE all_places;"

postgis:
	psql -d $(PG_DB) -c "CREATE EXTENSION postgis;"
	touch $@

raw/cb_2015_17_place_500k.zip: 
	wget -O $@ https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_17_place_500k.zip

raw/shapefiles/cb_2015_17_place_500k.shp: raw/cb_2015_17_place_500k.zip
	unzip "$<" -d raw/shapefiles/

all_places: raw/shapefiles/cb_2015_17_place_500k.shp postgis
	$(CHECK_RELATION) || \
		shp2pgsql -s 4269 $< $@ | psql -d $(PG_DB)
	touch $@

final/places.geojson: all_places places.csv 
	query=$$(eval csvcut -c 2 places.csv | tail -n +2 | \
		sed -e ':a' -e 'N' -e '$$!ba' -e "s/\n/', '/g" | \
		sed -e "s/^/select * from $< where placefp in \('/" -e "s/$$/'\)/") && \
	ogr2ogr -f "GeoJSON" $@ PG:"dbname=$(PG_DB)" -s_srs EPSG:4269 -t_srs EPSG:4326 -sql "$$query"