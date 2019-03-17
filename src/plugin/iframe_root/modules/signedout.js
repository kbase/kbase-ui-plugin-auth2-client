define(['kb_common/html', './lib/provider'], function (html, provider) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div'),
        ul = t('ul'),
        li = t('li'),
        a = t('a');

    class Signedout {
        constructor({ runtime }) {
            this.hostNode = null;
            this.container = null;
            this.runtime = runtime;
            this.listeners = [];

            this.providers = new provider.Providers({ runtime: runtime }).get();
        }

        render() {
            this.container.innerHTML = div(
                {
                    class: 'container-fluid'
                },
                div(
                    {
                        class: 'row'
                    },
                    [
                        div({
                            class: 'col-md-1'
                        }),
                        div(
                            {
                                class: 'col-md-10'
                            },
                            [
                                p(
                                    {
                                        style: {
                                            fontWeight: 'bold'
                                        }
                                    },
                                    'You are signed out of KBase.'
                                ),
                                p([
                                    'However, you may still be logged into a identity provider you have recently ',
                                    'used to sign in to KBase in this browser. ',
                                    'This would allow your KBase account to be accessed merely by ',
                                    'using the Sign In button and choosing the sign-in provider.'
                                ]),
                                p([
                                    'If you wish to ensure that your KBase account is inaccessible from this ',
                                    'browser, ',
                                    'you should sign out of any accounts you have used to access KBase as well.'
                                ]),
                                ul(
                                    this.providers
                                        .sort((a, b) => {
                                            const priorityOrder = a.priority - b.priority;
                                            if (priorityOrder !== 0) {
                                                return priorityOrder;
                                            }

                                            const labelOrder = a.label < b.label ? -1 : a.label > b.label ? 0 : 1;
                                            return labelOrder;
                                        })
                                        .map(function (provider) {
                                            return li(
                                                a(
                                                    {
                                                        href: provider.logoutUrl,
                                                        target: '_blank'
                                                    },
                                                    'Log out from ' + provider.label
                                                )
                                            );
                                        })
                                        .join('')
                                ),
                                p(['Additional security measures include:']),
                                ul([
                                    li('Remove all browser cookies'),
                                    li('Use your browser\'s private-browsing feature')
                                ])
                            ]
                        ),
                        div({
                            class: 'col-md-1'
                        })
                    ]
                )
            );
        }

        // API

        attach(node) {
            this.hostNode = node;
            this.container = this.hostNode.appendChild(document.createElement('div'));
        }

        start() {
            if (this.runtime.service('session').isLoggedIn()) {
                this.runtime.send('app', 'navigate', {
                    path: 'dashboard'
                });
            }
            this.listeners.push(
                this.runtime.recv('session', 'loggedin', () => {
                    this.runtime.send('app', 'navigate', {
                        path: 'dashboard'
                    });
                })
            );
            this.runtime.send('ui', 'setTitle', 'Signed Out');
            this.render();
        }

        stop() {
            this.listeners.forEach((listener) => {
                this.runtime.drop(listener);
            });
            return null;
        }

        detach() {
            if (this.hostNode && this.container) {
                this.hostNode.removeChild(this.container);
            }
        }
    }

    return Signedout;
});
