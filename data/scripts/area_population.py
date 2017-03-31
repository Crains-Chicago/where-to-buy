import sys
import json
import csv

from census_area import Census

from secrets import API_KEY

writer = csv.writer(sys.stdout)
writer.writerow(('community', 'population'))

geojson = json.load(sys.stdin)
features = geojson["features"]

c = Census(API_KEY)

fields = {'total_pop': 'B01003_001E'}

for feature in features:
    community = feature["properties"]["community"]
    tracts = c.acs5.geo_tract(('NAME', fields['total_pop']),
                              feature["geometry"])
    total_pop = sum(int(tract[1]['B01003_001E']) for tract in tracts)
    # Remove population of Cook County Jail
    # (source: https://performance.cookcountyil.gov/reports/Sheriff-DOC)
    if community == "SOUTH LAWNDALE":
        total_pop -= 9000
    writer.writerow((community, total_pop))
