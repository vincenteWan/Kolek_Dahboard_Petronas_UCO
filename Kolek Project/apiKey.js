(function () {
    const url = new URL(window.location.href);
    const urlKey = url.searchParams.get('api_key');
    const storedKey = localStorage.getItem('kolekApiKey');
    const apiKey = urlKey || storedKey || '';

    if (urlKey) {
        localStorage.setItem('kolekApiKey', urlKey);
        url.searchParams.delete('api_key');
        window.history.replaceState({}, document.title, url.toString());
    }

    if (!apiKey) {
        const entered = window.prompt('Enter API key to access the dashboard API:');
        if (entered) {
            localStorage.setItem('kolekApiKey', entered);
        }
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        const reqInit = init ? { ...init } : {};
        reqInit.headers = reqInit.headers ? { ...reqInit.headers } : {};

        const finalKey = localStorage.getItem('kolekApiKey');
        if (finalKey) {
            reqInit.headers['x-api-key'] = finalKey;
        }

        return originalFetch(input, reqInit);
    };
})();
