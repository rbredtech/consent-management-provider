var bannerContent =
  '<div id="agttcnstbnnr" style="position:absolute; z-index:9999; left:20px; right:20px; bottom:20px; display:none; font-family:sans-serif; font-size:16px; font-weight:400; line-height:24px; color:#505050; background-color:#ffffff; border-radius:8px; border: 4px solid #76b642">' +
  '<div style="margin: 30px 70px 0;"><span style="display:block; font-size:24px; line-height:24px; font-weight:500; color:#76b642; margin-bottom:16px">Datenschutzeinwilligung zur Reichweitenmessung</span>' +
  '<span>Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe agtt.at/hbb-Messung)<% if(!IS_PRO7){ %>, deren Mitglied <b><%-CHANNEL_NAME%></b> ist<%}%>, möchte ' +
  'das Nutzungsverhalten der Zuseher:innen erfassen, um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, deren TV Angebot stetig verbessern zu können. Dazu benötigt die ' +
  'AGTT Ihre Zustimmung, nach der ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:<br />' +
  'Geräte ID, IP-Adresse, System- bzw. Browserinformationen, Geräteinformationen (verwendet HbbTV-Version, TV-Hersteller, Übertragungsweg via Satellit oder Kabel, Geräteauflösung). ' +
  'Nähere Informationen zum Datenschutz finden Sie in der HbbTV Applikation des Senders, wo Sie den Status Ihrer Einwilligung verwalten bzw. ändern können.</span></div>' +
  '<div style="color: #76b642; margin: 30px 70px 40px;">' +
  '<span id="consBtnAgree" style="margin-right: 10px; padding: 10px; border: 1px solid #76b642; border-radius: 8px; background-color: #76b642; color: #ffffff" class="selected">Zustimmen</span>' +
  '<span id="consBtnDismiss" style="margin-right: 10px; padding: 10px;border: 1px solid #76b642; border-radius: 8px; background-color: #ffffff; color: #76b642">Ablehnen</span>' +
  '</div>' +
  '</div>';

var KeyEvent = window['KeyEvent'] || {};
KeyEvent.VK_LEFT = KeyEvent.VK_LEFT || window['VK_LEFT'] || 37;
KeyEvent.VK_RIGHT = KeyEvent.VK_RIGHT || window['VK_RIGHT'] || 39;
KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;

var consBtnAgree;
var consBtnDismiss;
var setConsentCallback;
var hideBannerTimeout;

window.__cbapi = function (command, version, callback, parameter) {
  function mountConsentBanner(nodeId) {
    var bannerParentNode = document.getElementsByTagName('body')[0];
    if (nodeId) {
      bannerParentNode = document.getElementById(nodeId);
    }

    if (!bannerParentNode) {
      return;
    }

    if (!document.getElementById('agttcnsntbnnr')) {
      bannerParentNode.insertAdjacentHTML('beforeend', bannerContent);
    }

    return document.getElementById('agttcnstbnnr');
  }

  function showConsentBanner(nodeId, callback, retriesLeft) {
    if (retriesLeft < 0) {
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
    consBtnDismiss = document.getElementById('consBtnDismiss');

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
      setNotSelected(consBtnDismiss);
    } else {
      setSelected(consBtnDismiss);
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
    setNotSelected(consBtnDismiss);
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
