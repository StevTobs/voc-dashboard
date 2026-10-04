import { parseComplaints } from './csv.js';

export async function loadComplaints({ url = '/data/complaints.csv', signal, fetcher = fetch } = {}) {
  const response = await fetcher(url, { signal, cache: 'no-store' });
  if (!response.ok) throw Error(`CSV request failed (HTTP ${response.status})`);
  return parseComplaints(await response.text());
}
