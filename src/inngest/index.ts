import { Inngest } from "inngest";
import User from "../models/user.model";

export const inngest = new Inngest({ id: "my-app" });

const syncUserCreation = inngest.createFunction(
    { id: "sync-user-creation", triggers: [{ event: "clerk/user.created" }] },

    async ({ event }) => {
        const { id, first_name, last_name, email_address, image_url } = event.data;
        let username = email_address[0].email_address.split("@")[0];
        const user = await User.findOne({ username });
        if (user) {
            username = username + Math.floor(Math.random() * 1000);
        }
        const userData = {
            _id: id,
            email: email_address[0].email_address,
            full_name: `${first_name} ${last_name}`,
            profile_picture: image_url,
            username,
        }
        await User.create(userData);
    },
);
const syncUserUpdation = inngest.createFunction(
    { id: "sync-user-updation", triggers: [{ event: "clerk/user.updated" }] },

    async ({ event }) => {
        const { id, first_name, last_name, email_address, image_url } = event.data;
        const userData = {
            email: email_address[0].email_address,
            full_name: `${first_name} ${last_name}`,
            profile_picture: image_url,
        }
        await User.findOneAndUpdate({ _id: id }, userData);


    },
);

const syncUserDeletion = inngest.createFunction(
    { id: "sync-user-deletion", triggers: [{ event: "clerk/user.deleted" }] },

    async ({ event }) => {
        const { id } = event.data;
        await User.findOneAndDelete({ _id: id });
    }
);

export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion

];
