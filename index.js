"use strict";

const child_process = require("child_process");
const path          = require("path");

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
    const name_color = error ? chalk.red.bold  : color;

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

function createChild(name, display_name, color, command, args, quiet)
{
    if (!quiet)
    {
        output(function(out) {
            out.writeLine("Starting " + color(name) + "...");
        });
    }

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
            if (commands[name]['stopping'])
            {
                commands[name].status = STOPPED;
                commands[name].stopping = false;
            }
            else
            {
                commands[name].status = COMPLETED;
            }
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
                                                 args,
                                                 true);
            commands[name].restart = false;
        }
    });

    return child;
}


function printHelp(out)
{
    let help = [
        "Control Commands:",
        "    start <command name>    Start a stopped command.",
        "    stop <command name>     Stop a running command.",
        "    restart <command name>  Restart a running command.",
        "",
        "  Note: Control commands and command names can be entered in reverse order.",
        "        The special command names 'all' and '*' can be used to control all the",
        "        commands together.",
        "",
        "Global Control Commands:",
        "    status  Print the status of all commands.",
        "    quit    Stop all commands and quit this.",
        "    help    Print this help."];

    let first_command = true;
    for (let entry of R.values(commands))
    {
        if (first_command)
        {
            help.push("");
            help.push("Commands:");

            first_command = false;
        }

        let entry_help = ("    " + entry.color(entry.display_name) + "  " +
                          entry.command);
        if (entry["args"] && entry.args.length > 0)
        {
            entry_help += " " + entry.args.join(" ");
        }
        help.push(entry_help);
    }

    for (let line of help)
    {
        out.writeLine(line);
    }
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
function quit(out)
{
    quitting = true;

    let running_process = false;
    for (let name in commands)
    {
        if (commands[name].process)
        {
            control_commands.stop(out, name);
            running_process = true;
        }
    }

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
            entry.stopping = true;
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
            else if ("quit" === command)
            {
                quit(out);
                valid = true;
            }
            else if ("status" === command)
            {
                printStatus(out);
                valid = true;
            }
            else if ("help" === command)
            {
                printHelp(out);
                valid = true;
            }
        }
        else if (2 == input.length)
        {
            let control_command = null;
            let command_names   = null;

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

            if (input[name_index])
            {
                if ("all" === input[name_index] ||
                    "*"   === input[name_index])
                {
                    command_names = Object.keys(commands);
                }
                else if (commands[input[name_index]])
                {
                    command_names = [input[name_index]];
                }
                else
                {
                    out.errorLine("Command '" + input[name_index] + "' does not exist.");
                }
            }

            if (control_command && command_names)
            {
                for (let command_name of command_names)
                {
                    control_command(out, command_name);
                    valid = true;
                }
            }
        }

        if (!valid)
        {
            out.error("Unknown command: ");
            out.errorLine(clean_command.s);
        }
    });
});


let colors = {
    "green":   0,
    "blue":    0,
    "cyan":    0,
    "magenta": 0,
    "yellow":  0
};


let commands = {};


output(function(out) {
    if (process.argv.length != 3) // node <this script> <config>
    {
        out.errorLine(chalk.bold.red("Error") + ": One command line " +
                      "argument required: configuration script.");
        process.exit(1);
    }
    const config = require(path.resolve(process.cwd(), process.argv[2]));


    let valid = true;
    let max_name_length = 0;
    for (const name in config)
    {
        const entry = config[name];

        max_name_length = Math.max(max_name_length ,name.length);

        let color;
        if ("color" in entry && entry.color in colors)
        {
            color = entry.color;
        }
        else
        {
            let next_color = "";
            let next_count = -1;
            for (let c in colors)
            {
                if (-1 === next_count || colors[c] < next_count)
                {
                    next_color = c;
                    next_count = colors[c];
                }
            }
            color = next_color;
        }
        colors[color] += 1;
        color = chalk[color];

        let command;
        let args = [];
        if ("command" in entry)
        {
            if (Array.isArray(entry.command))
            {
                command = entry.command[0];
                args    = entry.command.slice(1);
            }
            else
            {
                command = entry.command;
            }

            commands[name] = {color:    color,
                              command:  command,
                              args:     args,
                              process:  null,
                              status:   STOPPED,
                              stopping: false,
                              restart:  false};
        }
        else
        {
            out.errorLine(chalk.bold.red("Error:") + " configuration enttry '" +
                          name + "' does not have a 'command' entry, " +
                          "which is required.");
            valid = false;
            continue;
        }
    }
    for (let name in commands)
    {
        commands[name].display_name = S(name).padRight(max_name_length, " ").s;
    }

    if (valid)
    {
        for (let name in commands)
        {
            control_commands.start(out, name);
        }
    }
    else
    {
        process.exit(2);
    }
});
