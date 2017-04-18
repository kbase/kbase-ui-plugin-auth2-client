define([

], function() {
    'use strict';

    function niceDuration(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        var minimized = [];
        var units = [{
            unit: 'millisecond',
            short: 'ms',
            single: 'm',
            size: 1000
        }, {
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
            size: 30
        }];
        var temp = value;
        var parts = units
            .map(function(unit) {
                var unitValue = temp % unit.size;
                temp = (temp - unitValue) / unit.size;
                return {
                    name: unit.single,
                    value: unitValue
                };
            }).reverse();

        parts.pop();

        var keep = false;
        for (var i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    minimized.push(parts[i]);
                }
            } else {
                minimized.push(parts[i]);
            }
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        } else {
            // Skip seconds if we are into the hours...
            if (minimized.length > 2) {
                minimized.pop();
            }
            return minimized.map(function(item) {
                    return String(item.value) + item.name;
                })
                .join(' ');
        }
    }

    return {
        niceDuration: niceDuration
    };
});