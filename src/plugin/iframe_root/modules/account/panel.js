define([
    'bluebird',
    'kb_common_ts/Auth2',
    './personalInfoEditor',
    './linksManager',
    './developerTokenManager',
    './serviceTokenManager',
    './agreementsManager',
    './signinManager',
    'lib/domUtils',
    '../widgets/tabsWidget'
], (
    Promise,
    auth2,
    PersonalInfoEditor,
    LinksManager,
    DeveloperTokenManager,
    ServiceTokenManager,
    AgreementsManager,
    SigninManager,
    {clearInnerHTML},
    TabsWidget
) => {
    class AccountPanel {
        constructor({runtime}) {
            this.runtime = runtime;
            this.hostNode = null;
            this.tabs = null;

            this.vm = {
                developerTokens: {
                    enabled: null,
                    value: null
                },
                serviceTokens: {
                    enabled: null,
                    value: null
                }
            };

            this.auth2 = new auth2.Auth2({
                baseUrl: this.runtime.config('services.auth.url')
            });
        }

        // RENDERING

        renderLayout(node, params) {
            const tabDef = {
                runtime: this.runtime,
                style: {
                    padding: '0 10px'
                },
                initialTab: params.tab || 'account',
                tabs: [

                    {
                        name: 'account',
                        label: 'Account',
                        panel: {
                            class: PersonalInfoEditor
                        }
                    },
                    {
                        name: 'links',
                        label: 'Linked Sign-In Accounts',
                        panel: {
                            class: LinksManager
                        }
                    },
                    (() => {
                        if (this.vm.developerTokens.enabled) {
                            return {
                                name: 'developer-tokens',
                                label: 'Developer Tokens',
                                panel: {
                                    class: DeveloperTokenManager
                                }
                            };
                        }
                    })(),
                    (() => {
                        if (this.vm.serviceTokens.enabled) {
                            return {
                                name: 'service-tokens',
                                label: 'Service Tokens',
                                panel: {
                                    class: ServiceTokenManager
                                }
                            };
                        }
                    })(),
                    {
                        name: 'signins',
                        label: 'Sign-Ins',
                        panel: {
                            class: SigninManager
                        }
                    },
                    {
                        name: 'agreements',
                        label: 'Use Agreements',
                        panel: {
                            class: AgreementsManager
                        }
                    }
                ].filter((tab) => {
                    return !!tab;
                })
            };

            this.tabs = TabsWidget.make(tabDef);
            return this.tabs.attach(node).then(() => {
                return this.tabs.start();
            });
        }

        // API

        attach(node) {
            return Promise.try(() => {
                this.hostNode = node;
            });
        }

        start(params) {
            return this.auth2.getMe(this.runtime.service('session').getAuthToken()).then((account) => {
                // vm.roles.value = account.roles;
                account.roles.forEach((role) => {
                    switch (role.id) {
                    case 'ServToken':
                        this.vm.serviceTokens.enabled = true;
                        break;
                    case 'DevToken':
                        this.vm.developerTokens.enabled = true;
                        break;
                    }
                });

                this.runtime.send('ui', 'setTitle', 'Account Manager');
                return this.renderLayout(this.hostNode, params || {});
            });
        }

        run(params) {
            let tab;
            if (params) {
                tab = params.tab || 'profile';
            } else {
                tab = 'profile';
            }
            this.tabs.run({tab});
            // this.tabs.activeTab(para)
        }

        stop() {
            return Promise.try(() => {
                if (!this.tabs) {
                    return null;
                }
                return this.tabs.stop();
            });
        }

        detach() {
            return Promise.try(() => {
                if (!this.tabs) {
                    return null;
                }
                return this.tabs.detach().then(() => { });
            }).finally(() => {
                if (this.hostNode) {
                    clearInnerHTML(this.hostNode);
                }
            });
        }
    }

    return AccountPanel;
});
