.PHONY: docker-test test

docker-test:
	docker build -t mpris-service-test .
	docker run -it mpris-service-test

test:
	. /root/.nvm/nvm.sh ; \
	for v in v6.17.1 v14.16.0 ; do \
		nvm use $$v ; \
		PYTHON=python2 npm install ; \
		PYTHON=python2 npm rebuild ; \
		dbus-run-session npm run test ; \
	done
