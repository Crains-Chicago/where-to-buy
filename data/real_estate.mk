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
			# Figure out the PDF bounds
			case [[ "$$fname" == \
				*"DuPage_County"* ]]) \
					# Assign bounds vars
					;; \
				*"Lake_County"* ]]) \
					# Assign bounds vars
					;; \
				*"North_Cook"* ]]) \
					# Assign bounds vars
					;; \
				*"South_Cook"* ]]) \
					# Assign bounds vars
					;; \
				*"West_Cook"* ]]) \
					# Assign bounds vars
					;; \
				*"Will_County"* ]]) \
					export p2-bounds=$(p24-will-bounds) p2-cols=$(p24-will-cols); \
					export p3-bounds=$(p3-will-bounds) p3-cols=$(p3-will-cols); \
					export p4-bounds=$(p24-will-bounds) p4-cols=$(p24-will-cols); \
					;; \
			esac \
			$(tabula) -p 1 -a $(p1-county-bounds) -c $(p1-cols) "$$pdf" > "raw/csvs/county-summaries/$${fname}.csv" && \
			$(tabula) -p 2 -a $$p2-bounds -c $$p2-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_2.csv" && \
			$(tabula) -p 3 -a $$p3-bounds -c $$p3-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_3.csv" && \
			$(tabula) -p 4 -a $$p4-bounds -c $$p4-cols "$$pdf" > "raw/csvs/suburbs/$${fname}_4.csv"; \
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

