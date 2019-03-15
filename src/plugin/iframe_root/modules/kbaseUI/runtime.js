define(['bluebird', 'kb_lib/props', 'kb_lib/messenger', './widget/manager'], (
    Promise,
    props,
    Messenger,
    WidgetManager
) => {
    'use strict';
    class Runtime {
        constructor({ token, username, config }) {
            this.token = token;
            this.username = username;
            this.widgetManager = new WidgetManager({
                baseWidgetConfig: {
                    runtime: this
                }
            });

            this.configDb = new props.Props({ data: config });

            this.pluginPath = '/modules/plugins/auth2-client/iframe_root';
            this.pluginResourcePath = this.pluginPath + '/resources';

            this.messenger = new Messenger();

            this.heartbeatTimer = null;
        }

        config(path, defaultValue) {
            return this.configDb.getItem(path, defaultValue);
        }

        getConfig(path, defaultValue) {
            return this.config(path, defaultValue);
        }

        service(name) {
            switch (name) {
            case 'session':
                return {
                    getAuthToken: () => {
                        return this.token;
                    },
                    getUsername: () => {
                        return this.username;
                    },
                    isLoggedIn: () => {
                        return this.token ? true : false;
                    }
                };
            }
        }

        getService(name) {
            return this.service(name);
        }

        send(channel, message, data) {
            this.messenger.send({ channel, message, data });
        }

        receive(channel, message, handler) {
            return this.messenger.receive({ channel, message, handler });
        }

        recv(channel, message, handler) {
            return this.receive(channel, message, handler);
        }

        drop(subscription) {
            this.messenger.drop(subscription);
        }

        start() {
            return Promise.try(() => {
                this.heartbeatTimer = window.setInterval(() => {
                    this.send('app', 'heartbeat', { time: new Date().getTime() });
                }, 1000);
            });
        }

        stop() {
            return Promise.try(() => {
                window.clearInterval(this.heartbeatTimer);
            });
        }
    }

    return Runtime;
});
