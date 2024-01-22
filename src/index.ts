import { CityInfoBot } from "./bots/bot";
import { UserState } from "botbuilder";
import { CityInfoDialog } from "./dialogs/cityDialog";

const { BotFrameworkAdapter, MemoryStorage, ConversationState, ActivityHandler } = require('botbuilder');
const express = require('express');
const bodyParser = require('body-parser');

const adapter = new BotFrameworkAdapter();

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const dialog = new CityInfoDialog(userState);
const bot = new CityInfoBot(conversationState, userState, dialog);

adapter.onTurnError = async (context, error) => {
    console.error(`Error: ${error.message}`);
    await context.sendActivity('An error occurred.');
};


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

app.listen(PORT, () => {
    console.log(`Bot is listening at http://localhost:${PORT}/api/messages`);
});