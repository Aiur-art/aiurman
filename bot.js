var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var monk = require('monk');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//Configure db connection
var db = monk(auth.dblink);
var words = db.get('Words');

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `e!`
    if (message.substring(0, 2) == 'e!') {
        var args = message.substring(2).split(' ');
        var cmd = args[0];

        args = args.splice(1);

        let label = args[0];
        let text = message.substring(cmd.length + label.length + 3); //"e!".length + " ".length = 3

        switch (cmd) {

            // e!say
            case 'say':
                logger.info(label);

                words.findOne({ Label: label }, function (err, doc) {
                    if (err) throw err;
                    if (doc == null) logger.info(label + " - not found");
                    else {
                        bot.sendMessage({ to: channelID, message: doc.Text });
                    }
                });
                break;

            //e!note
            case 'note':
                logger.info("Label: " + label + ", Text: " + text);

                words.update(
                    { Label: label },
                    { $set: { Label: label, Text: text } },
                    { upsert: true },
                    function (err, object) {
                        if (err) bot.sendMessage({ to: channelID, message: "Не понимаю" });
                        else bot.sendMessage({ to: channelID, message: "Понимаю" });
                    });
                break;

            //e!delete
            case 'delete':
                logger.info("Label: " + label + "is deleted");

                words.remove({ Label: label },
                    function (err, object) {
                        if (err) bot.sendMessage({ to: channelID, message: "Дело не сделано" });
                        else bot.sendMessage({ to: channelID, message: "Дело сделано" });
                    });
                break;
        }
    }
});