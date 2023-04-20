var KeyEvent = window['KeyEvent'] || {};
KeyEvent.VK_LEFT = KeyEvent.VK_LEFT || window['VK_LEFT'] || 37;
KeyEvent.VK_RIGHT = KeyEvent.VK_RIGHT || window['VK_RIGHT'] || 39;
KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;

var consBtnAgree;
var consBtnDecline;
var setConsentCallback;
var hideBannerTimeout;

var bannerDefaultStyles =
  '#agttcnsntbnnr{position:absolute;left:20px;right:20px;bottom:20px;font-family:sans-serif;font-size:16px;font-weight:400;line-height:24px;color:#505050;background-color:#fff;border:4px solid #76b642;border-radius:8px}' +
  '#agttcnsntbnnr .header{display:block;font-size:24px;line-height:24px;font-weight:500;color:#76b642;margin-bottom:16px}' +
  '#agttcnsntbnnr .content{margin:30px 70px 0 70px}' +
  '#agttcnsntbnnr .actions{color:#76b642;margin:30px 70px 40px 70px}#agttcnsntbnnr .action{margin-right:10px;padding:10px;border:1px solid #76b642;border-radius:8px;background-color:#fff;color:#76b642}' +
  '#agttcnsntbnnr .action.selected{background-color:#76b642;color:#fff}';

function buildBannerElement() {
  var bannerOuter = document.createElement('div');
  bannerOuter.id = 'agttcnsntbnnr';
  bannerOuter.style.display = 'none';

  var bannerContentWrapper = document.createElement('div');
  bannerContentWrapper.className = 'content';

  var bannerHeader = document.createElement('span');
  bannerHeader.className = 'header';
  bannerHeader.appendChild(document.createTextNode('Datenschutzeinwilligung zur Reichweitenmessung'));

  var bannerLegalText = document.createElement('span');
  bannerLegalText.className = 'body';

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
  bannerActionsWrapper.className = 'actions';

  var bannerActionAccept = document.createElement('span');
  bannerActionAccept.id = 'consBtnAgree';
  bannerActionAccept.className = 'action selected';
  bannerActionAccept.appendChild(document.createTextNode('Zustimmen'));

  var bannerActionDecline = document.createElement('span');
  bannerActionDecline.id = 'consBtnDecline';
  bannerActionDecline.className = 'action';
  bannerActionDecline.appendChild(document.createTextNode('Ablehnen'));

  bannerActionsWrapper.appendChild(bannerActionAccept);
  bannerActionsWrapper.appendChild(bannerActionDecline);

  bannerContentWrapper.appendChild(bannerHeader);
  bannerContentWrapper.appendChild(bannerLegalText);

  bannerOuter.appendChild(bannerContentWrapper);
  bannerOuter.appendChild(bannerActionsWrapper);

  return bannerOuter;
}

window.__cbapi = function (command, version, callback, parameter) {
  function mountBannerDefaultStyles() {
    var head = document.getElementsByTagName('head')[0];
    var styleTag = document.createElement('style');
    styleTag.type = 'text/css';

    if (styleTag.styleSheet) {
      // fallback for old browsers
      styleTag.styleSheet.cssText = bannerDefaultStyles;
    } else {
      styleTag.appendChild(document.createTextNode(bannerDefaultStyles));
    }

    head.insertBefore(styleTag, head.firstChild);
  }

  function mountConsentBanner(nodeId) {
    var bannerParentNode = document.getElementsByTagName('body')[0];
    if (nodeId) {
      bannerParentNode = document.getElementById(nodeId);
    }

    if (!bannerParentNode) {
      return null;
    }

    var banner = document.getElementById('agttcnsntbnnr');

    if (!banner) {
      mountBannerDefaultStyles();
      banner = buildBannerElement();
      bannerParentNode.appendChild(banner);
    }

    if (!nodeId) {
      banner.style.zIndex = '9999';
    }

    return banner;
  }

  function showConsentBanner(nodeId, callback, retriesLeft) {
    if (retriesLeft < 0) {
      callback(undefined);
      return;
    }

    var banner = mountConsentBanner(nodeId);

    if (!banner) {
      setTimeout(function () {
        showConsentBanner(nodeId, callback, retriesLeft - 1);
      }, 100);
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
    if (document.getElementById('agttcnsntbnnr')) {
      document.getElementById('agttcnsntbnnr').style.display = 'none';
      clearTimeout(hideBannerTimeout);
    }
  }

  function isConsentBannerVisible() {
    return (
      !!document.getElementById('agttcnsntbnnr') && document.getElementById('agttcnsntbnnr').style.display != 'none'
    );
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
      !!setConsentCallback && setConsentCallback(true);
    } else {
      !!setConsentCallback && setConsentCallback(false);
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
      showConsentBanner(parameter, callback, 3);
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
