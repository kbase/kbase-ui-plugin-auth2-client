define([
    'knockout-plus',
    'kb_common/html',
    'kb_common_ts/Auth2Error'
], function (
    ko,
    html,
    Auth2Error
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        img = t('img');

    function viewModel(params) {
        // import params into this VM.
        var provider = params.provider;
        var runtime = params.runtime;
        var nextRequest = params.nextRequest;
        var assetsPath = params.assetsPath;
        var origin = params.origin;

        var imageBase = assetsPath + '/providers/' + provider.id.toLowerCase() + '/signin-button/';
        var state = ko.observable('normal');
        var doMouseOver = function () {
            state('hover');
        };
        var doMouseOut = function () {
            state('normal');
        };
        var imageSource = ko.pureComputed(function () {
            switch (state()) {
            case 'normal':
                return imageBase + 'normal.png';
            case 'hover':
                return imageBase + 'pressed.png';
            case 'disabled':
                return imageBase + 'disabled.png';
            default:
                return imageBase + 'normal.png';
            }
        });
        // ['normal', 'disabled', 'focus', 'pressed'].forEach(function (state) {
        //     provider.imageSource[state] = imageBase + state + '.png';
        // });
        var disabled = ko.observable(false);
        var loading = ko.observable(false);

        function doSignin(data) {
            // set last provider...
            data.loading(true);
            // providers.forEach(function (provider) {
            //     provider.state('disabled');
            //     provider.disabled(true);
            // });
            // loginStart(runtime, data.id, {
            //     nextrequest: nextRequest,
            //     origin: 'login'
            // });

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
                .then(function () {
                    //  don 't care whether it succeeded or failed.
                    runtime.service('session').loginStart({
                        // TODO: this should be either the redirect url passed in 
                        // or the dashboard.
                        // We just let the login page do this. When the login page is 
                        // entered with a valid token, redirect to the nextrequest,
                        // and if that is empty, the dashboard.
                        state: {
                            nextrequest: nextRequest,
                            origin: origin
                        },
                        provider: provider.id
                    });
                })
                .finally(function () {
                    loading(false);
                });
        }

        return {
            runtime: runtime,
            provider: provider,
            doSignin: doSignin,
            imageSource: imageSource,
            state: state,
            doMouseOver: doMouseOver,
            doMouseOut: doMouseOut,
            disabled: disabled,
            loading: loading,
            assetsPath: assetsPath
        };
    }

    function template() {
        return div({
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
        }, [
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
                        mouseout: 'doMouseOut'
                    },
                    attr: {
                        src: 'imageSource'
                    }
                }
            }),
            div({
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
            }, span({
                class: 'fa fa-spinner fa-pulse fa-3x',
                style: {
                    color: '#FFF'
                }
            }))
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    return ko.kb.registerComponent(component);
});