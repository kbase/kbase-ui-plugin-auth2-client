define([
    'kb_common/html',
    './lib/provider',
], function (
    html,
    provider
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

        var providers = new provider.Providers({allowed: runtime.config('ui.allow')}).get();

        // UI
        
        // VIEW

        function render() {
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
                    p({
                        style: {
                            fontWeight: 'bold'
                        }
                    }, 'You are signed out of KBase.'),
                    p([
                        'However, you may still be logged into a identity provider you have recently ',
                        'used to sign in to KBase in this browser. ',
                        'This would allow your KBase account to be accessed merely by ',
                        'using the Sign In button and choosing the sign-in provider.',
                    ]),
                    p([
                        'If you wish to ensure that your KBase account is inaccessible from this ',
                        'browser, ',
                        'you should sign out of any accounts you have used to access KBase as well.'
                    ]),
                    ul(providers
                        .sort(function (a, b) {
                            let priorityOrder = a.priority - b.priority;
                            if (priorityOrder !== 0) {
                                return priorityOrder;
                            }

                            let labelOrder = a.label < b.label ? -1 : (a.label > b.label ? 0 : 1);
                            return labelOrder;
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
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        var listeners = [];

        function start() {
            if (runtime.service('session').isLoggedIn()) {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }
            listeners.push(runtime.recv('session', 'loggedin', function () {
                runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }));
            runtime.send('ui', 'setTitle', 'Signed Out');
            render();
        }

        function stop() {
            listeners.forEach(function (listener) {
                runtime.drop(listener);
            });
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
            return factory(config);
        }
    };
});