var showBannerCB;

function handlevk(keyCode) {
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
      consentBanner.style.display = 'none'; // every action hides banner
      if (consBtnAgree.classList.contains('selected')) {
        __tcfapi('setConsent', 2, showBannerCB, true); // give consent
      } else {
        __tcfapi('setConsent', 2, showBannerCB, false); // decline consent
      }
      break;
    case KeyEvent.VK_LEFT:
    case KeyEvent.VK_RIGHT:
      // toggle selected button
      if (!consBtnAgree.classList.contains('selected')) {
        consBtnAgree.classList.add('selected');
        consBtnAgree.style.border = '3px solid #76b642';

        consBtnDismiss.classList.remove('selected');
        consBtnDismiss.style.border = '1px solid #76b642';
      } else {
        consBtnAgree.classList.remove('selected');
        consBtnAgree.style.border = '1px solid #76b642';

        consBtnDismiss.classList.add('selected');
        consBtnDismiss.style.border = '3px solid #76b642';
      }
      break;
    default:
      break;
  }
}

function kbd(cb) {
  showBannerCB = cb;
}
