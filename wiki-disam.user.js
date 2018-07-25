// ==UserScript==
// @name         Wikipedia Disambiguation Popularity
// @namespace    http://tbre.racing
// @version      0.1
// @description  Add popularity rankings to Wikipedia disambiguation pages
// @author       James Raikes
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://en.wikipedia.org/wiki/*
// ==/UserScript==

// Steps:
// List of nodes (or array) to add indicator to, ignoring the "See Also" section
// API requests to get pageviews (monthly) for each listed page
// Prepend each link with the view count

const listItems = document.querySelectorAll("#mw-content-text>div>ul>li");

listItems.forEach(function(val, ind, obj) {
  val.textContent += ind;
});
