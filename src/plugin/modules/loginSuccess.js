/*global
 define
 */
/*jslint
 browser: true,
 white: true
 */
define([
    'kb_common/html',
    'kb_common/domEvent',
    'jquery',
    'bluebird',
    'kb_plugin_login',
    'kb_common/auth2'
],
function (html, domEvent, $, Promise, Plugin, Auth2) {
    'use strict';


    function widget(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            events;

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = document.createElement('div');
                events = domEvent.make(container);
                hostNode.appendChild(container);
            });
        }

        function start(params) {
            var auth2 = Auth2.make({
                cookieName: runtime.config('services.auth2.cookieName'),
                authBaseUrl: runtime.config('services.auth2.url')
            });
            container.innerHTML = "log in success!";
        }

        function stop() {
            return null;
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return widget(config);
        }
    };

});