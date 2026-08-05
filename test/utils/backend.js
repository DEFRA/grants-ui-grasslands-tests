import { getAuthorizationHeader } from './backend-auth.js'

const BASE_URL = process.env.BASE_BACKEND_URL

export async function clearApplicationData(sbi, grantCode) {
  const response = await fetch(
    `${BASE_URL}/admin/test-data?sbi=${sbi}&grantCode=${grantCode}`,
    { method: 'DELETE', headers: { Authorization: getAuthorizationHeader() } }
  )
  if (response.status !== 200) {
    throw new Error(`Failed to clear test data: ${response.status}`)
  }
}
