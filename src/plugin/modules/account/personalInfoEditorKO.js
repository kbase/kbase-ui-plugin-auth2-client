/*global Promise*/
define([
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'knockout',
    './components/userInfoEditor'
], function(
    html,
    BS,
    ko
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        p = t('p');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var vm;


        function render(id, vmMap) {
            var tabs = BS.buildTabs({
                initialTab: 0,
                tabs: [{
                    label: 'Main',
                    name: 'main',
                    content: div({
                        style: {
                            marginTop: '10px'
                        },
                        dataBind: {
                            component: {
                                name: '"user-info-editor"',
                                params: (function() {
                                    var params = {};
                                    Object.keys(vm).forEach(function(k) {
                                        params[k] = k;
                                    });
                                    return params;
                                }())
                            }
                        }
                    })
                }, {
                    label: 'About',
                    name: 'about',
                    content: div({
                        style: {
                            marginTop: '10px'
                        }
                    }, [
                        p('You may view and edit edit your basic account information here.'),
                        p('Changes saved will be immediately available')
                    ])
                }]
            });
            return div({
                id: id,
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, tabs.content);
        }

        function attach(node) {
            return Promise.try(function() {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return runtime.service('session').getClient().getMe()
                .then(function(account) {
                    var id = html.genId();
                    vm = {
                        realname: account.display,
                        email: account.email,
                        created: account.created,
                        lastLogin: account.lastlogin,
                        username: account.user,
                        doSave: function(data) {
                            return runtime.service('session').getClient().putMe(data);
                        }
                    };
                    container.innerHTML = render(id);
                    ko.applyBindings(vm, document.getElementById(id));
                });
        }

        function stop() {
            return Promise.try(function() {});
        }

        function detach() {
            return Promise.try(function() {
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
        make: function(config) {
            return factory(config);
        }
    };
});