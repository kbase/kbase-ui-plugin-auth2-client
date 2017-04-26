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

        var button = html.tag('button'),
            div = html.tag('div'),
            a = html.tag('a'),
            span = html.tag('span'),
            ul = html.tag('ul'),
            li = html.tag('li'),
            br = html.tag('br', { close: false }),
            i = html.tag('i'),
            img = html.tag('img');

        function handleSignout(e) {
            e.preventDefault();

            runtime.service('session').logout()
                .then(function () {
                    // w.setState('updated', new Date());
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

        function buildAvatar(profile) {
            if (!profile || !profile.profile) {
                console.warn('no profile?', profile);
                return '';
            }
            var avatarUrl;
            switch (profile.profile.userdata.avatarOption || 'gravatar') {
            case 'gravatar':
                var gravatarDefault = profile.profile.userdata.gravatarDefault;
                var gravatarHash = profile.profile.userdata.gravatarHash;
                if (gravatarHash) {
                    avatarUrl = 'https://www.gravatar.com/avatar/' + gravatarHash + '?s=32&amp;r=pg&d=' + gravatarDefault;
                    break;
                }
            case 'mysteryman':
            default:
                avatarUrl = Plugin.plugin.fullPath + '/images/nouserpic.png';
            }

            return img({
                src: avatarUrl,
                style: {
                    width: '40px;'
                },
                class: 'login-button-avatar',
                dataElement: 'avatar'
            });
        }

        // function handleAccount() {
        //     runtime.send('ui', 'navigate', ['auth2', 'account']);
        // }

        // function hasRole(account, role) {
        //     for (var i = 0; i < account.roles.length; i += 1) {
        //         if (account.roles[i].id === role) {
        //             return true;
        //         }
        //     }
        //     return false;
        // }

        function renderLogin(events) {
            return Promise.try(function () {
                if (runtime.service('session').isLoggedIn()) {
                    /* TODO: fix dependencies like this -- realname is not available until, and unless, the                     
                    profile is loaded, which happens asynchronously.            
                    */
                    // var profile = widget.get('userProfile'),
                    //     realname;
                    return runtime.service('userprofile').getProfile()
                        .then(function (profile) {
                            if (!profile) {
                                // Don't bother rendering yet if the profile is not ready 
                                // yet.
                                return;
                            }
                            var realname = profile.user.realname;
                            var username = profile.user.username;
                            return div({ class: 'dropdown', style: 'display:inline-block' }, [
                                button({ type: 'button', class: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown', 'aria-expanded': 'false' }, [
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
                                    // li({}, [
                                    //     a({ href: '#people/' + username, 'data-menu-item': 'userlabel' }, [
                                    //         div({ style: 'display:inline-block; width: 34px; vertical-align: top;' }, [
                                    //             span({ class: 'fa fa-address-card-o', style: 'font-size: 150%; margin-right: 10px;' })
                                    //         ]),
                                    //         div({ style: 'display: inline-block', 'data-element': 'user-label' }, 'Profile')
                                    //     ])
                                    // ]),
                                    li({}, [
                                        a({
                                            href: '#auth2/account',
                                            'data-menu-item': 'account'
                                        }, [
                                            div({ style: 'display: inline-block; width: 34px;' }, [
                                                span({ class: 'fa fa-user', style: 'font-size: 150%; margin-right: 10px;' })
                                            ]),
                                            'Account'
                                        ])
                                    ]),
                                    // DISABLE ADMIN
                                    // For now. There is in actuality no back-end admin support yet other than for
                                    // the auth2 built-in ui.
                                    // (function() {
                                    //     if (!hasRole(account, 'Admin')) {
                                    //         return;
                                    //     }
                                    //     return li({}, [
                                    //         a({
                                    //             href: '#auth2/admin',
                                    //             'data-menu-item': 'account'
                                    //         }, [
                                    //             div({ style: 'display: inline-block; width: 34px;' }, [
                                    //                 span({ class: 'fa fa-unlock', style: 'font-size: 150%; margin-right: 10px;' })
                                    //             ]),
                                    //             'Admin'
                                    //         ])
                                    //     ]);
                                    // }()),
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
                                            div({ style: 'display: inline-block; width: 34px;' }, [
                                                span({ class: 'fa fa-sign-out', style: 'font-size: 150%; margin-right: 10px;' })
                                            ]),
                                            'Sign Out'
                                        ])
                                    ])
                                ])
                            ]);
                        });
                }
                return a({ class: 'btn btn-primary navbar-btn kb-nav-btn', 'data-button': 'signin', href: '#login' }, [
                    div({ class: 'fa fa-sign-in  fa-inverse', style: 'margin-right: 5px;' }),
                    div({ class: 'kb-nav-btn-txt' }, ['Sign In'])
                ]);
            });
        }

        // API

        var hostNode, container;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function render() {
            var events = DomEvents.make({
                node: container
            });
            return renderLogin(events)
                .then(function (loginContent) {
                    container.innerHTML = loginContent;
                    events.attachEvents();
                });
        }

        function start(params) {
            return Promise.try(function () {
                // this.set('loggedin', runtime.service('session').isLoggedIn());
                runtime.service('userprofile').onChange(function (data) {
                    // this.set('userProfile', data);
                    render();
                }.bind(this));

                // runtime.service('session').onChange(function () {
                //     // hmm, also take it upon ourselves to visit the logged out page if we are indeed logged out.
                //     render();
                // });
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