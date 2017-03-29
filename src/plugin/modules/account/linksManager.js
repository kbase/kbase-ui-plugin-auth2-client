/* global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
], function (
    html,
    DomEvents,
    BS,
    Plugin
) {
    var // t = html.tagMaker(),
        t = html.tag,
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

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var vm = {
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

        function buildProviderLabel(provider) {
            return div({
                style: {
                    display: 'inline',
                    whiteSPace: 'nowrap',
                    height: '54px'
                }
            }, [
                div({
                        style: {
                            display: 'inline-block',
                            width: '54px',
                            height: '24px',
                            marginRight: '4px'
                        }
                    },
                    img({
                        src: Plugin.plugin.fullPath + '/providers/' + provider.id.toLowerCase() + '_logo.png',
                        style: {
                            height: '24px'
                        }
                    })),
                provider.label
            ]);
        }

        function setContent(parentNode, element, content) {
            var node = parentNode.querySelector('[data-element=["' + element + ']');
            if (!node) {
                return;
            }
            node.innerHTML = content;
        }

        function renderError() {
            if (vm.error.hidden) {
                vm.error.node.classList.add('hidden');
                return;
            }
            Object.keys(vm.error.value).forEach(function (name) {
                setContent(vm.error.node, name, vm.error.value[name]);
            });
        }

        function showError(errorInfo) {
            vm.error.value = errorInfo;
            vm.error.node.hidden = false;
            renderError();
        }

        function doLink() {
            var providerSelect = document.querySelector('[data-element="link-form"] [name="provider"]');
            var providerId = providerSelect.value;

            try {
                runtime.service('session').getClient().link({
                    provider: providerId,
                    node: container
                });
            } catch (ex) {
                showError({
                    name: 'LinkError',
                    message: 'Exception starting the link process',
                    detail: ex.message
                });
            }
        }

        function doUnlink(identityId) {
            runtime.service('session').getClient().removeLink({
                    identityId: identityId
                })
                .then(function (result) {
                    reload();
                    return null;
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function buildLinkForm(events) {
            var providers = runtime.service('session').getProviders();
            var providerControlId = html.genId();
            var providerMenuId = html.genId();
            var providerMenuLabelId = html.genId();
            var selectedProviderId = 'Globus';
            var selectedProvider = providers.filter(function (provider) {
                return (provider.id === selectedProviderId);
            })[0];
            return form({
                class: 'form-inline',
                dataElement: 'link-form',
            }, div({}, [
                div({}, [
                    button({
                        class: 'btn btn-primary',
                        type: 'button',
                        id: events.addEvent('click', doLink)
                    }, 'Link '),
                    ' a ',
                    div({
                        xclass: 'kb-dropdown',
                        style: {
                            position: 'relative',
                            display: 'inline-block'
                        }
                    }, [
                        input({
                            id: providerControlId,
                            name: 'provider',
                            type: 'hidden',
                            value: selectedProvider.id
                        }),
                        button({
                            class: 'btn btn-default dropdown-toggle',
                            type: 'button',
                            id: events.addEvent('click', function () {
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
                        }, [
                            span({
                                id: providerMenuLabelId
                            }, buildProviderLabel(selectedProvider)),
                            span({
                                class: 'caret',
                                style: {
                                    marginLeft: '10px'
                                }
                            })
                        ]),
                        ul({
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
                        }, providers.map(function (provider) {
                            return li({
                                class: 'login-provider',
                                style: {
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    margin: '8px 12px',
                                    display: 'block',
                                    whiteSpace: 'nowrap'
                                }
                            }, div({
                                id: events.addEvent('click', function () {
                                    // var controlNode = document.getElementById(providerControlId);
                                    var providerInput = document.querySelector('[data-element="link-form"] [name="provider"]')
                                    providerInput.value = provider.id;
                                    var menuLabelNode = document.getElementById(providerMenuLabelId);
                                    menuLabelNode.innerHTML = buildProviderLabel(provider);
                                    var n = document.getElementById(providerMenuId);
                                    n.style.display = 'none';
                                    runtime.service('session').getClient().setLastProvider(provider.id);
                                })
                            }, buildProviderLabel(provider)));
                        }))
                    ]),
                    span({
                        style: {
                            margin: '0 0.7em'
                        }
                    }, ' account to this KBase account'),
                ])
            ]));
        }

        function render() {
            var events = DomEvents.make({
                node: container
            });
            var canUnlink = (vm.identities.value.length > 1);

            container.innerHTML = div({
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12',
                        style: {
                            maxWidth: '60em'
                        }
                    }, (function () {
                        if (canUnlink) {
                            return [
                                p([
                                    'Listed below are all of the external accounts with which you may sign in to your KBase account.',
                                ]),
                                p([
                                    'You should be able to recognize the account from the "Provider" and "Username". The Provider is the ',
                                    'service with which you authenticate (e.g. username and password). '
                                ]),
                                p([
                                    'You may unlink any linked sign-in account from your KBase Account at any time. The unlinked account will ',
                                    'not be affected, but you will not be able to use it to access your KBase Account unless you re-link it.'
                                ]),
                                div({
                                    class: 'alert alert-warning'
                                }, [
                                    'Note: You may only link a sign-in account to one KBase account.'
                                ])
                            ];
                        }
                        return [
                            p([
                                'One authorization account is linked to your KBase account. ',
                                'Since you must always have at least one linked account in order to ',
                                'access your KBase account, you may not delete this linked account.'
                            ]),
                            p([
                                'If you wish to unlink this account, you must first link at least ',
                                'one additional authorization account.'
                            ])
                        ];
                    }())),
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-12'
                        }, [
                            BS.buildPanel({
                                title: 'Linked Accounts',
                                body: div({ class: 'col-md-12' }, [
                                    BS.buildPanel({
                                        name: 'linkForm',
                                        classes: ['kb-panel-light'],
                                        title: 'Currently Linked Accounts',
                                        body: table({
                                            class: 'table table-striped'
                                        }, [
                                            tr([
                                                th('Provider'),
                                                // th('Id'),
                                                th('Username'),
                                                th('Action')
                                            ])
                                        ].concat(
                                            vm.identities.value.map(function (identity) {
                                                return tr([
                                                    td(buildProviderLabel(runtime.service('session').getClient().getClient().getProvider(identity.provider))),
                                                    // td(identity.id),
                                                    td(identity.username),
                                                    td(button({
                                                        class: 'btn btn-danger',
                                                        type: 'button',
                                                        disabled: !canUnlink,
                                                        id: events.addEvent('click', function () {
                                                            doUnlink(identity.id);
                                                        })
                                                    }, 'Unlink'))
                                                ]);
                                            })))
                                    }),
                                    BS.buildPanel({
                                        name: 'linkForm',
                                        classes: ['kb-panel-light'],
                                        title: 'Link an additional authorization account to this KBase Account',
                                        body: buildLinkForm(events)
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
                                            })
                                        ])
                                    })

                                ])
                            })

                        ])
                    ])
                ])
            ]);
            events.attachEvents();
        }

        function reload() {
            return runtime.service('session').getClient().getMe()
                .then(function (account) {
                    vm.identities.value = account.idents;
                    render();
                    return null;
                });
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
                return reload();
            });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                    hostNode.innerHTML = '';
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