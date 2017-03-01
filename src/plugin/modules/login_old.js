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
        var mount, container, runtime = config.runtime,
            nextRequest,
            events;

        // API

        function attach(node) {
            return Promise.try(function () {
                mount = node;
                container = document.createElement('div');
                // $container = $(container);
                events = domEvent.make(container);
                mount.appendChild(container);
            });
        }

        function start(params) {
            return Promise.try(function () {
                var auth2 = Auth2.make({
                    cookieName: runtime.config('services.auth2.cookieName'),
                    authBaseUrl: runtime.config('services.auth2.url')
                });
                auth2.login({
                    redirectUrl: 'https://authdev.kbase.us#auth2/login/success',
                    provider: 'Globus',
                    stayLoggedIn: false,
                    node: container
                });
               // container.innerHTML = "log in now!";
            });
        }

        function detach() {
            events.detachEvents();
            if (container) {
                mount.removeChild(container);
            }
        }

        return {
            attach: attach,
            detach: detach,
            start: start
        };
    }

    return {
        make: function (config) {
            return widget(config);
        }
    };

});