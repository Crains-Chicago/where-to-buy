import csv
import sys


# Custom exception for debugging
class ArgException(Exception):
    pass

# Make sure the right number of arguments got passed in
try:
    assert sys.argv[1]
    assert sys.argv[2]
except IndexError as e:
    raise ArgException("The script clean_price_data.py requires two " +
                       "arguments: `filename` and `year`. Check to see " +
                       "that you included both.")

# Global vars
FILENAME = sys.argv[1].split('/')[2]
YEAR = sys.argv[2]
PREV_YEAR = str(int(YEAR)-1)
CHANGE = 'change'
SUFFIXES = [PREV_YEAR, YEAR, CHANGE]

# Read in the CSV
reader = csv.reader(sys.stdin)
in_header = next(reader)

# Chicago data
if len(in_header) <= 8:

    # Map input rows to output columns
    variables = [
        'new_listings',
        'closed_sales',
        'median_price',
        'percent_of_list_price_received',
        'market_time',
        'inventory_for_sale'
    ]
    var_labels = [
        'New Listings',
        'Closed Sales',
        'Median Sales Price*',
        'Percent of Original List Price Received*',
        'Market Time',
        'Inventory of Homes for Sale'
    ]
    var_map = {label: var for (label, var) in zip(var_labels, variables)}

    # Bring the CSV into memory so we can split tables if need be
    data = [row for row in reader]

    # Check if the data is from Chicago, or a summary of a county
    if len(data) > 8:
        detached = data[:8]
        attached = data[8:]

        attached_results = {}
        for row in attached:
            try:
                # Check if first col is empty b.c. of weird PDF conversion
                if row[0] == '':
                    attached_results[var_map[row[1]]] = row[5:]
                else:
                    attached_results[var_map[row[0]]] = row[4:]

            except KeyError:
                # If the row value doesn't match a variable, skip it
                continue

        detached_results = {}
        for row in detached:
            try:
                if row[0] == '':
                    detached_results[var_map[row[1]]] = row[5:]
                else:
                    detached_results[var_map[row[0]]] = row[4:]
            except KeyError:
                continue

        # Build a dict of values to store the results
        output = {}
        for key in attached_results:
            for label, val in zip(SUFFIXES, attached_results[key]):
                output['_'.join(('attached', key, label))] = val

        for key in detached_results:
            for label, val in zip(SUFFIXES, detached_results[key]):
                output['_'.join(('detached', key, label))] = val

    # Similar process for county summaries, which have the same structure
    else:
        data_results = {}
        for row in data:
            try:
                if row[0] == '':
                    data_results[var_map[row[1]]] = row[5:]
                else:
                    data_results[var_map[row[0]]] = row[4:]
            except KeyError:
                continue
        output = {}
        for key in data_results:
            for label, val in zip(SUFFIXES, data_results[key]):
                output['_'.join((key, label))] = val

    # Build the right header row
    if len(data) > 8:
        prefixes = ['detached', 'attached']
        zipped = [[pre, var, suf] for pre in prefixes for var in variables for suf in SUFFIXES]
    else:
        zipped = [[var, suf] for var in variables for suf in SUFFIXES]

    fieldnames = ['community'] + ['_'.join(name) for name in zipped]

    # Figure out the name of this community and add it to the dict of values
    if '.pdf' in FILENAME:
        place = FILENAME.split('.pdf')[0].replace('_', ' ').upper()
    else:
        # For debugging
        assert '.csv' in FILENAME
        place = FILENAME.split('.csv')[0].replace('_', ' ').upper()
    output['community'] = place

    # Wrap the output in a list, for generalization
    output = [output]

# Handle suburbs
else:
    # Set the right variables based on the sheet number in the filename
    if '2' in FILENAME:
        variables = [
            'new_listings',
            'closed_sales'
        ]
    elif '3' in FILENAME:
        variables = [
            'median_price',
            'market_time'
        ]
    elif '4' in FILENAME:
        variables = [
            'percent_of_list_price_received',
            'inventory_for_sale',
            'months_supply'
        ]

    # Remove the second header
    second_header = next(reader)

    # Read CSV into memory
    data = [row for row in reader]

    # Find entries where data spans multiple lines and squish them together
    cleaned_data = []
    for index, row in enumerate(data):
        # Check if first col is empty b.c. of weird PDF conversion
        if row[0] == '':
            zero = 1
        else:
            zero = 0

        # Skip entries with no valid data
        if (row[zero+1] == ''):
            continue
        # Find entries where the community name is missing
        elif row[zero] == '' and not (row[zero+1] == ''):
            # Squish the surrounding rows into this one
            community = ' '.join((data[index-1][zero], data[index+1][zero]))
            cleaned_data.append([community] + row[zero+1:])
        else:
            cleaned_data.append(row[zero:])

    # Perform a similar cleaning process as above
    output = []
    for row in cleaned_data:
        # Set up the output row with community name
        final_row = {}
        final_row['community'] = row[0]

        # Do some zipping to match up the rest of the vals
        data_results = {}
        data_results[variables[0]] = row[4:7]
        if len(variables) == 3:
            data_results[variables[1]] = row[7:10]
            data_results[variables[2]] = row[10:]
        else:
            data_results[variables[1]] = row[10:]

        for key in data_results:
            for label, val in zip(SUFFIXES, data_results[key]):
                final_row['_'.join((key, label))] = val

        # Push this row dict into the output dict
        output.append(final_row)

    # Build the header row
    zipped = [[var, suf] for var in variables for suf in SUFFIXES]
    fieldnames = ['community'] + ['_'.join(name) for name in zipped]

# Write the output
writer = csv.DictWriter(sys.stdout,
                        fieldnames=fieldnames,
                        quoting=csv.QUOTE_MINIMAL)
writer.writeheader()
for row in output:
    writer.writerow(row)
