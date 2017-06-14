const express = require("express");
const middleware = require("./middleware");
const bodyParser = require("body-parser");
const AirCallClient = require("./aircallClient");

const REQUIRED_OPTIONS = ["aircallApiId", "aircallApiToken", "intercomWebhookPath"];

const init = (options) => {
    const router = express.Router();

    router.use(bodyParser.json());
    verifyRequiredOptions(options);

    if (options.hubSecret) {
        router.use(middleware.signedNotification(options.hubSecret));
    }

    const aircallClient = new AirCallClient(options.aircallApiId, options.aircallApiToken);

    router.post(options.intercomWebhookPath, (req, res) => {
        if (req.body.topic !== "user.created") {
            return res.sendStatus(200);
        }

        const body = req.body.data.item;
        aircallClient.postContact({
            firstName: body.name && body.name.split(" ")[0],
            lastName: body.name && body.name.split(" ")[1],
            email: body.email,
            phoneNumber: body.phone,
            companyName: body.companies && body.companies[0] && body.companies[0].name
        }).then(() => {
            res.sendStatus(200);
        }).catch(() => res.sendStatus(500));

    });
    return router;

};

const verifyRequiredOptions = (options) => {
    const missingOptions = REQUIRED_OPTIONS.filter(option => !options[option]);
    if (missingOptions.length) {
        throw new Error("Missing required options " + JSON.stringify(missingOptions));
    }
};

module.exports = init;
