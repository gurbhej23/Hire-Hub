import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  actor,
  type,
  message,
  link = "",
  entityId = "",
}) => {
  if (!recipient || !actor) return null;
  if (recipient.toString() === actor.toString()) return null;

  return Notification.create({
    recipient,
    actor,
    type,
    message,
    link,
    entityId,
  });
};

export const upsertNotification = async ({
  recipient,
  actor,
  type,
  message,
  link = "",
  entityId = "",
}) => {
  if (!recipient || !actor) return null;
  if (recipient.toString() === actor.toString()) return null;

  return Notification.findOneAndUpdate(
    {
      recipient,
      actor,
      type,
      entityId,
    },
    {
      message,
      link,
      read: false,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const deleteNotification = async ({
  recipient,
  actor,
  type,
  entityId = "",
}) => {
  if (!recipient || !actor) return null;

  return Notification.deleteMany({
    recipient,
    actor,
    type,
    entityId,
  });
};
