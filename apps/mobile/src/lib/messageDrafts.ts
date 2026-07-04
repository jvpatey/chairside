import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_PREFIX = 'message-draft:';

export async function getMessageDraft(conversationId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(`${DRAFT_PREFIX}${conversationId}`)) ?? '';
  } catch {
    return '';
  }
}

export async function setMessageDraft(conversationId: string, draft: string): Promise<void> {
  try {
    const key = `${DRAFT_PREFIX}${conversationId}`;
    const trimmed = draft.trim();
    if (!trimmed) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, draft);
  } catch {
    // Ignore draft persistence failures.
  }
}

export async function clearMessageDraft(conversationId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${DRAFT_PREFIX}${conversationId}`);
  } catch {
    // Ignore draft persistence failures.
  }
}
