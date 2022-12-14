var inner =
  '<div id="agttcnstbnnr" ' +
  'style="position:absolute; left:20px; right:20px; bottom:20px; display:none; font-family:sans-serif; font-size:16px; font-weight:400; line-height:24px; color:#505050; background-color:#ffffff; border-radius:8px; border: 4px solid #76b642">' +
  '<div style="margin: 30px 70px 0;"><span style="display:block;font-size:24px;line-height:24px;font-weight:500;color:#76b642;margin-bottom:16px">Datenschutzeinwilligung zur Reichweitenmessung</span>' +
  '<span>Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT; Details siehe agtt.at/hbb-Messung)<% if(!IS_PRO7){ %>, deren Mitglied <b><%-CHANNEL_NAME%></b> ist<%}%>, möchte das Nutzungsverhalten der Zuseher:innen erfassen, um dadurch den Mitgliedern der AGTT die Möglichkeit zu geben, deren TV Angebot stetig verbessern zu können. Dazu benötigt die AGTT Ihre Zustimmung, nach der ein Cookie auf Ihrem Gerät platziert wird, um folgende Informationen auslesen zu können:<br />' +
  'Geräte ID, IP-Adresse, System- bzw. Browserinformationen, Geräteinformationen (verwendet HbbTV-Version, TV-Hersteller, Übertragungsweg via Satellit oder Kabel, Geräteauflösung). ' +
  'Nähere Informationen zum Datenschutz finden Sie in der HbbTV Applikation des Senders, wo Sie den Status Ihrer Einwilligung verwalten bzw. ändern können.</span></div>' +
  '<div style="color: #76b642; margin: 30px 70px 40px;">' +
  '<span id="consBtnAgree" class="selected" ' +
  'style="margin-right: 10px; padding: 10px; border: 3px solid #76b642; border-radius: 8px">Zustimmen</span>' +
  '<span id="consBtnDismiss" ' +
  'style="margin-right: 10px;padding: 10px;border: 1px solid #76b642; border-radius: 8px">Ablehnen</span>' +
  '</div>' +
  '</div>';

function addBanner() {
  document.body.insertAdjacentHTML('beforeend', inner);
}

function isBannerShown() {
  return document.getElementById('agttcnstbnnr') && document.getElementById('agttcnstbnnr').style.display != 'none';
}

function showBanner() {
  if (!document.getElementById('agttcnstbnnr')) {
    addBanner();
  }
  document.getElementById('agttcnstbnnr').style.display = 'block';
}

function hideBanner() {
  if (document.getElementById('agttcnstbnnr')) {
    document.getElementById('agttcnstbnnr').style.display = 'none';
  }
}
