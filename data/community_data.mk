PG_DB = wtb

# ======= #
# Chicago #
# ======= #

# -- crime -- #

chicago_population.csv : final/community_areas.geojson
	cat $< | python scripts/area_population.py > $@

.INTERMEDIATE: chicago_crime_rate.csv
chicago_crime_rate.csv : final/chicago.csv chicago_population.csv
	csvcut -c "community","HOMICIDE","CRIM SEXUAL ASSAULT","ROBBERY","ASSAULT","BURGLARY","THEFT","MOTOR VEHICLE THEFT","ARSON" $< |\
		csvjoin -c community - $(word 2,$^) | python scripts/nulls_to_zeroes.py |\
		python scripts/crime_numbers_to_rates.py chicago > $@

.INTERMEDIATE: crime_index
crime_index : chicago_crime_rate.csv
	csvgrep -c 1 -m "LOOP" -i $< | csvgrep -c 1 -m "NEAR NORTH SIDE" -i - |\
		csvgrep -c 1 -m "NEAR SOUTH SIDE" -i - | csvgrep -c 1 -m "NEAR WEST SIDE" -i - |\
		python scripts/pca.py crime > $@

chicago_crime_index.csv : crime_index
	echo "\nLOOP,0\nNEAR NORTH SIDE,0\nNEAR SOUTH SIDE,0\nNEAR WEST SIDE,0" | csvstack $< - > $@

# -- schools -- #

.INTERMEDIATE: chicago_school_averages.csv suburb_school_averages.csv
chicago_school_averages.csv : final/chicago_schools.csv
	csvcut -c 1,2,3,4,5,6,7,14,15,16,17,18,19 $< |\
		python scripts/nulls_to_zeroes.py | \
		python scripts/school_averages.py chicago > $@

chicago_school_index.csv : chicago_school_averages.csv
	cat $< | python scripts/pca.py schools > $@

# ======= #
# Suburbs #
# ======= #

# -- crime -- #

suburb_crime_rates.csv : final/suburb.csv
	csvcut -c 1,3,18,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28,29,30,31,32 $< |\
		python scripts/nulls_to_zeroes.py |\
		python scripts/crime_numbers_to_rates.py suburbs > $@

suburb_crime_index.csv : suburb_crime_rates.csv
	# TO DO: make sure to handle rows with nulls
	cat $< | python scripts/pca.py crime > $@

# -- schools -- #

suburb_school_averages.csv : final/suburb_schools.csv
	csvcut -C 2,4,5,6,7,8,9,10,11,12,13,14 $< | python scripts/nulls_to_zeroes.py |\
		python scripts/school_averages.py suburbs > $@

suburb_school_index.csv : suburb_school_averages.csv
	cat $< | python scripts/pca.py schools > $@

.INTERMEDIATE: suburb_modified.csv chicago_modified.csv
suburb_modified.csv : final/suburb.csv places.csv suburb_school_index.csv suburb_crime_index.csv raw/suburb_price_scoring.csv
	csvjoin -I -c "Place","Place","community","community","community" $^ |\
		csvcut -c "Place","Avg Commute Time","Diversity Index","crime","schools","price","FIPS" - |\
		sed -e "1s/Place/community/" -e "1s/Avg Commute Time/commute/" |\
		sed -e "1s/Diversity Index/diversity/" -e "1s/FIPS/fips/" > $@

chicago_modified.csv : final/chicago.csv chicago_school_index.csv chicago_crime_index.csv raw/chicago_price_scoring.csv
	csvjoin -I -c "community" $^ |\
		csvcut -c "community","Average Commute","Diversity Index","crime","schools","price" - |\
		sed -e "1s/Average Commute/commute/" -e "1s/Diversity Index/diversity/" |\
		sed -e "s/$$/,14000/" -e "1s/14000/fips/"> $@

final/community_data.csv : suburb_modified.csv chicago_modified.csv
	csvstack $^ > $@