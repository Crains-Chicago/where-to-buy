year = 2016

tabula = java -jar ./tabula-java/target/tabula-0.9.1-jar-with-dependencies.jar
pdf-pages = `pdfinfo "$$pdf" | grep Pages | perl -p -e 's/[^[0-9]*//'`

p1-bounds-chicago = 170.76,23.54,429.83,586.64
p1-bounds-county = 170.76,23.54,290,586.64
p1-cols = 30,280,330,380,432,482,532

p24-bounds = 96.12,27.35,747.18,586.85
p24-cols = 27.35,126,170,207,245,288,328,368,398,428,463,505,545

p3-bounds = $(p24-bounds)
p3-cols = 27.35,112,156,195,230,272,315,353,385,418,460,500,540

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
		export fname=$$(basename "$$pdf" .pdf); \
		if [[ $(pdf-pages) == 4 ]]; then \
			$(tabula) -p 1 -a $(p1-bounds-county) -c $(p1-cols) "$$pdf" > "raw/csvs/county-summaries/$${fname}.csv" && \
			$(tabula) -p 2 -a $(p24-bounds) -c $(p24-cols) "$$pdf" > "raw/csvs/suburbs/$${fname}_2.csv" && \
			$(tabula) -p 3 -a $(p3-bounds) -c $(p3-cols) "$$pdf" > "raw/csvs/suburbs/$${fname}_3.csv" && \
			$(tabula) -p 4 -a $(p24-bounds) -c $(p24-cols) "$$pdf" > "raw/csvs/suburbs/$${fname}_4.csv"; \
		else \
			$(tabula) -p 1 -a $(p1-bounds-chicago) -c $(p1-cols) "$$pdf" > "raw/csvs/chicago/$${fname}.csv"; \
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

final/chicago_prices.csv: cleaned_csvs
	csvstack raw/csvs/chicago/clean/*.csv > $@

final/suburb_prices.csv: cleaned_csvs
	for csv in raw/csvs/suburbs/clean/*_2.csv; do \
		export fname=$$(basename "$$csv" _2.csv); \
		export fnames=$$(echo raw/csvs/suburbs/clean/$${fname}_*.csv); \
		csvjoin -c "community" $$fnames > "raw/csvs/suburbs/clean/$${fname}_final.csv"; \
	done
	csvstack raw/csvs/suburbs/clean/*_final.csv > $@
