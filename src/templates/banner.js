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
        'Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe agtt.at/hbb-Messung), möchte ' +
          'das Nutzungsverhalten der Zuseher:innen erfassen, um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, deren TV Angebot stetig verbessern zu können. Dazu benötigt die ' +
          'AGTT Ihre Zustimmung, nach der ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:',
      ),
    );
  } else {
    var bannerLegalTextChannelName = document.createElement('b');
    bannerLegalTextChannelName.appendChild(document.createTextNode('<%-CHANNEL_NAME%>'));

    bannerLegalText.appendChild(
      document.createTextNode(
        'Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe agtt.at/hbb-Messung), deren Mitglied ',
      ),
    );
    bannerLegalText.appendChild(bannerLegalTextChannelName);
    bannerLegalText.appendChild(
      document.createTextNode(
        ' ist, möchte ' +
          'das Nutzungsverhalten der Zuseher:innen erfassen, um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, deren TV Angebot stetig verbessern zu können. Dazu benötigt die ' +
          'AGTT Ihre Zustimmung, nach der ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:',
      ),
    );
  }
  bannerLegalText.appendChild(document.createElement('br'));
  bannerLegalText.appendChild(
    document.createTextNode(
      'Geräte ID, IP-Adresse, System- bzw. Browserinformationen, Geräteinformationen (verwendet HbbTV-Version, TV-Hersteller, Übertragungsweg via Satellit oder Kabel, Geräteauflösung). ' +
        'Nähere Informationen zum Datenschutz finden Sie in der HbbTV Applikation des Senders, wo Sie den Status Ihrer Einwilligung verwalten bzw. ändern können.',
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

window.__cbapi = function (command, version, callback, parameter) {
  function mountConsentBanner(nodeId) {
    var bannerParentNode = document.getElementsByTagName('body')[0];
    if (nodeId) {
      bannerParentNode = document.getElementById(nodeId);
    }

    if (!bannerParentNode) {
      return null;
    }

    var banner = document.getElementById('agttcnstbnnr');

    if (!banner) {
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
      !!setConsentCallback && setConsentCallback(true);
    } else {
      !!setConsentCallback && setConsentCallback(false);
    }
    hideConsentBanner();

    // reset consent banner to have ACCEPT button selected
    setSelected(consBtnAgree);
    setNotSelected(consBtnDecline);
  }

  function handleVK(parameter) {
    if (!isConsentBannerVisible()) {
      return;
    }

    !!parameter.preventDefault && parameter.preventDefault();
    var keyCode = parameter.keyCode ? parameter.keyCode : parameter;

    switch (keyCode) {
      case KeyEvent.VK_ENTER:
        handleEnter();
        break;
      case KeyEvent.VK_LEFT:
      case KeyEvent.VK_RIGHT:
        handleSelectionToggle();
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
      handleVK(parameter);
      break;
    default:
      break;
  }
};
