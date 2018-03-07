'use strict';

var topicsCallback;

(function (window, document) {

    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };

    var topics = {};

    var overflow = 'auto';

    var thirdPartyEnabled = true;
    var selectorActive = false;
    var selectedElement = null;
    var tooltipElements = {};
    var highlightElements = {};
    var buttonElements = {};

    var resizeFunction = function() {
        var els = document.querySelectorAll('[data-cavy-topic]');
        [].forEach.call(els, function (el) {
            if (el.tagName.toLowerCase() !== 'body') {
                var topic = el.getAttribute('data-cavy-topic');
                if (selectorActive) {
                    updateHighlightPosition(el, topic);
                }
            }
        });
    };

    var tooltipLocation = 'top';

    var scriptSource = (function() {

        if (document.currentScript) {
            return document.currentScript.src;
        } else {
            var documentScripts = document.getElementsByTagName('script'),
                script = documentScripts[documentScripts.length - 1];

            if (typeof script.getAttribute.length !== 'undefined') {
                return script.src;
            }

            return script.getAttribute('src', -1);
        }

    }());

    var hostname = scriptSource.replace('https://','').replace('http://','').split('/')[0];

    var baseUrl = 'https://' + hostname;
    var clientUrl = baseUrl;

    var pathPrefix = './widget/';

    var widgetZIndex = 9000;

    var dataParams = getDataParams();

    if (dataParams.pathPrefix) {
        pathPrefix = dataParams.pathPrefix;
    }

    if (dataParams.api) {
        baseUrl = dataParams.api;
    }

    if (dataParams.client) {
        clientUrl = dataParams.client;
    } else {
        clientUrl = baseUrl;
    }

    if (dataParams.widgetZIndex) {
        widgetZIndex = dataParams.widgetZIndex;
    }

    var widgetHtml = String(' \
        <div id="cavy-chat-button" class="cavy-button" title="Current Topic Chat" aria-label="Current Topic Chat" tabindex="991"> \
        </div> \
        <div id="cavy-issues-button" class="cavy-button" title="Current Topic Issues" aria-label="Current Topic Issues" tabindex="992"> \
        </div> \
        <div id="cavy-wiki-button" class="cavy-button" title="Current Topic Wiki" aria-label="Current Topic Wiki" tabindex="993"> \
        </div> \
        <div id="cavy-select-button" title="Highlight Topics (esc to cancel)" aria-label="Highlight Topics (esc to cancel)" tabindex="994"> \
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"> \
        <path d="m 2.4347429,0.01803702 c -1.205376,0 -2.19463992,0.98926388 -2.19463992,2.19463988 V 7.799394 c 0,1.205376 0.98926392,2.1946401 2.19463992,2.1946401 H 5.7844797 L 5.5445512,8.7970378 H 2.4347429 c -0.5632145,0 -0.9976438,-0.4344293 -0.9976438,-0.9976438 V 2.2126769 c 0,-0.5632145 0.4344293,-0.9976438 0.9976438,-0.9976438 h 8.7790011 c 0.563215,0 0.997644,0.4344293 0.997644,0.9976438 v 4.9727825 l 1.161272,0.035725 0.03572,-5.0085071 C 13.41668,1.0073008 12.419121,0.01803692 11.213745,0.01803692 Z m 4.7950412,7.24063578 1.2049347,6.7232902 1.6821472,-2.049977 1.580705,1.787996 1.580705,-1.412226 -1.649068,-1.680381 2.130689,-1.1692111 z"></path>\
        </svg> \
        </div> \
    ');

    var cavyChatButtonHtml = String(' \
        <div class="cavy-icon"> \
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"> \
        <path d="m 5.5,2.4992182 c -2.4375,0 -4.5,1.375 -4.5,3 0,0.8595 0.578,1.6875 1.578,2.2655 l 0.758,0.4375 -0.2735,0.6565003 c 0.164,-0.0935 0.328,-0.1955 0.4845,-0.3045 l 0.344,-0.2420003 0.414,0.078 c 0.3905,0.0705 0.789,0.1095 1.1955,0.1095 2.4375,0 4.5,-1.375 4.5,-3 0,-1.625 -2.0625,-3 -4.5,-3 z m 0,-1.0000002 c 3.039,0 5.5,1.7890002 5.5,4.0000002 0,2.211 -2.461,4.0000003 -5.5,4.0000003 -0.4765,0 -0.9375,-0.047 -1.375,-0.125 -0.6485,0.461 -1.383,0.7969995 -2.172,0.9999995 -0.211,0.0545 -0.4375,0.0935 -0.672,0.125 H 1.2575 c -0.117,0 -0.2265,-0.0935 -0.25,-0.2265 v 0 c -0.0315,-0.1485 0.0705,-0.242 0.1565,-0.3439995 0.3045,-0.344 0.6485,-0.6485 0.914,-1.297 C 0.8125,7.8972182 0,6.7647182 0,5.4987182 0,3.2877182 2.461,1.498718 5.5,1.498718 Z m 6.422,9.133 c 0.2655,0.6485 0.6095,0.953 0.914,1.297 0.086,0.1015 0.1875,0.1955 0.1565,0.344 v 0 c -0.0315,0.1405 -0.1485,0.242 -0.2735,0.2265 -0.2345,-0.0315 -0.461,-0.0705 -0.672,-0.125 -0.789,-0.203 -1.5235,-0.539 -2.172,-1 -0.4375,0.078 -0.8985,0.125 -1.375,0.125 -1.414,0 -2.711,-0.3905 -3.6875,-1.0315 0.2265,0.0155 0.461,0.0315 0.6875,0.0315 1.6795,0 3.2655,-0.4845 4.4765,-1.3594995 C 11.281,8.1872182 12,6.8982182 12,5.4997182 c 0,-0.406 -0.0625,-0.8045 -0.1795,-1.1875 1.3205,0.7265 2.1795,1.883 2.1795,3.1875 0,1.2735003 -0.8125,2.3985003 -2.078,3.1329998 z"></path>\
        </svg> \
        </div> \
        <div class="cavy-status-text">{0}</div> \
    ');

    var cavyIssuesButtonHtml = String('\
        <div class="cavy-icon"> \
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"> \
        <path d="m 7.998813,3.5308119 2.4685,2.4685 -4.4685,4.4685011 -2.4685,-2.4685011 z M 6.350312,11.178813 11.178313,6.3508119 c 0.1955,-0.1955 0.1955,-0.508 0,-0.703 l -2.828,-2.8279995 c -0.1875,-0.1875 -0.5155,-0.1875 -0.703,0 L 2.8193125,7.6478119 c -0.1955,0.1955 -0.1955,0.508 0,0.703 L 5.647312,11.178813 c 0.0935,0.0935 0.219001,0.1405 0.351501,0.1405 0.132499,0 0.257999,-0.047 0.351499,-0.1405 z M 13.295813,6.2023119 6.209812,13.295813 c -0.3905,0.383 -1.0315,0.383 -1.413999,0 l -0.9845,-0.9845 c 0.585999,-0.586 0.585999,-1.539 0,-2.125001 -0.586,-0.5860003 -1.5390005,-0.5860003 -2.1250005,0 l -0.9765,-0.9845001 c -0.3905,-0.383 -0.3905,-1.0235 0,-1.414 L 7.795813,0.70981236 c 0.383,-0.39050004 1.023499,-0.39050004 1.413999,0 l 0.9765,0.97650004 c -0.586,0.586 -0.586,1.5389995 0,2.1249995 0.586001,0.586 1.539001,0.586 2.125001,0 l 0.9845,0.9765 c 0.383,0.3905 0.383,1.0315 0,1.414 z"></path>\
        </svg> \
        </div> \
        <div class="cavy-status-text">{0}</div> \
    ');

    var cavyWikiButtonHtml = String('\
        <div class="cavy-wiki-text">WIKI</div> \
    ');

    function addClass(el, className) {
        if (el.classList)
            el.classList.add(className);
        else
            el.className += ' ' + className;
    }

    function removeClass(el, className) {
        if (el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    function createDiv() {
        var el = document.createElement('div');
        return el;
    }

    function fadeOut(element, callback) {
        var op = 1;
        var step = (function () {
            if (op <= 0.1) {
                element.style.display = 'none';
                if (callback !== undefined) {
                    callback();
                }
            } else {
                window.requestAnimationFrame(step);
            }
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ')';
            op -= op * 0.1;
        }).bind(this);
        step();
    }

    function fadeIn(element, callback) {
        var op = 0.1;
        element.style.display = '';
        var step = (function() {
            if (op >= 1) {
                element.style.opacity = 1;
                element.style.filter = 'none';
                if (callback !== undefined) {
                    callback();
                }
            } else {
                window.requestAnimationFrame(step);
            }
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ')';
            op += op * 0.1;
        }).bind(this);
        step();
    }

    var openChat = (function() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        openIframe(clientUrl + '/#/chat?topic=' + getTopicId());
    }).bind(this);

    var openIssues = (function() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        openIframe(clientUrl + '/#/issues?topic=' + getTopicId());
    }).bind(this);

    var openWiki = (function() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        openIframe(clientUrl + '/#/?topic=' + getTopicId());
    }).bind(this);

    var toggleSelector = (function() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (!selectorActive) {
            fetchTopics(topics, 'topicsCallback');
        } else {
            stopSelector();
        }
    }).bind(this);

    function stopSelector() {
        selectorActive = false;
        removeOutlineElements();
        var body = document.getElementsByTagName('body')[0];
        body.removeEventListener('mousemove', updateOutlinePosition);
        body.removeEventListener('click', clickSelectionHandler);
        body.removeEventListener('touchstart', clickSelectionHandler);
        toggleHighlight();
    }

    function getTopicId(el) {

        var topicId = undefined;

        if (el !== undefined) {
            topicId = el.getAttribute('data-cavy-topic');
        } else {
            var body = document.getElementsByTagName('body')[0];
            topicId = body.getAttribute('data-cavy-topic');
        }

        if (topicId === null || typeof topicId === 'undefined') {
            return 'root';
        } else {
            return topicId;
        }

    }

    function openIframe(url) {

        if (thirdPartyEnabled) {

            if (document.getElementsByTagName('body')[0].style.overflow !== undefined) {
                overflow = document.getElementsByTagName('body')[0].style.overflow;
            }
            document.getElementsByTagName('body')[0].style.overflow = 'hidden';

            var cavyIframeElement = document.getElementById('cavy-iframe');
            removeClass(cavyIframeElement, 'cavy-iframe-hide');

            fadeIn(cavyIframeElement, (function () {

                var ifrm = document.createElement('iframe');
                ifrm.setAttribute('src', url);
                ifrm.setAttribute('frameborder', 0);
                ifrm.width = '100%';
                ifrm.height = '100%';

                cavyIframeElement.appendChild(ifrm);

            }).bind(this));

        } else {

            window.open(url, '_blank');

        }

    }

    function closeIframe() {
        var cavyIframeElement = document.getElementById('cavy-iframe');
        fadeOut(cavyIframeElement, (function() {
            var iframes = cavyIframeElement.querySelectorAll('iframe');
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].parentNode.removeChild(iframes[i]);
            }
            addClass(cavyIframeElement, 'cavy-iframe-hide');
            document.getElementsByTagName('body')[0].style.overflow = overflow;
        }).bind(this));
    }

    function loadCSS() {

        if (document.createStyleSheet) {

            document.createStyleSheet(pathPrefix + 'boot.css');

        } else {

            var bootLink = document.createElement('link');
            bootLink.href = pathPrefix + 'boot.css';
            bootLink.setAttribute('rel', 'stylesheet');
            bootLink.setAttribute('type', 'text/css');
            document.getElementsByTagName('head')[0].appendChild(bootLink);

        }

    }

    function fetchTopics(topics, callback) {

        var ids = [];

        for (var key in topics) {
            ids.push(key);
        }

        topicsCallback = function(data) {
            for (var i = 0; i < data.length; i++) {
                topics[data[i].id] = data[i];
            }
            startSelector(topics);
        };

        var script = document.createElement('script');
        script.src = baseUrl + '/api/topics/summary?ids[]=' + ids.join('&ids[]=') + '&callback=' + callback;

        document.getElementsByTagName('head')[0].appendChild(script);

    }

    function startSelector(data) {

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                topics[key] = data[key];
            }
        }

        if (selectorActive !== true) {
            selectorActive = true;
            createOutlineElements();
            hideTooltipElements();
            var body = document.getElementsByTagName('body')[0];
            body.addEventListener('mousemove', updateOutlinePosition);
            setTimeout((function () {
                body.addEventListener('click', clickSelectionHandler);
                body.addEventListener('touchstart', clickSelectionHandler, {passive: false})
            }).bind(this), 50);
            toggleHighlight();
        }

    }

    function getDisplayPosition(rect, event) {

        var clientX;
        var clientY;

        if (event.type === 'touchstart' && event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        var top = clientY - rect.height;
        var bottom = clientY + rect.height;
        var left = clientX - (rect.width / 2);
        var right = clientX + (rect.width / 2);

        var arr = [];

        // hits top
        if (top < 20) {
            arr.push('bottom');
        }

        // hits bottom
        if (bottom > (window.innerHeight || document.documentElement.clientHeight) - 20) {
            arr.push('top');
        }

        // hits left
        if (left < 20) {
            arr.push('right');
        }

        // hits right
        if (right > (window.innerWidth || document.documentElement.clientWidth) - 20) {
            arr.push('left');
        }

        if (arr.length === 0) {
            arr.push('top');
        }

        return arr.join('-');

    }

    function updateToolTipLocation(el, event) {

        var tooltipRect = tooltipElements.tooltip.getBoundingClientRect();

        if (tooltipRect.width === 0 || tooltipRect.height === 0) {
            return;
        }

        // default bottom.
        var tooltipXOffset = -(tooltipRect.width / 2);
        var tooltipYOffset = 25;

        if (tooltipLocation === 'top') {
            tooltipYOffset = -(tooltipRect.height + 25);
        } else if (tooltipLocation === 'left') {
            tooltipXOffset = -(tooltipRect.width + 25);
            tooltipYOffset = -(tooltipRect.height / 2);
        } else if (tooltipLocation === 'right') {
            tooltipXOffset = tooltipRect.width + 25;
            tooltipYOffset = -(tooltipRect.height / 2);
        }

        var pageX;
        var pageY;

        if (event.type === 'touchstart' && event.touches && event.touches.length > 0) {
            pageX = event.touches[0].pageX;
            pageY = event.touches[0].pageY;
        } else {
            pageX = event.pageX;
            pageY = event.pageY;
        }

        el.style.left = (pageX + tooltipXOffset) + 'px';
        el.style.top = (pageY + tooltipYOffset) + 'px';

    }

    function updateOutlinePosition(event) {

        var el = event.target;

        var tooltipRect = tooltipElements.tooltip.getBoundingClientRect();
        tooltipLocation = getDisplayPosition(tooltipRect, event);
        if (!tooltipElements.tooltip.classList.contains('cavy-selector-tooltip-' + tooltipLocation)) {
            tooltipElements.tooltip.classList.remove('cavy-selector-tooltip-top');
            tooltipElements.tooltip.classList.remove('cavy-selector-tooltip-bottom');
            tooltipElements.tooltip.classList.remove('cavy-selector-tooltip-left');
            tooltipElements.tooltip.classList.remove('cavy-selector-tooltip-right');
            tooltipElements.tooltip.classList.add('cavy-selector-tooltip-' + tooltipLocation);
        }

        if (selectedElement === el) {
            updateToolTipLocation(tooltipElements.tooltip, event);
            return;
        }

        if (el.tagName.toLowerCase() === 'body') {
            return;
        }

        /**
         * Only select highlight elements.
         */
        var topicId = el.getAttribute('data-cavy-highlight');

        if (topicId == null) {
            if (selectedElement != null) {
                hideTooltipElements();
                removeClass(selectedElement, 'cavy-topic-overlay-selected');
                selectedElement = null;
            }
            return;
        }

        selectedElement = el;
        addClass(selectedElement, 'cavy-topic-overlay-selected');
        tooltipElements.container.innerHTML = compileLabelText(topicId);
        updateToolTipLocation(tooltipElements.tooltip, event);
        showTooltipElements();

    }

    function compileLabelText(topicId) {
        var html = '';
        if (topics[topicId]['icon']) {
            html += '<div class="cavy-selector-tooltip-icon"><img style="border-radius: 2px;" src="' + topics[topicId]['icon'] + '" width="60" height="60"></div>';
        }
        html += '<p><span class="cavy-selector-tooltip-title">' + topics[topicId].name.toUpperCase() + '</span></p><p style="clear: both;">' + topics[topicId].description + '</p>';
        if (topics[topicId]['pinned'] && topics[topicId]['pinned'].length > 0) {
            for (var slug in topics[topicId]['pinned']) {
                html += '<div class="cavy-selector-tooltip-slug' + (topics[slug]['color'] ? ' cavy-slug-' + topics[slug]['color']: '') + '">' + slug + '</div>';
            }
        }
        html += '<p style="margin: 0;"><span class="cavy-selector-tooltip-topic-id">' + clientUrl + '/#/?topic=' + topicId + '</span></p>';
        return html;
    }

    function clickTopicEventHandler(event) {
        event = event || window.event;
        if (event.type === 'touchstart' && !selectedElement) {
            console.log('not opening topic, no element is selected.');
            return;
        }
        var el = null;
        if (event !== undefined && event.currentTarget !== undefined) {
            el = event.currentTarget;
        } else if (event !== undefined) {
            el = event.target;
        }
        clickHandler(el);
    }

    function clickSelectionHandler(event) {

        event.preventDefault();

        if (event.type === 'touchstart') {
            var preSelected = selectedElement;
            updateOutlinePosition(event);
            if (preSelected === selectedElement && selectedElement) {
                var topicId = selectedElement.getAttribute('data-cavy-highlight');
                if (topicId === null) {
                    topicId = selectedElement.getAttribute('data-cavy-topic');
                }
                if (topicId) {
                    openIframe(clientUrl + '/#/?topic=' + topicId);
                } else {
                    stopSelector();
                }
            } else if (!selectedElement) {
                stopSelector();
            } else {
                updateOutlinePosition(event);
            }
            return;
        }
        clickHandler(selectedElement);
    }

    function clickHandler(el) {
        stopSelector();
        if (el !== null) {
            var topicId = el.getAttribute('data-cavy-highlight');
            if (topicId === null) {
                topicId = el.getAttribute('data-cavy-topic');
            }

            if (topicId != null) {
                console.log(topicId);
                openIframe(clientUrl + '/#/?topic=' + topicId);
            }
        }
        return false;
    }

    function removeElement(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
    }

    function removeOutlineElements() {
        for (var key in tooltipElements) {
            if (tooltipElements.hasOwnProperty(key)) {
                removeElement(tooltipElements[key]);
            }
        }
    }

    function hideTooltipElements() {
        for (var key in tooltipElements) {
            if (tooltipElements.hasOwnProperty(key)) {
                tooltipElements[key].style.display = 'none';
            }
        }
    }

    function showTooltipElements() {
        for (var key in tooltipElements) {
            if (tooltipElements.hasOwnProperty(key)) {
                tooltipElements[key].style.display = '';
            }
        }
    }

    function createOutlineElements() {

        tooltipElements.tooltip = createDiv();
        tooltipElements.container = createDiv();

        addClass(tooltipElements.tooltip, 'cavy-selector-tooltip');
        addClass(tooltipElements.container, 'reset-this');

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(tooltipElements.tooltip);
        tooltipElements.tooltip.appendChild(tooltipElements.container);

    }

    function parseTopicElements() {
        var els = document.querySelectorAll('[data-cavy-topic]');
        [].forEach.call(els, function (el) {
            var tagName = el.tagName.toLowerCase();
            var topic = el.getAttribute('data-cavy-topic');
            if (!topics[topic] && (tagName !== 'body')) {
                topics[topic] = {
                    'name': 'TOPIC NOT FOUND',
                    'description': 'Click to create a new topic.'
                };
            }
            if ((tagName === 'a' || el.getAttribute('data-cavy-link')) && el.onclick !== clickTopicEventHandler) {
                el.href = 'javascript:;';
                el.onclick = clickTopicEventHandler;
                el.ontouchstart = clickTopicEventHandler;
            }
        });
    }

    function toggleHighlight() {

        var els = document.querySelectorAll('[data-cavy-topic]');

        var topicIds = [];

        [].forEach.call(els, function (el) {
            if (el.tagName.toLowerCase() !== 'body') {
                var topic = el.getAttribute('data-cavy-topic');
                topicIds.push(topic);
                if (selectorActive) {
                    if (!highlightElements[topic]) {
                        highlightElements[topic] = createDiv();
                        var body = document.getElementsByTagName('body')[0];
                        body.appendChild(highlightElements[topic]);
                        highlightElements[topic].setAttribute('data-cavy-highlight', topic);
                        updateHighlightPosition(el, topic);
                    }
                    addClass(highlightElements[topic], 'cavy-topic-overlay');
                    addClass(highlightElements[topic], 'cavy-topic-overlay-visible');
                } else if (highlightElements[topic]) {
                    removeClass(highlightElements[topic], 'cavy-topic-overlay-visible');
                }
            }
        });

        /**
         * Remove the selected border if element is selected.
         */
        if (!selectorActive && selectedElement) {
            removeClass(selectedElement, 'cavy-topic-overlay-selected');
        }

        /**
         * Remove highlight elements that are no longer associated with topics in the DOM.
         */
        var body = document.getElementsByTagName('body')[0];
        for (var topic in highlightElements) {
            if (highlightElements.hasOwnProperty(topic)) {
                if (topicIds.indexOf(topic) < 0) {
                    body.removeChild(highlightElements[topic]);
                    delete highlightElements[topic];
                }
            }
        }

        /**
         * Add a resize listener to keep the highlight element locations the same as topics.
         */
        if (selectorActive) {
            window.addEventListener('resize', resizeFunction);
        } else {
            window.removeEventListener('resize', resizeFunction);
        }

    }

    function getBlockRect(el) {
        var nodeRect = el.getBoundingClientRect();
        var rect = {
            x1: nodeRect.left,
            y1: nodeRect.top,
            x2: nodeRect.left + nodeRect.width,
            y2: nodeRect.top + nodeRect.height
        };
        if (nodeRect.width > 0) {
            return rect;
        } else {
            return addBlockRect(el, rect);
        }
    }

    function addBlockRect(el, rect) {
        if (el.hasChildNodes()) {
            [].forEach.call(el.childNodes, function(child) {
                var nodeRect = child.getBoundingClientRect();
                if (rect.x1 > nodeRect.left) {
                    rect.x1 = nodeRect.left;
                }
                if (rect.y1 > nodeRect.top) {
                    rect.y1 = nodeRect.top;
                }
                if (rect.x2 < (nodeRect.left + nodeRect.width)) {
                    rect.x2 = nodeRect.left + nodeRect.width;
                }
                if (rect.y2 < (nodeRect.top + nodeRect.height)) {
                    rect.y2 = nodeRect.top + nodeRect.height;
                }
                if (nodeRect.width === 0) {
                    addBlockRect(el, rect);
                }
            });
        }
        return rect;
    }

    function updateHighlightPosition(el, topic) {
        var body = document.getElementsByTagName('body')[0];
        var rect = getBlockRect(el);
        var top = rect.y1 + body.scrollTop;
        var left = rect.x1 + body.scrollLeft;
        highlightElements[topic].style.top = Math.max(0, top) + 'px';
        highlightElements[topic].style.left = left + 'px';
        highlightElements[topic].style.width = (rect.x2 - rect.x1) + 'px';
        highlightElements[topic].style.height = (rect.y2 - rect.y1) + 'px';
    }

    function updateNotifications(summary) {
        buttonElements.chatButton.innerHTML = cavyChatButtonHtml.format(summary.cha);
        buttonElements.issuesButton.innerHTML = cavyIssuesButtonHtml.format(summary.tic);
    }

    function drawInterface() {

        var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
        var processEvent = window[eventMethod];
        var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

        /**
         * Receive close iframe and notification update messages.
         */
        processEvent(messageEvent, function(e) {
            if (e.data === 'MM:3PCunsupported') {
                thirdPartyEnabled = false;
                return;
            }
            if (e.data === 'MM:3PCsupported') {
                thirdPartyEnabled = true;
                return;
            }
            if (e.data === 'cavy-close') {
                closeIframe();
                return;
            }
            if (e.origin !== baseUrl) {
                console.log('Message from wrong origin: ' + e.origin);
                return;
            }
            updateNotifications(e.data);
        }, false);

        /**
         * Attach third party cookie check iframe.
         */
        var thirdpartyiframe = document.createElement('iframe');
        thirdpartyiframe.id = 'cavy-third-party-iframe';
        thirdpartyiframe.setAttribute('frameborder', 0);
        thirdpartyiframe.setAttribute('width', 0);
        thirdpartyiframe.setAttribute('height', 0);
        thirdpartyiframe.src = baseUrl + '/widget/start.html';
        document.getElementsByTagName('body')[0].appendChild(thirdpartyiframe);

        /**
         * Attach the SSE iframe.
         */
        var iframe = document.createElement('iframe');
        iframe.id = 'cavy-sse-iframe';
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('width', 0);
        iframe.setAttribute('height', 0);
        iframe.src = baseUrl + '/widget/iframe.html'; // iframe must be hosted by cavy to work.
        document.getElementsByTagName('body')[0].appendChild(iframe);

        /**
         * Attach the fullscreen container iframe for Cavy.
         */
        var cavyIframe = createDiv();
        cavyIframe.id = 'cavy-iframe';
        cavyIframe.style.visibility = 'hidden';
        addClass(cavyIframe, 'cavy-iframe-hide');
        document.getElementsByTagName('body')[0].appendChild(cavyIframe);

        /**
         * Attach the widget elements.
         */
        var widget = createDiv();
        widget.id = 'cavy-widget';
        widget.style.visibility = 'hidden';
        widget.style.zIndex = widgetZIndex;
        widget.innerHTML = widgetHtml;
        document.getElementsByTagName('body')[0].appendChild(widget);

        buttonElements.chatButton = document.getElementById('cavy-chat-button');
        buttonElements.chatButton.innerHTML = cavyChatButtonHtml.format('0');
        buttonElements.chatButton.onclick = openChat;

        buttonElements.issuesButton = document.getElementById('cavy-issues-button');
        buttonElements.issuesButton.innerHTML = cavyIssuesButtonHtml.format('0');
        buttonElements.issuesButton.onclick = openIssues;

        buttonElements.wikiButton = document.getElementById('cavy-wiki-button');
        buttonElements.wikiButton.innerHTML = cavyWikiButtonHtml;
        buttonElements.wikiButton.onclick = openWiki;

        buttonElements.selectorButton = document.getElementById('cavy-select-button');
        buttonElements.selectorButton.onclick = toggleSelector;

    }

    function getDataParams() {
        var scripts = document.getElementsByTagName('script');
        var currentScript;
        if (document.currentScript) {
            currentScript = document.currentScript;
        } else {
            currentScript = scripts[scripts.length - 1];
        }
        return {
            api: currentScript.getAttribute('data-cavy-api'),
            client: currentScript.getAttribute('data-cavy-client'),
            widgetZIndex: currentScript.getAttribute('data-cavy-z-index'),
            pathPrefix: currentScript.getAttribute('data-cavy-path-prefix')
        };
    }

    /**
     * RUN
     */
    loadCSS();
    parseTopicElements();
    drawInterface();

    /**
     * Only display the widget once the CSS has been loaded.
     */
    var loadInterval = setInterval((function() {
        var widget = document.getElementById('cavy-widget');
        var iframe = document.getElementById('cavy-iframe');
        if (widget.offsetLeft > 20 || widget.offsetTop > 20) {
            clearInterval(loadInterval);
            widget.style.visibility = 'visible';
            iframe.style.visibility = 'visible';
        }
    }).bind(this), 10);

    /**
     * Attach a key handler.
     *
     * @param evt
     */
    document.onkeydown = function(evt) {
        evt = evt || window.event;
        var isEscape = false;
        var isEnter = false;
        if ('key' in evt) {
            isEscape = evt.key === 'Escape';
            isEnter = evt.key === 'Enter';
        } else {
            isEscape = evt.keyCode === 27;
            isEnter = evt.keyCode === 13;
        }
        if (isEscape) {
            if (selectorActive) {
                stopSelector();
            }
        }
        if (isEnter) {
            if (document.activeElement) {
                if (document.activeElement.tabIndex === 991) {
                    openChat();
                } else if (document.activeElement.tabIndex === 992) {
                    openIssues();
                } else if (document.activeElement.tabIndex === 993) {
                    openWiki();
                } else if (document.activeElement.tabIndex === 994) {
                    toggleSelector();
                }
            }
        }
    };

    /**
     * Observe the DOM for changes to find new Cavy topics.
     */
    var observeDOM = (function() {

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
            eventListenerSupported = window.addEventListener;

        return function(obj, callback) {
            if (MutationObserver) {
                var obs = new MutationObserver(function(mutations) {
                    if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                        callback();
                    }
                });
                obs.observe( obj, {childList: true, subtree: true});
            } else if (eventListenerSupported) {
                obj.addEventListener('DOMNodeInserted', callback, false);
                obj.addEventListener('DOMNodeRemoved', callback, false);
            }
        }

    })();

    observeDOM(document.getElementsByTagName('body')[0], function() {
        parseTopicElements();
    });

}(window, document));
