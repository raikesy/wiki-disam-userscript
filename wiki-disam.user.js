// ==UserScript==
// @name         Wikipedia Disambiguation Popularity
// @namespace    http://tbre.racing
// @version      0.1
// @description  Add popularity rankings to Wikipedia disambiguation pages
// @author       James Raikes
// @match        https://en.wikipedia.org/wiki/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js
// @grant        unsafeWindow
// ==/UserScript==

// Notes:
// Partially working (Testing on ELM page)
// Check if page is Disambiguation using an API call
// If so, get the page views of all linked pages using a single API call
// Append the sum of the last months page views to each list entry
// Little bit of CSS and number formatting to make it prettier
// To Do:
// Title matching the list entries is a bit janky (communist party breaks the script)
// So better error handling required
// Implement continue calls
// Clean up code, organisation and es6 syntax
// Consider trying async/await to prevent ugly fetch chaining
// Add heat colours, and/or different layout options

(function() {
  "use strict";

  // let listItems = document.querySelectorAll("#mw-content-text>div>ul>li");

  const currentURL = new URL(window.location.href);
  const pageTitle = currentURL.pathname.substring(6);

  const apiUrlString = "https://en.wikipedia.org/w/api.php";

  const disCheckUrl = new URL(apiUrlString);
  const disCheckParams = {
    action: "query",
    format: "json",
    prop: "categories",
    redirects: 1,
    titles: pageTitle,
    clcategories: "Category:Disambiguation_pages"
  };
  buildUrl(disCheckUrl, disCheckParams);

  fetch(disCheckUrl)
    .then(response => response.json())
    .then(myJson => {
      // Request will only ever return one page
      const pageId = Object.keys(myJson.query.pages)[0];
      const categories = myJson.query.pages[pageId].categories;
      if (typeof categories !== "undefined") {
        // Script code goes here to only work on Disambiguation pages
        const styleEl = document.createElement("style");
        document.head.appendChild(styleEl);
        styleEl.textContent = `.viewLabel {
          color: #fff;
          background-color: #6c757d;
          display: inline-block;
          padding: .25em .4em;
          font-size: 75%;
          font-weight: 700;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          vertical-align: baseline;
          border-radius: .25rem;
        }`;

        const pageViewsUrl = new URL(apiUrlString);
        const pageViewsParams = {
          action: "query",
          format: "json",
          prop: "pageviews",
          titles: pageTitle,
          generator: "links",
          redirects: 1
        };
        buildUrl(pageViewsUrl, pageViewsParams);

        fetch(pageViewsUrl)
          .then(response => response.json())
          .then(myJson => {
            // console.log(myJson);
            const pages = Object.values(myJson.query.pages);
            pages.forEach(value => {
              const viewSum = Object.values(value.pageviews).reduce(
                (acc, curr) => acc + curr
              );
              const viewEl = document.createElement("span");
              viewEl.className = "viewLabel";
              viewEl.textContent = numeral(viewSum).format('0.[0]a');

              const title = value.title;
              const liEl = document
                .querySelector(`#mw-content-text li a[title="${title}"]`)
                .parentElement;
                liEl.appendChild(document.createTextNode(" "));
                liEl.appendChild(viewEl);
            });
          });
      }
    });

  function buildUrl(url, params) {
    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    );
  }
})();
