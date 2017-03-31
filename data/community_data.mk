PG_DB = wtb

.INTERMEDIATE: suburb_modified.csv chicago_modified.csv

chicago_school_index.csv : final/chicago_schools.csv

# chicago_crime_rate.csv : final/chicago.csv
# 	csvcut -c "community","HOMICIDE","CRIM SEXUAL ASSAULT","ROBBERY","ASSAULT","BURGLARY","THEFT","MOTOR VEHICLE THEFT","ARSON" $< |\
# 		python scripts/crime_numbers_to_rates.py > $@

# chicago_crime_index.csv : chicago_crime_rate.csv
chicago_crime_index.csv : final/chicago.csv
	csvcut -c "community","HOMICIDE","CRIM SEXUAL ASSAULT","ROBBERY","ASSAULT","BURGLARY","THEFT","MOTOR VEHICLE THEFT","ARSON" $< |\
		python scripts/nulls_to_zeroes.py | python scripts/crime_index.py > $@

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