define([
    'bluebird',
    'kb_lib/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2',
    '../lib/provider'
], (Promise, html, DomEvents, BS, auth2, provider) => {
    'use strict';
    const t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        img = t('img'),
        ul = t('ul'),
        li = t('li'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        form = t('form'),
        input = t('input');

    class LinksManager {
        constructor({ runtime }) {
            this.runtime = runtime;

            this.providers = new provider.Providers({ runtime: runtime }).get();

            this.providersMap = this.providers.reduce((providersMap, provider) => {
                providersMap[provider.id] = provider;
                return providersMap;
            }, {});

            this.hostNode = null;
            this.container = null;
            this.vm = {
                identities: {
                    label: 'Identities',
                    value: null
                },
                error: {
                    node: null,
                    value: {
                        name: null,
                        title: null,
                        message: null,
                        detail: null
                    }
                }
            };
            this.auth2 = new auth2.Auth2({
                baseUrl: this.runtime.config('services.auth.url')
            });
            this.currentUserToken = this.runtime.service('session').getAuthToken();
        }

        buildProviderLabel(provider) {
            return div(
                {
                    style: {
                        display: 'inline',
                        whiteSPace: 'nowrap',
                        height: '54px'
                    }
                },
                [
                    div(
                        {
                            style: {
                                display: 'inline-block',
                                width: '54px',
                                height: '24px',
                                marginRight: '4px'
                            }
                        },
                        img({
                            src:
                                this.runtime.pluginResourcePath +
                                '/providers/' +
                                provider.id.toLowerCase() +
                                '/logo.png',
                            style: {
                                height: '24px'
                            }
                        })
                    ),
                    provider.label
                ]
            );
        }

        setContent(parentNode, element, content) {
            var node = parentNode.querySelector('[data-element="' + element + '"');
            if (!node) {
                return;
            }
            node.innerHTML = content;
        }

        renderError() {
            if (this.vm.error.hidden) {
                this.vm.error.node.classList.add('hidden');
                return;
            }
            Object.keys(this.vm.error.value).forEach((name) => {
                this.setContent(this.vm.error.node, name, this.vm.error.value[name]);
            });
        }

        showError(errorInfo) {
            this.vm.error.value = errorInfo;
            this.vm.error.node.classList.remove('hidden');
            this.renderError();
        }

        doLink() {
            var providerSelect = document.querySelector('[data-element="link-form"] [name="provider"]');
            var providerId = providerSelect.value;

            try {
                // TODO: routing back into here.
                const params = {
                    provider: providerId,
                    token: this.currentUserToken
                };
                const action = this.runtime.config('services.auth.url') + '/link/start';

                this.runtime.send('app', 'post-form', {
                    action: action,
                    params: params
                });

                // this.auth2.linkStart(this.currentUserToken, {
                //     provider: providerId,
                //     node: this.container
                // });
            } catch (ex) {
                this.showError({
                    name: 'LinkError',
                    message: 'Exception starting the link process',
                    detail: ex.message
                });
            }
        }

        doUnlink(identityId) {
            this.auth2
                .removeLink(this.currentUserToken, {
                    identityId: identityId
                })
                .then(() => {
                    this.reload();
                    return null;
                })
                .catch((err) => {
                    this.showError({
                        name: 'UnLinkError',
                        message: 'Error with the unlink process',
                        detail: err.message
                    });
                });
        }

        buildLinkForm(events) {
            var providerControlId = html.genId();
            var providerMenuId = html.genId();
            var providerMenuLabelId = html.genId();
            var selectedProviderId = 'Globus';
            var selectedProvider = this.providers.filter((provider) => {
                return provider.id === selectedProviderId;
            })[0];
            return form(
                {
                    class: 'form-inline',
                    dataElement: 'link-form'
                },
                div({}, [
                    div({}, [
                        button(
                            {
                                class: 'btn btn-primary',
                                type: 'button',
                                id: events.addEvent('click', () => {
                                    this.doLink();
                                })
                            },
                            'Link '
                        ),
                        ' a ',
                        div(
                            {
                                xclass: 'kb-dropdown',
                                style: {
                                    position: 'relative',
                                    display: 'inline-block'
                                }
                            },
                            [
                                input({
                                    id: providerControlId,
                                    name: 'provider',
                                    type: 'hidden',
                                    value: selectedProvider.id
                                }),
                                button(
                                    {
                                        class: 'btn btn-default dropdown-toggle',
                                        type: 'button',
                                        id: events.addEvent('click', () => {
                                            var n = document.getElementById(providerMenuId);
                                            if (n.style.display === 'none') {
                                                n.style.display = 'block';
                                            } else {
                                                n.style.display = 'none';
                                            }
                                        }),
                                        xid: providerMenuId,
                                        ariaHaspopup: 'true',
                                        ariaExpanded: 'true'
                                    },
                                    [
                                        span(
                                            {
                                                id: providerMenuLabelId
                                            },
                                            this.buildProviderLabel(selectedProvider)
                                        ),
                                        span({
                                            class: 'caret',
                                            style: {
                                                marginLeft: '10px'
                                            }
                                        })
                                    ]
                                ),
                                ul(
                                    {
                                        style: {
                                            position: 'absolute',
                                            top: '100%',
                                            left: '0',
                                            float: 'left',
                                            listStyle: 'none',
                                            display: 'none',
                                            border: '1px silver solid',
                                            padding: '0',
                                            backgroundColor: 'white'
                                        },
                                        id: providerMenuId,
                                        xariaLabelledby: providerMenuId
                                    },
                                    this.providers.map((provider) => {
                                        return li(
                                            {
                                                class: 'login-provider',
                                                style: {
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    margin: '8px 12px',
                                                    display: 'block',
                                                    whiteSpace: 'nowrap'
                                                }
                                            },
                                            div(
                                                {
                                                    id: events.addEvent('click', () => {
                                                        // var controlNode = document.getElementById(providerControlId);
                                                        var providerInput = document.querySelector(
                                                            '[data-element="link-form"] [name="provider"]'
                                                        );
                                                        providerInput.value = provider.id;
                                                        var menuLabelNode = document.getElementById(
                                                            providerMenuLabelId
                                                        );
                                                        menuLabelNode.innerHTML = this.buildProviderLabel(provider);
                                                        var n = document.getElementById(providerMenuId);
                                                        n.style.display = 'none';
                                                    })
                                                },
                                                this.buildProviderLabel(provider)
                                            )
                                        );
                                    })
                                )
                            ]
                        ),
                        span(
                            {
                                style: {
                                    margin: '0 0.7em'
                                }
                            },
                            ' account to this KBase account'
                        )
                    ])
                ])
            );
        }

        renderInfo() {
            var canUnlink = this.vm.identities.value.length > 1;
            var content = [
                p([
                    'This tab provides access to all of the the external accounts which you have set up sign in to your KBase account.'
                ]),
                p(['You should be able to recognize the account from the "Provider" and "Username" columns.. ']),
                div(
                    {
                        class: 'alert alert-warning'
                    },
                    [
                        'Note: You may only link an external sign-in account to a single KBase account.',
                        'If you attempt to link an external sign-in account which is already linked to another ',
                        'KBase account you will receive an error message'
                    ]
                )
            ];
            if (canUnlink) {
                content = content.concat([
                    p(['You may unlink any linked sign-in account from your KBase Account at any time.'])
                ]);
            } else {
                content = content.concat([
                    p(['You may unlink any linked sign-in account from your KBase Account at any time.']),
                    p([
                        'However, since you ',
                        'at present have just a single linked account, you will not be able to unlink it. A KBase account ',
                        'must always have at least one linked identity to ensure that it is accessible.'
                    ]),
                    p([
                        'If you wish to unlink this account, you must first link at least ',
                        'one additional sign-in account.'
                    ])
                ]);
            }
            return content;
        }

        render() {
            var events = DomEvents.make({
                node: this.container
            });
            var canUnlink = this.vm.identities.value.length > 1;

            var tabs = BS.buildTabs({
                initialTab: 0,
                tabs: [
                    {
                        name: 'main',
                        label: 'Manage Your Linked Sign-in Accounts',
                        content: div([
                            BS.buildPanel({
                                name: 'linkForm',
                                classes: ['kb-panel-light'],
                                title: 'Currently Linked Accounts',
                                body: table(
                                    {
                                        class: 'table table-striped'
                                    },
                                    [tr([th('Provider'), th('Username'), th('Action')])].concat(
                                        this.vm.identities.value.map((identity) => {
                                            var tooltip;
                                            if (canUnlink) {
                                                tooltip =
                                                    'Unlink this  ' +
                                                    identity.provider +
                                                    ' account from your KBase account';
                                            } else {
                                                tooltip =
                                                    'Since this is the only external sign-in account linked to your KBase account, you cannot unlink it';
                                            }
                                            return tr([
                                                td(this.buildProviderLabel(this.providersMap[identity.provider])),
                                                td(identity.provusername),
                                                td(
                                                    button(
                                                        {
                                                            class: 'btn btn-danger',
                                                            type: 'button',
                                                            disabled: !canUnlink,
                                                            dataToggle: 'tooltip',
                                                            dataPlacement: 'top',
                                                            title: tooltip,
                                                            id: events.addEvent('click', () => {
                                                                this.doUnlink(identity.id);
                                                            })
                                                        },
                                                        'Unlink'
                                                    )
                                                )
                                            ]);
                                        })
                                    )
                                )
                            }),
                            BS.buildPanel({
                                name: 'linkForm',
                                classes: ['kb-panel-light'],
                                title: 'Link an additional sign-in account to this KBase Account',
                                body: this.buildLinkForm(events)
                            }),
                            BS.buildPanel({
                                name: 'error',
                                type: 'danger',
                                title: 'Error',
                                hidden: true,
                                body: div({}, [
                                    div({
                                        dataElement: 'name'
                                    }),
                                    div({
                                        dataElement: 'title'
                                    }),
                                    div({
                                        dataElement: 'message'
                                    }),
                                    div({
                                        dataElement: 'detail'
                                    }),
                                    div(
                                        {
                                            textAlign: 'center'
                                        },
                                        [
                                            button(
                                                {
                                                    class: 'btn btn-primary',
                                                    type: 'button',
                                                    id: events.addEvent('click', () => {
                                                        this.vm.error.node.classList.add('hidden');
                                                    })
                                                },
                                                'Close'
                                            )
                                        ]
                                    )
                                ])
                            })
                        ])
                    },
                    {
                        name: 'about',
                        icon: 'info-circle',
                        content: div(
                            {
                                style: {
                                    maxWidth: '60em',
                                    margin: '10px auto 0 auto'
                                }
                            },
                            this.renderInfo()
                        )
                    }
                ]
            });

            this.container.innerHTML = div(
                {
                    style: {
                        marginTop: '10px'
                    }
                },
                tabs.content
            );
            this.vm.error.node = this.container.querySelector('[data-element="error"]');
            events.attachEvents();
        }

        reload() {
            this.auth2.getMe(this.currentUserToken).then((account) => {
                this.vm.identities.value = account.idents;
                this.render();
                return null;
            });
        }

        // API

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
                this.container = this.hostNode.appendChild(document.createElement('div'));
            });
        }

        start() {
            return Promise.try(() => {
                return this.reload();
            }).then(() => {
                BS.activateTooltips(this.container);
                return null;
            });
        }

        stop() {
            return Promise.resolve();
        }

        detach() {
            return Promise.try(() => {
                if (this.hostNode && this.container) {
                    this.hostNode.removeChild(this.container);
                    this.hostNode.innerHTML = '';
                }
            });
        }
    }
    return LinksManager;
});
