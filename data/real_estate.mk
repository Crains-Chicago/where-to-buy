year = 2016

tabula = java -jar ./tabula-java/target/tabula-0.9.1-jar-with-dependencies.jar
pdf-pages = `pdfinfo "$$pdf" | grep Pages | perl -p -e 's/[^[0-9]*//'`

include pdf_bounds.mk

tabula-java :
	git clone https://github.com/tabulapdf/tabula-java.git
	cd tabula-java && \
		git checkout a1775ecb744abf06f6d6d7d024b561d13bb01f7d && \
		mvn clean compile assembly:single

pdfs: 
	mkdir -p raw/pdfs
	python scripts/retrieve_pdfs.py $(year)
	touch $@

raw_csvs: pdfs
	mkdir -p raw/csvs/chicago raw/csvs/suburbs raw/csvs/county-summaries
	for pdf in raw/pdfs/*.pdf; do \
		# Grab the name of the place
		export fname=$$(basename "$$pdf" .pdf); \
		# If place is a county (4 pages)
		if [[ $(pdf-pages) == 4 ]]; then \
			# Figure out the PDF bounds. These bounds are defined in pdf_bounds.mk
			case [[ "$$fname" == \
				*"DuPage_County"* ]]) \
					export p2-cols=$(p24-dupage-cols); \
					export p3-cols=$(p3-dupage-cols); \
					export p4-cols=$(p24-dupage-cols); \
					;; \
				*"Lake_County"* ]]) \
					export p2-cols=$(p24-lake-cols); \
					export p3-cols=$(p3-lake-cols); \
					export p4-cols=$(p24-lake-cols); \
					;; \
				*"North_Cook"* ]]) \
					export p2-cols=$(p24-north-cols); \
					export p3-cols=$(p3-north-cols); \
					export p4-cols=$(p24-north-cols); \
					;; \
				*"South_Cook"* ]]) \
					export p2-cols=$(p24-south-cols); \
					export p3-cols=$(p3-south-cols); \
					export p4-cols=$(p24-south-cols); \
					;; \
				*"West_Cook"* ]]) \
					export p2-cols=$(p24-west-cols); \
					export p3-cols=$(p3-west-cols); \
					export p4-cols=$(p24-west-cols); \
					;; \
				*"Will_County"* ]]) \
					export p2-cols=$(p24-will-cols); \
					export p3-cols=$(p3-will-cols); \
					export p4-cols=$(p24-will-cols); \
					;; \
			esac \
			# Use tabula-java to convert PDF pages to CSV files 
			$(tabula) -p 1 -a $(p1-county-bounds) -c $(p1-cols) "$$pdf" > "raw/csvs/county-summaries/$${fname}.csv" && \
			$(tabula) -p 2 -a $(p234-county-bounds) -c $$p2-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_2.csv" && \
			$(tabula) -p 3 -a $(p234-county-bounds) -c $$p3-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_3.csv" && \
			$(tabula) -p 4 -a $(p234-county-bounds) -c $$p4-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_4.csv"; \
		# If PDF is a Chicago community area
		else \
			$(tabula) -p 1 -a $(p1-chicago-bounds) -c $(p1-cols) "$$pdf" > "raw/csvs/chicago/$${fname}.csv"; \
		fi \
	done
	touch $@

cleaned_csvs: raw_csvs
	mkdir -p raw/csvs/chicago/clean raw/csvs/suburbs/clean
	for csv in raw/csvs/chicago/*.csv; \
	do \
		export fname=$$(basename "$$csv" .csv); \
		cat "$$csv" | python scripts/clean_price_data.py "$$fname" $(year) > "raw/csvs/chicago/clean/$${fname}.csv"; \
	done
	for csv in raw/csvs/suburbs/*.csv; do \
		export fname=$$(eval basename $$csv .csv); \
		cat "$$csv" | python scripts/clean_price_data.py "$$fname" $(year) > "raw/csvs/suburbs/clean/$${fname}.csv"; \
	done
	touch $@

.PHONY: test_conversion
test_conversion: cleaned_csvs
	# Test that all PDFs were converted properly
	for csv in raw/csvs/chicago/clean/*.csv raw/csvs/suburbs/clean/*.csv; \
	do \
		cat "$$csv" | python scripts/test_price_data_conversion.py "$$csv" >> "conversion_errors.csv" 2>&1; \
	done 

final/chicago_yearly_price_data.csv: cleaned_csvs
	csvstack raw/csvs/chicago/clean/*.csv > $@

final/suburb_yearly_price_data.csv: cleaned_csvs
	for csv in raw/csvs/suburbs/clean/*_2.csv; do \
		export fname=$$(basename "$$csv" _2.csv); \
		export fnames=$$(echo raw/csvs/suburbs/clean/$${fname}_*.csv); \
		csvjoin -c "community" $$fnames > "raw/csvs/suburbs/clean/$${fname}_final.csv"; \
	done
	csvstack raw/csvs/suburbs/clean/*_final.csv > $@
	rm raw/csvs/suburbs/clean/*_final.csv

.PHONY: test-county
test-county:
	mkdir -p tmp
	for pdf in raw/pdfs/*.pdf; do \
		export fname=$$(basename "$$pdf" .pdf); \
		if [[ $(pdf-pages) == 4 ]]; then \
			$(tabula) -p 2 -a $(p24-bounds) -r "$$pdf" > "tmp/$${fname}_2.csv" && \
			$(tabula) -p 3 -a $(p3-bounds) -r "$$pdf" > "tmp/$${fname}_3.csv" && \
			$(tabula) -p 4 -a $(p24-bounds) -r "$$pdf" > "tmp/$${fname}_4.csv"; \
		fi \
	done

