import { Session } from "@shopify/shopify-api";
import Cryptr from "cryptr";
import SessionModel from "../models/SessionModel.js";

let cryption;

const getCryption = () => {
  if (!cryption) {
    const encryptionString = process.env.ENCRYPTION_STRING;
    if (!encryptionString) {
      throw new Error('ENCRYPTION_STRING environment variable is required');
    }
    cryption = new Cryptr(encryptionString);
  }
  return cryption;
};

/**
 * Stores the session data into the database.
 *
 * @param {Session} session - The Shopify session object.
 * @returns {Promise<boolean>} Returns true if the operation was successful.
 */
const storeSession = async (session) => {
  try {
    const crypto = getCryption();
    const result = await SessionModel.findOneAndUpdate(
      { id: session.id },
      {
        content: crypto.encrypt(JSON.stringify(session)),
        shop: session.shop,
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ Session stored successfully for shop: ${session.shop}, ID: ${session.id}`);
    console.log(`📄 Document ID: ${result._id}`);
    return true;
  } catch (error) {
    console.error(`❌ Error storing session for shop: ${session.shop}`, error);
    throw error;
  }
};

/**
 * Loads the session data from the database.
 *
 * @param {string} id - The session ID.
 * @returns {Promise<Session | undefined>} Returns the Shopify session object or
 *   undefined if not found.
 */
const loadSession = async (id) => {
  try {
    const sessionResult = await SessionModel.findOne({ id });
    if (sessionResult === null) {
      console.log(`🔍 No session found for ID: ${id}`);
      return undefined;
    }
    if (sessionResult.content.length > 0) {
      const crypto = getCryption();
      const sessionObj = JSON.parse(crypto.decrypt(sessionResult.content));
      const returnSession = new Session(sessionObj);
      console.log(`✅ Session loaded successfully for shop: ${sessionResult.shop}, ID: ${id}`);
      return returnSession;
    }
    return undefined;
  } catch (error) {
    console.error(`❌ Error loading session for ID: ${id}`, error);
    throw error;
  }
};

/**
 * Deletes the session data from the database.
 *
 * @param {string} id - The session ID.
 * @returns {Promise<boolean>} Returns true if the operation was successful.
 */
const deleteSession = async (id) => {
  await SessionModel.deleteMany({ id });
  return true;
};

/**
 * Session handler object containing storeSession, loadSession, and
 * deleteSession functions.
 */
const sessionHandler = { storeSession, loadSession, deleteSession };

export default sessionHandler;
