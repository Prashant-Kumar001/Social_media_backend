import { Inngest } from "inngest";
import User from "../models/user.model";
import dotenv from "dotenv";
import { Connection } from "../models/connections.model";
import { sendMail } from "../utils/sendMail";
import Story from "../models/story.model";
import Message from "../models/message.model";
dotenv.config();
export const inngest = new Inngest({
  id: "my-app",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  eventKey: process.env.INNGEST_EVENT_KEY,
});

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-creation", triggers: [{ event: "clerk/user.created" }] },

  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      throw new Error("Email not found in Clerk payload");
    }

    let username = email.split("@")[0];

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = username + Math.floor(Math.random() * 1000);
    }

    const userData = {
      _id: id,
      email,
      full_name: `${first_name || ""} ${last_name || ""}`,
      username,
      profile_picture: {
        url: image_url,
        fileId: "",
      },
      bio: "write your bio here",
    };

    await User.create(userData);
  },
);

const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-updation", triggers: [{ event: "clerk/user.updated" }] },

  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const email = email_addresses?.[0]?.email_address;

    await User.findOneAndUpdate(
      { _id: id },
      {
        email,
        full_name: `${first_name || ""} ${last_name || ""}`,
        profile_picture: image_url,
      },
    );
  },
);

const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-deletion", triggers: [{ event: "clerk/user.deleted" }] },

  async ({ event }) => {
    const { id } = event.data;
    await User.findOneAndDelete({ _id: id });
  },
);

const sendConnectionsRequestReminder = inngest.createFunction(
  {
    id: "send-connections-request-reminder",
    triggers: [{ event: "app/connections.requested" }],
  },

  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run("send-connections-request-reminder", async () => {
      if (!connectionId) {
        throw new Error("connectionId is missing");
      }

      const connection = await Connection.findById(connectionId)
        .populate("from_user_id to_user_id")
        .lean();

      if (!connection) {
        throw new Error("Connection not found");
      }

      const fromUser = connection.from_user_id as any;
      const toUser = connection.to_user_id as any;

      const subject = `🔔 Connection Request Reminder`;

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hey ${toUser?.full_name || "there"} 👋</h2>

          <p>
            You have a pending connection request from 
            <strong>${fromUser?.full_name || "someone"}</strong>.
          </p>

          <p>
            Don't miss out—check it now and connect!
          </p>

          <div style="margin-top: 20px;">
            <a 
              href="${process.env.CLIENT_URL}/connections"
              style="
                background-color: #4CAF50;
                color: white;
                padding: 10px 16px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
              "
            >
              View Request
            </a>
          </div>
        
          <p style="margin-top: 30px; font-size: 12px; color: gray;">
            Click <a href="${process.env.CLIENT_URL}/connections">here</a> to view your connections

          </p>
          <p style="margin-top: 30px; font-size: 12px; color: gray;">
            If you already responded, you can ignore this email.
          </p>
        </div>
      `;

      await sendMail({
        to: toUser?.email,
        subject,
        html,
      });

      return { success: true };
    });

    const in24hours = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24hours);
    await step.run("send-connections-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id",
      );

      if (!connection) {
        throw new Error("Connection not found");
      }
      if (connection.status === "accepted") {
        return { success: true };
      }

      const fromUser = connection.from_user_id as any;
      const toUser = connection.to_user_id as any;

      const subject = `🔔 Connection Request Reminder`;

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hey ${toUser?.full_name || "there"} 👋</h2>

          <p>
            You have a pending connection request from 
            <strong>${fromUser?.full_name || "someone"}</strong>.
          </p>

          <p>
            Don't miss out—check it now and connect!
          </p>

          <div style="margin-top: 20px;">
            <a 
              href="${process.env.CLIENT_URL}/connections"
              style="
                background-color: #4CAF50;
                color: white;
                padding: 10px 16px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
              "
            >
              View Request
            </a>
          </div>
        
          <p style="margin-top: 30px; font-size: 12px; color: gray;">
            Click <a href="${process.env.CLIENT_URL}/connections">here</a> to view your connections

          </p>
          <p style="margin-top: 30px; font-size: 12px; color: gray;">
            If you already responded, you can ignore this email.
          </p>
        </div>
      `;

      await sendMail({
        to: toUser?.email,
        subject,
        html,
      });

      return { success: true };
    });
  },
);

const in24DeleteStory = inngest.createFunction(
  { id: "story-delete", triggers: [{ event: "app/story.deleted" }] },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete({
        _id: storyId,
      });

    });
    return { success: true };
  },
);

const sendNotificationsOnUnseenMessages = inngest.createFunction(
  {
    id: "send-notifications-on-unseen-messages",
    triggers: [{ event: "app/unseen-messages" }, {
      cron: "TZ=America/New_York 0 9 * * *", // 
    }],
  },
  async ({ step }) => {
    const message = await Message.find({ seen: false }).populate("to_user_id").lean();

    const unSeenMessage: { [key: string]: number } = {}

    if (message) {
      (message && message.map(message => {
        unSeenMessage[message?.to_user_id?._id as string] = (unSeenMessage[message?.to_user_id?._id] || 0) + 1
      }))

      for (const key in unSeenMessage) {
        const user = await User.findById(key)

        const subject = `You have ${unSeenMessage[key]} new messages`;

        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hey ${user?.full_name || "there"} 👋</h2>

            <p>
              You have ${unSeenMessage[key]} new messages.
            </p>

            <div style="margin-top: 20px;">
              <a 
                href="${process.env.CLIENT_URL}/messages"
                style="
                  background-color: #4CAF50;
                  color: white;
                  padding: 10px 16px;
                  text-decoration: none;
                  border-radius: 5px;
                  display: inline-block;
                "
              >
                View Messages
              </a>
            </div>
          
            <p style="margin-top: 30px; font-size: 12px; color: gray;">
              Click <a href="${process.env.CLIENT_URL}/messages">here</a> to view your messages

            </p>
            <p style="margin-top: 30px; font-size: 12px; color: gray;">
              If you already responded, you can ignore this email.
            </p>
          </div>
        `;

        await sendMail({
          to: user?.email!,
          subject,
          html,
        });

      }

      return { success: true, message: "Notifications sent successfully" };
    }
  },
)

export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendConnectionsRequestReminder,
  in24DeleteStory,
  sendNotificationsOnUnseenMessages
];
