const child_process = require('child_process');

const networkTypes = ['Ethernet', 'Thunderbolt Ethernet', 'Wi-Fi'];

function execSync(cmd) {
    let stdout,
        status = 0;
    try {
        stdout = child_process.execSync(cmd);
    } catch (err) {
        stdout = err.stdout;
        status = err.status;
    }

    return {
        stdout: stdout.toString(),
        status
    };
}

const macProxyManager = {};

macProxyManager.getNetworkType = () => {
    for (let i = 0; i < networkTypes.length; i++) {
        const type = networkTypes[i],
            result = execSync('networksetup -getwebproxy ' + type);

        if (result.status === 0) {
            macProxyManager.networkType = type;
            return type;
        }
    }

    throw new Error('Unknown network type');
};


macProxyManager.enableGlobalProxy = (ip, port, proxyType) => {
    if (!ip || !port) {
        console.log('failed to set global proxy server.\n ip and port are required.');
        return;
    }

    proxyType = proxyType || 'http';

    const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();

    return /^http$/i.test(proxyType) ?

        // set http proxy
        execSync(
            'networksetup -setwebproxy ${networkType} ${ip} ${port} && networksetup -setproxybypassdomains ${networkType} 127.0.0.1 localhost'
                .replace(/\${networkType}/g, networkType)
                .replace('${ip}', ip)
                .replace('${port}', port)) :

        // set https proxy
        execSync('networksetup -setsecurewebproxy ${networkType} ${ip} ${port} && networksetup -setproxybypassdomains ${networkType} 127.0.0.1 localhost'
            .replace(/\${networkType}/g, networkType)
            .replace('${ip}', ip)
            .replace('${port}', port));
};

macProxyManager.disableGlobalProxy = (proxyType) => {
    proxyType = proxyType || 'http';
    const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();
    return /^http$/i.test(proxyType) ?

        // set http proxy
        execSync(
            'networksetup -setwebproxystate ${networkType} off'
                .replace('${networkType}', networkType)) :

        // set https proxy
        execSync(
            'networksetup -setsecurewebproxystate ${networkType} off'
                .replace('${networkType}', networkType));
};

macProxyManager.getProxyState = () => {
    const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();
    const result = execSync('networksetup -getwebproxy ${networkType}'.replace('${networkType}', networkType));

    return result;
};



module.exports = macProxyManager;
