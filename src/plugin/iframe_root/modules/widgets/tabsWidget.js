define(['bluebird', 'kb_lib/html'], function (Promise, html) {
    'use strict';

    const t = html.tag,
        div = t('div');

    function make(config) {
        let hostNode;
        const runtime = config.runtime;

        let tabSet;
        let currentTab;

        const tabsId = html.genId();
        const tabsMap = config.tabs.reduce(function (accum, tab) {
            if (tab) {
                accum[tab.name] = tab;
            }
            return accum;
        }, {});

        function render() {
            const style = config.style ? config.style : {};

            hostNode.innerHTML = div(
                {
                    class: 'flex-tabs',
                    id: tabsId,
                    style: style
                },
                [
                    div(
                        {
                            class: '-tabs'
                        },
                        config.tabs.map(function (tab) {
                            return div(
                                {
                                    class: '-tab',
                                    dataTab: tab.name
                                },
                                div(
                                    {
                                        class: '-label'
                                    },
                                    tab.label
                                )
                            );
                        }).concat([div(
                            {
                                class: '-tab-rest'
                            }
                        )])
                    ),
                    div(
                        {
                            class: '-panels'
                        },
                        config.tabs.map(function (tab) {
                            return div({
                                class: '-panel',
                                dataTabPanel: tab.name
                            });
                        })
                    )
                ]
            );
            tabSet = hostNode.querySelector('.-tabs');
        }

        function deactivateCurrentTab() {
            if (!currentTab) {
                return;
            }
            const tab = hostNode.querySelector('[data-tab="' + currentTab + '"]');
            const panel = hostNode.querySelector('[data-tab-panel="' + currentTab + '"]');
            tab.classList.add('-inactive');
            panel.classList.add('-inactive');
            tab.classList.remove('-active');
            panel.classList.remove('-active');
        }

        let currentTabWidget;

        function unloadCurrentTab() {
            return Promise.try(function () {
                if (!currentTabWidget) {
                    return null;
                }
                return currentTabWidget.stop().then(function () {
                    return currentTabWidget.detach();
                });
            });
        }

        function loadTab(tabName) {
            const panel = tabsMap[tabName].panel;
            if (panel.factory) {
                currentTabWidget = panel.factory.make({
                    runtime
                });
            } else if (panel.class) {
                currentTabWidget = new panel.class({
                    runtime
                });
            } else {
                throw new Error('No panel factory or class');
            }

            const tabNode = hostNode.querySelector(`[data-tab-panel="${tabName}"]`);
            return currentTabWidget.attach(tabNode).then(function () {
                return currentTabWidget.start();
            });
        }

        function activateTab(tabName) {
            currentTab = tabName;
            const tab = hostNode.querySelector(`[data-tab="${currentTab}"]`);
            const panel = hostNode.querySelector(`[data-tab-panel="${currentTab}"]`);
            return unloadCurrentTab()
                .then(function () {
                    tab.classList.remove('-inactive');
                    panel.classList.remove('-inactive');
                    return loadTab(tabName);
                })
                .then(function () {
                    tab.classList.add('-active');
                    panel.classList.add('-active');
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        // Service API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                render();
            });
        }

        function start() {
            return Promise.try(function () {
                const tabs = Array.prototype.slice.call(tabSet.querySelectorAll('[data-tab]'));
                tabs.forEach((tab) => {
                    const tabName = tab.getAttribute('data-tab');
                    const tabPanel = hostNode.querySelector(`[data-tab-panel="${tabName}"]`);
                    tab.classList.add(tabName === currentTab ? '-active' : '-inactive');
                    tabPanel.classList.add(tabName === currentTab ? '-active' : '-inactive');
                    tab.addEventListener('click', function () {
                        deactivateCurrentTab();
                        activateTab(tabName);
                    });
                });
                if (config.initialTab) {
                    return activateTab(config.initialTab);
                }
            });
        }

        function run({ tab }) {
            deactivateCurrentTab();
            return activateTab(tab);
        }

        function stop() {
            return Promise.try(function () {
                if (!currentTabWidget) {
                    return null;
                }
                return currentTabWidget.stop();
            });
        }

        function detach() {
            return Promise.try(function () {
                if (!currentTabWidget) {
                    return null;
                }
                return currentTabWidget.detach();
            }).then(() => {
                if (hostNode) {
                    hostNode.innerHTML = '';
                }
                return null;
            });
        }

        return {
            attach,
            start,
            run,
            stop,
            detach
        };
    }

    return {
        make
    };
});
