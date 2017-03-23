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

        function doLogin(providerId, redirectParams) {
            // console.log('dologin', providerId, nextRequest);
            var query = Object.keys(redirectParams).map(function (key) {
                return [key, redirectParams[key]].map(encodeURIComponent).join('=');
            }).join('&');
            var fakeUrl = window.location.origin + '?' + query;

            runtime.service('session').login({
                // TODO: this should be either the redirect url passed in 
                // or the dashboard.
                // We just let the login page do this. When the login page is 
                // entered with a valid token, redirect to the nextrequest,
                // and if that is empty, the dashboard.
                redirectUrl: fakeUrl,
                provider: providerId,
                stayLoggedIn: false,
                node: document.body
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

        function buildLoginButton(events, provider, redirectParams) {
            return button({
                class: 'btn btn-default',
                style: {
                    xtextAlign: 'left',
                    xcursor: 'pointer',
                    margin: '8px 0',
                    xdisplay: 'block',
                    xwhiteSpace: 'nowrap',
                    xwidth: '100%',
                    height: '44px'
                },
                id: events.addEvent('click', function () {
                    runtime.service('session').getClient().setLastProvider(provider.id);
                    doLogin(provider.id, redirectParams);
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

        return {
            buildLoginButton: buildLoginButton,
            parsePolicyAgreements: parsePolicyAgreements
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});