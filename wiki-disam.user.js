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
// Implement continue calls
// Clean up code, organisation and es6 syntax
// Consider trying async/await to prevent ugly fetch chaining
// Add heat colours, and/or different layout options

(function() {
  "use strict";

  // Get current page title from page
  const currentURL = new URL(window.location.href);
  const pageTitle = currentURL.pathname.substring(6);

  // Construct API URL to check if the page is a disambiguation page
  const apiUrlString = "https://en.wikipedia.org/w/api.php";
  const disCheckParams = {
    action: "query",
    format: "json",
    prop: "categories",
    titles: pageTitle,
    redirects: 1,
    formatversion: 2,
    clcategories: "Category:Disambiguation_pages"
  };
  const disCheckUrl = buildUrl(apiUrlString, disCheckParams);

  // Make request and if page has disambiguation category, call the function with the rest of the code
  fetch(disCheckUrl.href)
    .then(response => response.json())
    // Can this arrow function body be extracted for readability?
    .then(data => {
      if (!data.batchcomplete) {
        throw new Error(
          "API signaled incomplete batch on the disambiguation check"
        );
      }
      if (data.query.pages[0].hasOwnProperty("categories")) {
        addTags();
      }
    })
    .catch(err => console.log(err));

  function addTags() {
    // Add a stylesheet and insert some style rules for the viewcount tags
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

    // Construct API URL for retrieving the view counts for every linked page from current page
    const pageViewsParams = {
      action: "query",
      format: "json",
      prop: "pageviews",
      titles: pageTitle,
      generator: "links",
      redirects: 1,
      formatversion: 2,
      gpllimit: 500
    };
    const pageViewsUrl = buildUrl(apiUrlString, pageViewsParams);

    // Notes:
    // handle batchcomplete in case of missing data
    //   To do this, we'll handle batchcomplete ONLY at first, then deal with continue
    //   We'll ask for a batch of 500 and make the code work with that
    //   The API should return props only from that batch until we see batchcomplete
    // how to use the continue stuff
    // how to properly chain the fetches
    // fetch(pageViewsUrl.href)
    //   .then(response => response.json())
    //   .then(data => {
    //     // Construct Map of redirect data
    //     const redirects = new Map(
    //       data.query.redirects.map(obj => [obj.to, obj.from])
    //     );

    //     // Construct Map of undirected titles and respective viewcounts
    //     const viewMap = new Map(
    //       data.query.pages.map(obj => {
    //         let title = obj.title;
    //         if (redirects.has(title)) {
    //           title = redirects.get(title);
    //         }
    //         const viewSum = Object.values(obj.pageviews).reduce(
    //           (acc, curr) => acc + curr
    //         );
    //         return [title, viewSum];
    //       })
    //     );

    //     // Add badge to each list entry with their viewcount
    //     viewMap.forEach((value, key, _) => {
    //       const viewEl = document.createElement("span");
    //       viewEl.className = "viewLabel";
    //       viewEl.textContent = numeral(value).format("0.[0]a");

    //       const aEl = document.querySelector(
    //         `#mw-content-text li a[title="${key}"]`
    //       );
    //       // Throw error if list item can't be found
    //       if (aEl === null) {
    //         throw new Error("No link found with title: " + key);
    //       } else {
    //         const liEl = aEl.parentElement;
    //         liEl.appendChild(document.createTextNode(" "));
    //         liEl.appendChild(viewEl);
    //       }
    //     });
    //   })
    //   .catch(err => console.log(err));

    // fetch(pageViewsUrl.href)
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log(data);
    //     const contUrl = buildUrl(pageViewsUrl.href, data.continue);
    //     fetch(contUrl)
    //       .then(response => response.json())
    //       .then(data => {
    //         console.log(data);
    //         const contUrl = buildUrl(pageViewsUrl.href, data.continue);
    //         fetch(contUrl)
    //           .then(response => response.json())
    //           .then(data => console.log(data));
    //       });
    //   });

    
    fetchBatch(pageViewsUrl.href);
  }

  function buildUrl(baseUrlString, searchParams) {
    const url = new URL(baseUrlString);
    Object.keys(searchParams).forEach(key =>
      url.searchParams.append(key, searchParams[key])
    );
    return url;
  }

  function fetchBatch(input) {
    fetch(input)
      .then(response => response.json())
      .then(data => {
        if (data.batchcomplete) {
          addtags2(data);
        } else {
          continuedFetch(input, data);
        }
      });
  }

  function continuedFetch(input, previousData) {
    const contParams = previousData.continue;
    const contUrl = buildUrl(input, contParams);
    fetch(contUrl.href)
      .then(response => response.json())
      .then(data => {
        data = Object.assign(data, previousData);
        if (data.batchcomplete) {
          addtags2(data);
        } else {
          continuedFetch(input, data);
        }
      });
  }

  function addtags2(data) {
    // Construct Map of redirect data
    const redirects = new Map(
      data.query.redirects.map(obj => [obj.to, obj.from])
    );

    // Construct Map of undirected titles and respective viewcounts
    const viewMap = new Map(
      data.query.pages.map(obj => {
        let title = obj.title;
        if (redirects.has(title)) {
          title = redirects.get(title);
        }
        const viewSum = Object.values(obj.pageviews).reduce(
          (acc, curr) => acc + curr
        );
        return [title, viewSum];
      })
    );

    // Add badge to each list entry with their viewcount
    viewMap.forEach((value, key, _) => {
      const viewEl = document.createElement("span");
      viewEl.className = "viewLabel";
      viewEl.textContent = numeral(value).format("0.[0]a");

      const aEl = document.querySelector(
        `#mw-content-text li a[title="${key}"]`
      );
      // Throw error if list item can't be found
      if (aEl === null) {
        console.error("No link found with title: " + key);
      } else {
        const liEl = aEl.parentElement;
        liEl.appendChild(document.createTextNode(" "));
        liEl.appendChild(viewEl);
      }
    });
  }
})();
