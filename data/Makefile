.PHONY: all clean

all: final/places.geojson

clean:
	rm -Rf raw/shapefiles/ final/counties.geojson raw/cb_2015_17_place_500k.zip

raw/cb_2015_17_place_500k.zip: 
	wget -O $@ https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_17_place_500k.zip

raw/shapefiles/cb_2015_17_place_500k.shp: raw/cb_2015_17_place_500k.zip
	unzip "$<" -d raw/shapefiles/

final/places.geojson: raw/shapefiles/cb_2015_17_place_500k.shp
	ogr2ogr -f "GEOJSON" -s_srs EPSG:4269 -t_srs EPSG:4326 $@ $<