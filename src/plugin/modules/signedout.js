/* global Promise */
define([
    'kb_common/html'
], function (
    html
) {
    'use strict';
    var t = html.tag,
        p = t('p'),
        div = t('div'),
        ul = t('ul'),
        li = t('li'),
        a = t('a');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        // UI


        // VIEW

        function render(params) {
            container.innerHTML = div({
                class: 'container-fluid'
            }, div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-1'
                }),
                div({
                    class: 'col-md-10'
                }, [
                    p('You are signed out of KBase.'),
                    p([
                        'However, you may still be logged into a identity provider you have recently ',
                        'used to sign in to KBase in this browser. ',
                        'This would allow your KBase account to be accessed merely by ',
                        'using the Sign In button and choosing the sign-in provider.',
                    ]),
                    p([
                        'If you wish to ensure that your KBase account is inaccessible from this ',
                        'browser until you explicitly authenticate with a sign-in provider, ',
                        'you should sign out of any Google or Globus account as well.'
                    ]),
                    ul(runtime.service('session').getProviders()
                        .sort(function (a, b) {
                            if (a.id === 'Google') {
                                return -1;
                            } else if (b.id === 'Google') {
                                return 1;
                            }
                            if (a.id < b.id) {
                                return -1;
                            } else if (a.id > b.id) {
                                return 1;
                            }
                            return 0;
                        })
                        .map(function (provider) {
                            return li(a({
                                href: provider.logoutUrl,
                                target: '_blank'
                            }, 'Log out from ' + provider.label));
                        }).join('')),
                    p([
                        'Additional security measures include:'
                    ]),
                    ul([
                        li('Remove all browser cookies'),
                        li('Use your browser\'s private-browsing feature')
                    ])
                ]),
                div({
                    class: 'col-md-1'
                })
            ]));
        }

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                if (runtime.service('session').isLoggedIn()) {
                    runtime.send('app', 'navigate', {
                        path: 'dashboard'
                    });
                }
                runtime.send('ui', 'setTitle', 'Signed Out');
                render();
            });
        }

        function stop() {
            return Promise.try(function () {
                return null;
            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
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
            return factory(config);
        }
    };
});