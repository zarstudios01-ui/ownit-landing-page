async function adminFetch(url) {
  let key = sessionStorage.getItem('ownit_admin_key');
  if (!key) {
    key = prompt('Admin key');
    if (!key) throw new Error('No admin key entered');
  }
  const res = await fetch(url, { headers: { 'x-admin-key': key } });
  if (res.status === 401) {
    sessionStorage.removeItem('ownit_admin_key');
    throw new Error('Wrong admin key');
  }
  sessionStorage.setItem('ownit_admin_key', key);
  return res;
}
