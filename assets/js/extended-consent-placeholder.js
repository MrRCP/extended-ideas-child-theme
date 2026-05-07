/**
 * Consent placeholder for Calendly embeds.
 * Shows a fallback prompt when Termageddon/Usercentrics blocks Calendly.
 */
(function () {
	'use strict';

	var PLACEHOLDER_CLASS = 'extended-consent-placeholder';
	var PLACEHOLDER_ADDED_ATTR = 'data-extended-consent-placeholder-added';
	var CALENDLY_SELECTOR = '.calendly-inline-widget';

	function getCalendlyContainers() {
		return Array.prototype.slice.call(document.querySelectorAll(CALENDLY_SELECTOR));
	}

	function areAllConsentsAccepted() {
		return typeof window.UC_UI !== 'undefined' &&
			typeof window.UC_UI.areAllConsentsAccepted === 'function' &&
			window.UC_UI.areAllConsentsAccepted();
	}

	function isCalendlyBlocked(container) {
		if (!container) return false;
		if (container.querySelector('.uc-embedding-wrapper')) return false;
		if (areAllConsentsAccepted()) return false;

		var iframe = container.querySelector('iframe');
		if (!iframe) return true;

		var src = iframe.getAttribute('src') || '';
		if (!src || src === 'about:blank') return true;

		var styles = window.getComputedStyle(iframe);
		if (styles.display === 'none' || styles.visibility === 'hidden' || iframe.offsetHeight === 0) return true;

		return false;
	}

	function openCookieSettings() {
		// CookieYes APIs
		if (typeof window.ckyDisplayPreferenceCenter === 'function') {
			window.ckyDisplayPreferenceCenter();
			return;
		}
		if (typeof window.ckyShowConsentbar === 'function') {
			window.ckyShowConsentbar();
			return;
		}
		if (typeof window.CookieYes !== 'undefined' && typeof window.CookieYes.openSettings === 'function') {
			window.CookieYes.openSettings();
			return;
		}

		if (typeof window.UC_UI !== 'undefined') {
			if (typeof window.UC_UI.showFirstLayer === 'function') {
				window.UC_UI.showFirstLayer();
				return;
			}
			if (typeof window.UC_UI.showSecondLayer === 'function') {
				window.UC_UI.showSecondLayer();
				return;
			}
		}

		// Alternative CMP API variants used by some Usercentrics/Termageddon setups
		if (typeof window.Usercentrics !== 'undefined') {
			if (typeof window.Usercentrics.showFirstLayer === 'function') {
				window.Usercentrics.showFirstLayer();
				return;
			}
			if (typeof window.Usercentrics.showSecondLayer === 'function') {
				window.Usercentrics.showSecondLayer();
				return;
			}
		}

		if (typeof window.usercentrics !== 'undefined' && typeof window.usercentrics.openSettings === 'function') {
			window.usercentrics.openSettings();
			return;
		}

		// Click known settings/privacy triggers rendered in the DOM
		var selectors = [
			'.cky-banner-btn-settings',
			'.cky-btn-revisit',
			'.cky-btn-settings',
			'[data-cky-tag="settings-button"]',
			'[data-cky-tag="revisit-consent"]',
			'a#usercentrics-psl',
			'.usercentrics-psl a',
			'[class*="usercentrics-psl"] a',
			'[data-testid="uc-privacy-button"]',
			'[data-uc-action="open-second-layer"]',
			'a[href*="usercentrics"]',
			'button[aria-label*="cookie" i]',
			'button[aria-label*="consent" i]',
			'a[aria-label*="cookie" i]',
			'a[aria-label*="consent" i]'
		];

		for (var i = 0; i < selectors.length; i++) {
			var trigger = document.querySelector(selectors[i]);
			if (trigger) {
				trigger.click();
				return;
			}
		}
	}

	function createPlaceholder() {
		var wrap = document.createElement('div');
		wrap.className = PLACEHOLDER_CLASS;
		wrap.setAttribute('role', 'region');
		wrap.setAttribute('aria-label', 'Cookie consent required');
		wrap.innerHTML = '<p>Calendly is blocked until you accept the relevant cookies.</p><p>Use the button below to open cookie settings.</p><button type="button" class="tr-consent-btn">Open cookie settings</button>';

		var btn = wrap.querySelector('.tr-consent-btn');
		if (btn) btn.addEventListener('click', openCookieSettings);
		return wrap;
	}

	function injectFallbackPlaceholders() {
		var containers = getCalendlyContainers();
		if (!containers.length) return;

		containers.forEach(function (container) {
			var alreadyAdded = container.getAttribute(PLACEHOLDER_ADDED_ATTR);
			var blocked = isCalendlyBlocked(container);

			if (alreadyAdded && !blocked) {
				var existingPlaceholder = container.querySelector('.' + PLACEHOLDER_CLASS);
				if (existingPlaceholder) existingPlaceholder.remove();
				container.removeAttribute(PLACEHOLDER_ADDED_ATTR);
				return;
			}

			if (alreadyAdded || !blocked) return;

			var placeholder = createPlaceholder();
			container.style.setProperty('position', 'relative', 'important');
			container.style.setProperty('min-height', '400px', 'important');
			container.style.setProperty('overflow', 'visible', 'important');

			if (container.firstChild) {
				container.insertBefore(placeholder, container.firstChild);
			} else {
				container.appendChild(placeholder);
			}
			container.setAttribute(PLACEHOLDER_ADDED_ATTR, '1');
		});
	}

	function removeFallbackPlaceholders() {
		document.querySelectorAll('[' + PLACEHOLDER_ADDED_ATTR + ']').forEach(function (container) {
			var placeholder = container.querySelector('.' + PLACEHOLDER_CLASS);
			if (placeholder) placeholder.remove();
			container.removeAttribute(PLACEHOLDER_ADDED_ATTR);
		});
	}

	function runWhenReady() {
		if (!getCalendlyContainers().length) return;

		injectFallbackPlaceholders();
		setTimeout(injectFallbackPlaceholders, 1200);
		setTimeout(injectFallbackPlaceholders, 3500);
	}

	function init() {
		if (!getCalendlyContainers().length) return;

		setTimeout(runWhenReady, 400);

		var attempts = 0;
		var poll = setInterval(function () {
			attempts++;
			if (typeof window.UC_UI !== 'undefined') {
				clearInterval(poll);
				runWhenReady();
			}
			if (attempts >= 20) clearInterval(poll);
		}, 500);

		window.addEventListener('UC_UI_INITIALIZED', function onReady() {
			window.removeEventListener('UC_UI_INITIALIZED', onReady);
			runWhenReady();
		});

		setTimeout(runWhenReady, 5000);

		if (typeof window.MutationObserver !== 'undefined') {
			var debounceTimer;
			var observer = new MutationObserver(function () {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(function () {
					injectFallbackPlaceholders();
				}, 400);
			});
			observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	window.addEventListener('uc_window', function (e) {
		if (e.detail && e.detail.event === 'consent_status') {
			removeFallbackPlaceholders();
			setTimeout(runWhenReady, 300);
		}
	});
})();
