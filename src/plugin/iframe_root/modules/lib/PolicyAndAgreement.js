define([
    'bluebird',
    'marked',
    'kb_common_ts/HttpClient',
    'lib/utils',
    'kb_common_ts/Auth2'
], (
    Promise,
    marked,
    M_HttpClient,
    Utils,
    auth2
) => {
    class PolicyAndAgreement {
        constructor({runtime}) {
            this.runtime = runtime;
            this.policies = null;
            this.useAgreements = null;
            this.utils = Utils.make({
                runtime
            });

            this.auth2Client = new auth2.Auth2({
                baseUrl: runtime.config('services.auth.url')
            });
            this.currentUserToken = runtime.service('session').getAuthToken();
        }

        getPolicyFile({id, version}) {
            const http = new M_HttpClient.HttpClient();
            const policyVersion = this.getPolicyVersion(id, version);
            const url = [window.location.origin + this.runtime.pluginResourcePath, 'agreements', policyVersion.file].join('/');
            return http
                .request({
                    method: 'GET',
                    url
                })
                .then((result) => {
                    if (result.status === 200) {
                        try {
                            return marked(result.response);
                        } catch (ex) {
                            throw new Error(`Error formatting agreement file: ${ex.message}`);
                        }
                    } else {
                        console.error('ERROR', result);
                        throw new Error(`Error fetching agreement: ${result.status}`);
                    }
                });
        }

        async loadPolicies() {
            const url = [window.location.origin + this.runtime.pluginResourcePath, 'agreements', 'policies.json'].join('/');

            const response = await fetch(url);
            if (response.status === 200) {
                return JSON.parse(await response.text());
            }

            throw new Error(`Error fetching index: ${response.status}`);
        }

        getLatestPolicies() {
            return this.policies.map(({id, title, versions}) => {
                const latestVersionId = Math.max.apply(
                    null,
                    versions.map((version) => {
                        return version.version;
                    })
                );
                const {version, date, file} = versions.filter((version) => {
                    return version.version === latestVersionId;
                })[0];

                return {
                    id, title, version, date, file
                };
            });
        }

        getPolicy(id) {
            return this.policies.filter((policy) => {
                return policy.id === id;
            })[0];
        }

        getPolicyVersion(id, version) {
            const policy = this.getPolicy(id);
            if (!policy) {
                throw new Error(`Policy does not exist ${id}`);
            }

            const policyVersion = policy.versions.filter((ver) => {
                return version === ver.version;
            })[0];
            if (!policyVersion) {
                throw new Error(`Policy version does not exist ${id}.${version}`);
            }

            return policyVersion;
        }


        parsePolicyAgreements(policyIds) {
            return policyIds.map((policyId) => {
                const id = policyId.id.split('.');
                return {
                    id: id[0],
                    version: parseInt(id[1], 10),
                    date: new Date(policyId.agreedon)
                };
            });
        }

        getUseAgreements() {
            return this.useAgreements;
        }

        async start() {
            const policies = await this.loadPolicies();

            this.policies = policies;

            const {policyids} = await this.auth2Client.getMe(this.currentUserToken);

            const agreements = this.parsePolicyAgreements(policyids);

            // Now add the policy information to the use agreements
            // TODO: ideally the auth service knows about policies themselves!
            const useAgreements = agreements.map(({date: agreedAt, id, version}) => {

                try {
                    const {title} = this.getPolicy(id);
                    const {date: publishedAt} = this.getPolicyVersion(id, version);
                    return {
                        agreedAt, id, version,
                        title, publishedAt
                    };
                } catch (ex) {
                    console.error('Error fetching policy or version, skipped', ex);
                    return null;
                }
            })
                .filter((useAgreement) => {return !!useAgreement;});


            this.useAgreements = useAgreements;


        }

        stop() {
            return Promise.try(() => { });
        }
    }

    return PolicyAndAgreement;
});
