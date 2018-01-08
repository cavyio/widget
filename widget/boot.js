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
        <div id="cavy-chat-button" class="cavy-button"> \
        </div> \
        <div id="cavy-issues-button" class="cavy-button"> \
        </div> \
        <div id="cavy-wiki-button" class="cavy-button"> \
        </div> \
        <div id="cavy-select-button">&#xe900; \
        </div> \
    ');

    var cavyChatButtonHtml = String('\
        <div class="cavy-icon">&#xe96d;</div> \
        <div class="cavy-status-text">{0}</div> \
    ');

    var cavyIssuesButtonHtml = String('\
        <div class="cavy-icon">&#xe939;</div> \
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
        openIframe(clientUrl + '/#/chat?topic=' + getTopicId());
    }).bind(this);

    var openIssues = (function() {
        openIframe(clientUrl + '/#/issues?topic=' + getTopicId());
    }).bind(this);

    var openWiki = (function() {
        openIframe(clientUrl + '/#/?topic=' + getTopicId());
    }).bind(this);

    var toggleSelector = (function() {
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
     * Attach a key handler to stop tooltip selection when escape is pressed.
     *
     * @param evt
     */
    document.onkeydown = function(evt) {
        evt = evt || window.event;
        var isEscape = false;
        if ('key' in evt) {
            isEscape = evt.key === 'Escape';
        } else {
            isEscape = evt.keyCode === 27;
        }
        if (isEscape) {
            if (selectorActive) {
                stopSelector();
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