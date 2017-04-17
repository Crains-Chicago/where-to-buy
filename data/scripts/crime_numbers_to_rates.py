import sys
import csv
import psycopg2

location = sys.argv[1]
assert location in ["chicago", "suburbs"]
if location == "suburbs":
    dbname = sys.argv[2]

reader = csv.reader(sys.stdin)
writer = csv.writer(sys.stdout)

header = next(reader)

if location == "chicago":
    writer.writerow(header[:len(header)-1])
    for row in reader:
        for i, x in enumerate(row):
            if i > 0 and i < len(row)-1:
                rate = (float(x)/float(row[-1])) * 10000
                x = row[i] = rate
        writer.writerow(row[:-1])

elif location == "suburbs":
    # Write the header
    writer.writerow([header[0]] + header[3:])

    # Bring the data into memory so we can search it
    reader_list = list([row for row in reader])
    all_fips = ["'" + str(row[-1]) + "'" for row in reader_list]

    # Set up the database connection
    conn = psycopg2.connect("dbname='" + dbname + "'")
    cur = conn.cursor()

    # Calculate rates for each place
    for row in reader_list:

        # Find the eight nearest neighbors of the current place
        fips = str(row[-1])
        query = "SELECT placefp " + \
                "FROM suburbs WHERE placefp != '" + fips + "' " + \
                "AND placefp IN (" + ','.join(all_fips) + ") " + \
                "ORDER BY geom <-> " + \
                    "(SELECT geom FROM suburbs " + \
                    "WHERE placefp = '" + fips + "') " + \
                "LIMIT 8;"
        cur.execute(query)
        query_rows = cur.fetchall()
        neighbors = [query_row[0] for query_row in query_rows]

        # Calculate a rate for this place smoothed by its neighbors
        neighbor_data = [row] + [r for r in reader_list if r[-1] in neighbors]
        try:
            pop2014_sum = sum([int(r[2]) for r in neighbor_data if r[2]])
            pop2015_sum = sum([int(r[1]) for r in neighbor_data if r[1]])
        except ValueError as e:
            print(neighbor_data)
            raise ValueError('Wrong').with_trackeback(e.__traceback__)
        for i, x, in enumerate(row):
            if i == len(row)-1:  # ignore FIPS code
                rate = x
            elif i > 2 and i < 17 and pop2015_sum > 0:
                total = sum([float(r[i]) for r in neighbor_data if r[i]])
                rate = (total/pop2015_sum) * 10000
            elif i > 2 and i < 17 and pop2015_sum == 0:
                rate = 0
            elif i > 17 and pop2014_sum > 0:
                total = sum([float(r[i]) for r in neighbor_data if r[i]])
                rate = (total/pop2014_sum) * 10000
            elif i > 17 and pop2014_sum == 0:
                rate = 0
            else:
                rate = x
            x = row[i] = rate
        writer.writerow([row[0]] + row[3:-1])


    # good_data = []
    # no_data = []
    # writer.writerow([header[0]] + header[3:])
    # for row in reader:
    #     # Pull rows out of the mix if they're all null
    #     try:
    #         assert len(row[3]) > 0
    #     except AssertionError:
    #         no_data.append(row)
    #         continue
    #     # If the row looks good, calculate some rates
    #     pop2015 = float(row[1])
    #     pop2014 = float(row[2])
    #     for i, x, in enumerate(row):
    #         if i == len(row)-1:  # FIPS code
    #             rate = x
    #         elif i > 2 and i < 17 and pop2015 > 0:
    #             rate = (float(x)/pop2015) * 10000
    #         elif i > 2 and i < 17 and pop2015 == 0:
    #             rate = 0
    #         elif i > 17 and pop2014 > 0:
    #             rate = (float(x)/pop2014) * 10000
    #         elif i > 17 and pop2014 == 0:
    #             rate = 0
    #         else:
    #             rate = x
    #         x = row[i] = rate
    #     good_data.append([row[0]] + row[3:])
    #     writer.writerow([row[0]] + row[3:-1])

    # # For null rows, we're going to search for data from the closest community

    # # Get a postgis-compatible list of FIPS codes for all the places with data
    # good_community_fips = ["'" + str(row[-1]) + "'" for row in good_data]

    # # Set up the database connection
    # conn = psycopg2.connect("dbname='" + dbname + "'")
    # cur = conn.cursor()

    # # For each bad row:
    # for row in no_data:
    #     fips = str(row[-1])
    #     # Query the DB to get the closest place with good data
    #     query = "SELECT placefp " + \
    #             "FROM suburbs WHERE placefp != '" + fips + "' " + \
    #             "AND placefp IN (" + ','.join(good_community_fips) + ") " + \
    #             "ORDER BY geom <-> " + \
    #                 "(SELECT geom FROM suburbs " + \
    #                 "WHERE placefp = '" + fips + "') " + \
    #             "LIMIT 1;"
    #     cur.execute(query)
    #     rows = cur.fetchall()
    #     closest_good_place = rows[0][0]

    #     # Match that place to its community data using the FIPS code
    #     replacement_data = []
    #     for data in good_data:
    #         if str(data[-1]) == closest_good_place:
    #             # Steal the data for the community with nulls
    #             replacement_data = data[1:-1]

    #     # Make sure we actually found some good data for this place!
    #     assert len(replacement_data) > 0
    #     # Finally, write out the row
    #     writer.writerow([row[0]] + replacement_data)
