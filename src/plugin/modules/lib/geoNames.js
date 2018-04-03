define([
    'kb_common_ts/HttpClient'
], function (
    HttpClient
) {
    'use strict';
    
    var urlBase = window.location.origin + '/geonames';

    function getCountryCode(arg) {
        var httpClient = new HttpClient.HttpClient();
        return httpClient.request({
            method: 'GET',
            url: urlBase + '/countryCodeJSON',
            query: {
                lat: arg.latitude,
                lng: arg.longitude,
                username: arg.username
            }
        })
            .then(function (result) {
                switch (result.status) {
                case 200:
                    return JSON.parse(result.response);
                default:
                    throw new Error('Error getting country code: ' + result.status);
                }
            });
    }

    return {
        getCountryCode: getCountryCode,
    };
});