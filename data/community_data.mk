PG_DB = wtb

.INTERMEDIATE: suburb_modified.csv chicago_modified.csv

suburb_modified.csv : final/suburb.csv final/suburb_schools.csv
	csvcut -c "Place","Avg Commute Time","Diversity Index" $< |\
		sed -e "1s/Place/community/" -e "1s/Avg Commute Time/commute/" |\
		sed -e "1s/Diversity Index/diversity/" > $@

chicago_modified.csv : final/chicago.csv final/chicago_schools.csv
	csvcut -c "community","Average Commute","Diversity Index" $< |\
		sed -e "1s/Average Commute/commute/" -e "1s/Diversity Index/diversity/" > $@

final/community_data.csv : suburb_modified.csv chicago_modified.csv
	csvstack $^ > $@