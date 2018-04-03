define([

], function () {
    'use strict';

    // function niceDuration(value, defaultValue) {
    //     if (!value) {
    //         return defaultValue;
    //     }
    //     var minimized = [];
    //     var units = [{
    //         unit: 'millisecond',
    //         short: 'ms',
    //         single: 'm',
    //         size: 1000
    //     }, {
    //         unit: 'second',
    //         short: 'sec',
    //         single: 's',
    //         size: 60
    //     }, {
    //         unit: 'minute',
    //         short: 'min',
    //         single: 'm',
    //         size: 60
    //     }, {
    //         unit: 'hour',
    //         short: 'hr',
    //         single: 'h',
    //         size: 24
    //     }, {
    //         unit: 'day',
    //         short: 'day',
    //         single: 'd',
    //         size: 30
    //     }];
    //     var temp = value;
    //     var parts = units
    //         .map(function(unit) {
    //             var unitValue = temp % unit.size;
    //             temp = (temp - unitValue) / unit.size;
    //             return {
    //                 name: unit.single,
    //                 value: unitValue
    //             };
    //         }).reverse();

    //     parts.pop();

    //     var keep = false;
    //     for (var i = 0; i < parts.length; i += 1) {
    //         if (!keep) {
    //             if (parts[i].value > 0) {
    //                 keep = true;
    //                 minimized.push(parts[i]);
    //             }
    //         } else {
    //             minimized.push(parts[i]);
    //         }
    //     }

    //     if (minimized.length === 0) {
    //         // This means that there is are no time measurements > 1 second.
    //         return '<1s';
    //     } else {
    //         // Skip seconds if we are into the hours...
    //         if (minimized.length > 2) {
    //             minimized.pop();
    //         }
    //         return minimized.map(function(item) {
    //                 return String(item.value) + item.name;
    //             })
    //             .join(' ');
    //     }
    // }

    function niceDuration(value, options) {
        var defaultValue;
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
        var minimized = [];
        var units = [{
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
        var temp = Math.round(value / 1000) * 1000;
        // var temp = value;
        var parts = units
            .map(function (unit) {
                var unitValue;
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

        var keep = false;
        var i;
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
            var trimmed = [];
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
        } else {
            // Skip seconds if we are into the hours...
            if (minimized.length > 2) {
                minimized.pop();
            }
            return minimized.map(function (item) {
                return String(item.value) + item.name;
            })
                .join(' ');
        }
    }

    return {
        niceDuration: niceDuration
    };
});