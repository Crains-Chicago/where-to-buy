import csv
import sys

with open(sys.argv[1]) as f:
    car_csv = csv.reader(f)
    car_header = next(car_csv)
    car_places = [row[0] for row in car_csv]

with open(sys.argv[2]) as g:
    canonical_csv = csv.reader(g)
    canonical_header = next(canonical_csv)
    canonical_places = [row[0] for row in canonical_csv]

# Canonical suffixes for places
SUFFIXES = [
    ' village, Illinois',
    ' city, Illinois',
    ' town, Illinois'
]

# Clean places with multiple entries
duped_places = []
for place in car_places:
    if ' and ' in place:
        split_list = place.split(' and ')
        for item in split_list:
            duped_places.append(item)
    elif ', ' in place:
        split_list = place.split(', ')
        for item in split_list:
            duped_places.append(item)
    elif ' Area' in place:
        item = place.replace(' Area', '')
        duped_places.append(item)
    else:
        duped_places.append(place)

for place in duped_places:
    possible_matches = []
    for canonical_place in canonical_places:
        if place in canonical_place:
            possible_matches.append(canonical_place)
    # Dundee should be East Dundee and West Dundee
    if len(possible_matches) > 1:
        print('-----------')
        print('Place: ' + place)
        print('Possible matches:')
        for match in possible_matches:
            for suf in SUFFIXES:
                if match.split(suf)[0] == place:
                    print('\t- ' + match)
