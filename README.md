## Development

`docker-compose up`
open http://localhost:3001/


```
docker-compose exec server rails db:create db:migrate
```

NOTE:
- Variables in .env are not automatically available in containers. You need to specify keys in `environment` of services.
- In local development, with accessing IP address like http://10.0.1.2:3001/ google login won't work.
