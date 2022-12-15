var inner =
  '<div id="agttcnstbnnr" style="position:absolute; z-index:9999; left:20px; right:20px; bottom:20px; display:none; font-family:sans-serif; font-size:16px; font-weight:400; line-height:24px; color:#505050; background-color:#ffffff; border-radius:8px; border: 4px solid #76b642">' +
  '<div style="margin: 30px 70px 0;"><span style="display:block; font-size:24px; line-height:24px; font-weight:500; color:#76b642; margin-bottom:16px">Datenschutzeinwilligung zur Reichweitenmessung</span>' +
  '<span>Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT; Details siehe agtt.at/hbb-Messung)<% if(!IS_PRO7){ %>, deren Mitglied <b><%-CHANNEL_NAME%></b> ist<%}%>, möchte ' +
  'das Nutzungsverhalten der Zuseher:innen erfassen, um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, deren TV Angebot stetig verbessern zu können. Dazu benötigt die ' +
  'AGTT Ihre Zustimmung, nach der ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:<br />' +
  'Geräte ID, IP-Adresse, System- bzw. Browserinformationen, Geräteinformationen (verwendet HbbTV-Version, TV-Hersteller, Übertragungsweg via Satellit oder Kabel, Geräteauflösung). ' +
  'Nähere Informationen zum Datenschutz finden Sie in der HbbTV Applikation des Senders, wo Sie den Status Ihrer Einwilligung verwalten bzw. ändern können.</span></div>' +
  '<div style="color: #76b642; margin: 30px 70px 40px;">' +
  '<span id="consBtnAgree" style="margin-right: 10px; padding: 10px; border: 1px solid #76b642; border-radius: 8px; background-color: #76b642; color: #ffffff" class="selected">Zustimmen</span>' +
  '<span id="consBtnDismiss" style="margin-right: 10px; padding: 10px;border: 1px solid #76b642; border-radius: 8px; background-color: #ffffff; color: #76b642">Ablehnen</span>' +
  '</div>' +
  '</div>';

var setConsentCallback;

function setSelected(element) {
  element.classList.add('selected');
  element.style.color = '#ffffff';
  element.style.backgroundColor = '#76b642';
}

function setNotSelected(element) {
  element.classList.remove('selected');
  element.style.color = '#76b642';
  element.style.backgroundColor = '#ffffff';
}

function handleLeftRight(consBtnAgree, consBtnDismiss) {
  if (!consBtnAgree.classList.contains('selected')) {
    setSelected(consBtnAgree);
    setNotSelected(consBtnDismiss);
  } else {
    setSelected(consBtnDismiss);
    setNotSelected(consBtnAgree);
  }
}

function handleEnter(consentBanner, consBtnAgree) {
  consentBanner.style.display = 'none';
  if (consBtnAgree.classList.contains('selected')) {
    __tcfapi('setConsent', 2, setConsentCallback, true);
  } else {
    __tcfapi('setConsent', 2, setConsentCallback, false);
  }
}

function handleVK(keyCode) {
  var KeyEvent = window['KeyEvent'] || {};
  KeyEvent.VK_LEFT = KeyEvent.VK_LEFT || window['VK_LEFT'] || 37;
  KeyEvent.VK_RIGHT = KeyEvent.VK_RIGHT || window['VK_RIGHT'] || 39;
  KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;

  var consentBanner = document.getElementById('agttcnstbnnr');
  var consBtnAgree = document.getElementById('consBtnAgree');
  var consBtnDismiss = document.getElementById('consBtnDismiss');

  if (!consentBanner || !consBtnAgree || !consBtnDismiss) {
    return;
  }

  switch (keyCode) {
    case KeyEvent.VK_ENTER:
      handleEnter(consentBanner, consBtnAgree);
      break;
    case KeyEvent.VK_LEFT:
    case KeyEvent.VK_RIGHT:
      handleLeftRight(consBtnAgree, consBtnDismiss);
      break;
    default:
      break;
  }
}

function showConsentBanner(id, cb) {
  setConsentCallback = cb;

  if (!document.getElementById('agttcnstbnnr')) {
    if (id && document.getElementById(id)) {
      document.getElementById(id).insertAdjacentHTML('beforeend', inner);
    } else {
      document.body.insertAdjacentHTML('beforeend', inner);
    }
  }
  document.getElementById('agttcnstbnnr').style.display = 'block';
}

function hideConsentBanner() {
  if (document.getElementById('agttcnstbnnr')) {
    document.getElementById('agttcnstbnnr').style.display = 'none';
  }
}

function isConsentBannerShown() {
  return document.getElementById('agttcnstbnnr') && document.getElementById('agttcnstbnnr').style.display != 'none';
}
