PG_DB = wtb

.INTERMEDIATE: suburb_modified.csv chicago_modified.csv

chicago_school_index.csv : final/chicago_schools.csv

chicago_population.csv : final/community_areas.geojson
	cat $< | python scripts/area_population.py > $@

chicago_crime_rate.csv : final/chicago.csv chicago_population.csv
	csvcut -c "community","HOMICIDE","CRIM SEXUAL ASSAULT","ROBBERY","ASSAULT","BURGLARY","THEFT","MOTOR VEHICLE THEFT","ARSON" $< |\
		csvjoin -c community - $(word 2,$^) | python scripts/nulls_to_zeroes.py |\
		python scripts/crime_numbers_to_rates.py > $@

.INTERMEDIATE: crime_index
crime_index : chicago_crime_rate.csv
	csvgrep -c 1 -m "LOOP" -i $< | csvgrep -c 1 -m "NEAR NORTH SIDE" -i - |\
		csvgrep -c 1 -m "NEAR SOUTH SIDE" -i - | csvgrep -c 1 -m "NEAR WEST SIDE" -i - |\
		python scripts/crime_index.py > $@

chicago_crime_index.csv : crime_index
	echo "\nLOOP,0\nNEAR NORTH SIDE,0\nNEAR SOUTH SIDE,0\nNEAR WEST SIDE,0" | csvstack $< - > $@

suburb_school_index.csv : final/suburb_schools.csv

suburb_crime_index.csv : final/suburb.csv

suburb_modified.csv : final/suburb.csv final/suburb_schools.csv
	csvcut -c "Place","Avg Commute Time","Diversity Index" $< |\
		sed -e "1s/Place/community/" -e "1s/Avg Commute Time/commute/" |\
		sed -e "1s/Diversity Index/diversity/" > $@

chicago_modified.csv : final/chicago.csv final/chicago_schools.csv
	csvcut -c "community","Average Commute","Diversity Index" $< |\
		sed -e "1s/Average Commute/commute/" -e "1s/Diversity Index/diversity/" > $@

final/community_data.csv : suburb_modified.csv chicago_modified.csv
	csvstack $^ > $@