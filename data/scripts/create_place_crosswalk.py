import csv
import sys

# Open the files and extract only the place names
with open(sys.argv[1]) as f:
    car_csv = csv.reader(f)
    car_header = next(car_csv)
    car_places = [row[0] for row in car_csv]

with open(sys.argv[2]) as g:
    canonical_csv = csv.reader(g)
    canonical_header = next(canonical_csv)
    canonical_places = [row[0] for row in canonical_csv]

# Write headers
writer = csv.writer(sys.stdout)
out_header = ['community', 'Place']
writer.writerow(out_header)

# Canonical suffixes for places
SUFFIXES = [
    ' village, Illinois',
    ' city, Illinois',
    ' town, Illinois'
]

# Clean places with multiple entries per line, saving
# the old version and the new version
duped_places = []
for place in car_places:
    if ' and ' in place:
        split_list = place.split(' and ')
        # Handle double reporting for Vernon Hills
        if 'Vernon Hills' in split_list[1]:
            duped_places.append((split_list[0], split_list[0]))
        else:
            for item in split_list:
                duped_places.append((place, item))
    elif ', ' in place:
        split_list = place.split(', ')
        for item in split_list:
            duped_places.append((place, item))
    elif ' Area' in place:
        item = place.replace(' Area', '')
        duped_places.append((place, item))
    else:
        duped_places.append((place, place))

# Match places between the two files
for place, duped_place in duped_places:
    matches = []
    for canonical_place in canonical_places:
        if duped_place in canonical_place:
            matches.append(canonical_place)
    # Clean up the matches
    good_matches = []
    # Dundee's matches are weird, but they're all fine
    if duped_place == 'Dundee':
        for match in matches:
            good_matches.append(match)
    # Check multiple matches against the suffixes
    elif len(matches) > 1:
        for match in matches:
            for suf in SUFFIXES:
                if match.split(suf)[0] == duped_place:
                    good_matches.append(match)
    else:
        good_matches = matches
    # Write good matches to output
    for match in good_matches:
        writer.writerow([place, match])
