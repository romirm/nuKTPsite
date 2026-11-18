import { onValue, ref } from './database';
import { mergeDirectoryRoles } from './memberRoles.mjs';

/** Both the directory population and editor mode follow authoritative live roles. */
export function subscribeMemberDirectory(database: any, onDirectory: (directory: Record<string, any>) => void, onError: (error: Error) => void) {
  let profiles: any, roles: any, profilesReady = false, closed = false;
  const publish = () => {
    if (closed || !profilesReady) return;
    if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) { onError(new Error('Public directory is unavailable')); return; }
    onDirectory(mergeDirectoryRoles(profiles, roles));
  };
  const stopProfiles = onValue(ref(database, 'public_users'), snapshot => { profiles = snapshot.val(); profilesReady = true; publish(); }, onError);
  // Profiles already carry roles. Apply the authoritative overrides when available,
  // without making directory access depend on a separate admissions collection.
  const stopRoles = onValue(ref(database, 'allowed_users'), snapshot => { roles = snapshot.val(); publish(); }, error => {
    if (closed) return;
    console.warn('Directory role overrides are unavailable:', error);
    roles = undefined;
    publish();
  });
  return () => { closed = true; stopProfiles(); stopRoles(); };
}
