PG_DB = wtb
CHECK_RELATION = psql -d $(PG_DB) -c "\d $@" > /dev/null 2>&1

.PHONY: all clean

all: final/places.geojson final/community_areas.geojson

clean:
	rm -Rf raw/shapefiles/ final/places.geojson final/community_areas.geojson suburbs community_areas raw/*.zip
	psql -d $(PG_DB) -c "DROP TABLE suburbs,community_areas;"

postgis:
	psql -d $(PG_DB) -c "CREATE EXTENSION postgis;"
	touch $@

raw/community_areas.zip:
	wget -O $@ "https://data.cityofchicago.org/api/geospatial/cauq-8yn6?method=export&format=Shapefile" 

raw/shapefiles/community_areas.shp: raw/community_areas.zip
	unzip "$<" -d raw/shapefiles/
	mv raw/shapefiles/geo_export*.dbf raw/shapefiles/community_areas.dbf
	mv raw/shapefiles/geo_export*.prj raw/shapefiles/community_areas.prj
	mv raw/shapefiles/geo_export*.shp raw/shapefiles/community_areas.shp
	mv raw/shapefiles/geo_export*.shx raw/shapefiles/community_areas.shx

raw/cb_2015_17_place_500k.zip: 
	wget -O $@ https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_17_place_500k.zip

raw/shapefiles/cb_2015_17_place_500k.shp: raw/cb_2015_17_place_500k.zip
	unzip "$<" -d raw/shapefiles/

suburbs: raw/shapefiles/cb_2015_17_place_500k.shp postgis
	$(CHECK_RELATION) || \
		shp2pgsql -s 4269 $< $@ | psql -d $(PG_DB)
	touch $@

community_areas: raw/shapefiles/community_areas.shp postgis
	$(CHECK_RELATION) || \
		shp2pgsql -s 4326 $< $@ | psql -d $(PG_DB)
	touch $@

final/places.geojson: suburbs places.csv 
	query=$$(eval csvcut -c 2 places.csv | tail -n +2 | \
		sed -e ':a' -e 'N' -e '$$!ba' -e "s/\n/', '/g" | \
		sed -e "s/^/select name, placefp, ST_Simplify\(geom,0.001\) from $< where placefp in \('/" | \
		sed -e "s/$$/'\) and placefp \!= '14000'/") && \
	ogr2ogr -f "GeoJSON" $@ PG:"dbname=$(PG_DB)" -s_srs EPSG:4269 -t_srs EPSG:4326 -sql "$$query"

final/community_areas.geojson: community_areas
	query="select community, ST_Simplify(geom,0.001) from $<" && \
	ogr2ogr -f "GeoJSON" $@ PG:"dbname=$(PG_DB)" -s_srs EPSG:4326 -t_srs EPSG:4326 -sql "$$query"