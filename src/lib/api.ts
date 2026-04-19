const URLS = {
  auth: 'https://functions.poehali.dev/ab72503d-176a-4eec-b2c4-99b0630883c2',
  users: 'https://functions.poehali.dev/9314d77e-0a8c-4c6d-9ac2-93c9466e5929',
  messages: 'https://functions.poehali.dev/138b8e2a-cfd6-4e10-b0d9-98d9d0afbfa9',
  posts: 'https://functions.poehali.dev/f51d0867-cff3-4d85-ac06-6340f82abe65',
};

function getToken() {
  return localStorage.getItem('vspishka_token') || '';
}

async function call(fn: keyof typeof URLS, body: Record<string, unknown>) {
  const res = await fetch(URLS[fn], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getToken(),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string; display_name: string }) =>
    call('auth', { action: 'register', ...data }),
  login: (login: string, password: string) =>
    call('auth', { action: 'login', login, password }),
  me: () => call('auth', { action: 'me' }),
  logout: () => call('auth', { action: 'logout' }),

  // Posts
  getFeed: (offset = 0) => call('posts', { action: 'get_feed', offset }),
  createPost: (text: string, image_url = '') => call('posts', { action: 'create_post', text, image_url }),
  likePost: (post_id: number) => call('posts', { action: 'like_post', post_id }),
  getComments: (post_id: number) => call('posts', { action: 'get_comments', post_id }),
  addComment: (post_id: number, text: string) => call('posts', { action: 'add_comment', post_id, text }),

  // Users
  searchUsers: (q: string) => call('users', { action: 'search', q }),
  getProfile: (user_id?: number) => call('users', { action: 'get_profile', ...(user_id ? { user_id } : {}) }),
  updateProfile: (data: Record<string, string>) => call('users', { action: 'update_profile', ...data }),
  follow: (user_id: number) => call('users', { action: 'follow', user_id }),
  unfollow: (user_id: number) => call('users', { action: 'unfollow', user_id }),
  recommendations: () => call('users', { action: 'recommendations' }),

  // Messages
  getChats: () => call('messages', { action: 'get_chats' }),
  createChat: (type: 'private' | 'group', member_ids: number[], name = '') =>
    call('messages', { action: 'create_chat', type, member_ids, name }),
  getMessages: (chat_id: number, offset = 0) =>
    call('messages', { action: 'get_messages', chat_id, offset }),
  sendMessage: (chat_id: number, text: string, type = 'text', file_url = '', file_name = '', reply_to_id?: number) =>
    call('messages', { action: 'send_message', chat_id, text, type, file_url, file_name, reply_to_id }),
  addReaction: (message_id: number, emoji: string) =>
    call('messages', { action: 'add_reaction', message_id, emoji }),
  getChatInfo: (chat_id: number) =>
    call('messages', { action: 'get_chat_info', chat_id }),
};
