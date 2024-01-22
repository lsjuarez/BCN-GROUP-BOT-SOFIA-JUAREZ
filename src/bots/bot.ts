import { ActivityHandler, BotState, ConversationState, StatePropertyAccessor, UserState } from "botbuilder";
import { Dialog, DialogState } from "botbuilder-dialogs";
import { CityInfoDialog } from "../dialogs/cityDialog";

export class CityInfoBot extends ActivityHandler {
    private conversationState: BotState;
    private userState: BotState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;

    constructor(conversationState: BotState, userState: BotState, dialog: Dialog){
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState as ConversationState;
        this.userState = userState as UserState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async(context, next) => {
            console.log('Running dialog with message activiy');
            await(this.dialog as CityInfoDialog).run(context, this.dialogState);

            await next();
        });

        this.onDialog(async(context, next) => {
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        })
    }
}