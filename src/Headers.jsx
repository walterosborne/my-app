import { React, useEffect, useState } from 'react'

function Headers() {
    const [headers, setHeaders] = useState({});
    const [allRequestHeaders, setAllRequestHeaders] = useState({});

    useEffect(() => {
        // Try to get all possible request headers using a real fetch
        fetch(window.location.href)
            .then(response => {
                const headerObj = {};
                response.headers.forEach((value, key) => {
                    headerObj[key] = value;
                });
                setHeaders(headerObj);

                // Also capture request headers from various sources
                const requestHeaders = {
                    // Navigator properties
                    'User-Agent': navigator.userAgent,
                    'Language': navigator.language,
                    'Languages': navigator.languages?.join(', '),
                    'Platform': navigator.platform,
                    'Cookie-Enabled': navigator.cookieEnabled,
                    'Online': navigator.onLine,
                    'Vendor': navigator.vendor,

                    // Document properties
                    'Referrer': document.referrer,
                    'Cookie': document.cookie,
                    'Domain': document.domain,

                    // Window properties
                    'Origin': window.location.origin,
                    'Hostname': window.location.hostname,
                };

                setAllRequestHeaders(requestHeaders);

                // Log all headers to console for inspection
                console.log('Response Headers:', headerObj);
                console.log('Request Info:', requestHeaders);
            })
            .catch(err => console.error('Error fetching headers:', err));
    }, []);

    return (
        <div>
            <h1>All HTTP Headers and Request Information</h1>

            <h2>Response Headers (from server)</h2>
            <pre>{JSON.stringify(headers, null, 2)}</pre>

            <h2>Request Information (browser/client)</h2>
            <pre>{JSON.stringify(allRequestHeaders, null, 2)}</pre>

            <h2>Window Location</h2>
            <pre>{JSON.stringify({
                'href': window.location.href,
                'protocol': window.location.protocol,
                'host': window.location.host,
                'hostname': window.location.hostname,
                'port': window.location.port,
                'pathname': window.location.pathname,
                'search': window.location.search,
                'hash': window.location.hash,
                'origin': window.location.origin
            }, null, 2)}</pre>

            <h2>Document Properties</h2>
            <pre>{JSON.stringify({
                'cookie': document.cookie,
                'domain': document.domain,
                'referrer': document.referrer,
                'title': document.title,
                'URL': document.URL,
                'lastModified': document.lastModified
            }, null, 2)}</pre>

            <h2>Check Console</h2>
            <p>All headers have been logged to the browser console for detailed inspection.</p>
        </div>
    )
}

export default Headers
