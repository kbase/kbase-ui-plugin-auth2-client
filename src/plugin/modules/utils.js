define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Plugin
) {
    var t = html.tag,
        div = t('div'),
        img = t('img'),
        button = t('button');

    function factory(config) {
        var runtime = config.runtime;

        function doLogin(providerId, state) {

            runtime.service('session').loginStart({
                // TODO: this should be either the redirect url passed in 
                // or the dashboard.
                // We just let the login page do this. When the login page is 
                // entered with a valid token, redirect to the nextrequest,
                // and if that is empty, the dashboard.
                state: state,
                provider: providerId,
                stayLoggedIn: false
            });
        }

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
                        width: '44px',
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

        function buildLoginButton(events, provider, state) {
            return button({
                class: 'btn btn-default',
                style: {
                    margin: '8px 0',
                    height: '44px'
                },
                id: events.addEvent('click', function () {
                    runtime.service('session').getClient().setLastProvider(provider.id);
                    doLogin(provider.id, state);
                })
            }, buildProviderLabel(provider));
        }

        function parsePolicyAgreements(policyIds) {
            return policyIds.map(function (policyId) {
                var id = policyId.id.split('.');
                return {
                    id: id[0],
                    version: parseInt(id[1], 10),
                    date: new Date(policyId.agreed_on)
                };
            });
        }

        function buildTable(arg) {
            var t = html.tag,
                table = t('table'),
                thead = t('thead'),
                tbody = t('tbody'),
                tr = t('tr'),
                th = t('th'),
                td = t('td'), id, attribs;
            arg = arg || {};
            if (arg.id) {
                id = arg.id;
            } else {
                id = html.genId();
                arg.generated = {id: id};
            }
            attribs = {id: id};
            if (arg.class) {
                attribs.class = arg.class;
            } else if (arg.classes) {
                attribs.class = arg.classes.join(' ');
            }
            return table(attribs, [
                thead(tr(arg.columns.map(function (x) {
                    return th(x.label);
                }))),
                tbody(arg.rows.map(function (row) {
                    return tr(row.map(function (x, index) {
                        var col = arg.columns[index];
                        var value = x;
                        if (col.format) {
                            try {
                                value = col.format(x);
                            } catch (ex) {
                                value = 'er: ' + ex.message;
                            }
                        }
                        return td(value);
                    }));
                }))
            ]);
        }

        function ViewModel(config) {
            var vm = config.model;

            function get(path) {
                var l = path.split('.');
                function getPath(vm, p) {
                    var vmNode = vm[p[0]];
                    console.log('getPath', vm, p);
                    if (vmNode) {
                        if (p.length > 1) {
                            if (vmNode.model) {
                                return getPath(vmNode.model, p.slice(1));
                            } else {
                                throw new Error('Path does not exist: ' + p.join('.'));
                            }
                        } else {
                            return vmNode;
                        }
                    }
                }
                return getPath(vm, l);
            }

            function bindVmNode(vmNode) {
                if (vmNode.enabled && (vmNode.node === null || vmNode === undefined)) {
                    vmNode.node = document.getElementById(vmNode.id);
                }
            }

            function bindAll() {
                Object.keys(vm).forEach(function (key) {
                    bindVmNode(vm[key]);
                });
            }

            function bind(path) {
                var vmNode = get(path);
                if (!vmNode) {
                    return;
                }
                vmNode.node = document.getElementById(vmNode.id);
            }

            return {
                bindAll: bindAll,
                bind: bind,
                get: get
            };
        }

        return {
            buildLoginButton: buildLoginButton,
            parsePolicyAgreements: parsePolicyAgreements,
            buildTable: buildTable,
            ViewModel: ViewModel
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});