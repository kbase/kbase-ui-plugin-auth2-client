/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent2',
    '../../utils'
], function (
    html,
    DomEvents,
    Utils
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        span = t('span'),
        button = t('button'),
        form = t('form'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        p = t('p'),
        iframe = t('iframe');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        var vm = Utils.ViewModel({
            model: {
                userInfo: {
                    id: html.genId(),
                    node: null,
                    value: null
                },
                tabs: {
                    id: html.genId(),
                    node: null,
                    value: null
                }
            }
        });
        function buildPresentableJson(data) {
            switch (typeof data) {
            case 'string':
                return data;
            case 'number':
                return String(data);
            case 'boolean':
                return String(data);
            case 'object':
                if (data === null) {
                    return 'NULL';
                }
                if (data instanceof Array) {
                    return table({ class: 'table table-striped' },
                        data.map(function (datum, index) {
                            return tr([
                                th(String(index)),
                                td(buildPresentableJson(datum))
                            ]);
                        }).join('\n')
                    );
                }
                return table({ class: 'table table-striped' },
                    Object.keys(data).map(function (key) {
                        return tr([th(key), td(buildPresentableJson(data[key]))]);
                    }).join('\n')
                );
            default:
                return 'Not representable: ' + (typeof data);
            }
        }
        function renderUser(users) {
            var events = DomEvents.make({
                node: container
            });

            var content = buildPresentableJson(vm.get('userInfo').value);

            vm.get('userInfo').node.innerHTML = content;
            events.attachEvents();
        }

        function renderLayout() {
            container.innerHTML = div({}, [
                div({
                    id: vm.get('userInfo').id
                })
            ]);
        }


        // LIFECYCLE

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return runtime.service('session').getClient().getAdminUser(params.username)
                .then(function (userInfo) {
                    vm.get('userInfo').value = userInfo;
                    renderLayout();
                    vm.bindAll();
                    renderUser();
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