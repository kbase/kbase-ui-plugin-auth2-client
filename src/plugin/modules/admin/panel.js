/*global Promise*/
define([
    'jquery',
    'kb_common_ts/Html',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    './userManager',
    './configManager'
], function (
    $,
    M_Html,
    html,
    BS,
    UserManager,
    ConfigManager
) {
    // var html = new M_Html.Html();
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        span = t('span'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        button = t('button'),
        form = t('form'),
        input = t('input'),
        label = t('label'),
        p = t('p');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime;

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

        function buildTabs(arg) {
            var tabsId = arg.id,
                tabsAttribs = {},
                tabClasses = ['nav', 'nav-tabs'],
                tabStyle = {},
                activeIndex, tabTabs,
                tabs = arg.tabs.filter(function (tab) {
                    return (tab ? true : false);
                }),
                selectedTab = arg.initialTab,
                events = [],
                content,
                tabMap = {},
                panelClasses = ['tab-pane'];

            if (arg.fade) {
                panelClasses.push('fade');
            }

            if (tabsId) {
                tabsAttribs.id = tabsId;
            }

            tabs.forEach(function (tab, index) {
                tab.panelId = html.genId();
                tab.tabId = html.genId();
                if (tab.selected === true && selectedTab === undefined) {
                    selectedTab = index;
                }

                // panel widget definition
                if (tab.panel) {
                    events.push({
                        id: tab.tabId,
                        jquery: true,
                        type: 'show.bs.tab',
                        handler: function (e) {
                            // var panelId = e.target.getAttribute('data-target');
                            var panel = document.getElementById(tab.panelId);
                            // close any active panels.
                            Promise.all(arg.tabs.map(function (tab) {
                                    if (tab && tab.panel && tab.panel.instance) {
                                        return tab.panel.instance.stop()
                                            .then(function () {
                                                return tab.panel.instance.detach();
                                            })
                                            .then(function () {
                                                tab.panel.instance = null;
                                            });
                                    }
                                }))
                                .then(function () {
                                    tab.panel.instance = tab.panel.factory.make({
                                        runtime: runtime
                                    });
                                    return tab.panel.instance.attach(panel)
                                })
                                .then(function () {
                                    tab.panel.instance.start();
                                });
                        }
                    });
                }
            });
            if (arg.alignRight) {
                tabTabs = BS.reverse(tabs);
                tabStyle.float = 'right';
                if (selectedTab !== undefined) {
                    activeIndex = tabs.length - 1 - selectedTab;
                }
            } else {
                tabTabs = tabs;
                if (selectedTab !== undefined) {
                    activeIndex = selectedTab;
                }
            }
            content = div(tabsAttribs, [
                ul({ class: tabClasses.join(' '), role: 'tablist' },
                    tabTabs.map(function (tab, index) {
                        if (tab.name) {
                            tabMap[tab.name] = tab;
                        }
                        var tabAttribs = {
                                role: 'presentation'
                            },
                            linkAttribs = {
                                href: '#' + tab.panelId,
                                dataElement: 'tab',
                                ariaControls: tab.panelId,
                                dataTarget: tab.panelid,
                                role: 'tab',
                                id: tab.tabId,
                                dataPanelId: tab.panelId,
                                dataToggle: 'tab'
                            },
                            icon, label = span({ dataElement: 'label' }, tab.label);
                        if (tab.icon) {
                            icon = BS.buildIcon({ name: tab.icon });
                        } else {
                            icon = '';
                        }

                        if (tab.name) {
                            linkAttribs.dataName = tab.name;
                        }
                        if (index === activeIndex) {
                            tabAttribs.class = 'active';
                        }
                        tabAttribs.style = tabStyle;
                        return li(tabAttribs, a(linkAttribs, [icon, label].join(' ')));
                    })),
                div({ class: 'tab-content' },
                    tabs.map(function (tab, index) {
                        var attribs = {
                            role: 'tabpanel',
                            class: panelClasses.join(' '),
                            id: tab.panelId,
                            style: arg.style || {}
                        };
                        if (tab.name) {
                            attribs.dataName = tab.name;
                        }
                        if (index === 0) {
                            attribs.class += ' active';
                        }
                        return div(attribs, tab.content);
                    }))
            ]);

            function showTab(name) {
                if (!tabMap[name]) {
                    console.warn('Tab ' + name + ' not found');
                    return;
                }
                var tabId = tabMap[name].tabId;
                $(document.getElementById(tabId)).tab('show');

            }
            return {
                content: content,
                events: events,
                map: tabMap,
                showTab: showTab
            };
        }

        function renderLayout(node, params) {
            var tabDef = {
                tabs: [
                    {
                        name: 'userManager',
                        label: 'Users',
                        panel: {
                            factory: UserManager
                        }
                    },
                    {
                        name: 'configManager',
                        label: 'Configure Auth2',
                        panel: {
                            factory: ConfigManager
                        }
                    }
                ]
            };
            var tabs = buildTabs(tabDef);
            node.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [tabs.content])
                ])
            ]);
            tabs.events.forEach(function (event) {
                if (event.jquery) {
                    $(document.getElementById(event.id)).on(event.type, event.handler);
                } else {
                    document.getElementById(event.id).addEventListener(event.type, event.handler);
                }
            });
            var defaultTab = params.tab || 'userManager';
            tabs.showTab(defaultTab);
        }



        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
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
                    renderLayout(container, params);
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