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
	python scripts/retrieve_pdfs.py
	touch $@

csvs: pdfs
	mkdir -p raw/csvs
	for pdf in raw/pdfs/*.pdf; do \
		if [[ $(pdf-pages) > 1 ]]; then \
			$(tabula) -p 1 -a $(p1-bounds-county) -c $(p1-cols) "$$pdf" > raw/csvs/$$pdf_summary.csv \
			$(tabula) -p 2 -a $(p24-bounds) -c $(p24-cols) "$$pdf" > raw/csvs/$$pdf_2.csv \
			$(tabula) -p 3 -a $(p3-bounds) -c $(p3-cols) "$$pdf" > raw/csvs/$$pdf_3.csv \
			$(tabula) -p 2-4 -a $(p24-bounds) -c $(p24-cols) "$$pdf" > raw/csvs/$$pdf_4.csv; \
		else \
			$(tabula) -p all -a $(p1-bounds-chciago) -c $(p1-cols) "$$pdf" > raw/csvs/$$pdf.csv; \
		fi \
	done
	touch $@

.PHONY: test-county
test-county: 
	$(tabula) -p 1 -a $(p1-bounds-county) -c $(p1-cols) raw/pdfs/Will_County.pdf > raw/csvs/Will_County_summary.csv && \
	$(tabula) -p 2 -a $(p24-bounds) -c $(p24-cols) raw/pdfs/Will_County.pdf > raw/csvs/Will_County_2.csv && \
	$(tabula) -p 3 -a $(p3-bounds) -c $(p3-cols) raw/pdfs/Will_County.pdf > raw/csvs/Will_County_3.csv && \
	$(tabula) -p 2-4 -a $(p24-bounds) -c $(p24-cols) raw/pdfs/Will_County.pdf > raw/csvs/Will_County_4.csv;

