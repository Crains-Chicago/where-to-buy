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

This Makefile takes as input the output files of a few other DataMade repos. Those files live in the `final/` directory, since they're considered to be final copies in and of themselves. If you want to remake any of them (to get a new year of real estate data, for example) you'll have to manually remake source data in those repos and copy the output over here. 

Here are the files you might be interested in remaking, and instructions for how to make them for this project:

* [Book of Lists](https://github.com/datamade/book-of-lists)
    - **Summary:** School, crime, diversity, and commute data from a variety of sources.
    - **Files:**
        - `final/chicago.csv`
        - `final/chicago_schools.csv`
        - `final/suburb.csv`
        - `final/suburb_schools.csv`
    - **How to make them:**: Follow the instructions in the Book of Lists repo for making all output. Then, copy the files over from the `output/` directory to the `final/` directory in this repo.
    - **Sample script:**
    
    ```bash
    # Make the Book of Lists files
    cd book-of-lists
    workon book-of-lists
    make
    
    # Copy the output to this repo
    cp output/chicago.csv ~/where-to-buy/data/final/chicago.csv
    cp output/chicago_schools.csv ~/where-to-buy/data/final/chicago_schools.csv
    cp output/suburb.csv ~/where-to-buy/data/final/suburb.csv
    cp output/suburb_schools.csv ~/where-to-buy/data/final/suburb_schools.csv
    ```
    
* [CAR Scraper](https://github.com/datamade/car-scraper)
    - **Summary:** Real estate data from the Chicago Association of Realtors.
    - **Files:**
        - `final/chicago_yearly_price_data.csv`
        - `final/suburb_yearly_price_data.csv`
    - **How to make them:** The CAR scraper allows you to get real estate data for any month/year by setting variables at the top of the Makefile. It's a cool feature, but for this project we're only interested in year-over-year changes. You'll want to set the month and year to December of the last available year, run the scraper, and then copy the files over here, making sure to remove the trailing month/year extension in the filename.
    - **Sample script:**
    
    ```bash
    cd car-scraper
    workon car-scraper
    vim Makefile
    
    # Look for December data from the last available year
    year = 2016
    month = 12
    :wq  # Save and quit (vim command)
    
    # Make all files and copy the output to this repo
    make all
    cp final/chicago_yearly_price_data_12_2017.csv ~/where-to-buy/data/final/chicago_yearly_price_data.csv
    cp final/suburb_yearly_price_data_12_2017.csv ~/where-to-buy/data/final/suburb_yearly_price_data.csv
    ```
    
Once you've updated the source data, you'll have to remake the output files of this directory, too.   

## Making output files

Run `make geojson` to generate only the map layers.

Run `make community_data` to generate only the community data (variable indeces and short descriptions).

Run `make all` to generate everything – map layers and community data.

Run `make clean` to get rid of the output and remove all generated files from your repo.
