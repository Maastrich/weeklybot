// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { App, CodedError, LogLevel } from "@slack/bolt"

import dotenv from "dotenv"
dotenv.config()
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
});

app.action("weekly", async ({ action, ack, say, body, respond }) => {
  await ack();

  const channelId = body.channel?.id;

  if (!channelId) {
    return respond({
      text: "Sorry, I couldn't find the channel ID for this message.",
      replace_original: true,
    });
  }
  // list of users in the channel
  const users = await app.client.conversations.members({
    channel: channelId
  });
  // pick two different random users from the list of users
  const randomUsers = users.members
    ?.sort(() => 0.5 - Math.random())
    .slice(0, 2);
  if (randomUsers) {
    await respond({
      text: `Hello everyone! here are your scribe and ambassador. \nScribe: <@${randomUsers[0]}>\nAmbassador: <@${randomUsers[1]}>\nHave a great week!`,
      replace_original: false,
    });
    // post a message to the channel
  } else {
    await say("Could not find any users in this channel :man_shrugging:\nTry with <https://random.org|random.org>");
  }
})

app.command("/weekly", async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Hello! It's monday, time to pick your scribe and ambassador for the week :tada:",
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Pick my scribe and ambassador",
            },
            action_id: "weekly",
          }
        ]
      }
    ]
  })
});

app.error(async (error: CodedError): Promise<void> => {
  // Check the details of the error to handle cases where you should retry sending a message or stop the app
  console.error(error);
  return;
});


(async () => {
  (await app.start(process.env.PORT || 3000)).addListener("request", () => {
    console.log("request")
  });
  console.log("⚡️ Bolt app is running!");
})();