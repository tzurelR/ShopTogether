// Sends Web Push notifications for one list event to a set of subscriptions.
// Invoked asynchronously by the api Lambda: { event, subscriptions: [{ PK, SK, endpoint, p256dh, auth, lang }] }
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

import { render } from "./messages.mjs";
import { sendPush } from "./webpush.mjs";

const dynamo = new DynamoDBClient({});
const ssm = new SSMClient({});
let privateKey; // cached across warm invocations

async function vapidPrivateKey() {
  if (!privateKey) {
    const result = await ssm.send(new GetParameterCommand({ Name: process.env.VAPID_PRIVATE_KEY_PARAM, WithDecryption: true }));
    privateKey = result.Parameter.Value.trim();
  }
  return privateKey;
}

export async function handler({ event, subscriptions = [] }) {
  if (!subscriptions.length) return { sent: 0 };
  const options = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: await vapidPrivateKey(),
    subject: process.env.VAPID_SUBJECT,
    topic: `list-${event.listId}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32),
  };

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const { title, body } = render(event, sub.lang);
      const payload = { title, body, url: event.type === "list.deleted" ? "/" : `/lists/${event.listId}`, tag: `list-${event.listId}` };
      const status = await sendPush(sub, payload, options);
      if (status === 404 || status === 410) {
        // The phone or browser dropped this subscription; forget it.
        await dynamo.send(new DeleteItemCommand({
          TableName: process.env.TABLE_NAME,
          Key: { PK: { S: sub.PK }, SK: { S: sub.SK } },
        }));
      } else if (status >= 400) {
        console.warn("Push rejected", status, new URL(sub.endpoint).host);
      }
      return status;
    }),
  );
  const sent = results.filter((r) => r.status === "fulfilled" && r.value < 300).length;
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("Push failed", r.reason));
  return { sent, total: subscriptions.length };
}
