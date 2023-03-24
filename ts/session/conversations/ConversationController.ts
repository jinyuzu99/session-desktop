import { Data } from '../../data/data';
import { OpenGroupData } from '../../data/opengroups';
import { ConversationCollection, ConversationModel } from '../../models/conversation';
import { actions as conversationActions } from '../../state/ducks/conversations';
import { BlockedNumberController } from '../../util';
import { getOpenGroupManager } from '../apis/open_group_api/opengroupV2/OpenGroupManagerV2';
import { getSwarmFor } from '../apis/snode_api/snodePool';
import { PubKey } from '../types';

import { deleteAllMessagesByConvoIdNoConfirmation } from '../../interactions/conversationInteractions';
import { ConversationTypeEnum } from '../../models/conversationAttributes';
import { leaveClosedGroup } from '../group/closed-group';
import { ConfigurationSync } from '../utils/job_runners/jobs/ConfigurationSyncJob';
import { SessionUtilContact } from '../utils/libsession/libsession_utils_contacts';
import { SessionUtilConvoInfoVolatile } from '../utils/libsession/libsession_utils_convo_info_volatile';
import { SessionUtilUserGroups } from '../utils/libsession/libsession_utils_user_groups';

let instance: ConversationController | null;

export const getConversationController = () => {
  if (instance) {
    return instance;
  }
  instance = new ConversationController();

  return instance;
};

export class ConversationController {
  private readonly conversations: ConversationCollection;
  private _initialFetchComplete: boolean = false;
  private _initialPromise?: Promise<any>;

  /**
   * Do not call this constructor. You get the ConversationController through getConversationController() only
   */
  constructor() {
    this.conversations = new ConversationCollection();
  }

  // FIXME this could return | undefined
  public get(id: string): ConversationModel {
    if (!this._initialFetchComplete) {
      throw new Error('getConversationController().get() needs complete initial fetch');
    }

    return this.conversations.get(id);
  }

  public getOrThrow(id: string): ConversationModel {
    if (!this._initialFetchComplete) {
      throw new Error('getConversationController().get() needs complete initial fetch');
    }

    const convo = this.conversations.get(id);

    if (convo) {
      return convo;
    }
    throw new Error(`Conversation ${id} does not exist on getConversationController().get()`);
  }
  // Needed for some model setup which happens during the initial fetch() call below
  public getUnsafe(id: string): ConversationModel | undefined {
    return this.conversations.get(id);
  }

  public getOrCreate(id: string, type: ConversationTypeEnum) {
    if (typeof id !== 'string') {
      throw new TypeError("'id' must be a string");
    }

    if (
      type !== ConversationTypeEnum.PRIVATE &&
      type !== ConversationTypeEnum.GROUP &&
      type !== ConversationTypeEnum.GROUPV3
    ) {
      throw new TypeError(`'type' must be 'private' or 'group' or 'groupv3' but got: '${type}'`);
    }

    if (type === ConversationTypeEnum.GROUPV3 && !PubKey.isClosedGroupV3(id)) {
      throw new Error(
        'required v3 closed group` ` but the pubkey does not match the 03 prefix for them'
      );
    }

    if (!this._initialFetchComplete) {
      throw new Error('getConversationController().get() needs complete initial fetch');
    }

    if (this.conversations.get(id)) {
      return this.conversations.get(id) as ConversationModel;
    }

    const conversation = this.conversations.add({
      id,
      type,
    });

    const create = async () => {
      try {
        // this saves to DB and to the required wrapper
        await conversation.commit();
      } catch (error) {
        window?.log?.error(
          'Conversation save failed! ',
          id,
          type,
          'Error:',
          error && error.stack ? error.stack : error
        );
        throw error;
      }

      window?.inboxStore?.dispatch(
        conversationActions.conversationAdded({
          id: conversation.id,
          data: conversation.getConversationModelProps(),
        })
      );

      if (!conversation.isPublic() && conversation.isActive()) {
        // NOTE: we request snodes updating the cache, but ignore the result

        void getSwarmFor(id);
      }
      return conversation;
    };

    conversation.initialPromise = create();

    return conversation;
  }

  public getContactProfileNameOrShortenedPubKey(pubKey: string): string {
    const conversation = getConversationController().get(pubKey);
    if (!conversation) {
      return pubKey;
    }
    return conversation.getContactProfileNameOrShortenedPubKey();
  }

  public async getOrCreateAndWait(
    id: string | PubKey,
    type: ConversationTypeEnum
  ): Promise<ConversationModel> {
    const initialPromise =
      this._initialPromise !== undefined ? this._initialPromise : Promise.resolve();
    return initialPromise.then(() => {
      if (!id) {
        return Promise.reject(new Error('getOrCreateAndWait: invalid id passed.'));
      }
      const pubkey = id && (id as any).key ? (id as any).key : id;
      const conversation = this.getOrCreate(pubkey, type);

      if (conversation) {
        return conversation.initialPromise.then(() => conversation);
      }

      return Promise.reject(new Error('getOrCreateAndWait: did not get conversation'));
    });
  }

  /**
   * Usually, we want to mark private contact deleted as inactive (active_at = undefined).
   * That way we can still have the username and avatar for them, but they won't appear in search results etc.
   * For the blinded contact deletion though, we want to delete it completely because we merged it to an unblinded convo.
   */
  public async deleteBlindedContact(blindedId: string) {
    if (!this._initialFetchComplete) {
      throw new Error(
        'getConversationController().deleteBlindedContact() needs complete initial fetch'
      );
    }
    if (!PubKey.hasBlindedPrefix(blindedId)) {
      throw new Error('deleteBlindedContact allow accepts blinded id');
    }
    window.log.info(`deleteBlindedContact with ${blindedId}`);
    const conversation = this.conversations.get(blindedId);
    if (!conversation) {
      window.log.warn(`deleteBlindedContact no such convo ${blindedId}`);
      return;
    }

    // we remove the messages left in this convo. The caller has to merge them if needed
    await deleteAllMessagesByConvoIdNoConfirmation(conversation.id);

    await conversation.setIsApproved(false, false);
    await conversation.setDidApproveMe(false, false);
    await conversation.commit();
  }

  public async deleteContact(id: string, fromSyncMessage: boolean) {
    if (!this._initialFetchComplete) {
      throw new Error('getConversationController().deleteContact() needs complete initial fetch');
    }

    window.log.info(`deleteContact with ${id}`);

    const conversation = this.conversations.get(id);
    if (!conversation) {
      window.log.warn(`deleteContact no such convo ${id}`);
      return;
    }

    // those are the stuff to do for all conversation types
    window.log.info(`deleteContact destroyingMessages: ${id}`);
    await deleteAllMessagesByConvoIdNoConfirmation(id);
    window.log.info(`deleteContact messages destroyed: ${id}`);

    // Closed/Medium group leaving
    if (conversation.isClosedGroup()) {
      window.log.info(`deleteContact ClosedGroup case: ${id}`);
      await leaveClosedGroup(conversation.id);
      await SessionUtilConvoInfoVolatile.removeLegacyGroupFromWrapper(conversation.id);
      // open group v2
    } else if (conversation.isPublic()) {
      window?.log?.info('leaving open group v2', conversation.id);
      // remove from the wrapper the entries before we remove the roomInfos, as we won't have the required community pubkey afterwards
      try {
        await SessionUtilUserGroups.removeCommunityFromWrapper(conversation.id, conversation.id);
        await SessionUtilConvoInfoVolatile.removeCommunityFromWrapper(
          conversation.id,
          conversation.id
        );
      } catch (e) {
        window?.log?.info('SessionUtilUserGroups.removeCommunityFromWrapper failed:', e);
      }

      const roomInfos = OpenGroupData.getV2OpenGroupRoom(conversation.id);
      if (roomInfos) {
        getOpenGroupManager().removeRoomFromPolledRooms(roomInfos);
      }

      // remove the roomInfos locally for this open group room including the pubkey
      try {
        await OpenGroupData.removeV2OpenGroupRoom(conversation.id);
      } catch (e) {
        window?.log?.info('removeV2OpenGroupRoom failed:', e);
      }
    } else if (conversation.isPrivate()) {
      // if this conversation is a private conversation it's in fact a `contact` for desktop.
      // we just want to remove everything related to it and set the hidden field to true
      // so the conversation still exists (needed for that user's profile in groups) but is not shown on the list of conversation
      window.log.info(`deleteContact isPrivate, marking as hidden: ${id}`);

      conversation.set({
        hidden: true,
      });
      // we currently do not wish to reset the approved/approvedMe state when marking a private conversation as hidden
      // await conversation.setIsApproved(false, false);
      await conversation.commit();

      // The note to self cannot be removed from the wrapper I suppose, as it must always be there
      // TODO I think we want to mark the contacts as hidden instead of removing them, so maybe keep the volatile info too?
      // if (!isUsFromCache(conversation.id)) {
      //   await SessionUtilConvoInfoVolatile.remove1o1(conversation.id);
      // }
      // TODO the call above won't mark the conversation as hidden in the wrapper, it will just stop being updated (which is a bad thing)
    }

    if (conversation.isGroup()) {
      window.log.info(`deleteContact isGroup, removing convo from DB: ${id}`);
      // not a private conversation, so not a contact for the ContactWrapper
      await Data.removeConversation(id);

      window.log.info(`deleteContact isGroup, convo removed from DB: ${id}`);

      // TODO remove group related entries from their corresponding wrappers here
      this.conversations.remove(conversation);

      window?.inboxStore?.dispatch(
        conversationActions.conversationChanged({
          id: conversation.id,
          data: conversation.getConversationModelProps(),
        })
      );
      window.inboxStore?.dispatch(conversationActions.conversationRemoved(conversation.id));

      window.log.info(`deleteContact NOT private, convo removed from store: ${id}`);
    }

    if (!fromSyncMessage) {
      await ConfigurationSync.queueNewJobIfNeeded();
    }
  }

  /**
   *
   * @returns the reference of the list of conversations stored.
   * Warning: You should not not edit things directly from that list. This must only be used for reading things.
   * If you need to make change, do the usual getConversationControler().get('the id you want to edit')
   */
  public getConversations(): Array<ConversationModel> {
    return this.conversations.models;
  }

  public unsafeDelete(convo: ConversationModel) {
    this.conversations.remove(convo);
  }

  public async load() {
    if (this.conversations.length) {
      throw new Error('ConversationController: Already loaded!');
    }

    const load = async () => {
      try {
        const start = Date.now();
        const convoModels = await Data.getAllConversations();
        this.conversations.add(convoModels);

        console.time('refreshAllWrapperContactsData');
        // TODO make this a switch so we take care of all wrappers and have compilation errors if we forgot to add one.
        for (let index = 0; index < convoModels.length; index++) {
          const convo = convoModels[index];
          if (SessionUtilContact.isContactToStoreInContactsWrapper(convo)) {
            await SessionUtilContact.refreshMappedValue(convo.id, true);
          }
          if (SessionUtilUserGroups.isUserGroupToStoreInWrapper(convo)) {
            await SessionUtilUserGroups.refreshCachedUserGroup(convo.id, true);
          }
          if (SessionUtilConvoInfoVolatile.isConvoToStoreInWrapper(convo)) {
            await SessionUtilConvoInfoVolatile.refreshConvoVolatileCached(
              convo.id,
              Boolean(convo.isClosedGroup() && convo.id.startsWith('05')),
              true
            );

            await convo.refreshInMemoryDetails();
          }
        }
        console.timeEnd('refreshAllWrapperContactsData');

        this._initialFetchComplete = true;
        this.conversations.forEach((conversation: ConversationModel) => {
          if (
            conversation.isActive() &&
            !conversation.isHidden() &&
            !conversation.get('lastMessage')
          ) {
            conversation.updateLastMessage();
          }
        });

        window?.log?.info(
          `ConversationController: done with initial fetch in ${Date.now() - start}ms.`
        );
      } catch (error) {
        window?.log?.error(
          'ConversationController: initial fetch failed',
          error && error.stack ? error.stack : error
        );
        throw error;
      }
    };
    await BlockedNumberController.load();

    this._initialPromise = load();

    return this._initialPromise;
  }

  public loadPromise() {
    return this._initialPromise;
  }

  public reset() {
    this._initialPromise = Promise.resolve();
    this._initialFetchComplete = false;
    if (window?.inboxStore) {
      window.inboxStore?.dispatch(conversationActions.removeAllConversations());
    }
    this.conversations.reset([]);
  }
}
