const {spawn} = require('child_process');
var sudo = require('sudo-prompt');
var options = {
    name: 'Electron',
    cachePassword: true,
    prompt: 'Password, yo? ',
    spawnOptions: {/* other options for spawn */}
};

function startExternalService(ip, port) {
    return new Promise((resolve, reject) => {
        //  let tun2socks = spawn('tun2socks/main', ['-local-socks-addr', `${ip}:${port}`]);
        var tun2socks = sudo.exec(`tun2socks/main -local-socks-addr  ${ip}:${port}`, options, (error, stdout, stderr) => {
            console.log(error, stdout, stderr)
        });
        /*tun2socks.stdout.on('data', (data) => {
            let line = data.toString();
            let name = line.split(':')[1];
            if (false) {
                resolve({ps: tun2socks, tun: name.trim()})
            } else {
                reject({ps: tun2socks, msg: 'output not expect: ' + data});
            }
        });*/
    })
}

function stopExternalService(ps) {
    return new Promise((resolve, reject) => {
        try {
            ps.kill('SIGHUP');
            ps.on('close', () => {
                resolve();
            })
        } catch (e) {
            console.log(e)
        }

    })
}

class Tun2Socks {
    async start(ip, port) {
        this.ip = ip;
        this.port = port;
        // 启动服务进程
        if (this.ps) {
            await stopExternalService(ps);
        }
        try {
            let {ps, tun} = await startExternalService(ip, port);
            this.ps = ps;
            this.tunName = tun;
        } catch (e) {
            if (e.ps) {
                await  stopExternalService(e.ps);
            }
        }
        // 设置路由表
    }

    stop() {
        // 删除路由表

        // 停止进程
    }


}

let tun2socks = module.exports = new Tun2Socks();
tun2socks.start('172.17.2.4', 8002);

