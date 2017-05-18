/*global Promise*/
define([
    'jquery',
    'kb_common_ts/Html',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    './personalInfoEditorKO',
    './linksManager',
    './developerTokenManager',
    './serviceTokenManager',
    './agreementsManager',
    './signinManager',
    './profileManager',
    '../widgets/tabsWidget'
], function (
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
    // var html = new Html.Html();
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        ul = t('ul'),
        li = t('li'),
        p = t('p');

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

        function buildError(err) {
            return div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div({
                            class: 'alert alert-danger'
                        }, err.message || (err.error && err.error.message))
                    ])
                ])
            ]);
        }

        function buildMessage(message) {
            return div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div({
                            class: 'alert alert-warning'
                        }, message)
                    ])
                ])
            ]);
        }

        function buildAbout() {
            return buildMessage(div([
                p('This is the account manager'),
                p('It is designed to allow a user to manage all apsects of their account.'),
                p('What can they do here?'),
                ul([
                    li('Edit their real name or email address'),
                    li('View their account creation date'),
                    li('View their last login time'),
                    li('Manage their linked accounts'),
                    li('Manage their developer tokens')
                ])
            ]));
        }

        function renderLayout(node, params) {
            var tabDef = {
                runtime: runtime,
                style: {
                    padding: '0 10px'
                },
                initialTab: 'profile',
                tabs: [{
                        name: 'profile',
                        label: 'Your Profile',
                        panel: {
                            factory: ProfileManager
                        }
                    },
                    {
                        name: 'account',
                        label: 'Account',
                        panel: {
                            factory: PersonalInfoEditor
                        }
                    },
                    {
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
                    // {
                    //     name: 'about',
                    //     label: 'About',
                    //     content: buildAbout()
                    // }
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
                //hostNode.appendChild(document.createElement('div'));
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
                // if (hostNode && container) {
                //     hostNode.removeChild(container);
                // }

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
    }
});