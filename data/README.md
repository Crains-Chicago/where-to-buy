# Where to Buy Data

This subdirectory generates the data sources that power Crain's Where to Buy.

## Requirements

All OS-level requirements are standard DataMade tools. Make sure you have them installed:

- Python 3.3+ 
- PostgreSQL
- PostGis
- GDAL (with GeoJSON driver)
- wget (if you'd like to download a new version of the compressed shapefiles)

Next, make a virtualenv and install Python requirements:

```
mkvirtualenv where-to-buy
pip install -U -r requirements.txt
```

Finally, you'll have to create a Postgres database for the shapefiles to live in. Create it on the default port, without username/password protection:

```
createdb wtb
```

## Updating source data

This Makefile takes as input the output files of a few other DataMade repos. Those files live in the `final/` directory, since they're considered to be final copies in and of themselves. 
## Making output files

Run `make geojson` to generate only the map layers.

Run `make community_data` to generate only the community data (variable indeces and short descriptions).

Run `make all` to generate everything – map layers and community data.

Run `make clean` to get rid of the output and remove all generated files from your repo.
