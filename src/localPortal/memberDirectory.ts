import { onValue, ref } from './database';
import { mergeDirectoryRoles } from './memberRoles.mjs';

/** Both the directory population and editor mode follow authoritative live roles. */
export function subscribeMemberDirectory(database: any, onDirectory: (directory: Record<string, any>) => void, onError: (error: Error) => void) {
  let profiles: any, roles: any, profilesReady = false, rolesReady = false, closed = false;
  const publish = () => {
    if (closed || !profilesReady || !rolesReady) return;
    if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) { onError(new Error('Public directory is unavailable')); return; }
    onDirectory(mergeDirectoryRoles(profiles, roles));
  };
  const stopProfiles = onValue(ref(database, 'public_users'), snapshot => { profiles = snapshot.val(); profilesReady = true; publish(); }, onError);
  const stopRoles = onValue(ref(database, 'allowed_users'), snapshot => { roles = snapshot.val() || {}; rolesReady = true; publish(); }, onError);
  return () => { closed = true; stopProfiles(); stopRoles(); };
}
