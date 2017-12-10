IMAGE = rooms
build:
	docker build -t $(IMAGE) .

test:
	docker-compose exec server bundle exec rspec -fdoc --order=defined
