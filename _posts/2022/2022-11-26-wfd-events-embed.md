---
title: WFD Events embed
author: Chris
date: 2022-11-26
description: You can now have the Whiskey Flat Days calendar on your website.
image: /img/raster/wfd-events-embed-320.jpg
thumbnail:
  url: /img/raster/wfd-events-embed-320.jpg
  width: 320
  height: 240
tags:
  - wfd-events
  - programming
  - development
categories:
  - developer
stylesheets:
  - href: https://cdn.kernvalley.us/css/core-css/jekyll-highlight.css
    crossOrigin: anonymous
    referrerPolicy: no-referrer
  - href: https://cdn.kernvalley.us/css/core-css/table.css
    crossOrigin: anonymous
    referrerPolicy: no-referrer
---
<div class="status-box info">
  <b>Notice:</b>
  <span>This post is for web developers and those who own websites, particularly in the Kern River Valley.</span>
</div>

## Introduction

The purpose of this web app is to get info about all things Whiskey Flat Days
out to the public. To serve in this effort, there is now a list of all Whiskey
Flat Days events you can embed on any website. To accommodate for different web
platforms and this varying skill levels of developers, there are several options.

<div class="center card shadow">
  <img src="{{ page.image }}" alt="wfd-events embed screenshot" width="320" height="240" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
</div>

The `<wfd-events>` component was designed to be lightweight, customizable, and 
respect user privacy. It supports lazy-loading, light/dark theme, custom styles,
doesn't use any cookies, and only adds 12.2 kB to page loads. Read on for details.

## Attributes

There are various attributes / properties / params that may be used. Rather than
detail these every time, here is what they all are up-front. Just adapt these to
the context of where they are used.

<table class="themed-table">
  <thead>
    <tr>
      <th>Attribute</th>
      <th>Values</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>source</code></td>
      <td>String</td>
      <td>Sets <code>utm_source</code> URL param</td>
      <td>None</td>
    </tr>
    <tr>
      <td><code>theme</code></td>
      <td><code>"auto"</code>, <code>"darK"</code>, <code>"light"</code></td>
      <td>Sets the theme of the component</td>
      <td><code>"auto"</code></td>
    </tr>
    <tr>
      <td><code>images</code></td>
      <td>Boolean</td>
      <td>Toggles using images for events</td>
      <td><code>false</code></td>
    </tr>
  </tbody>
</table>

## Embedding on your Site

### The Simplest Way &mdash; `<iframe>`

It doesn't get much easier than using an [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe),
does it? This isn't the preferred method since it does involve loading a page within
a page (which isn't great for load times), but it is still an option, and something
you may need if you do not have access to JavaScript or HTML.

```html
<iframe src="https://whiskeyflatdays.com/embed/"></iframe>
<!-- Advanced. Uses URL params for customization and extra iframe attributes -->
<iframe src="https://whiskeyflatdays.com/embed/?source=your-site&theme=light" sandbox="allow-scripts allow-popups" referrerpolicy="no-referrer" loading="lazy" width="350" height="500" frameborder="0"></iframe>
```

### Import the [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)

The preferred method of using WFD Events is through the custom element / web component.
It only adds 12.2 kB transfer size on page load, with another 2.4 kB lazy-loaded
once scrolled into view. Event data may vary, but is currently 2.9 kB in size
and also lazy-loaded.

Using the web component also provides certain custom styling options by way of
the [`::part()`](https://developer.mozilla.org/en-US/docs/Web/CSS/::part) selector.
`<wfd-events>` uses custom elements and a closed [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot),
which prevents the component from creating styling conflicts on your page and
makes it so your page styles do not affect the component unless you do so
deliberately.

```css
/* Style <wfd-events> itself
wfd-events {
  background-color: var(--primary-background);
  color: var(--primary-color);
}

/* Style the list of events */
wfd-events::part(list) {
  display: grid;
  grid-template-columns: 200px;
  justify-content: center;
  gap: 0.6em;
}

/* Style the event container */
wfd-events::part(event) {}

/* Style event name */
wfd-events::part(name) {}

/* Style all event links */
wfd-events::part(link) {}

/* Style all event text */
wfd-events::part(text) {}

/* Style event images */
wfd-events::part(image) {}

/* Style event description */
wfd-events::part(description) {}

/* Style icons */
wfd-events::part(icon) {}
```

#### Resources

`<wfd-events>` was designed to be very light-weight and have minimal impact on
performance / load times.

**Note:** `events.min.js` includes many polyfills that it needs in order to work.
This includes `AbortSignal`, `Function.prototype.once`, `Sanitizer`, and several others.

- `events.min.js`: 43 kB / 12.2 kB gzipped
- `events.html`: 2.2 kB / 1.4 kB gzipped
- `events.css`: 1 kB
- **Total**: 46.3 kB / 14.6 kB gzipped

```html
<script src="https://cdn.kernvalley.us/components/wfd/events.min.js"></script>
<wfd-events></wfd-events>
<!-- Advanced -->

<!-- Preload assets -->
<link rel="preload" as="style" type="text/css" href="https://cdn.kernvalley.us/components/wfd/events.css" crossorigin="anonymous" referrerpolicy="no-referrer" fetchpriority="low" />
<link rel="preload" as="fetch" type="text/html" href="https://cdn.kernvalley.us/components/wfd/events.html" crossorigin="anonymous" referrerpolicy="no-referrer" fetchpriority="low" />
<link rel="preload" as="fetch" type="application/json" href="https://whiskeyflatdays.com/events.json"  crossorigin="anonymous" referrerpolicy="no-referrer" fetchpriority="low"  />

<!-- Load the script -->
<script src="https://cdn.kernvalley.us/components/wfd/events.min.js" crossorigin="anonymous" referrerpolicy="no-referrer" defer=""></script>

<!-- Create the wfd-events element -->
<wfd-events source="your-site" theme="light" images="">
  <!-- Use a custom label -->
  <h3 slot="label">WFD Events</h3>
</wfd-events>
```

### Create with JavaScript

```js
import 'https://cdn.kernvalley.us/components/wfd/events.min.js';

customElements.whenDefined('wfd-events').then(() => {
  const WFDEvents = customElements.get('wfd-events');
  const events = new WFDEvents();
  const label = document.createElement('h3');

  label.textContent = 'WFD Events';
  label.slot = 'label';
  events.source = 'your-site';
  events.theme = 'auto';
  events.images = true;
  events.append(label);

  document.querySelector('.target').append(events);
});
```

### Fetch Event Data & Build your own

Of course, you might want to just fetch the event data and use it for your own
purposes. All event data is served according to the [Event spec](https://schema.org/Event)
on schema.org.

```js
import { getEvents } from 'https://cdn.kernvalley.us/js/std-js/krv/wfd.js';

// See https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
const signal = AbortSignal.timeout(5000);

getEvents({ signal }).then(events => {
  const elements = events.map(createEventElement);
  document.querySelector('.target').append(...elements);
});
```

### Or just DIY entirely

You don't need to use any external resources. You can just fetch the event data.

```js
fetch('https://whiskeyflatdays.com/events.json').then(async resp => {
  const events = await resp.json();
  
  document.querySelector('.target').append(...events.map(event => {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = JSON.stringify(event, null, 4);
    pre.append(code);
    return pre;
  }));
});
```

Go ahead and give any of this a quick try on a site like [CodePen](https://codepen.io/pen/).
If you have a website and want the WFD events list on it, go ahead and do so with
any of the above methods.
