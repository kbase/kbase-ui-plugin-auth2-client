define(['./windowChannel'], (WindowChannel) => {
    'use strict';

    class Integration {
        constructor({ rootWindow }) {
            this.rootWindow = rootWindow;
            this.container = rootWindow.document.body;
            // channelId, frameId, hostId, parentHost
            this.hostParams = this.getParamsFromIFrame();
            this.hostChannelId = this.hostParams.channelId;

            // The original params from the plugin (taken from the url)
            this.pluginParams = this.hostParams.params;

            this.authorized = null;

            this.channel = new WindowChannel.Channel({
                on: this.rootWindow,
                host: document.location.origin,
                to: this.hostChannelId
            });

            this.channel.start();

            // just a test...
            console.log('sending ready');
            this.channel.send('ready', { greet: 'hi' });

            // // this is the channel for this window.
            // this.channel = new WindowChannel.Channel({
            //     window: this.rootWindow,
            //     host: document.location.origin
            //     // recieveFor: [this.id],
            //     // clientId: this.iframe.id,
            //     // hostId: this.id
            // });

            // this.performanceMonitoringListener = null;

            // // This is the channel for the window containing this iframe.
            // this.hostChannel = new WindowChannel.Channel({
            //     window: this.rootWindow.parent,
            //     host: this.hostParams.parentHost,
            //     channelId: this.hostParams.channelId
            // });
        }

        getParamsFromIFrame() {
            if (!this.rootWindow.frameElement.hasAttribute('data-params')) {
                throw new Error('No params found in window!!');
            }
            return JSON.parse(decodeURIComponent(this.rootWindow.frameElement.getAttribute('data-params')));
        }

        render(ko) {
            this.rootViewModel = new RootViewModel({
                runtime: this.runtime,
                hostChannel: this.hostChannel,
                authorized: this.authorized,
                authorization: this.authorization,
                pluginParams: this.pluginParams
            });
            this.container.innerHTML = div(
                {
                    style: {
                        flex: '1 1 0px',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                    // dataBind: {
                    //     component: {
                    //         name: MainComponent.quotedName(),
                    //         params: {
                    //             runtime: 'runtime',
                    //             bus: 'bus',
                    //             authorization: 'authorization',
                    //             pluginParams: 'pluginParams'
                    //         }
                    //     }
                    // }
                },
                gen.if(
                    'ready',
                    gen.component({
                        name: MainComponent.name(),
                        params: {
                            runtime: 'runtime',
                            bus: 'bus',
                            authorization: 'authorization',
                            pluginParams: 'pluginParams'
                        }
                    })
                )
            );
            ko.applyBindings(this.rootViewModel, this.container);
        }

        showHelp() {
            this.rootViewModel.bus.send('help');
        }

        start() {
            return knockoutLoader.load().then((ko) => {
                ko.options.deferUpdates = true;
                ko.options.createChildContextWithAs = true;

                this.channel.start();
                this.hostChannel.start();

                this.channel.on('start', (payload) => {
                    const { token, username, config, realname, email } = payload;
                    if (token) {
                        this.authorization = { token, username, realname, email };
                    } else {
                        this.authorization = null;
                    }
                    this.token = token;
                    this.username = username;
                    this.config = config;
                    this.authorized = token ? true : false;

                    this.runtime = new runtime.Runtime({ config, token, username, realname, email });
                    this.render(ko);

                    this.rootViewModel.bus.on('set-plugin-params', ({ pluginParams }) => {
                        this.hostChannel.send('set-plugin-params', { pluginParams });
                    });

                    this.channel.on('show-help', () => {
                        this.showHelp();
                    });

                    this.channel.on('loggedin', ({ token, username, realname, email }) => {
                        this.runtime.auth({ token, username, realname, email });
                        this.rootViewModel.authorized(true);
                        this.rootViewModel.authorization({ token, username, realname, email });
                        // really faked for now.
                        // this.runtime.service('session').
                    });

                    this.channel.on('loggedout', () => {
                        this.runtime.unauth();
                        this.rootViewModel.authorized(false);
                        this.rootViewModel.authorization(null);
                    });

                    this.rootViewModel.bus.on('instrumentation', (payload) => {
                        this.hostChannel.send('send-instrumentation', payload);
                    });

                    // this.hostChannel.send('add-button', {
                    //     button: {
                    //         name: 'feedback',
                    //         label: 'Feedback',
                    //         style: 'default',
                    //         icon: 'bullhorn',
                    //         toggle: false,
                    //         params: {
                    //         },
                    //         callbackMessage: ['show-feedback', null]
                    //     }
                    // });

                    // this.hostChannel.send('add-button', {
                    //     button: {
                    //         name: 'help',
                    //         label: 'Help',
                    //         style: 'default',
                    //         icon: 'question-circle',
                    //         toggle: false,
                    //         params: {
                    //         },
                    //         callbackMessage: ['show-help', null]
                    //     }
                    // });
                });

                // Sending 'ready' with our channel id and host name allows the
                // enclosing app (window) to send us messages on our very own channel.
                // We could just use the host's channel, have all sends and receives
                // on the same channel, with control via the channel id. However, there is a risk
                // the the channels will listen on for the same message ... unlikely though.
                // Still, it would be odd for one window to listen for messages on another...
                this.hostChannel.send('ready', {
                    channelId: this.channel.id,
                    channelHost: this.channel.host
                });
            });
        }

        stop() {}
    }

    return Integration;
});
