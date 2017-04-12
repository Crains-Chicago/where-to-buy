import csv
import sys
import time

start = time.time()

reader = csv.reader(sys.stdin)
header = next(reader)

try:
    FILENAME = sys.argv[1]
except IndexError:
    pass


def parse_num(val):
    out = val.replace('$', '').replace(',', '').replace('%', '')
    out = out.replace('+', '').replace('+ ', '').replace('- ', '-')
    out = float(out)
    return out

for row in reader:
    # Sanity check the format of the values
    for i, val in enumerate(row):
        if "change" in header[i] and val != '--':
            # Value must start with 0, --, +, or -
            try:
                assert val[0] in ['0', '-', '+']
            except AssertionError:
                try:
                    print('Percentage error in ' + FILENAME)
                except NameError:
                    print('PERCENTAGE ERROR')
                print("Command: assert val[0] in ['0', '-', '+']")
                print('Community:', row[0])
                print('Column:', header[i])
                print('Row value:', val)
                print('====================')
            # Should end with a percent sign
            try:
                assert val[-1] == '%'
            except AssertionError:
                try:
                    print('Percentage error in ' + FILENAME)
                except NameError:
                    print('PERCENTAGE ERROR')
                print("Command: assert val[-1] == '%'")
                print('Community:', row[0])
                print('Column:', header[i])
                print('Row value:', val)
                print('====================')
            # Recalculate deltas based on previous values
            val_as_float = float(parse_num(val))
            delta = (parse_num(row[i-1]) - parse_num(row[i-2])) /\
                parse_num(row[i-2])
            try:
                assert (round(delta*100, 1) <= round(val_as_float, 1) + 1) and\
                       (round(delta*100, 1) >= round(val_as_float, 1) - 1)
            except AssertionError:
                try:
                    print('Percentage error in ' + FILENAME)
                except NameError:
                    print('PERCENTAGE ERROR')
                print('Community:', row[0])
                print('Column:', header[i])
                print('Row value:', round(val_as_float, 1))
                print('Calculated delta:', round(delta*100, 1))
                print('(Note: calculated deltas should be within +-1 of' +
                      ' the row value.')
                print('====================')
        elif "median_price" in header[i] and val != '--':
            # Value must start with a dollar sign
            try:
                assert val[0] == '$'
            except AssertionError:
                try:
                    print('Dollar sign error in ' + FILENAME)
                except NameError:
                    print('DOLLAR SIGN ERROR')
                print("Command: assert val[0] == '$'")
                print('Community:', row[0])
                print('Column:', header[i])
                print('Row value:', val)
                print('====================')
            # Commas must be followed by three digits
            if ',' in val:
                for sub in val.split(',')[1:]:
                    try:
                        assert len(sub) == 3
                    except AssertionError:
                        try:
                            print('Comma error in ' + FILENAME)
                        except NameError:
                            print('COMMA ERROR')
                        print("Command: assert len(sub) == 3")
                        print('Community:', row[0])
                        print('Column:', header[i])
                        print('Row value:', val)
                        print('====================')
        elif "new_listings" in header[i] or "closed_sales" in header[i]:
            # Commas must be followed by three digits
            if ',' in val:
                for sub in val.split(',')[1:]:
                    try:
                        assert len(sub) == 3
                    except AssertionError:
                        try:
                            print('Comma error in ' + FILENAME)
                        except NameError:
                            print('COMMA ERROR')
                        print("Command: assert len(sub) == 3")
                        print('Community:', row[0])
                        print('Column:', header[i])
                        print('Row value:', val)
                        print('====================')
