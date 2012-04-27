# Copyright 2012 Jonas Dohse. All Rights Reserved.

PATH := $(CURDIR)/test/bin:$(PATH)
SHELL := $(shell which bash)

RSYSLOG_CONFIG = 30-boilerplate.conf
UPSTART_CONFIG = boilerplate.conf
LOG_DIR = boilerplate

unit: check force
	run-tests -u $(ARGS)

test: check force
	run-tests -ui $(ARGS)

check: node_modules etc/profile jshint gjslint force

node_modules:
	npm install

etc/profile:
	ln -snf profile.production etc/profile

/var/log/$(LOG_DIR):
	mkdir -p $@
	chown syslog:adm $@
	chmod 750 $@

clean: force
	rm -rf node_modules etc/profile

jshint: force
	shopt -s globstar && \
	jshint {lib,test}/**/*.js --config test/share/jshint.conf

gjslint: force
	gjslint --debug_indentation --nojsdoc --unix_mode \
		-e test/fixtures \
		-r lib -r test -r bin

deploy: install /var/log/$(LOG_DIR)
	install -m 644 share/rsyslog.conf \
		/etc/rsyslog.d/$(RSYSLOG_CONFIG)
	install -m 644 share/upstart.conf /etc/init/$(UPSTART_CONFIG)

undeploy: force
	rm -rf /etc/rsyslog.d/$(RSYSLOG_CONFIG)
	rm -rf /etc/init/$(UPSTART_CONFIG)

install: clean node_modules etc/profile force

.PHONY: force
