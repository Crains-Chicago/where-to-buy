pdfs: scripts/secrets.py
	mkdir -p raw/pdfs/
	USER=$$(eval cat $< | grep MLS_USER | grep -Eo "'.*'")
	PASS=$$(eval cat $< | grep MLS_PASS | grep -Eo "'.*'")
	wget --save-cookies cookies.txt --keep-session-cookies --user=$$USER --password=$$PASS \
		--delete-after http://car.stats.10kresearch.com/login? &&\
	wget --load-cookies cookies.txt --no-use-server-timestamps -P raw/pdfs/ \
		-r -nd -l1 -H -A rpt_* http://car.stats.10kresearch.com/docs/lmu/list
	touch $@

