define([
], () => {
    function niceDuration(value, options) {
        let defaultValue;
        options = options || {};
        if (typeof options === 'string') {
            defaultValue = options;
            options = {};
        } else {
            defaultValue = options.default;
        }
        if (!value) {
            return defaultValue;
        }
        let minimized = [];
        const units = [{
            unit: 'millisecond',
            short: 'ms',
            single: 'm',
            size: 1000
        },
        {
            unit: 'second',
            short: 'sec',
            single: 's',
            size: 60
        }, {
            unit: 'minute',
            short: 'min',
            single: 'm',
            size: 60
        }, {
            unit: 'hour',
            short: 'hr',
            single: 'h',
            size: 24
        }, {
            unit: 'day',
            short: 'day',
            single: 'd',
            max: 90,
            size: 365
        },
        // {
        //     unit: 'week',
        //     short: 'week',
        //     single: 'w',
        //     size: 52
        // },
        {
            unit: 'year',
            short: 'year',
            single: 'y',
            size: null
        }
        ];
        // always start by rounding up to seconds.
        let temp = Math.round(value / 1000) * 1000;
        // var temp = value;
        const parts = units
            .map((unit) => {
                let unitValue;
                if (unit.size) {
                    if (unit.max && temp <= unit.max) {
                        unitValue = temp;
                        temp = 0;
                    } else {
                        unitValue = temp % unit.size;
                        temp = (temp - unitValue) / unit.size;
                    }
                } else {
                    unitValue = temp;
                }
                return {
                    name: unit.single,
                    value: unitValue
                };
            }).reverse();

        parts.pop();

        let keep = false;
        let i;
        for (i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    minimized.push(parts[i]);
                }
            } else {
                minimized.push(parts[i]);
            }
        }
        keep = false;
        if (options.trimEnd) {
            const trimmed = [];
            for (i = minimized.length - 1; i >= 0; i -= 1) {
                if (!keep) {
                    if (minimized[i].value > 0) {
                        keep = true;
                        trimmed.push(minimized[i]);
                    }
                } else {
                    trimmed.push(minimized[i]);
                }
            }
            minimized = trimmed.reverse();
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        }
        // Skip seconds if we are into the hours...
        if (minimized.length > 2) {
            minimized.pop();
        }
        return minimized.map((item) => {
            return String(item.value) + item.name;
        })
            .join(' ');

    }

    return {
        niceDuration
    };
});