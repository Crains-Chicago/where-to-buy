# Where to Buy Map Data

This repo generates the map layers that we need for the Where to Buy tool.

## Requirements

- PostgreSQL
- PostGis
- GDAL (with GeoJSON driver)
- wget (if you'd like to download a new version of the compressed shapefiles)

Start by making a database for the shapefiles to live in:

`createdb wtb`

Then, make a virtualenv for the project and install the Python requirements:

`pip install -r requirements.txt`

## Making the files

Run `make all` to generate the GeoJSON output. 

Run `make clean` to get rid of the output and remove intermediate files from your repo.