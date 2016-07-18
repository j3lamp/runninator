"use strict";

const child_process = require("child_process");

const chalk = require("chalk");
const R     = require("ramda");
const S     = require("string");

const scopedAction = require("./scopedAction");


const RUNNING   = "running";
const FAILED    = "failed";
const STOPPED   = "stopped";
const COMPLETED = "completed";

const STATUS_COLOR = {}
STATUS_COLOR[RUNNING]   = chalk.green;
STATUS_COLOR[FAILED]    = chalk.bold.red;
STATUS_COLOR[STOPPED]   = chalk.red;
STATUS_COLOR[COMPLETED] = chalk.yellow;


let prompt_length = 0;
const output = scopedAction(
    function()
    {
        if (prompt_length > 0)
        {
            process.stdout.write("\r");
            for (let i = 0; i < prompt_length; ++i)
            {
                process.stdout.write(" ");
            }
            process.stdout.write("\r");
            prompt_length = 0;
        }

        return {
            write: function write(text)
            {
                process.stdout.write(text);
            },

            writeLine: function writeLine(line)
            {
                process.stdout.write(line);
                process.stdout.write("\n");
            },

            error: function error(text)
            {
                process.stderr.write(text);
            },

            errorLine: function errorLine(line)
            {
                process.stderr.write(line);
                process.stderr.write("\n");
            }
        };
    },
    function()
    {
        const prompt = "run " + chalk.bold(">") + " ";
        prompt_length = chalk.stripColor(prompt).length;
        process.stdout.write(prompt);
    });


function createDataHandler(name, color, error)
{
    const name_color = error ? chalk.red  : color;

    let partial_out = null;
    return function handleData(data)
    {
        output(function(out) {
            let begin = 0;
            while (begin < data.length)
            {
                let next = data.indexOf("\n", begin);
                if (next < 0)
                {
                    let data_rest = data.slice(begin);
                    if (partial_out)
                    {
                        partial_out = Buffer.concat([partial_out, data_rest]);
                    }
                    else
                    {
                        partial_out = new Buffer(data_rest);
                    }
                    begin = data.length;
                }
                else
                {
                    process.stdout.write(name_color(name) + " " + color.bold("|") + " ");
                    if (partial_out)
                    {
                        out.write(partial_out);
                        partial_out = null;
                    }
                    out.writeLine(data.slice(begin, next))
                    begin = next + 1;
                }
            }
        });
    };
}

function createChild(name, display_name, color, command, args)
{
    output(function(out) {
        out.writeLine("Starting " + color(name) + "...");
    });

    commands[name].status = RUNNING;
    let child = child_process.spawn(command, args);

    child.stdout.on("data", createDataHandler(display_name, color, false));

    let partial_err = null;
    child.stderr.on("data", createDataHandler(display_name, color, true));

    child.on("error", function(error) {
        output(function(out) {
            out.errorLine("Could not start " + color(name) + "(" + command +
                          " " + JSON.stringify(args) + "):");
            out.errorLine(error);
        });

        commands[name].status  = FAILED;
        commands[name].process = null;
    });

    child.on("close", function(code) {
        if (!code || 0 === code)
        {
            commands[name].status = COMPLETED;
        }
        else
        {
            output(function(out) {
                out.errorLine(color(name) + " exited with errors (code " + code +")");
            });

            commands[name].status = FAILED
        }
        commands[name].process = null;

        if (quitting)
        {
            let all_done = R.reduce(function(done, entry)
                                    {
                                        return done && (entry.process === null);
                                    },
                                    true,
                                    R.values(commands));
            if (all_done)
            {
                // Leave the last prompt but make sure the terminal's prompt
                // will be on its own line.
                process.stdout.write("\n");
                process.exit(0);
            }
        }
        else if (commands[name].restart)
        {
            commands[name].process = createChild(name,
                                                 display_name,
                                                 color,
                                                 command,
                                                 args);
            commands[name].restart = false;
        }
    });

    return child;
}


const BULLET = "\u2022";
function printStatus(out)
{
    out.writeLine("Process status:");
    for (let name in commands)
    {
        const entry       = commands[name];
        const statusColor = STATUS_COLOR[entry.status];

        out.writeLine(" " + statusColor(BULLET) + " " +
                      entry.color(entry.display_name) + " " +
                      statusColor(entry.status));
    }
}

let quitting = false;
function quit()
{
    quitting = true;

    let running_process = false;
    R.forEach(function(entry)
              {
                  if (entry.process)
                  {
                      entry.process.kill();
                      running_process = true;
                  }
              },
              R.values(commands));

    if (!running_process)
    {
        process.exit(0);
    }
}

const control_commands = {
    start: function start(out, name) {
        const entry = commands[name];
        if (entry.process)
        {
            out.writeLine(entry.color(name) + " is already running.");
        }
        else
        {
            entry.process = createChild(name,
                                        entry.display_name,
                                        entry.color,
                                        entry.command,
                                        entry.args);
        }
    },

    stop: function stop(out, name) {
        const entry = commands[name];
        if (entry.process)
        {
            out.writeLine("Stopping " + entry.color(name) + "...");
            entry.process.kill();
        }
        else
        {
            out.writeLine(entry.color(name) + " is not running.");
        }
    },

    restart: function restart(out, name) {
        const entry = commands[name];
        if (entry.process)
        {
            out.writeLine("Restarting " + entry.color(name) + "...");
            entry.restart = true;
            entry.process.kill();
        }
        else
        {
            control_commands.start(out, name);
        }
    }
};


process.stdout.on("data", function(data) {
    const clean_command = S(data.toString()).replace(/[\x00-\x1F\x7F-\x9F]/g, "")
                                            .trim();
    const input         = clean_command.split(/\s+/);
    let   valid         = false;

    output(function(out) {
        // console.log(input);
        if (0 === input.length)
        {
            // No input, do nothing.
            valid = true;
        }
        else if (1 === input.length)
        {
            const command = input[0];
            if ("" === command)
            {
                // No input, do nothing.
                valid = true;
            }
            else if ("q" === command || "quit" === command)
            {
                quit(out);
                valid = true;
            }
            else if ("s" === command || "status" === command)
            {
                printStatus(out);
                valid = true;
            }
            // add help at some point
        }
        else if (2 == input.length)
        {
            let control_command = null;
            let command_name    = null;

            let name_index = 1;
            if (control_commands[input[0]])
            {
                control_command = control_commands[input[0]];
            }
            else if (control_commands[input[1]])
            {
                control_command = control_commands[input[1]];
                name_index = 0;
            }

            command_name = input[name_index];
            if (!commands[command_name])
            {
                command_name = false;
            }

            if (control_command && command_name)
            {
                control_command(out, command_name);
                valid = true;
            }
        }

        if (!valid)
        {
            out.error("Unknown command: ");
            out.errorLine(clean_command.s);
        }
    });
});


const commands = {test: {color:    chalk.cyan,
                         command:  "npm",
                         args:     ["run", "output"]},
                  bad:   {color:   chalk.magenta,
                          command: "npm",
                          args:    ["run", "nonexistent"]}};
const max_name_length = R.reduce(
    function(length, key){ return Math.max(length,key.length); },
    0,
    R.keys(commands));

for (let name in commands)
{
    let entry = commands[name];

    entry.display_name = S(name).padRight(max_name_length, " ").s;
    entry.process = createChild(name,
                                entry.display_name,
                                entry.color,
                                entry.command,
                                entry.args);
}

output(function(out) {
    // Perhaps print a startup message...
});
