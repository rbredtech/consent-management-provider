var KeyEvent = window['KeyEvent'] || {};
KeyEvent.VK_LEFT = KeyEvent.VK_LEFT || window['VK_LEFT'] || 37;
KeyEvent.VK_RIGHT = KeyEvent.VK_RIGHT || window['VK_RIGHT'] || 39;
KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;

var consBtnAgree;
var consBtnDecline;
var setConsentCallback;
var hideBannerTimeout;

function buildBannerElement() {
  var bannerOuter = document.createElement('div');
  bannerOuter.id = 'agttcnstbnnr';
  bannerOuter.style.position = 'absolute';
  bannerOuter.style.left = '20px';
  bannerOuter.style.right = '20px';
  bannerOuter.style.bottom = '20px';
  bannerOuter.style.display = 'none';
  bannerOuter.style.fontFamily = 'sans-serif';
  bannerOuter.style.fontSize = '16px';
  bannerOuter.style.fontWeight = '400';
  bannerOuter.style.lineHeight = '24px';
  bannerOuter.style.color = '#505050';
  bannerOuter.style.backgroundColor = '#ffffff';
  bannerOuter.style.border = '4px solid #76b642';
  bannerOuter.style.borderRadius = '8px';

  var bannerContentWrapper = document.createElement('div');
  bannerContentWrapper.style.margin = '30px 70px 0 70px';

  var bannerHeader = document.createElement('span');
  bannerHeader.style.display = 'block';
  bannerHeader.style.fontSize = '24px';
  bannerHeader.style.lineHeight = '24px';
  bannerHeader.style.fontWeight = '500';
  bannerHeader.style.color = '#76b642';
  bannerHeader.style.marginBottom = '16px';
  bannerHeader.appendChild(document.createTextNode('Datenschutzeinwilligung zur Reichweitenmessung'));

  var bannerLegalText = document.createElement('span');

  if ('<%-IS_PRO7%>' === 'true') {
    bannerLegalText.appendChild(
      document.createTextNode(
        'Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe agtt.at/hbb-messung), möchte ' +
          'die Nutzung der TV-Geräte erfassen (die Daten können ohne Unterstützung der nutzenden Person keinem ' +
          'konkreten TV-Gerät zugeordnet werden), um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, ' +
          'deren TV- und Werbeangebot stetig zu verbessern.  Dazu benötigt die AGTT Ihre Einwilligung, nach der ' +
          'ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:',
      ),
    );
  } else {
    var bannerLegalTextChannelName = document.createElement('b');
    bannerLegalTextChannelName.appendChild(document.createTextNode('<%-CHANNEL_NAME%>'));

    bannerLegalText.appendChild(
      document.createTextNode(
        'Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe agtt.at/hbb-messung), deren Mitglied ',
      ),
    );
    bannerLegalText.appendChild(bannerLegalTextChannelName);
    bannerLegalText.appendChild(
      document.createTextNode(
        ' ist, möchte ' +
          'die Nutzung der TV-Geräte erfassen (die Daten können ohne Unterstützung der nutzenden Person keinem ' +
          'konkreten TV-Gerät zugeordnet werden), um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, ' +
          'deren TV- und Werbeangebot stetig zu verbessern.  Dazu benötigt die AGTT Ihre Einwilligung, nach der ' +
          'ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:',
      ),
    );
  }
  bannerLegalText.appendChild(document.createElement('br'));
  bannerLegalText.appendChild(
    document.createTextNode(
      'Geräte ID, IP-Adresse, System- bzw. Browserinformationen, Geräteinformationen (verwendete HbbTV-Version, TV-Hersteller, ' +
        'Übertragungsweg via Satellit oder Kabel, Geräteauflösung). Nähere Informationen zum Datenschutz finden Sie in der ' +
        'HbbTV Applikation des Senders, wo Sie den Status Ihrer Einwilligung verwalten bzw. widerrufen können.',
    ),
  );

  var bannerActionsWrapper = document.createElement('div');
  bannerActionsWrapper.style.color = '#76b642';
  bannerActionsWrapper.style.margin = '30px 70px 40px 70px';

  var bannerActionAccept = document.createElement('span');
  bannerActionAccept.id = 'consBtnAgree';
  bannerActionAccept.className = 'selected';
  bannerActionAccept.style.marginRight = '10px';
  bannerActionAccept.style.padding = '10px';
  bannerActionAccept.style.border = '1px solid #76b642';
  bannerActionAccept.style.borderRadius = '8px';
  bannerActionAccept.style.backgroundColor = '#76b642';
  bannerActionAccept.style.color = '#ffffff';
  bannerActionAccept.appendChild(document.createTextNode('Zustimmen'));

  var bannerActionDecline = document.createElement('span');
  bannerActionDecline.id = 'consBtnDecline';
  bannerActionDecline.style.marginRight = '10px';
  bannerActionDecline.style.padding = '10px';
  bannerActionDecline.style.border = '1px solid #76b642';
  bannerActionDecline.style.borderRadius = '8px';
  bannerActionDecline.style.backgroundColor = '#ffffff';
  bannerActionDecline.style.color = '#76b642';
  bannerActionDecline.appendChild(document.createTextNode('Ablehnen'));

  bannerActionsWrapper.appendChild(bannerActionAccept);
  bannerActionsWrapper.appendChild(bannerActionDecline);

  bannerContentWrapper.appendChild(bannerHeader);
  bannerContentWrapper.appendChild(bannerLegalText);

  bannerOuter.appendChild(bannerContentWrapper);
  bannerOuter.appendChild(bannerActionsWrapper);

  return bannerOuter;
}

function loadOnDOMContentLoaded(domContentLoadedCB) {
  document.addEventListener('DOMContentLoaded', function () {
    if (domContentLoadedCB && typeof domContentLoadedCB === 'function') {
      domContentLoadedCB();
    }
  });
}

function waitForDOMElement(elementId, onDomElementFoundCB, retriesLeft) {
  if (retriesLeft < 0) {
    loadOnDOMContentLoaded(onDomElementFoundCB);
    return;
  }

  var element = document.getElementsByTagName('body')[0];
  if (elementId) {
    element = document.getElementById(elementId);
  }

  if (!element) {
    setTimeout(function () {
      waitForDOMElement(elementId, onDomElementFoundCB, retriesLeft - 1);
    }, 200);
    return;
  }

  if (onDomElementFoundCB && typeof onDomElementFoundCB === 'function') {
    onDomElementFoundCB();
  }
}

window.__cbapi = function (command, version, callback, parameter) {
  function mountConsentBanner(elementId) {
    var bannerParentNode = document.getElementsByTagName('body')[0];
    if (elementId) {
      bannerParentNode = document.getElementById(elementId);
    }

    if (!bannerParentNode) {
      return null;
    }

    var banner = document.getElementById('agttcnstbnnr');

    if (!banner) {
      banner = buildBannerElement();
      bannerParentNode.appendChild(banner);
    }

    if (!elementId) {
      banner.style.zIndex = '9999';
    }

    return banner;
  }

  function showConsentBanner(elementId, callback) {
    var banner = mountConsentBanner(elementId);

    if (!banner) {
      if (callback && typeof callback === 'function') {
        callback(undefined);
      }
      return;
    }

    setConsentCallback = callback;

    consBtnAgree = document.getElementById('consBtnAgree');
    consBtnDecline = document.getElementById('consBtnDecline');

    banner.style.display = 'block';

    hideBannerTimeout = setTimeout(function () {
      hideConsentBanner();
      !!callback && callback();
    }, parseInt('<%-BANNER_TIMEOUT%>'));
  }

  function hideConsentBanner() {
    if (document.getElementById('agttcnstbnnr')) {
      document.getElementById('agttcnstbnnr').style.display = 'none';
      clearTimeout(hideBannerTimeout);
    }
  }

  function isConsentBannerVisible() {
    return !!document.getElementById('agttcnstbnnr') && document.getElementById('agttcnstbnnr').style.display != 'none';
  }

  function setSelected(element) {
    if (!element) {
      return;
    }
    element.className = element.className.length ? element.className + ' selected' : 'selected';
    element.style.color = '#ffffff';
    element.style.backgroundColor = '#76b642';
  }

  function setNotSelected(element) {
    if (!element) {
      return;
    }
    element.className = element.className.replace(/selected/g, '');
    element.style.color = '#76b642';
    element.style.backgroundColor = '#ffffff';
  }

  function handleSelectionToggle() {
    if (consBtnAgree && consBtnAgree.className.indexOf('selected') == -1) {
      setSelected(consBtnAgree);
      setNotSelected(consBtnDecline);
    } else {
      setSelected(consBtnDecline);
      setNotSelected(consBtnAgree);
    }
  }

  function handleEnter() {
    if (consBtnAgree && consBtnAgree.className.indexOf('selected') != -1) {
      if (setConsentCallback && typeof setConsentCallback === 'function') {
        setConsentCallback(true);
      }
    } else {
      if (setConsentCallback && typeof setConsentCallback === 'function') {
        setConsentCallback(false);
      }
    }
    hideConsentBanner();

    // reset consent banner to have ACCEPT button selected
    setSelected(consBtnAgree);
    setNotSelected(consBtnDecline);
  }

  function handleVK(parameter, callback) {
    if (!isConsentBannerVisible()) {
      return;
    }

    !!parameter.preventDefault && parameter.preventDefault();
    var keyCode = parameter.keyCode ? parameter.keyCode : parameter;

    switch (keyCode) {
      case KeyEvent.VK_ENTER:
        handleEnter();
        !!callback && callback(keyCode);
        break;
      case KeyEvent.VK_LEFT:
      case KeyEvent.VK_RIGHT:
        handleSelectionToggle();
        !!callback && callback(keyCode);
        break;
      default:
        break;
    }
  }

  switch (command) {
    case 'showBanner':
      waitForDOMElement(
        parameter,
        function () {
          showConsentBanner(parameter, callback);
        },
        3,
      );
      break;
    case 'hideBanner':
      hideConsentBanner();
      break;
    case 'isBannerVisible':
      !!callback && callback(isConsentBannerVisible());
      break;
    case 'handleKey':
      handleVK(parameter, callback);
      break;
    default:
      break;
  }
};
