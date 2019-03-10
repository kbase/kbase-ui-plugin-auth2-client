define([
    'yaml!../../resources/data/providers.yaml',
], function (
    providersData
) {
    'use strict';

    class Providers {
        constructor({ runtime }) {
            this.providerWhitelist = runtime.config('services.auth2.providers');
            this.providers = providersData
                .filter((provider) => {
                    if (this.providerWhitelist) {
                        return this.providerWhitelist.includes(provider.id);
                    } else {
                        return true;
                    }
                });
            this.sortByPriority();
        }

        sortByPriority() {
            this.providers.sort(function (a, b) {
                const priorityOrder = a.priority - b.priority;
                if (priorityOrder !== 0) {
                    return priorityOrder;
                }

                const labelOrder = a.label < b.label ? -1 : (a.label > b.label ? 0 : 1);
                return labelOrder;
            });
        }

        get() {
            return this.providers;
        }
    }

    return { Providers };
});