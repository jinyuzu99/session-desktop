import { assert } from 'chai';
import { ConversationTypeEnum } from '../../../../models/conversation';

import { ConversationLookupType } from '../../../../state/ducks/conversations';
import {
  _getConversationComparator,
  _getLeftPaneLists,
} from '../../../../state/selectors/conversations';

describe('state/selectors/conversations', () => {
  describe('#getLeftPaneList', () => {
    // tslint:disable-next-line: max-func-body-length
    it('sorts conversations based on timestamp then by intl-friendly title', () => {
      const i18n = (key: string) => key;
      const data: ConversationLookupType = {
        id1: {
          id: 'id1',
          activeAt: 0,
          name: 'No timestamp',
          phoneNumber: 'notused',

          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          hasNickname: false,
          isPublic: false,
          subscriberCount: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          expireTimer: 0,
          isPinned: false,
        },
        id2: {
          id: 'id2',
          activeAt: 20,
          name: 'B',
          phoneNumber: 'notused',

          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          hasNickname: false,
          isPublic: false,
          subscriberCount: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          expireTimer: 0,
          isPinned: false,
        },
        id3: {
          id: 'id3',
          activeAt: 20,
          name: 'C',
          phoneNumber: 'notused',
          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          hasNickname: false,
          isPublic: false,
          subscriberCount: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          expireTimer: 0,
          isPinned: false,
        },
        id4: {
          id: 'id4',
          activeAt: 20,
          name: 'Á',
          phoneNumber: 'notused',
          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          hasNickname: false,
          isPublic: false,
          subscriberCount: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          expireTimer: 0,
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: false,
        },
        id5: {
          id: 'id5',
          activeAt: 30,
          name: 'First!',
          phoneNumber: 'notused',
          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          hasNickname: false,
          isPublic: false,
          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: false,
        },
      };
      const comparator = _getConversationComparator(i18n);
      const { conversations } = _getLeftPaneLists(data, comparator);

      assert.strictEqual(conversations[0].name, 'First!');
      assert.strictEqual(conversations[1].name, 'Á');
      assert.strictEqual(conversations[2].name, 'B');
      assert.strictEqual(conversations[3].name, 'C');
    });
  });

  describe('#getLeftPaneListWithPinned', () => {
    // tslint:disable-next-line: max-func-body-length
    it('sorts conversations based on pin, timestamp then by intl-friendly title', () => {
      const i18n = (key: string) => key;
      const data: ConversationLookupType = {
        id1: {
          id: 'id1',
          activeAt: 0,
          name: 'No timestamp',
          phoneNumber: 'notused',

          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: false,
          hasNickname: false,
          isPublic: false,
        },
        id2: {
          id: 'id2',
          activeAt: 20,
          name: 'B',
          phoneNumber: 'notused',

          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: false,
          hasNickname: false,
          isPublic: false,
        },
        id3: {
          id: 'id3',
          activeAt: 20,
          name: 'C',
          phoneNumber: 'notused',

          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: true,
          hasNickname: false,
          isPublic: false,
        },
        id4: {
          id: 'id4',
          activeAt: 20,
          name: 'Á',
          phoneNumber: 'notused',
          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,
          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: true,
          hasNickname: false,
          isPublic: false,
        },
        id5: {
          id: 'id5',
          activeAt: 30,
          name: 'First!',
          phoneNumber: 'notused',
          type: ConversationTypeEnum.PRIVATE,
          isMe: false,
          unreadCount: 1,
          mentionedUs: false,
          isSelected: false,
          isTyping: false,
          isBlocked: false,
          isKickedFromGroup: false,
          left: false,

          subscriberCount: 0,
          expireTimer: 0,
          currentNotificationSetting: 'all',
          weAreAdmin: false,
          isGroup: false,
          isPrivate: false,
          notificationForConvo: [{ value: 'all', name: 'all' }],
          avatarPath: '',
          groupAdmins: [],
          lastMessage: undefined,
          members: [],
          profileName: 'df',
          isPinned: false,
          hasNickname: false,
          isPublic: false,
        },
      };
      const comparator = _getConversationComparator(i18n);
      const { conversations } = _getLeftPaneLists(data, comparator);

      assert.strictEqual(conversations[0].name, 'Á');
      assert.strictEqual(conversations[1].name, 'C');
      assert.strictEqual(conversations[2].name, 'First!');
      assert.strictEqual(conversations[3].name, 'B');
    });
  });
});