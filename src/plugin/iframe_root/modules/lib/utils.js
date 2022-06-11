define([
    'kb_lib/html',
    'kb_common_ts/Auth2',
    'kb_common_ts/Auth2Error',
    'lib/domUtils',

    // for effect
    'bootstrap'], (
    html,
    auth2,
    Auth2Error,
    {setInnerHTML}
) => {
    const t = html.tag,
        div = t('div'),
        img = t('img'),
        span = t('span'),
        button = t('button');

    function factory(config) {
        const runtime = config.runtime;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });

        function doLogin(providerId, state) {
            auth2Client
                .loginCancel()
                .catch(Auth2Error.AuthError, (err) => {
                    // ignore this specific error...
                    if (err.code !== '10010') {
                        throw err;
                    }
                })
                .catch((err) => {
                    // TODO: show error.
                    console.error('Skipping error', err);
                })
                .finally(() => {
                    //  don 't care whether it succeeded or failed.
                    return runtime.service('session').loginStart({
                        // TODO: this should be either the redirect url passed in
                        // or the dashboard.
                        // We just let the login page do this. When the login page is
                        // entered with a valid token, redirect to the nextrequest,
                        // and if that is empty, the dashboard.
                        state,
                        provider: providerId
                    });
                });
        }

        function buildProviderLabel(provider) {
            return div(
                {
                    style: {
                        display: 'inline',
                        whiteSPace: 'nowrap',
                        height: '54px'
                    }
                },
                [
                    div(
                        {
                            style: {
                                display: 'inline-block',
                                width: '44px',
                                height: '24px',
                                marginRight: '4px'
                            }
                        },
                        img({
                            src: `${runtime.pluginResourcePath  }/providers/${  provider.id.toLowerCase()  }/logo.png`,
                            style: {
                                height: '24px'
                            }
                        })
                    ),
                    provider.label
                ]
            );
        }

        function buildLoginButton2(events, provider, state) {
            return button(
                {
                    class: 'btn btn-default',
                    style: {
                        textAlign: 'center'
                    },
                    id: events.addEvent('click', () => {
                        doLogin(provider.id, state);
                    })
                },
                div(
                    {
                        style: {
                            display: 'inline-block',
                            width: '50%',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            verticalAlign: 'middle'
                        }
                    },
                    [
                        img({
                            src: `${runtime.pluginResourcePath  }/providers/${  provider.id.toLowerCase()  }/logo.png`,
                            style: {
                                height: '24px',
                                marginRight: '10px',
                                verticalAlign: 'middle'
                            }
                        }),
                        span(
                            {
                                style: {
                                    verticalAlign: 'middle'
                                }
                            },
                            provider.label
                        )
                    ]
                )
            );
        }

        function buildLoginButton(events, provider, state) {
            return button(
                {
                    class: 'btn btn-default',
                    style: {
                        margin: '8px 0'
                    },
                    id: events.addEvent('click', () => {
                        doLogin(provider.id, state);
                    })
                },
                buildProviderLabel(provider)
            );
        }

        function parsePolicyAgreements(policyIds) {
            return policyIds.map((policyId) => {
                const id = policyId.id.split('.');
                return {
                    id: id[0],
                    version: parseInt(id[1], 10),
                    date: new Date(policyId.agreedon)
                };
            });
        }

        function buildTable(arg) {
            const t = html.tag,
                table = t('table'),
                thead = t('thead'),
                tbody = t('tbody'),
                tr = t('tr'),
                th = t('th'),
                td = t('td');
            let id;
            arg = arg || {};
            if (arg.id) {
                id = arg.id;
            } else {
                id = html.genId();
                arg.generated = {id};
            }
            const attribs = {id};
            if (arg.class) {
                attribs.class = arg.class;
            } else if (arg.classes) {
                attribs.class = arg.classes.join(' ');
            }
            return table(attribs, [
                thead(
                    tr(
                        arg.columns.map((x) => {
                            return th(x.label);
                        })
                    )
                ),
                tbody(
                    arg.rows.map((row) => {
                        return tr(
                            row.map((x, index) => {
                                const col = arg.columns[index];
                                let value = x;
                                if (col.format) {
                                    try {
                                        value = col.format(x);
                                    } catch (ex) {
                                        value = `er: ${  ex.message}`;
                                    }
                                }
                                return td(value);
                            })
                        );
                    })
                )
            ]);
        }

        function getTimeBias() {
            const then = new Date().getTime();
            return auth2Client.root().then((root) => {
                const now = new Date().getTime();
                const serverBias = root.servertime - (now + then) / 2;
                return serverBias;
            });
        }

        return {
            buildLoginButton,
            buildLoginButton2,
            parsePolicyAgreements,
            buildTable,
            getTimeBias
        };
    }

    function ViewModel(config) {
        const vm = config.model;
        if (!vm) {
            throw new Error('The vm must be supplied in the "model" property');
        }

        function get(path) {
            const l = path.split('.');

            function getPath(vm, p) {
                const vmNode = vm[p[0]];
                if (vmNode) {
                    if (p.length > 1) {
                        if (vmNode.model) {
                            return getPath(vmNode.model, p.slice(1));
                        }
                        throw new Error(`Path does not exist: ${  p.join('.')}`);

                    } else {
                        return vmNode;
                    }
                }
            }
            return getPath(vm, l);
        }

        function getElement(containerOrPath, names) {
            let container;
            if (typeof containerOrPath === 'string') {
                container = get(containerOrPath).node;
            } else {
                container = containerOrPath;
            }
            if (!container) {
                console.error('ERROR', containerOrPath, container);
                throw new Error(`Could not get vm node: ${  containerOrPath}`);
            }
            if (typeof names === 'string') {
                names = names.split('.');
            }
            if (names.length === 0) {
                return container;
            }
            const selector = names
                .map((name) => {
                    return `[data-element="${  name  }"]`;
                })
                .join(' ');

            const node = container.querySelector(selector);

            return node;
        }

        function bindVmNode(vmNode) {
            if (!vmNode.disabled && (vmNode.node === null || vmNode.node === undefined) && vmNode.id) {
                const node = document.getElementById(vmNode.id);
                if (node === null) {
                    throw new Error(`bind failed, node not found with id: ${  vmNode.id}`);
                }
                vmNode.node = node;
            }
        }

        function bindAll() {
            function bindModel(model) {
                Object.keys(model).forEach((key) => {
                    bindVmNode(model[key]);
                    if (model[key].model) {
                        bindModel(model[key].model);
                    }
                });
            }
            bindModel(vm);
        }

        function setHTML(vmPath, elementPath, content) {
            const vmNode = get(vmPath);
            if (!vmNode) {
                return;
            }
            const domNode = getElement(vmNode.node, elementPath);
            if (!domNode) {
                return;
            }
            setInnerHTML(domNode, content);
        }

        function bind(path) {
            const vmNode = get(path);
            if (!vmNode) {
                return;
            }
            vmNode.node = document.getElementById(vmNode.id);
        }

        return {
            bindAll,
            bind,
            get,
            setHTML,
            getElement
        };
    }

    function DeferUI() {
        const deferred = [];

        function defer(fun) {
            const id = html.genId();
            deferred.push({
                id,
                fun
            });
            return id;
        }

        function resolve() {
            deferred.forEach((defer) => {
                const node = document.getElementById(defer.id);
                try {
                    defer.fun(node);
                } catch (ex) {
                    console.error('ERROR resolving deferred ', ex);
                }
            });
        }
        return {
            defer,
            resolve
        };
    }

    return {
        make(config) {
            return factory(config);
        },
        ViewModel,
        DeferUI
    };
});
