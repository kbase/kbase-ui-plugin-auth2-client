define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html',
    'kb_common_ts/Auth2Error',
    'kb_common_ts/Auth2'],
function (
    ko,
    reg,
    html,
    Auth2Error,
    auth2
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        img = t('img');

    function viewModel(params) {
        // import params into this VM.
        const provider = params.provider;
        const runtime = params.runtime;
        const nextRequest = params.nextRequest;
        const assetsPath = params.assetsPath;
        const origin = params.origin;

        const auth2Client = new auth2.Auth2({
            baseUrl: runtime.config('services.auth.url')
        });
        const currentUserToken = runtime.service('session').getAuthToken();

        const imageBase = assetsPath + '/providers/' + provider.id.toLowerCase() + '/signin-button/';
        const state = ko.observable('normal');
        const doMouseOver = function () {
            state('hover');
        };
        const doMouseOut = function () {
            state('normal');
        };
        const doMouseDown = function () {
            state('pressed');
        };
        const doMouseUp = function () {
            state('normal');
        };
        const imageSource = ko.pureComputed(function () {
            switch (state()) {
            case 'normal':
                return imageBase + 'normal.png';
            case 'hover':
                return imageBase + 'hover.png';
            case 'pressed':
                return imageBase + 'pressed.png';
            case 'disabled':
                return imageBase + 'disabled.png';
            default:
                return imageBase + 'normal.png';
            }
        });

        const disabled = ko.observable(false);
        const loading = ko.observable(false);

        function makeRedirectURL() {
            const query = {
                state: JSON.stringify({
                    nextrequest: nextRequest,
                    origin
                })
            };
            const search = Object.keys(query)
                .map((key) => {
                    return [key, encodeURIComponent(query[key])].join('=');
                })
                .join('&');
            return document.location.origin + '?' + search;
        }

        function doSignin(data) {
            // set last provider...
            data.loading(true);
            state('disabled');
            disabled(true);
            // providers.forEach(function (provider) {
            //     provider.state('disabled');
            //     provider.disabled(true);
            // });
            // loginStart(runtime, data.id, {
            //     nextrequest: nextRequest,
            //     origin: 'login'
            // });

            auth2Client
                .loginCancel(currentUserToken)
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
                .then(function () {
                    //  don 't care whether it succeeded or failed.
                    const params = {
                        provider: provider.id,
                        redirecturl: makeRedirectURL(),
                        stayloggedin: false
                    };

                    const action = runtime.config('services.auth.url') + '/login/start';

                    runtime.send('app', 'post-form', {
                        action: action,
                        params: params
                    });
                })
                .finally(function () {
                    loading(false);
                });
        }

        // At time of writing (4/25/2020), Safari will restore the page and
        // JS context as left when returned to via back button (history),
        // which would otherwise leave the button in the disabled state after
        // clicking to sign in via a provider. Safari does support pageshow,
        // so this restores the button state.
        // Other browsers (FF, Chrome) don't seem to honor pageshow, but also
        // don't restore the page state when returning to it.
        window.addEventListener('pageshow', () => {
            state('normal');
        });

        return {
            runtime,
            provider,
            doSignin,
            imageSource,
            state,
            doMouseOver,
            doMouseOut,
            doMouseDown,
            doMouseUp,
            disabled,
            loading,
            assetsPath
        };
    }

    function template() {
        return div(
            {
                dataKBTesthookComponent: 'signin-button',
                style: {
                    textAlign: 'center',
                    margin: '4px',
                    padding: '4px',
                    position: 'relative'
                },
                dataBind: {
                    attr: {
                        'data-k-b-testhook-name': 'provider.id.toLowerCase()'
                    }
                }
            },
            [
                img({
                    style: {
                        height: '44px',
                        cursor: 'pointer'
                    },
                    class: 'signin-button',
                    dataBind: {
                        click: 'doSignin',
                        event: {
                            mouseover: 'doMouseOver',
                            mouseout: 'doMouseOut',
                            mousedown: 'doMouseDown',
                            mouseup: 'doMouseUp'
                        },
                        attr: {
                            src: 'imageSource'
                        }
                    }
                }),
                div(
                    {
                        style: {
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            textAlign: 'center',
                            paddingTop: '4px',
                            pointerEvents: 'none'
                        },
                        dataBind: {
                            visible: 'loading'
                        }
                    },
                    span({
                        class: 'fa fa-spinner fa-pulse fa-3x',
                        style: {
                            color: '#FFF'
                        }
                    })
                )
            ]
        );
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    return reg.registerComponent(component);
});
