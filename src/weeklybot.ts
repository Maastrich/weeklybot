// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { App, } from "@slack/bolt"

import dotenv from "dotenv"
dotenv.config()
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.action("weekly", async ({ ack, say, body, respond }) => {
  await ack();

  const channelId = body.channel?.id;

  if (!channelId) {
    await respond({
      text: "Sorry, I couldn't find the channel ID for this message.",
      replace_original: false,
    });
    return;
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
      blocks: [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hello everyone :wave:\n here are your scribe and ambassador. \nScribe: <@${randomUsers[0]}>\nAmbassador: <@${randomUsers[1]}>\nHave a great week!`
        },
      },
      {
        type: "actions",
        elements: [{
          type: "button",
          text: {
            type: "plain_text",
            text: "Not again :repeat:",
            emoji: true
          },
          action_id: "weekly"
        }
        ]
      }
      ],
      replace_original: true,
    });
    // post a message to the channel
  } else {
    await say("Could not find any users in this channel :man_shrugging:\nTry with <https://random.org|random.org>");
  }
})

app.command("/weekly", async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  const weeklyMessage = {
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "Hello there :wave!\nIt's monday, time to pick your scribe and ambassador for the week :tada:",
          emoji: true
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Pick my scribe and ambassador :eyes:",
            },
            action_id: "weekly",
          }
        ]
      }
    ]
  }
  // send weekly message every monday at 9:30am CET
  await app.client.chat.scheduleMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: command.channel_id,
    post_at: new Date().setHours(9, 30, 0, 0),
    blocks: weeklyMessage.blocks
  });
  await say("I'll post the message every monday at 9:30am CET :tada:");
});

app.command("/weekly-off", async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  // get scheduled messages
  const { scheduled_messages } = await app.client.chat.scheduledMessages.list({
    oldest: Date.now(),
    channel: command.channel_id,
    // end of time
    latest: 2147483647
  });

  if (scheduled_messages) {
    // delete all scheduled messages
    scheduled_messages.forEach(async (message) => {
      await app.client.chat.deleteScheduledMessage({
        channel: command.channel_id,
        scheduled_message_id: message.id!
      });
    });
  }
  await say("I won't post the message anymore :cry:");
});

app.command("/weekly-status", async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  // get scheduled messages
  const { scheduled_messages } = await app.client.chat.scheduledMessages.list({
    oldest: Date.now(),
    channel: command.channel_id,
    // end of time
    latest: 2147483647
  });

  if (scheduled_messages) {
    await say("I'm still posting the message every monday at 9:30am CET :tada:");
  } else {
    await say("I'm not posting the message anymore :cry:");
  }
});



(async () => {
  (await app.start(process.env.PORT || 3000)).addListener("request", () => {
    console.log("request")
  });
  console.log("⚡️ Bolt app is running!");
})();