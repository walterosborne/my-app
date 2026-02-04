import { React, useEffect, useState } from 'react'

function Headers() {
    const [headers, setHeaders] = useState({});

    useEffect(() => {
        // Fetch headers from a request
        fetch(window.location.href, { method: 'HEAD' })
            .then(response => {
                const headerObj = {};
                response.headers.forEach((value, key) => {
                    headerObj[key] = value;
                });
                return headerObj;
            })
            .then(data => setHeaders(data))
            .catch(err => console.error('Error fetching headers:', err));
    }, []);

    return (
        <div>
            <h1>HTTP Headers</h1>
            <h2>Request Headers</h2>
            <pre>{JSON.stringify({
                'User-Agent': navigator.userAgent,
                'Language': navigator.language,
                'Platform': navigator.platform,
                'Cookie-Enabled': navigator.cookieEnabled,
                'Online': navigator.onLine
            }, null, 2)}</pre>

            <h2>Response Headers</h2>
            <pre>{JSON.stringify(headers, null, 2)}</pre>

            <h2>Window Location</h2>
            <pre>{JSON.stringify({
                'href': window.location.href,
                'protocol': window.location.protocol,
                'host': window.location.host,
                'pathname': window.location.pathname,
                'search': window.location.search,
                'hash': window.location.hash
            }, null, 2)}</pre>
        </div>
    )
}

export default Headers
