PG_DB = wtb

# ======= #
# Chicago #
# ======= #

# -- crime -- #

chicago_population.csv : final/community_areas.geojson
	cat $< | python scripts/area_population.py > $@

.INTERMEDIATE: chicago_crime_rate.csv
chicago_crime_rate.csv : raw/chicago.csv chicago_population.csv
	csvcut -c "community","HOMICIDE","CRIM SEXUAL ASSAULT","ROBBERY","ASSAULT","BURGLARY","THEFT","MOTOR VEHICLE THEFT","ARSON" $< |\
		csvjoin -I -c community - $(word 2,$^) | python scripts/nulls_to_zeroes.py |\
		python scripts/crime_numbers_to_rates.py "chicago" > $@

.INTERMEDIATE: crime_index
crime_index : chicago_crime_rate.csv
	csvgrep -c 1 -m "LOOP" -i $< | csvgrep -c 1 -m "NEAR NORTH SIDE" -i - |\
		csvgrep -c 1 -m "NEAR SOUTH SIDE" -i - | csvgrep -c 1 -m "NEAR WEST SIDE" -i - |\
		python scripts/pca.py "crime" > $@

chicago_crime_index.csv : crime_index
	echo "\nLOOP,0\nNEAR NORTH SIDE,0\nNEAR SOUTH SIDE,0\nNEAR WEST SIDE,0" | csvstack $< - > $@

# -- schools -- #

.INTERMEDIATE: chicago_school_averages.csv suburb_school_averages.csv
chicago_school_averages.csv : final/chicago_schools.csv
	csvcut -c community,school_name,meet_benchmark_english,meet_benchmark_reading,meet_benchmark_math,meet_benchmark_science,meet_benchmark_all_four,act_english,act_math,act_reading,act_science,act_composite,school_coverage $< |\
		python scripts/nulls_to_zeroes.py | \
		python scripts/school_averages.py "chicago" > $@

chicago_school_index.csv : chicago_school_averages.csv
	cat $< | python scripts/pca.py "schools" > $@

# -- prices -- #

.INTERMEDIATE: chicago_prices.csv
chicago_prices.csv : final/chicago_yearly_price_data.csv
	csvcut -c "community","detached_median_price_change","attached_median_price_change","detached_closed_sales_2016","attached_closed_sales_2016" $< |\
		python scripts/percents_to_floats.py | \
                python scripts/nulls_to_zeroes.py | \
		python scripts/chicago_price_index.py > chicago_price_index.csv
	csvcut -c "community","detached_median_price_2016","attached_median_price_2016" $< |\
		csvjoin -I -c "community" chicago_price_index.csv - > $@ 
	rm chicago_price_index.csv

# ======= #
# Suburbs #
# ======= #

places.csv : raw/places.csv raw/places_to_delete.xlsx
	in2csv -H $(word 2,$^) | head -n 4 | tail -n 1 | csvcut -C 1,2,3 | tr "," "\n" > bad_places.csv
	cat $< | grep -v '\"Chicago city\, Illinois\"' | grep -v '\"Symerton village, Illinois\"' |\
		grep -v -f bad_places.csv > $@
	rm bad_places.csv 

places.csv : raw/places.csv raw/places_to_delete.xlsx raw/places_to_delete_2.xlsx
	in2csv -H $(word 2,$^) | head -n 4 | tail -n 1 | csvcut -C 1,2,3 | tr "," "\n" > bad_places.csv
	in2csv -H $(word 3,$^) | csvcut -c 1 | tail -n 14 > bad_places_2.csv
	cat $< | grep -v '\"Chicago city\, Illinois\"' | grep -v '\"Symerton village, Illinois\"' |\
		grep -v -f bad_places.csv | grep -v -f bad_places_2.csv > $@

# -- crime -- #

.INTERMEDIATE: suburb_crime_rates.csv
suburb_crime_rates.csv : raw/suburb.csv places.csv suburbs
	csvjoin -I -c "Place" "$<" "$(word 2,$^)" |\
		csvcut -c 1,3,18,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28,29,30,31,32,41 - |\
		python scripts/crime_numbers_to_rates.py "suburbs" $(PG_DB) > $@

suburb_crime_index.csv : suburb_crime_rates.csv
	cat $< | python scripts/pca.py "crime" > $@

# -- schools -- #

suburb_school_averages.csv : final/suburb_schools.csv
	csvcut -C 2,4,5,6,7,8,9,10,11,12,13,14 $< | python scripts/nulls_to_zeroes.py |\
		python scripts/school_averages.py "suburbs" > $@

suburb_school_index.csv : suburb_school_averages.csv
	cat $< | python scripts/pca.py "schools" > $@

# -- prices -- #

.INTERMEDIATE: places_crosswalk.csv
places_crosswalk.csv: final/suburb_yearly_price_data.csv places.csv 
	python scripts/create_place_crosswalk.py "$<" $(word 2,$^) > $@

.INTERMEDIATE: suburb_prices.csv
suburb_prices.csv : final/suburb_yearly_price_data.csv places_crosswalk.csv places.csv 
	csvjoin -I --right -c "community" "$<" "$(word 2,$^)" |\
		csvjoin -I --outer -c "Place" - "$(word 3,$^)" |\
		csvcut -c "Place2","median_price_change","closed_sales_2016","median_price_2016" |\
		python scripts/percents_to_floats.py |\
		python scripts/nulls_to_zeroes.py |\
		python scripts/suburb_price_index.py > $@

# ======== #
# Combined #
# ======== #

.INTERMEDIATE: suburb_zscores.csv
suburb_zscores.csv: raw/suburb.csv suburb_school_index.csv suburb_crime_index.csv suburb_prices.csv
	csvjoin -I -c "Place","community","community","community" $^ |\
		csvcut -c "Place","Avg Commute Time","Diversity Index","crime","schools","price" - |\
		sed -e "1s/Place/community/" -e "1s/Avg Commute Time/commute/" |\
		sed -e "1s/Diversity Index/diversity/" |\
		python scripts/normalize_values.py | python scripts/flip_signs.py "crime","commute" > $@

final/suburb_data.csv : places.csv suburb_zscores.csv suburb_prices.csv
	csvjoin -I -c "Place","community","community" $^ |\
		csvcut -c "Place","commute","diversity","crime","schools","price","FIPS","median_price_2016" - |\
		sed -e "1s/Place/community/" -e "1s/FIPS/fips/" -e "1s/_2016//" > $@

.INTERMEDIATE: chicago_zscores.csv
chicago_zscores.csv: raw/chicago.csv chicago_school_index.csv chicago_crime_index.csv chicago_prices.csv
	csvjoin -I -c "community" $^ |\
		csvcut -c "community","Average Commute","Diversity Index","crime","schools","price" - |\
		sed -e "1s/Average Commute/commute/" -e "1s/Diversity Index/diversity/" |\
		python scripts/normalize_values.py | python scripts/flip_signs.py "crime","commute" > $@

final/chicago_data.csv : chicago_zscores.csv chicago_prices.csv
	csvjoin -I -c "community" $^ |\
		csvcut -c "community","commute","diversity","crime","schools","price","detached_median_price_2016","attached_median_price_2016" - |\
		sed -e "s/$$/,14000/" -e "1s/14000/fips/" -e "1s/_2016//g" > $@
