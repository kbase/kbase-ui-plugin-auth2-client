define([
    'bluebird',
    'marked',
    'lib/utils',
    'kb_common_ts/Auth2',
    'lib/Features'
], (
    Promise,
    marked,
    Utils,
    auth2,
    Features
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

        async getPolicyFile({id, version}) {
            const policyVersion = this.getPolicyVersion(id, version);
            const url = [window.location.origin + this.runtime.pluginResourcePath, 'agreements', policyVersion.file].join('/');
            const response = await (async () => {
                try {
                    return await fetch(url);
                } catch (ex) {
                    console.error('ERROR', ex);
                    throw new Error(`Error fetching agreement: ${ex.message}`);
                }
            })();

            if (response.status !== 200) {
                console.error('ERROR', response);
                throw new Error(`Error fetching agreement: ${response.status}`);
            }

            try {
                return marked(await response.text());
            } catch (ex) {
                throw new Error(`Error formatting agreement file: ${ex.message}`);
            }
        }

        async loadPolicies() {
            const policiesFile = (() => {
                if (Features.isEnabled('ce-new-policy')) {
                    return 'policies-next.json';
                }
                return 'policies.json';
            })();
            const url = [window.location.origin + this.runtime.pluginResourcePath, 'agreements', policiesFile].join('/');

            const response = await fetch(url);
            if (response.status !== 200) {
                throw new Error(`Error fetching index: ${response.status}`);
            }
            const policies = JSON.parse(await response.text());
            return policies.map(({id, title, versions}) => {
                return {
                    id, title, versions: versions.map(({version, file, url, begin, end}) => {
                        return {
                            version, file, url,
                            begin: new Date(begin),
                            end: end ? new Date(end) : null
                        };
                    })
                };
            });
        }

        getLatestPolicies() {
            return this.policies.map(({id, title, versions}) => {
                const latestVersionId = Math.max.apply(
                    null,
                    versions.map((version) => {
                        return version.version;
                    })
                );
                const {version, begin, end, file} = versions.filter((version) => {
                    return version.version === latestVersionId;
                })[0];

                return {
                    id, title, version, begin, end, file
                };
            });
        }

        /**
         * Returns all policies.
         * The policy versions are modified to add a flag indicating whether
         * the policy is covered by an agreement (isAgreedTo).
         *
         * @returns
         */
        getPolicies() {
            return this.policies.map(({id, title, versions}) => {
                const latestVersionId = Math.max.apply(
                    null,
                    versions.map((version) => {
                        return version.version;
                    })
                );
                const {version, begin, end, file} = versions.filter((version) => {
                    return version.version === latestVersionId;
                })[0];

                return {
                    id, title, version, begin, end, file
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

        async start(policyIds) {
            const policies = await this.loadPolicies();

            this.policies = policies;

            if (!policyIds) {
                const me = await this.auth2Client.getMe(this.currentUserToken);
                policyIds = me.policyids;
            }

            const agreements = this.parsePolicyAgreements(policyIds);
            this.agreements = agreements;

            // Now add the policy information to the use agreements
            // TODO: ideally the auth service knows about policies themselves!
            const useAgreements = agreements.map(({date: agreedAt, id, version}) => {
                try {
                    const {title} = this.getPolicy(id);
                    const {begin: publishedAt, end: expiredAt} = this.getPolicyVersion(id, version);
                    return {
                        agreedAt, id, version,
                        title, publishedAt, expiredAt
                    };
                } catch (ex) {
                    console.error('Error fetching policy or version, skipped', ex);
                    return null;
                }
            })
                .filter((useAgreement) => {return !!useAgreement;});

            this.useAgreements = useAgreements;

            const now = Date.now();

            const policyAgreements = policies.reduce((policyAgreements, {id, title, versions}) => {
                versions.forEach(({version, begin: publishedAt, end: expiredAt, url, file}) => {
                    const agreedAt = agreements
                        .map(({id: idAgreed, version: versionAgreed, date: agreedAt}) => {
                            if (idAgreed === id && versionAgreed === version) {
                                return agreedAt;
                            }
                        })
                        .filter((agreedAt) => {
                            return !!agreedAt;
                        })[0] || null;

                    const previouslyAgreedTo = agreements
                        .some(({id: idAgreed, version: versionAgreed}) => {
                            return (id == idAgreed && version == versionAgreed + 1);
                        });

                    const [status, statusSort] = (() => {
                        if (expiredAt && expiredAt.getTime() < now) {
                            // We don't care whether it was agreed to or not.
                            return ['expired', 3];
                        }
                        if (agreedAt) {
                            return ['current', 2];
                        }
                        return [previouslyAgreedTo ? 'updated' : 'new', 1];
                    })();

                    policyAgreements.push({
                        id, version, title, publishedAt, expiredAt, agreedAt, status, statusSort, url, file
                    });
                });
                return policyAgreements;
            }, []);
            this.policyAgreements = policyAgreements;
        }

        /**
         * Returns all policies which are "new" -- the user has never agreed to.
         * As a convenience, fetches and includes the policy document itself.
         *
         * TODO: Perhaps the policy document should always be included in the policy.
         *
         * @returns
         */
        async getNewPolicies() {
            const policiesToResolve = this.policyAgreements.filter(({status}) => {
                return ['new', 'updated'].includes(status);
            });

            return Promise.all(policiesToResolve.map(async (policyAgreement) => {
                if (policyAgreement.file) {
                    const policyDoc = await this.getPolicyFile(policyAgreement);
                    policyAgreement.policyContent = policyDoc;
                }
                return policyAgreement;
            }));
            // return policiesToResolve;
        }

        stop() {
            return Promise.try(() => { });
        }
    }

    return PolicyAndAgreement;
});
