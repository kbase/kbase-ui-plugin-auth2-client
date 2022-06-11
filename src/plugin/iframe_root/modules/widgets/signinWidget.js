define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'lib/domUtils',
    'bootstrap'
], (Promise, html, DomEvents, {setInnerHTML}) => {
    function myWidget(config) {
        const runtime = config.runtime;
        if (!runtime) {
            throw {
                name: 'RuntimeMissing',
                message: 'The runtime argument is required but is missing',
                suggestion: 'This is an application error, and no fault of yours.'
            };
        }

        const t = html.tag,
            button = t('button'),
            div = t('div'),
            a = t('a'),
            span = t('span'),
            ul = t('ul'),
            li = t('li'),
            img = t('img');

        function handleSignout(e) {
            e.preventDefault();

            runtime
                .service('session')
                .logout()
                .then(() => {
                    runtime.send('app', 'auth-navigate', {
                        path: 'auth2/signedout'
                    });
                })
                .catch((err) => {
                    console.error('ERROR');
                    console.error(err);
                    alert('Error signing out (check console for details)');
                });
        }

        function buildAvatarUrl(profile) {
            switch (profile.profile.userdata.avatarOption || 'gravatar') {
            case 'gravatar':
                var gravatarDefault = profile.profile.userdata.gravatarDefault || 'identicon';
                var gravatarHash = profile.profile.synced.gravatarHash;
                if (gravatarHash) {
                    return (
                        `https://www.gravatar.com/avatar/${  gravatarHash  }?s=32&amp;r=pg&d=${  gravatarDefault}`
                    );
                }
                return `${runtime.pluginResourcePath  }/images/nouserpic.png`;

            case 'silhouette':
            case 'mysteryman':
            default:
                return `${runtime.pluginResourcePath  }/images/nouserpic.png`;
            }
        }

        function buildAvatar(profile) {
            if (!profile || !profile.profile) {
                console.warn('no profile?', profile);
                return '';
            }
            const avatarUrl = buildAvatarUrl(profile);

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
            return Promise.try(() => {
                if (runtime.service('session').isLoggedIn()) {
                    return runtime
                        .service('userprofile')
                        .getProfile()
                        .then((profile) => {
                            if (!profile) {
                                // Don't bother rendering yet if the profile is not ready
                                // yet.
                                return;
                            }
                            const realname = profile.user.realname;
                            const username = profile.user.username;
                            return div(
                                {
                                    class: 'navbar container-fluid'
                                },
                                div(
                                    {
                                        class: 'navbar-right'
                                    },
                                    div(
                                        {
                                            class: 'dropdown',
                                            style: 'display:inline-block',
                                            dataKBTesthookMenu: 'signed-in'
                                        },
                                        [
                                            button(
                                                {
                                                    type: 'button',
                                                    class: 'btn btn-default dropdown-toggle',
                                                    dataToggle: 'dropdown',
                                                    ariaExpanded: 'false',
                                                    dataKBTesthookButton: 'avatar'
                                                },
                                                [
                                                    buildAvatar(profile),
                                                    span({class: 'caret', style: 'margin-left: 5px;'})
                                                ]
                                            ),
                                            ul({class: 'dropdown-menu', role: 'menu'}, [
                                                li({}, [
                                                    div(
                                                        {
                                                            display: 'inline-block',
                                                            dataElement: 'user-label',
                                                            style: {
                                                                textAlign: 'center'
                                                            }
                                                        },
                                                        [
                                                            div(
                                                                {
                                                                    dataKBTesthookLabel: 'realname'
                                                                },
                                                                realname
                                                            ),
                                                            div(
                                                                {
                                                                    style: {
                                                                        fontStyle: 'italic'
                                                                    },
                                                                    dataKBTesthookLabel: 'username'
                                                                },
                                                                username
                                                            )
                                                        ]
                                                    )
                                                ]),
                                                li({class: 'divider'}),
                                                li({}, [
                                                    a(
                                                        {
                                                            href: '#',
                                                            dataMenuItem: 'logout',
                                                            dataKBTesthookButton: 'logout',
                                                            id: events.addEvent({
                                                                type: 'click',
                                                                handler: handleSignout
                                                            })
                                                        },
                                                        [
                                                            div(
                                                                {
                                                                    style: {
                                                                        display: 'inline-block',
                                                                        width: '34px'
                                                                    }
                                                                },
                                                                span({
                                                                    class: 'fa fa-sign-out',
                                                                    style: {
                                                                        fontSize: '150%',
                                                                        marginRight: '10px'
                                                                    }
                                                                })
                                                            ),
                                                            'Sign Out'
                                                        ]
                                                    )
                                                ])
                                            ])
                                        ]
                                    )
                                )
                            );
                        });
                }
                return a(
                    {
                        class: 'btn btn-primary navbar-btn kb-nav-btn',
                        dataButton: 'signin',
                        dataKBTesthookButton: 'signin',
                        href: '/#login'
                    },
                    [
                        div({
                            class: 'fa fa-sign-in  fa-inverse',
                            style: {marginRight: '5px'}
                        }),
                        div({class: 'kb-nav-btn-txt'}, 'Sign In')
                    ]
                );
            });
        }

        function render() {
            const events = DomEvents.make({
                node: container
            });
            return renderLogin(events).then((loginContent) => {
                setInnerHTML(container, loginContent);
                events.attachEvents();
            });
        }

        // LIFECYCLE API

        let hostNode, container;

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
            container.classList.add('widget-auth2_signin');
            container.setAttribute('data-k-b-testhook-widget', 'auth2_signin');
        }

        function start() {
            runtime.service('userprofile').onChange(
                () => {
                    render();
                }
            );

            return render();
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        function stop() {
            return null;
        }

        return {
            attach,
            start,
            stop,
            detach
        };
    }

    return {
        make(config) {
            return myWidget(config);
        }
    };
});
