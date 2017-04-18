# Where to Buy

A web tool that visualizes [Book of Lists](https://github.com/datamade/book-of-lists) data and [Chicagoland real estate reports](https://github.com/datamade/car-scraper) to help Crain's readers decide where to buy real estate.

## Running locally

This website is built using Jekyll, a static site generator that runs on Ruby. We developed it with Ruby v2.1.3, but any version >2.1.0 should work. If you don't have Ruby installed, we recommend you manage your installation with [rbenv](https://github.com/rbenv/rbenv) or [RVM](https://rvm.io/).

Once you have the correct Ruby version up and running, install the package manager Bundler:

```
gem install bundler
```

Then clone this project and install its dependencies using Bundler:

```
git clone https://github.com/datamade/where-to-buy.git
cd where-to-buy
bundle install
```

To serve the site locally, run the following command:

```
bundle exec jekyll serve -w
```

Then open your web browser and navigate to http://localhost:4000 (or whatever server address Jekyll printed to your console).

## Deployment

Crain's handles production deployment on their end. To deploy to our staging site, push to the `deploy` branch:

```bash
git push origin master && git push origin master:deploy
```

## Updating data

All data for the site lives in the `data/` subdirectory. [Head over there](https://github.com/datamade/where-to-buy/tree/master/data) for more information if you need to update any of the site's data sources.
