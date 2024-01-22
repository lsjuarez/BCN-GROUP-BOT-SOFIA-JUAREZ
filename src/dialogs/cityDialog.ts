import { StatePropertyAccessor, TurnContext, UserState } from "botbuilder";
import { ChoiceFactory, ChoicePrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { CityProfile } from "../cityProfile";
import axios from "axios";

export class CityInfoDialog extends ComponentDialog {
    private cityProfile: StatePropertyAccessor<CityProfile>;

    constructor(userState: UserState) {
        super();
        this.cityProfile = userState.createProperty('CITY_PROFILE');

        this.addDialog(new ChoicePrompt('cityPrompt'));
        this.addDialog(new ChoicePrompt('infoTypePrompt'));
        this.addDialog(new WaterfallDialog('WATERFALL_DIALOG', [
            this.promptForCountry.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = 'WATERFALL_DIALOG';
    }

    public async run(turnContext: TurnContext, accesor: StatePropertyAccessor) {
        const dialogSet = new DialogSet(accesor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    private async promptForCountry(stepContext: WaterfallStepContext) {
        try {
            const response = await axios.get('https://countriesnow.space/api/v0.1/countries');
            const countryOptions = response.data.data.map((val: any) => val.country);

            return await stepContext.prompt('cityPrompt', {
                prompt: 'Which city would you like information about?',
                choices: ChoiceFactory.toChoices(countryOptions)
            });
        } catch (err) {
            console.error('Error fetching countries from API:', err.message);
            return await stepContext.endDialog();
        }
    };

    private async getCurrency(country): Promise<string> {
        const body = {
            country: country
        };
        try {
            const response = await axios.post('https://countriesnow.space/api/v0.1/countries/currency', body);
            return response.data.data.currency;
        } catch (err) {
            console.error('Error fetching countries from API:', err.message);
            throw err;
        }
    }

    private async getCapital(country): Promise<string> {
        const body = {
            country: country
        };
        try {
            const response = await axios.post('https://countriesnow.space/api/v0.1/countries/capital', body);
            return response.data.data.capital;
        } catch (err) {
            console.error('Error fetching countries from API:', err.message);
            throw err;
        }
    }
    private async summaryStep(stepContext: WaterfallStepContext) {
        stepContext.options['country'] = stepContext.result.value;
        const body = {
            country: stepContext.options['country'].toLowerCase()
        }
        try {
            const response = await axios.post('https://countriesnow.space/api/v0.1/countries/positions', body);

            const country = stepContext.options['country'];

            const [capital, currency] = await Promise.all([
                this.getCapital(country.toLowerCase()),
                this.getCurrency(country.toLowerCase())
            ]);

            const message = `This is the information you searched:\n- Country: ${country}\n- Capital: ${capital}\n- Longitude: ${response.data.data.long}\n- Latitude: ${response.data.data.lat}\n- Currency: ${currency}`;
            await stepContext.context.sendActivity(message);

            return await stepContext.endDialog();
        } catch (err) {
            console.error('Error fetching cities from API:', err.message);
            return await stepContext.endDialog();
        }
    };


    public onComputeId(): string {
        return 'CityInfoDialog'
    };
}