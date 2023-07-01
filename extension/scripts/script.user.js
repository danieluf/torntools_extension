// ==UserScript==
// @name         HeLa Revives
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Adds a button to request a revive from HeLa
// @author       Lazerpent [2112641]
// @match        https://www.torn.com/*
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @grant        GM_registerMenuCommand
// @connect      api.no1irishstig.co.uk
// ==/UserScript==
'use strict';
  const API_URL = 'https://api.no1irishstig.co.uk/request';
  const ERRORS = {
    401: 'Request denied - Contact HeLa leadership.',
    429: 'You have already submitted a request to be revived.',
    499: 'Outdated Script - Please update.',
    500: 'An unknown error has occurred - Please report this to HeLa leadership.',
  };

  setInterval(checkButton, 500);
  GM_addStyle(`
    .hela-revive {
      margin: auto;
      display: table;
      cursor: pointer;
      border-radius: .5em; 
      padding: .25em .5em;
      text-decoration: none;
      
      color: black;
      background: lightgreen;
      border: 1px solid black;
      box-shadow: inset 0px 1px 0px 0px white;
    }
    
    .hela-revive:hover {
      background: green;
    }
    
    .hela-desktop:hover {
      background: #3cb371;
    }
    
    .hela-revive[disabled='true'] {
        opacity: 0.5;
    }
    
    .hela-desktop {
      margin-bottom: 8px;
    }
    
    .hela-mobile {
      display: inline;
    }
    
    .hela-dark-mode {
      color: white;
      background: darkgreen;
      border: 1px solid white;
      box-shadow: inset 0px 1px 0px 0px black;
    }    
    
    .hela-desktop:before {
      content: 'HeLa Quick ';
    }
    
    @media(min-width: 380px) {
      .hela-mobile:before {
        content: 'HeLa ';
      }
    }
`);

  let btn;

  function getButton(mobile) {
    btn = document.createElement('a');

    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-live', 'polite');

    btn.classList.add('hela-revive');
    btn.classList.add('hela-' + (mobile ? 'mobile' : 'desktop'));

    if (mobile || document.body.classList.contains('dark-mode')) {
      btn.classList.add('hela-dark-mode');
    }

    btn.id = 'hela-btn';
    btn.innerHTML = 'Revive';
    btn.href = '#hela-revive';
    btn.addEventListener('click', submitRequest);
    return btn;
  }

  function checkButton() {
    const {hospital, mobile} = getSessionData();
    const exists = document.getElementById('hela-btn');

    if (!hospital) {
      if (btn) {
        btn.remove();
      }
      return;
    }

    if (exists) {
      return;
    }

    const location = document.querySelector(mobile ? '.header-buttons-wrapper' : '#barLife');
    if (location != null) {
      location.children[0].insertAdjacentElement('beforebegin', getButton(mobile));
    }
  }

  function handleResponse(response) {
    if (response?.status && response.status !== 200) {
      console.log(response);
      alert(ERRORS[response.status] || ERRORS[500]);
      return;
    }

    let contract = false;
    try {
      contract = !!JSON.parse(response.responseText).contract;
    } catch (e) {
    }

    if (contract) {
      alert('Contract request has been sent to HeLa. Thank you!')
    } else {
      alert('Request has been sent to HeLa. Please pay your reviver a xanax or 1m TCD. Thank you!');
    }
  }

  function submitRequest(e) {
    e?.preventDefault();

    const sessionData = getSessionData();
    if (!sessionData.hospital) {
      alert('You are not in the hospital.');
      return;
    }

    btn.setAttribute('disabled', true);
    btn.setAttribute('aria-pressed', true);

    GM.xmlHttpRequest({
      method: 'POST',
      url: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        "vendor": "HeLa",
        'tornid': parseInt(sessionData.userID),
        'username': '' + sessionData.userName,
        'source': 'HeLa Script 1.2.1',
        'type': 'revive'
      }),
      onload: handleResponse,
    });
  }

  function getSessionData() {
    const sidebar = Object.keys(sessionStorage).find((k) => /sidebarData\d+/.test(k));
    const data = JSON.parse(sessionStorage.getItem(sidebar));
    return {
      userID: data.user.userID,
      userName: data.user.name,
      mobile: data.windowSize === 'mobile',
      hospital: data.statusIcons?.icons?.hospital,
    };
  }

  GM_registerMenuCommand('Request revive from HeLa', () => submitRequest());