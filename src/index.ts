import Axios, { Method } from 'axios';

export class APIError extends Error {
  mfa: string | undefined;

  constructor(message: string, mfa?: string) {
    super(message);
    this.name = 'APIError';
    this.mfa = mfa;
  }
}

interface User {
  _id: string;

  uid: string;

  username: string;

  invite: string;

  uploadKey: string;

  lastDomainAddition: Date;

  lastKeyRegen: Date;

  lastUsernameChange: Date;

  lastFileArchive: Date;

  email: string;

  emailVerified: boolean;

  emailVerificationKey: string;

  discord: {
    id: string;
    avatar: string;
  };

  strikes: number;

  disabled: boolean;

  blacklisted: {
    status: boolean;
    reason: string;
  };

  uploads: number;

  invites: number;

  invitedBy: string;

  invitedUsers: string[];

  registrationDate: Date;

  lastLogin: Date;

  admin: boolean;

  hash: string;

  mfa: boolean;

  notifs: string[] | null;
}

export interface FrontendUser {
  /**
   * The user's access token.
   */
  accessToken: string;

  /**
   * The api.
   */
  api: API;

  _id: string;

  uid: string;

  username: string;

  invite: string;

  uploadKey: string;

  lastDomainAddition: Date;

  lastKeyRegen: Date;

  lastUsernameChange: Date;

  lastFileArchive: Date;

  email: string;

  emailVerified: boolean;

  emailVerificationKey: string;

  discord: {
    id: string;
    avatar: string;
  };

  strikes: number;

  disabled: boolean;

  blacklisted: {
    status: boolean;
    reason: string;
  };

  uploads: number;

  invites: number;

  invitedBy: string;

  invitedUsers: string[];

  registrationDate: Date;

  lastLogin: Date;

  admin: boolean;

  hash: string;

  mfa: boolean;

  notifs: string[] | null;
}

export interface Notification {
  _id: string;

  avatar: string;

  message: string;

  date: Date;
}

class API {
  accessToken = '';

  url: string;
  apiKey: string;
  mfaSecret: string;

  constructor({
    url = process.env.NODE_ENV === 'development'
      ? 'http://localhost:4000'
      : 'https://api.xenfo.rocks',
    apiKey = ''
  }: {
    url?: string;
    apiKey?: string;
  }) {
    this.url = url;
    this.apiKey = apiKey;

    this.accessToken;
  }

  async request({
    endpoint,
    method,
    body,
    headers
  }: {
    endpoint: string;
    method: Method;
    body?: Record<string, unknown> | Array<Record<string, unknown>>;
    headers?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    try {
      const baseUrl = this.url;

      const { data } = await Axios({
        url: `${baseUrl}${endpoint}`,
        method,
        data: body ? body : null,
        headers: {
          ...headers,
          Authorization: this.apiKey,
          'x-access-token': this.accessToken
        },
        withCredentials: true
      });

      return data;
    } catch (err) {
      err = err.response.data;

      throw new APIError(
        `${err.error.charAt(0).toUpperCase() + err.error.slice(1)}.`,
        err.mfa
      );
    }
  }

  // Admin API

  /**
   * Get all of the server's statistics.
   */
  async adminGetTotalStats(): Promise<{
    totalUsers: number;
    totalBans: number;
  }> {
    const stats: {
      total: number;
      blacklisted: number;
      unusedInvites: number;
    } = await this.request({ endpoint: '/users', method: 'GET' });
    const totalUsers = stats.total;
    const totalBans = stats.blacklisted;
    return {
      totalUsers,
      totalBans
    };
  }

  /**
   *
   * @param {string} id The user's identifier.
   * @param {string} reason The reason for the blacklist.
   * @param {string} executor The user responsible
   */
  async adminBlacklist(
    id: string,
    reason: string,
    executor: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/admin/blacklist',
      method: 'POST',
      body: {
        id,
        reason: reason ? reason : 'No reason provided',
        executerId: executor
      }
    });
  }

  async adminVerifyemail(
    id: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/admin/verifyemail',
      method: 'POST',
      body: {
        id
      }
    });
  }

  async adminWipeuser(
    id: string
  ): Promise<{
    success: boolean;
    message: string;
    count: number | undefined;
  }> {
    return await this.request({
      endpoint: '/admin/wipeuser',
      method: 'POST',
      body: {
        id
      }
    });
  }

  async adminUnblacklist(
    id: string,
    reason: string,
    executer: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/admin/unblacklist',
      method: 'POST',
      body: {
        id,
        reason: reason ? reason : 'No reason provided',
        executerId: executer
      }
    });
  }

  async adminSetuid(
    id: string,
    newuid: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/admin/setuid',
      method: 'POST',
      body: {
        id,
        newuid: newuid
      }
    });
  }

  /**
   * Get a user.
   * @param {string} id The user's identifier.
   */
  async adminGetUsers(
    id: string
  ): Promise<{
    success: boolean;
    users: User;
  }> {
    return await this.request({
      endpoint: `/admin/users/${id}`,
      method: 'GET'
    });
  }

  async adminSendNotification(
    avatar: string,
    message: string
  ): Promise<{
    success: boolean;
  }> {
    return await this.request({
      endpoint: `/notifications`,
      method: 'POST',
      body: { avatar, message }
    });
  }

  // User API

  /**
   * Send a register request.
   * @param {string} username The user's username
   * @param {string} password The user's password.
   * @param {string} email The email to register with.
   * @param {string} invite The invite to register with.
   */
  async register(
    username: string,
    password: string,
    email: string,
    invite: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const data = await this.request({
      endpoint: '/auth/register',
      method: 'POST',
      body: {
        username,
        password,
        email,
        invite
      }
    });

    return data;
  }

  /**
   * Send a password reset email to a user.
   * @param {string} email The email to send a reset to.
   */
  async sendPasswordReset(
    email: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const data = await this.request({
      endpoint: '/auth/reset_password/send',
      method: 'POST',
      body: {
        email
      }
    });

    return data;
  }

  /**
   * Reset a user's password.
   * @param {string} key The password reset key.
   * @param {string} password The password.
   * @param {string} confirmPassword The password confirmation.
   */
  async resetPassword(
    key: string,
    password: string,
    confirmPassword: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const data = await this.request({
      endpoint: '/auth/reset_password/reset',
      method: 'POST',
      body: {
        key,
        password,
        confirmPassword
      }
    });

    return data;
  }

  /**
   * Get a user's refresh token.
   */
  async refreshToken(): Promise<{
    success: boolean;
    accessToken: string;
    user: User;
  }> {
    const data = await this.request({
      endpoint: '/auth/token',
      method: 'GET'
    });

    this.accessToken = data.accessToken;

    return data;
  }

  /**
   * Send a login request.
   * @param {string} username The user's username.
   * @param {string} password The user's password.
   */
  async login(
    username: string,
    password: string
  ): Promise<{
    success: boolean;
    accessToken: string;
    user: FrontendUser;
  }> {
    const data = await this.request({
      endpoint: '/auth/login',
      method: 'POST',
      body: {
        username,
        password
      }
    });

    this.accessToken = data.accessToken;

    return data;
  }

  async do2fa(
    username: string,
    password: string,
    token: string,
    id: string
  ): Promise<{
    success: boolean;
    accessToken: string;
    user: FrontendUser;
  }> {
    const data = await this.request({
      endpoint: `/auth/otp/verify/${id}`,
      method: 'POST',
      body: {
        username,
        password,
        token
      }
    });

    this.accessToken = data.accessToken;

    return data;
  }

  async verify2fa(
    token: string
  ): Promise<{
    success: boolean;
    backupKeys: string[];
  }> {
    const data = await this.request({
      endpoint: '/auth/otp/verify',
      method: 'POST',
      body: {
        token
      }
    });

    return data;
  }

  async toggle2fa(): Promise<{
    success: boolean;
  }> {
    const data = await this.request({
      endpoint: '/auth/otp/toggle',
      method: 'GET'
    });

    this.mfaSecret = data.token;

    return data;
  }

  async regen2faKeys(): Promise<{
    success: boolean;
    backupKeys: string[];
  }> {
    const data = await this.request({
      endpoint: '/auth/otp/regenKeys',
      method: 'GET'
    });

    return data;
  }

  /**
   * Logout of the site.
   */
  async logout(): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/auth/logout',
      method: 'GET'
    });
  }

  /**
   * Logout of the site on all sessions.
   */
  async logoutAll(): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/auth/logout_all_devices',
      method: 'GET'
    });
  }

  async getNotifications(): Promise<{
    success: boolean;
    read: Notification[];
    unread: Notification[];
  }> {
    return await this.request({
      endpoint: '/users/me/notifications',
      method: 'GET'
    });
  }

  async getAllNotifications(): Promise<{
    success: boolean;
    notifications: Notification[];
  }> {
    return await this.request({
      endpoint: '/notifications/all',
      method: 'GET'
    });
  }

  async readNotifications(): Promise<{
    success: boolean;
    read: Notification[];
  }> {
    return await this.request({
      endpoint: '/users/me/notifications/read',
      method: 'GET'
    });
  }

  /**
   * Disable a user's account.
   */
  async disableAccount(): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/users/me/disable',
      method: 'POST'
    });
  }

  /**
   * Change a user's username.
   * @param {string} username The new username.
   * @param {string} password The current password.
   */
  async changeUsername(
    username: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    username: string;
  }> {
    return await this.request({
      endpoint: '/users/me/change_username',
      method: 'PUT',
      body: {
        username,
        password
      }
    });
  }

  /**
   * Change a user's password.
   * @param {string} newPassword The user's new password.
   * @param {string} password The user's current password.
   */
  async changePassword(
    newPassword: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await this.request({
      endpoint: '/users/me/change_password',
      method: 'PUT',
      body: {
        newPassword,
        password
      }
    });
  }

  /**
   * Get a user's profile via their uid.
   * @param {string} uid The user's uid.
   */
  async getUserProfile(
    uid: string
  ): Promise<{
    success: boolean;
    user: {
      uuid: string;
      uid: string;
      username: string;
      registrationDate: Date;
      role: string;
      uploads: number;
      invitedBy: string;
      avatar: string;
    };
  }> {
    return await this.request({
      endpoint: `/users/profile/${uid}`,
      method: 'GET'
    });
  }
}

export default API;
