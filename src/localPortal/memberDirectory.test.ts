import { subscribeMemberDirectory } from './memberDirectory';
import { onValue } from './database';
jest.mock('./database', () => ({ ref: (_: unknown, path: string) => path, onValue: jest.fn() }));

test('role changes immediately republish the directory and subscriptions are cleaned up', () => {
  const callbacks: Record<string, (snapshot: any) => void> = {}, stops: jest.Mock[] = [];
  (onValue as jest.Mock).mockImplementation((path, callback) => { callbacks[path] = callback; const stop = jest.fn(); stops.push(stop); return stop; });
  const next = jest.fn(), error = jest.fn();
  const stop = subscribeMemberDirectory({}, next, error);
  callbacks['public_users']({ val: () => ({ me: { name: 'Member', role: 'Member' } }) });
  expect(next).not.toHaveBeenCalled();
  callbacks['allowed_users']({ val: () => ({ me: { role: 'Member' } }) });
  expect(next).toHaveBeenLastCalledWith({ me: { name: 'Member', role: 'Member' } });
  callbacks['allowed_users']({ val: () => ({ me: { role: 'Alumni' } }) });
  expect(next).toHaveBeenLastCalledWith({ me: { name: 'Member', role: 'Alumni' } });
  callbacks['public_users']({ val: () => ({ me: { name: 'Member', role: 'Member', workplace: 'Acme' } }) });
  expect(next).toHaveBeenLastCalledWith({ me: { name: 'Member', role: 'Alumni', workplace: 'Acme' } });
  stop();
  expect(stops.every(s => s.mock.calls.length === 1)).toBe(true);
  expect(error).not.toHaveBeenCalled();
});
