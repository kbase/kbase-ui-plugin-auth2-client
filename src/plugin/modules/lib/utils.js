define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Auth2Error,
    Plugin
) {
    var t = html.tag,
        div = t('div'),
        img = t('img'),
        button = t('button');

    function factory(config) {
        var runtime = config.runtime;

        function doLogin(providerId, state) {
            runtime.service('session').getClient().loginCancel()
                .catch(Auth2Error.AuthError, function (err) {
                    // ignore this specific error...
                    if (err.code !== '10010') {
                        throw err;
                    }
                })
                .catch(function (err) {
                    // TODO: show error.
                    console.error('Skipping error', err);
                })
                .finally(function () {
                    //  don 't care whether it succeeded or failed.
                    return runtime.service('session').loginStart({
                        // TODO: this should be either the redirect url passed in 
                        // or the dashboard.
                        // We just let the login page do this. When the login page is 
                        // entered with a valid token, redirect to the nextrequest,
                        // and if that is empty, the dashboard.
                        state: state,
                        provider: providerId,
                        stayLoggedIn: false
                    });
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
                    height: '44px',
                    fontSize: '110%',
                    fontWeight: 'bold'
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
                    date: new Date(policyId.agreedon)
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
                td = t('td'),
                id, attribs;
            arg = arg || {};
            if (arg.id) {
                id = arg.id;
            } else {
                id = html.genId();
                arg.generated = { id: id };
            }
            attribs = { id: id };
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



        return {
            buildLoginButton: buildLoginButton,
            parsePolicyAgreements: parsePolicyAgreements,
            buildTable: buildTable
        };
    }

    function ViewModel(config) {
        var vm = config.model;
        if (!vm) {
            throw new Error('The vm must be supplied in the "model" property');
        }

        function get(path) {
            var l = path.split('.');

            function getPath(vm, p) {
                var vmNode = vm[p[0]];
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

        function getElement(containerOrPath, names) {
            var container;
            if (typeof containerOrPath === 'string') {
                container = get(containerOrPath).node;
            } else {
                container = containerOrPath;
            }
            if (!container) {
                console.error('ERROR', containerOrPath, container);
                throw new Error('Could not get vm node: ' + containerOrPath);
            }
            if (typeof names === 'string') {
                names = names.split('.');
            }
            if (names.length === 0) {
                return container;
            }
            var selector = names.map(function (name) {
                return '[data-element="' + name + '"]';
            }).join(' ');

            var node = container.querySelector(selector);

            return node;
        }

        function bindVmNode(vmNode) {
            if (!vmNode.disabled &&
                (vmNode.node === null || vmNode.node === undefined) &&
                vmNode.id) {
                var node = document.getElementById(vmNode.id);
                if (node === null) {
                    throw new Error('bind failed, node not found with id: ' + vmNode.id);
                }
                vmNode.node = node;
            }
        }

        function bindAll() {
            function bindModel(model) {
                Object.keys(model).forEach(function (key) {
                    bindVmNode(model[key]);
                    if (model[key].model) {
                        bindModel(model[key].model);
                    }
                });
            }
            bindModel(vm);
        }

        function setHTML(vmPath, elementPath, content) {
            var vmNode = get(vmPath);
            if (!vmNode) {
                return;
            }
            var domNode = getElement(vmNode.node, elementPath);
            if (!domNode) {
                return;
            }
            domNode.innerHTML = content;
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
            get: get,
            setHTML: setHTML,
            getElement: getElement
        };
    }

    function DeferUI() {
        var deferred = [];

        function defer(fun) {
            var id = html.genId();
            deferred.push({
                id: id,
                fun: fun
            });
            return id;
        }

        function resolve() {
            deferred.forEach(function (defer) {
                var node = document.getElementById(defer.id);
                try {
                    defer.fun(node);
                } catch (ex) {
                    console.error('ERROR resolving deferred ', ex);
                }
            });
        }
        return {
            defer: defer,
            resolve: resolve
        };
    }
    return {
        make: function (config) {
            return factory(config);
        },
        ViewModel: ViewModel,
        DeferUI: DeferUI
    };
});