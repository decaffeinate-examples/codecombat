/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const net = require('net');
const repl = require('repl');
const cluster = require('cluster');
const chalk = require('chalk');
const moment = require('moment');
const log = require('winston');
const os = require('os');
const _ = require('lodash');
const util = require('util');
const c = new chalk.constructor({enabled: true});

exports.init = function() {
  if (process.env.COCO_DEBUG_PORT == null) { return; }

  cluster.on('online', function(worker) {
    worker.created = new Date();
    return worker.on('message', function(worker, message, handle) {
      let r;
      if (arguments.length === 2) {
        [handle, message] = Array.from([message, worker]);
      }

      if (message !== 'debugger:handback') { return; }
      return r = exports.createREPL(handle);
    });
  });

  if (cluster.isMaster) {
    const logging = require('./server/commons/logging');
    logging.setup();
    const bind = process.env.COCO_DEBUG_BIND || '127.0.0.1';
    log.warn(`Debugger REPL active on ${bind}:${process.env.COCO_DEBUG_PORT}`);
    return net.createServer(function(socket) {
      log.info(`Debugger connection from ${socket.remoteAddress}`);
      const r = exports.createREPL(socket);
      return r.on('exit', () => socket.end());
    }).listen(process.env.COCO_DEBUG_PORT, bind);
  } else {
    return process.on('message', function(message, handle) {
      if (message === 'debugger:repl') {
        const r = exports.createREPL(handle);
        return r.on('exit', function() {
          if (process.connected) {
            return cluster.worker.send('debugger:handback', handle);
          }
        });
      } else if (message === 'debugger:ping') {
        return cluster.worker.send('debuger:pong');
      }
    });
  }
};

const colorWord = function(word) {
  if (['listening', 'online', 'connected'].includes(word)) { return c.green(word); }
  if (['destroyed'].includes(word)) { return c.red(word); }
  return word;
};

exports.createREPL = function(socket) {
  if (!socket) { return; }
  const name = cluster.isMaster ? "master" : `worker ${cluster.worker.id}`;

  const server = repl.start({
    prompt: `${c.yellow('Co')}${c.grey('Co')} ${c.cyan(name)}> `,
    input: socket,
    output: socket,
    terminal: true,
    useColor: true,
    breakEvalOnSigint: true
  });

  if (cluster.isMaster) {
    server.context.workers = cluster.workers;
    const listWorkersCommand = {
      help: 'List current workers',
      action() {
        server.outputStream.write(`${c.underline("Active Workers")}:\n`);
        for (let id in cluster.workers) {
          const worker = cluster.workers[id];
          server.outputStream.write([
            `${c.cyan(worker.id)}:`,
            colorWord(worker.state),
            `[PID: ${worker.process.pid}]`,
            `[Up: ${c.cyan(moment(worker.created).fromNow(true))}]`,
            "\n"
          ].join(" ")
          );
        }

        return server.displayPrompt();
      }
    };

    server.defineCommand('workers', listWorkersCommand);
    server.defineCommand('w', listWorkersCommand);

    const enterCommand = { 
      help: "Enters a worker's context",
      action(id) {
        const worker = _.find(cluster.workers, x => x.id === parseInt(id));
        if (worker == null) {
          server.outputStream.write(`${c.red('Error!')} Unknown worker \`${c.red(id)}\`\n`);
          server.displayPrompt();
          return;
        }
        return worker.send("debugger:repl", socket);
      }
    };

    server.defineCommand('enter', enterCommand);
    server.defineCommand('e', enterCommand);

  } else {
    server.context.worker = cluster.worker;
    server.context.app = cluster.worker.app;
    server.context.httpServer = cluster.worker.httpServer;
    const mongoose = require('mongoose');
    server.context.mongoose = mongoose;
    server.context.models = mongoose.models;


    server.defineCommand('bind', {
      help: 'Bind express to an port for only this cluster member',
      action(port){
        cluster.worker.app.listen(parseInt(port), "0.0.0.0", {exclusive: true});
        return server.displayPrompt();
      }
    }
    );
  }

  //For Both
  const osInfoCommand = {
    help: 'Show some information from the operating system.',
    action() {
      server.outputStream.write([
        `${c.underline("OS Information")}:`,
        `${os.hostname()} - ${os.platform()} ${os.arch()} ${os.release()}`,
        `CPU   : ${os.cpus()[0].model}`,
        `Load  : ${os.loadavg().join(', ')}`,
        `Memory: ${os.freemem()/1024/1024}mb free of ${os.totalmem()/1024/1024}mb`,
        `Uptime: ${moment.duration(os.uptime(), 'seconds').humanize()}`,
        ""

      ].join("\n")
      );
      return server.displayPrompt();
    }
  };
  server.defineCommand('osinfo', osInfoCommand);

  const memInfoCommand = { 
    help: 'Display memory usage for this cluster member / master',
    action() {
      const mem = process.memoryUsage();
      for (let k in mem) {
        const v = mem[k];
        server.outputStream.write(`${c.cyan(k)}: ${Math.ceil(v/1024/1024)}mb\n`);
      }
      return server.displayPrompt();
    }
  };

  server.defineCommand('meminfo', memInfoCommand);

  server.defineCommand('handles', {
    help: 'List active handles',
    action() {
      server.outputStream.write(`${c.underline("Active Handles")}:\n`);
      const object = process._getActiveHandles();
      for (let k in object) {
        const handle = object[k];
        if (handle instanceof net.Socket) {
          let state = 'connected';
          if (handle.connecting) { state = 'connecting'; } 
          if (handle.destroyed) { state = 'destroyed'; }
          server.outputStream.write(`${c.magenta('Socket')} ${c.bold(handle.remoteFamily || handle._type)} `);
          if ((handle.localAddress != null) || (handle.localPort != null)) {
            server.outputStream.write(`${handle.localAddress}:${handle.localPort} -> ${handle.remoteAddress}:${handle.remotePort} `);
          }
          server.outputStream.write(`${colorWord(state)} [R:${c.red(handle.bytesRead)} / W:${c.green(handle.bytesWritten)}]\n`);
          //unless handle.remoteFamily?
          //  server.outputStream.write util.inspect(handle)

        } else if (handle instanceof net.Server) {
          const addr = handle.address();
          server.outputStream.write(`${c.yellow('Listening Socket')} ${c.bold(addr != null ? addr.family : undefined)} ${(addr != null ? addr.address : undefined)}:${(addr != null ? addr.port : undefined)}\n`);
        } else if (handle.constructor.name === "ChildProcess") {
          server.outputStream.write(`${c.cyan('Child Process')} [pid: ${handle.pid}] ${handle.spawnargs.join(' ')}\n`);
        } else if (handle.constructor.name === "Pipe") {
          server.outputStream.write(`${c.green('Pipe')} ${handle.type} [fd: ${handle.fd}]\n`);
        } else {
          server.outputStream.write(`-> Unknown Type ${handle}: ${util.inspect(handle)}\n`);
        }
      }

      return server.displayPrompt();
    }
  }
  );

  server.context.log = require('winston');
  server.context.print = function() { return server.outputStream.write(Array.prototype.join.call(arguments, "\t") + "\n"); };
  return server;
};
