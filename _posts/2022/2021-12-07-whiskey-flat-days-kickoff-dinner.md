---
name: Whiskey Flat Days Kickoff Dinner
name: Whiskey Flat Days Kickoff Dinner
description: Join us at Elks Lodge and meet the Whiskey Flat Days Mayor contendors
date: 2021-12-07
author: KernvilleChamber
tags:
  - kernville
  - events
  - whiskey flat days
  - whiskey flats
  - kickoff dinner
startDate: 2022-01-07 18:00
endDate: 2022-01-07 21:00
imgur: https://i.imgur.com/4ijlBC7.jpg
image: https://i.imgur.com/4ijlBC7.jpg
location:
  "@type": NGO
  identifier: b56155ea-ddfe-40ea-99b0-4e64c87f86f0
  name: Elks Lodge
  telephone: +1-760-376-6475
  address:
    "@type": PostalAddress
    streetAddress: 6708 Wofford Blvd.
    addressLocality: Wofford Heights
    addressRegion: CA
    addressCountry: US
    postalCode: 93285
  geo:
    "@type": GeoCoordinates
    latitude: 35.70812928278075
    longitude: -118.45398530000001
organizer:
  name: Kernville Chamber of Commerce
  identifier: 85d7ace2-2fdf-400e-a624-5d1ab4e17512
  "@context": https://schema.org
  "@type": NGO
  url: https://www.gotokernville.com/
  email: info@gotokernville.com
  telephone: +1-760-376-2629
  sameAs:
    - https://www.facebook.com/KernvilleChamber/
    - https://instagram.com/explorekernville
  address:
    "@type": PostalAddress
    streetAddress: 11447 Kernville Rd.
    postOfficeBoxNumber: 397
    addressLocality: Kernville
    addressRegion: CA
    postalCode: 93238
  geo:
    "@type": GeoCoordinates
    longitude: -118.418143
    latitude: 35.755794
    elevation: 826
offers:
  - name: Dinner Ticket
    price: 35
    url: https://kernville-chamber-of-commerce-2.square.site/product/64th-annual-whiskey-flat-days-kickoff-dinner/54
---
<h3>What</h3>
<h4>64<sup>th</sup> Annual Whiskey Flat Days Kickoff Dinner</h4>

<h3>When</h3>
<div><time datetime="{{ page.startDate | date: '%F' }}">{{ page.startDate | date: '%-I:%M %p' }}</time>&mdash;<time datetime="{{ page.endDate | date: '%F' }}">{{ page.endDate | date: '%-I:%M %p %b. %-d, %Y' }}</time></div>
<h3>Organized by:</h3>
<b class="block">{{ page.organizer.name }}</b>
{% include common/same-as-links.html sameAs=page.organizer.sameAs email=page.organizer.email telephone=page.organizer.telephone url=page.organizer.url %}
- - -
<div class="center">{% include common/imgur.html url=page.imgur sizes="(max-width: 600px) 500px, 90%" %}</div>

<div>
Join us for our 64<sup>th</sup> Annual Whiskey Flat Days Kickoff Dinner with your choice of
Chicken or Tri Tip on January 7<sup>th</sup> 2022 at 6 pm at the Elks Lodge in Wofford
Heights and meet the Whiskey Flat Days Mayor contenders.

<br />

<div class="flex row wrap space-evenly">
{% for offer in page.offers %}
<a href="{{ offer.url }}" rel="noopener noreferrer external" class="btn btn-primary btn-wide grow-1 center">{{ offer.name | default: 'Ticket' }} {% include common/icon.html icon="link-external" height="16" width="16" fill="currentColor" %}</a>
{% endfor %}
</div>

<h3>Where</h3>
<leaflet-map center="{{ page.location.geo.latitude }},{{ page.location.geo.longitude }}" controls="">{% include leaflet/local-business-marker.html business=page.location %}</leaflet-map>
