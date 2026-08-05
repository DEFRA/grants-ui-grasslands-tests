import { mockServerClient } from 'mockserver-client'

function client() {
  return mockServerClient(process.env.MOCKSERVER_HOST, process.env.MOCKSERVER_PORT)
}

export async function getApplicationSubmission(referenceNumber) {
  const requests = await client().retrieveRecordedRequests({
    path: '/grants/[^/]+/applications'
  })
  return requests.find((r) => r.body.json.metadata.clientRef === referenceNumber.toLowerCase())
}
