define([
    'bluebird',
    'kb_common/html',
    'kb_common/gravatar',
    'kb_common/domEvent2',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    Promise,
    html,
    Gravatar,
    DomEvents,
    Plugin
) {
    'use strict';

    function myWidget(config) {
        var runtime = config.runtime;
        if (!runtime) {
            throw {
                name: 'RuntimeMissing',
                message: 'The runtime argument is required but is missing',
                suggestion: 'This is an application error, and no fault of yours.'
            };
        }

        var t = html.tag,
            button = t('button'),
            div = t('div'),
            a = t('a'),
            span = t('span'),
            ul = t('ul'),
            li = t('li'),
            br = t('br', { close: false }),
            i = t('i'),
            img = t('img');

        function handleSignout(e) {
            e.preventDefault();

            runtime.service('session').logout()
                .then(function () {
                    runtime.send('app', 'navigate', {
                        path: 'auth2/signedout'
                    });
                })
                .catch(function (err) {
                    console.error('ERROR');
                    console.error(err);
                    alert('Error signing out (check console for details)');
                });
        }

        function buildAvatarUrl(profile) {
            switch (profile.profile.userdata.avatarOption || 'silhouette') {
            case 'gravatar':
                var gravatarDefault = profile.profile.userdata.gravatarDefault || 'identicon';
                var gravatarHash = profile.profile.synced.gravatarHash;
                if (gravatarHash) {
                    return 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=32&amp;r=pg&d=' + gravatarDefault;
                } else {
                    return Plugin.plugin.fullPath + '/images/nouserpic.png';
                }
            case 'silhouette':
            case 'mysteryman':
            default:
                return Plugin.plugin.fullPath + '/images/nouserpic.png';
            }
        }

        function buildAvatar(profile) {
            if (!profile || !profile.profile) {
                console.warn('no profile?', profile);
                return '';
            }
            var avatarUrl = buildAvatarUrl(profile);

            return img({
                src: avatarUrl,
                style: {
                    width: '40px;'
                },
                class: 'login-button-avatar',
                dataElement: 'avatar'
            });
        }

        function renderLogin(events) {
            return Promise.try(function () {
                if (runtime.service('session').isLoggedIn()) {
                    return runtime.service('userprofile').getProfile()
                        .then(function (profile) {
                            if (!profile) {
                                // Don't bother rendering yet if the profile is not ready 
                                // yet.
                                return;
                            }
                            var realname = profile.user.realname;
                            var username = profile.user.username;
                            return div({
                                class: 'dropdown',
                                style: 'display:inline-block'
                            }, [
                                button({
                                    type: 'button',
                                    class: 'btn btn-default dropdown-toggle',
                                    dataToggle: 'dropdown',
                                    ariaExpanded: 'false'
                                }, [
                                    buildAvatar(profile),
                                    span({ class: 'caret', style: 'margin-left: 5px;' })
                                ]),
                                ul({ class: 'dropdown-menu', role: 'menu' }, [
                                    li({}, [
                                        div({
                                            display: 'inline-block',
                                            dataElement: 'user-label',
                                            style: {
                                                textAlign: 'center'
                                            }
                                        }, [
                                            realname,
                                            br(),
                                            i({}, username)
                                        ])
                                    ]),
                                    li({ class: 'divider' }),
                                    li({}, [
                                        a({
                                            href: '#',
                                            'data-menu-item': 'logout',
                                            id: events.addEvent({
                                                type: 'click',
                                                handler: handleSignout
                                            })
                                        }, [
                                            div({
                                                style: {
                                                    display: 'inline-block',
                                                    width: '34px'
                                                }
                                            }, span({
                                                class: 'fa fa-sign-out',
                                                style: {
                                                    fontSize: '150%',
                                                    marginRight: '10px'
                                                }
                                            })),
                                            'Sign Out'
                                        ])
                                    ])
                                ])
                            ]);
                        });
                }
                return a({
                    class: 'btn btn-primary navbar-btn kb-nav-btn',
                    dataButton: 'signin',
                    href: '#login'
                }, [
                    div({
                        class: 'fa fa-sign-in  fa-inverse',
                        style: { marginRight: '5px' }
                    }),
                    div({ class: 'kb-nav-btn-txt' }, 'Sign In')
                ]);
            });
        }

        function render() {
            var events = DomEvents.make({
                node: container
            });
            return renderLogin(events)
                .then(function (loginContent) {
                    container.innerHTML = div({
                        dataWidget: 'auth2_signin',
                        class: 'widget-auth2_signin'
                    }, loginContent);
                    events.attachEvents();
                });
        }

        // LIFECYCLE API

        var hostNode, container;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                runtime.service('userprofile').onChange(function () {
                    render();
                }.bind(this));

                return render();
            });
        }

        function stop() {
            return Promise.try(function () {});
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
            return myWidget(config);
        }
    };
});