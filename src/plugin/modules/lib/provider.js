define([
    'json!../../resources/data/providers.json',
], function (
    providersData
) {
    'use strict';

    function intersect(a1, a2) {
        return a1.some(function (a) {
            return a2.includes(a);
        });
    }

    class Providers {
        constructor({allowed}) {
            this.providers = providersData
                .filter((provider) => {
                    if (provider.allow) {
                        if (intersect(provider.allow, allowed)) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                });
            this.sortByPriority();
        }

        sortByPriority() {
            this.providers.sort(function (a, b) {
                let priorityOrder = a.priority - b.priority;
                if (priorityOrder !== 0) {
                    return priorityOrder;
                }

                let labelOrder = a.label < b.label ? -1 : (a.label > b.label ? 0 : 1);
                return labelOrder;
            });
        }

        get() {
            return this.providers;
        }
    }

    return {Providers};
});