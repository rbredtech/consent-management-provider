(function () {
  var KeyEvent = window['KeyEvent'] || {};
  KeyEvent.VK_LEFT = KeyEvent.VK_LEFT || window['VK_LEFT'] || 37;
  KeyEvent.VK_RIGHT = KeyEvent.VK_RIGHT || window['VK_RIGHT'] || 39;
  KeyEvent.VK_ENTER = KeyEvent.VK_ENTER || window['VK_ENTER'] || 13;

  var consBtnAgree;
  var consBtnDecline;
  var bannerCloseCallback;
  var hideBannerTimeout;

  function buildBannerElement() {
    return buildBanner('Datenschutzeinwilligung zur Reichweitenmessung', 'noconsent', function (bannerLegalText) {
      bannerLegalText.appendChild(
        document.createTextNode(
          'Wir möchten in einem gemeinsamen Projekt mit der AGF Videoforschung GmbH und weiteren TV-Sendern ' +
            '(https://www.agf.de/agf-hbbtv-nutzungsmessung-beteiligteunddatenschutzrechtlichverantwortliche) ' +
            'Informationen über die Nutzung der TV-Geräte unserer Zuschauer erfassen und analysieren, um unser ' +
            'Programmangebot zu verbessern. Dafür benötigen wir und die anderen Projektbeteiligten Ihre Einwilligung. ' +
            'Erteilen Sie eine Einwilligung, wird ein Cookie auf Ihrem Gerät platziert, durch das folgende ' +
            'Informationen ausgelesen werden können:'
        )
      );
      bannerLegalText.appendChild(document.createElement('br'));
      bannerLegalText.appendChild(document.createElement('br'));
      bannerLegalText.appendChild(
        document.createTextNode(
          'Geräte ID; IP-Adresse; System- bzw. Browserinformationen; Geräteinformationen (verwendet HbbTV-Version, ' +
            'TV-Hersteller, Übertragungsweg via Satellit oder Kabel, Geräteauflösung); Datum, Uhrzeit, Dauer und Sender, ' +
            'der gesehen wurde.'
        )
      );
      bannerLegalText.appendChild(document.createElement('br'));
      bannerLegalText.appendChild(document.createElement('br'));
      bannerLegalText.appendChild(
        document.createTextNode(
          'Die Einwilligungserklärungen beziehen sich auf die Nutzungsmessung des Angebots aller teilnehmenden Sender und können in der ' +
            'HbbTV-Applikation jedes Senders jederzeit mit Wirkung für die Zukunft widerrufen werden. Nähere Informationen zum Datenschutz ' +
            'finden Sie in unserer HbbTV-Applikation. Drücken Sie hierfür die rote Taste auf Ihrer Fernbedienung.'
        )
      );
    });
  }

  function buildBannerAdditionalChannelsElement() {
    return buildBanner('Datenschutzeinwilligung zur Reichweitenmessung', 'go-to-settings', function (bannerLegalText) {
      bannerLegalText.appendChild(
        document.createTextNode(
          'Der Verein Arbeitsgemeinschaft Teletest (kurz AGTT, Details siehe www.agtt.at/hbb-messung) führt Messungen des ' +
            'Nutzungsverhaltens durch. Zu dieser Messung haben Sie bereits Ihre Einwilligung erteilt. Nunmehr möchte die AGTT die ' +
            'Messung auch auf andere Sender ausdehnen. Dies möchten wir Ihnen hiermit zur Kenntnis bringen. Die aktuelle Liste aller ' +
            'Sender, bei denen das Nutzungsverhalten durch die AGTT gemessen wird, finden Sie unter www.agtt.at/hbb-messung. Falls ' +
            'Sie Ihre Einstellungen ändern möchten, können Sie dies in den „Einstellungen“ tun. Vielen Dank für Ihre Unterstützung.'
        )
      );
    });
  }

  function buildBanner(header, secondaryButtonType, bodyBuilder) {
    var bannerOuter = document.createElement('div');
    bannerOuter.id = 'agfcnsntbnnr';
    bannerOuter.style.position = 'absolute';
    bannerOuter.style.left = '20px';
    bannerOuter.style.right = '20px';
    bannerOuter.style.bottom = '20px';
    bannerOuter.style.display = 'none';
    bannerOuter.style.fontFamily = 'sans-serif';
    bannerOuter.style.fontSize = '14px';
    bannerOuter.style.fontWeight = 'normal';
    bannerOuter.style.lineHeight = '20px';
    bannerOuter.style.color = '#9ebcc7';
    bannerOuter.style.backgroundColor = '#0C5873';
    bannerOuter.style.borderRadius = '8px';

    var bannerContentWrapper = document.createElement('div');
    bannerContentWrapper.style.margin = '30px 40px 0 40px';

    var bannerHeader = document.createElement('span');
    bannerHeader.style.display = 'block';
    bannerHeader.style.fontSize = '22px';
    bannerHeader.style.lineHeight = '22px';
    bannerHeader.style.fontWeight = 'bold';
    bannerHeader.style.color = '#ea515a';
    bannerHeader.style.marginBottom = '16px';
    bannerHeader.appendChild(document.createTextNode(header));

    var bannerLegalText = document.createElement('span');

    bodyBuilder(bannerLegalText);

    var bannerActionsWrapper = document.createElement('div');
    bannerActionsWrapper.style.margin = '30px 40px 30px 40px';

    var bannerActionAccept = document.createElement('span');
    bannerActionAccept.id = 'consBtnAgree';
    bannerActionAccept.className = 'selected';
    bannerActionAccept.style.marginRight = '10px';
    bannerActionAccept.style.padding = secondaryButtonType === 'go-to-settings' ? '10px 30px' : '10px';
    bannerActionAccept.style.borderRadius = '8px';
    bannerActionAccept.style.backgroundColor = '#ea515a';
    bannerActionAccept.style.color = '#ffffff';
    bannerActionAccept.setAttribute('data-reason', 'consent');
    switch (secondaryButtonType) {
      case 'go-to-settings':
        bannerActionAccept.appendChild(document.createTextNode('OK'));
        break;
      default:
        bannerActionAccept.appendChild(document.createTextNode('Zustimmen'));
    }

    var bannerActionDecline = document.createElement('span');
    bannerActionDecline.id = 'consBtnDecline';
    bannerActionDecline.style.marginRight = '10px';
    bannerActionDecline.style.padding = '10px';
    bannerActionDecline.style.borderRadius = '8px';
    bannerActionDecline.style.backgroundColor = '#9ebcc7';
    bannerActionDecline.style.color = '#0C5873';
    bannerActionDecline.setAttribute('data-reason', secondaryButtonType);
    switch (secondaryButtonType) {
      case 'go-to-settings':
        bannerActionDecline.appendChild(document.createTextNode('Einstellungen ändern'));
        break;
      default:
        bannerActionDecline.appendChild(document.createTextNode('Ablehnen'));
    }

    bannerActionsWrapper.appendChild(bannerActionAccept);
    bannerActionsWrapper.appendChild(bannerActionDecline);

    bannerContentWrapper.appendChild(bannerHeader);
    bannerContentWrapper.appendChild(bannerLegalText);

    bannerOuter.appendChild(bannerContentWrapper);
    bannerOuter.appendChild(bannerActionsWrapper);

    return bannerOuter;
  }

  function loadOnDOMContentLoaded(domContentLoadedCB) {
    if (domContentLoadedCB && typeof domContentLoadedCB === 'function') {
      document.addEventListener('DOMContentLoaded', function () {
        domContentLoadedCB();
      });
    }
  }

  function getBannerParentNode(elementId) {
    var element = document.getElementsByTagName('body')[0];
    if (elementId) {
      element = document.getElementById(elementId);
    }
    return element;
  }

  function waitForDOMElement(elementId, onDomElementFoundCB, retriesLeft) {
    if (retriesLeft < 0) {
      // After retry attempts have been exhausted we try to use the DOMContentLoaded event as a fallback
      loadOnDOMContentLoaded(onDomElementFoundCB);
      return;
    }

    var element = getBannerParentNode(elementId);

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

  window.__cbapi = function (command, _version, callback, parameter) {
    function mountConsentBanner(elementId, bannerType) {
      var bannerParentNode = getBannerParentNode(elementId);

      if (!bannerParentNode) {
        return null;
      }

      var banner = document.getElementById('agfcnsntbnnr');

      if (!banner) {
        if (bannerType === 'additional-channels') {
          banner = buildBannerAdditionalChannelsElement();
        } else {
          banner = buildBannerElement();
        }
        bannerParentNode.appendChild(banner);
      }

      if (!elementId) {
        banner.style.zIndex = '9999';
      }

      return banner;
    }

    function showConsentBanner(elementId, callback, bannerType) {
      var banner = mountConsentBanner(elementId, bannerType);

      if (!banner) {
        if (callback && typeof callback === 'function') {
          callback(undefined, 'not-mounted');
        }
        return;
      }

      bannerCloseCallback = callback;

      consBtnAgree = document.getElementById('consBtnAgree');
      consBtnDecline = document.getElementById('consBtnDecline');

      banner.style.display = 'block';

      hideBannerTimeout = setTimeout(function () {
        hideConsentBanner();
        if (callback && typeof callback === 'function') {
          callback(undefined, 'timeout');
        }
      }, parseInt('{{BANNER_TIMEOUT}}'));
    }

    function hideConsentBanner() {
      if (document.getElementById('agfcnsntbnnr')) {
        document.getElementById('agfcnsntbnnr').style.display = 'none';
        clearTimeout(hideBannerTimeout);
      }
    }

    function isConsentBannerVisible() {
      var banner = document.getElementById('agfcnsntbnnr');
      if (!banner) {
        return false;
      }
      return banner.style.display === 'block';
    }

    function setSelected(element) {
      if (!element) {
        return;
      }
      element.className = element.className.length ? element.className + ' selected' : 'selected';
      element.style.color = '#ffffff';
      element.style.backgroundColor = '#ea515a';
    }

    function setNotSelected(element) {
      if (!element) {
        return;
      }
      element.className = element.className.replace(/selected/g, '');
      element.style.color = '#0C5873';
      element.style.backgroundColor = '#9ebcc7';
    }

    function handleSelectionToggle() {
      if (consBtnAgree && consBtnAgree.className.indexOf('selected') === -1) {
        setSelected(consBtnAgree);
        setNotSelected(consBtnDecline);
      } else {
        setSelected(consBtnDecline);
        setNotSelected(consBtnAgree);
      }
    }

    function handleEnter() {
      if (bannerCloseCallback && typeof bannerCloseCallback === 'function') {
        if (consBtnAgree && consBtnAgree.className.indexOf('selected') !== -1) {
          bannerCloseCallback(true, consBtnAgree.getAttribute('data-reason'));
        } else {
          bannerCloseCallback(consBtnDecline.getAttribute('data-reason') === 'go-to-settings' ? undefined : false, consBtnDecline.getAttribute('data-reason'));
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

      if (parameter.preventDefault && typeof parameter.preventDefault === 'function') {
        parameter.preventDefault();
      }
      var keyCode = parameter.keyCode ? parameter.keyCode : parameter;

      switch (keyCode) {
        case KeyEvent.VK_ENTER:
          handleEnter();
          if (callback && typeof callback === 'function') {
            callback(keyCode);
          }
          break;
        case KeyEvent.VK_LEFT:
        case KeyEvent.VK_RIGHT:
          handleSelectionToggle();
          if (callback && typeof callback === 'function') {
            callback(keyCode);
          }
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
            showConsentBanner(parameter, callback, 'basic');
          },
          3
        );
        break;
      case 'showAdditionalChannelsBanner':
        waitForDOMElement(
          parameter,
          function () {
            showConsentBanner(parameter, callback, 'additional-channels');
          },
          3
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
})();
