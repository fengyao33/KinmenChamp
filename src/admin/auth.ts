// 原型登入狀態(不接真帳號系統、不驗真密碼)。之後換成真 auth 時只改這裡。
const KEY = 'dz_admin_auth'

export const auth = {
  isAuthed(): boolean {
    try {
      return sessionStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  },
  login() {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
  },
  logout() {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}
