define([
    'bluebird',
    'jquery',
    'kb_common_ts/Html',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    './personalInfoEditor',
    './linksManager',
    './developerTokenManager',
    './serviceTokenManager',
    './agreementsManager',
    './signinManager',
    './profileManager',
    '../widgets/tabsWidget'
], function (
    Promise,
    $,
    Html,
    html,
    BS,
    PersonalInfoEditor,
    LinksManager,
    DeveloperTokenManager,
    ServiceTokenManager,
    AgreementsManager,
    SigninManager,
    ProfileManager,
    TabsWidget
) {
    'use strict';
    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            tabs;

        var vm = {
            developerTokens: {
                enabled: null,
                value: null
            },
            serviceTokens: {
                enabled: null,
                value: null
            }
        };

        // RENDERING

        function renderLayout(node, params) {
            var tabDef = {
                runtime: runtime,
                style: {
                    padding: '0 10px'
                },
                initialTab: params.tab || 'profile',
                tabs: [{
                    name: 'profile',
                    label: 'Your Profile',
                    panel: {
                        factory: ProfileManager
                    }
                }, {
                    name: 'account',
                    label: 'Account',
                    panel: {
                        factory: PersonalInfoEditor
                    }
                }, {
                    name: 'links',
                    label: 'Linked Sign-In Accounts',
                    panel: {
                        factory: LinksManager
                    }
                }, (function () {
                        if (vm.developerTokens.enabled) {
                            return {
                                name: 'developer-tokens',
                                label: 'Developer Tokens',
                                panel: {
                                    factory: DeveloperTokenManager
                                }
                            };
                        }
                    }()), (function () {
                        if (vm.serviceTokens.enabled) {
                            return {
                                name: 'service-tokens',
                                label: 'Service Tokens',
                                panel: {
                                    factory: ServiceTokenManager
                                }
                            };
                        }
                    }()), {
                        name: 'signins',
                        label: 'Sign-Ins',
                        panel: {
                            factory: SigninManager
                        }
                    }, {
                        name: 'agreements',
                        label: 'Usage Agreements',
                        panel: {
                            factory: AgreementsManager
                        }
                    }                    
                ].filter(function (tab) {
                    return tab ? true : false;
                })
            };

            tabs = TabsWidget.make(tabDef);
            return tabs.attach(node)
                .then(function () {
                    return tabs.start();
                });
        }

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode;
            });
        }

        function start(params) {
            return runtime.service('session').getClient().getMe()
                .then(function (account) {
                    // vm.roles.value = account.roles;
                    account.roles.forEach(function (role) {
                        switch (role.id) {
                        case 'ServToken':
                            vm.serviceTokens.enabled = true;
                            break;
                        case 'DevToken':
                            vm.developerTokens.enabled = true;
                            break;
                        }
                    });

                    runtime.send('ui', 'setTitle', 'Account Manager');
                    try {
                        return renderLayout(container, params);
                    } catch (ex) {
                        console.error('ERROR', ex);
                        // renderError(ex);
                        throw (ex);
                    }
                });
        }

        function stop() {
            return Promise.try(function () {
                return tabs.stop();
            });
        }

        function detach() {
            return Promise.try(function () {
                return tabs.detach()
                    .then(function () {
                        if (hostNode) {
                            hostNode.innerHTML = '';
                        }
                    });
            });
        }

        return Object.freeze({
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});