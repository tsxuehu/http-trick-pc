const {spawn, exec} = require('child_process');

function startExternalService(ip, port) {
    return new Promise((resolve, reject) => {
        let tun2socks = spawn('tun2socks/main', ['-local-socks-addr', `${ip}:${port}`]);

        tun2socks.stdout.on('data', (data) => {
            let line = data.toString();
            let name = line.split(':')[1];
            if (name) {
                resolve({ps: tun2socks, tun: name.trim()})
            } else {
                console.log('output not expect: ' + data);
                reject({ps: tun2socks, msg: 'output not expect: ' + data});
            }
        });
    })
}

function stopExternalService(ps) {
    if (!ps) return;
    return new Promise((resolve, reject) => {
        try {
            ps.kill('SIGHUP');
            ps.on('close', () => {
                resolve();
            })
        } catch (e) {
            console.log('stop external failed', e)
        }

    })
}

function execp(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            console.log(error, stdout, stderr)
            if (error) {
                reject({error, stdout, stderr});
            } else {
                resolve({error, stdout, stderr});
            }
        })
    })
}

class Tun2Socks {
    async start(ip, port) {
        this.ip = ip;
        this.port = port;
        // 启动服务进程
        console.log('start external service')
        if (this.ps) {
            await stopExternalService(ps);
        }
        try {
            let {ps, tun} = await startExternalService(ip, port);
            this.ps = ps;
            this.tunName = tun;
        } catch (e) {
            await  stopExternalService(e.ps);
            return
        }
        // 设置路由表

        let cmd = `route add -net 192.18.0.1/16 -interface ${this.tunName}`
        console.log('change route')
        await execp(cmd);
        // 设置dns

        console.log('started tun2socks')
    }

    async stop() {
        // 恢复dns

        // 删除路由表
        console.log('delete route')
        await exec(`route delete -net 192.18.0.1/16 -interface ${this.tunName}`);
        // 停止进程
        console.log('stop external service')
        await  stopExternalService(this.ps);
    }
}

let tun2socks = module.exports = new Tun2Socks();
tun2socks.start('172.17.2.4', 8002);

