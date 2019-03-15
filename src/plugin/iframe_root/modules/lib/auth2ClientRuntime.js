define(['../kbaseUI/runtime', 'kb_common_ts/Auth2Session'], (Runtime, M_auth2Session) => {
    'use strict';

    class Auth2ClientRuntime extends Runtime {
        constructor(params) {
            super(params);

            const extraCookies = [];
            // if (config.cookie.backup.enabled) {
            //     extraCookies.push({
            //         name: config.cookie.backup.name,
            //         domain: config.cookie.backup.domain
            //     });
            // }

            this.auth2Session = new M_auth2Session.Auth2Session({
                cookieName: this.config('services.auth2.cookieName'),
                extraCookies: extraCookies,
                baseUrl: this.config('services.auth2.url'),
                providers: this.config('services.auth2.providers')
            });
        }

        service(name) {
            // awk-ward
            if (name === 'session') {
                const session = super.service('session');
                session.getClient = () => {
                    return this.auth2Session;
                };
                return session;
            } else {
                return super.service(name);
            }
        }
    }

    return Auth2ClientRuntime;
});
