import { Inngest } from "inngest";
import User from "../models/user.model";
import dotenv from "dotenv";
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

export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion];
