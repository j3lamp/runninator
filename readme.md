Runninator
==========
> A generic runner ideal for a front-end hot reload server and application server.

Runninator is designed for running things like your application server along
with a webpack development server, or similar. This is not designed for running
build tasks but rather a way to start multiple servers required for development
together while providing the ability to control them individually.


Install
-------
```bash
npm install --save-dev runninator
```


Usage
-----
`runninator <config file>`

Once launched runninator will start each of the commands listed in the
configuration file and provide a prompt for controlling them. Allowing
individual commands to be restarted, stopped, and started again.

### Configuring
Runninator expects a JavaScript file that exports a configuration object.

#### Example
```js
module.exports = {
    app: {command: ["node", "app.js"],
          color:   "green"},
    wp:  {command: ["npm", "run", "webpack"],
          color:   "blue"}
};
```

Each entry maps the name runninator will use to the actual command to be run.
The color field id optional and one will be picked automatically if omitted or
invalid. Valid colors are:

- `green`
- `blue`
- `cyan`
- `magenta`
- `yellow`

Red is reserved for displaying errors.


Limitations
-----------
- Not tested on Windows, but in theory it should work.
- With node.js 4 commands cannot always be stopped, for example any command
  started using an npm script. This is due to a documented bug that was fixed in
  later versions. <https://github.com/nodejs/node/issues/2098>
- Not tested with node.js versions prior to 4.


Example Run
-----------
<pre>
Starting <span style="color: #408b09;">app</span>...
Starting <span style="color: #879105;">wp</span>...
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span> $ open http://127.0.0.1:7001
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Listening at http://localhost:7002/
run <span style="font-weight: bold;">&gt;</span> help
Control Commands:
    start &lt;command name&gt;    Start a stopped command.
    stop &lt;command name&gt;     Stop a running command.
    restart &lt;command name&gt;  Restart a running command.

  Note: Control commands and command names can be entered in reverse order.
        The special command names 'all' and '*' can be used to control all the
        commands together.

Global Control Commands:
    status  Print the status of all commands.
    quit    Stop all commands and quit this.
    help    Print this help.

Commands:
    <span style="color: #408b09;">app </span> node app.js
    <span style="color: #879105;">wp  </span> node dev-server.js
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Hash: cb9b46aed96961bfa659
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Version: webpack 1.13.1
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Time: 2829ms
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     Asset     Size  Chunks             Chunk Names
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> bundle.js  1.08 MB       0  [emitted]  main
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> chunk    {0} bundle.js (main) 945 kB [rendered]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [0] multi main 52 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [1] (webpack)-dev-server/client?http://localhost:7002 2.67 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [2] ./~/url/url.js 22.3 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [3] ./~/url/~/punycode/punycode.js 14.6 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [4] (webpack)/buildin/module.js 251 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [5] ./~/querystring/index.js 127 bytes {0} [built]
<span style="color: grey;">    &vellip;</span>
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [255] ./~/component-emitter/index.js 3 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [256] ./~/reduce-component/index.js 405 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [257] ./public/javascripts/components/footer.js 3.38 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [258] ./public/javascripts/components/todo_list.js 2.93 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [259] ./public/javascripts/components/todo.js 3.63 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [260] ./~/classnames/index.js 1.1 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> webpack: bundle is now VALID.
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span>   &lt;-- GET /tasks
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span>   --&gt; GET /tasks 200 15ms -
run <span style="font-weight: bold;">&gt;</span> status
Process status:
 <span style="color: #408b09;">&bull;</span> <span style="color: #408b09;">app</span> <span style="color: #408b09;">running</span>
 <span style="color: #408b09;">&bull;</span> <span style="color: #879105;">wp </span> <span style="color: #408b09;">running</span>
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span>   &lt;-- GET /tasks
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span>   --&gt; GET /tasks 200 5ms -
run <span style="font-weight: bold;">&gt;</span> stop wp
Stopping <span style="color: #879105;">wp</span>...
run <span style="font-weight: bold;">&gt;</span> restart app
Restarting <span style="color: #408b09;">app</span>...
<span style="color: #408b09;">app </span><span style="font-weight: bold; color: #7ae028;">|</span> $ open http://127.0.0.1:7001
run <span style="font-weight: bold;">&gt;</span> status
Process status:
 <span style="color: #408b09;">&bull;</span> <span style="color: #408b09;">app</span> <span style="color: #408b09;">running</span>
 <span style="color: #bd0005;">&bull;</span> <span style="color: #879105;">wp </span> <span style="color: #bd0005;">stopped</span>
run <span style="font-weight: bold;">&gt;</span> start wp
Starting <span style="color: #879105;">wp</span>...
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Listening at http://localhost:7002/
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Hash: cb9b46aed96961bfa659
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Version: webpack 1.13.1
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> Time: 2845ms
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     Asset     Size  Chunks             Chunk Names
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> bundle.js  1.08 MB       0  [emitted]  main
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> chunk    {0} bundle.js (main) 945 kB [rendered]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [0] multi main 52 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [1] (webpack)-dev-server/client?http://localhost:7002 2.67 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [2] ./~/url/url.js 22.3 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [3] ./~/url/~/punycode/punycode.js 14.6 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [4] (webpack)/buildin/module.js 251 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>     [5] ./~/querystring/index.js 127 bytes {0} [built]
<span style="color: grey;">    &vellip;</span>
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [255] ./~/component-emitter/index.js 3 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [256] ./~/reduce-component/index.js 405 bytes {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [257] ./public/javascripts/components/footer.js 3.38 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [258] ./public/javascripts/components/todo_list.js 2.93 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [259] ./public/javascripts/components/todo.js 3.63 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span>   [260] ./~/classnames/index.js 1.1 kB {0} [built]
<span style="color: #879105;">wp  </span><span style="font-weight: bold; color: #fae63f;">|</span> webpack: bundle is now VALID.
run <span style="font-weight: bold;">&gt;</span> quit
Stopping <span style="color: #408b09;">app</span>...
Stopping <span style="color: #879105;">wp</span>...
run <span style="font-weight: bold;">&gt;</span>
</pre>

License
-------
&copy; John Lamp

MIT license
