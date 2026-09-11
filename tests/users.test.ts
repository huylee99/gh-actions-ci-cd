import { beforeEach, describe, expect, it } from 'vitest';
import { createUserStore } from '../src/users.js';

describe('user store', () => {
  let store: ReturnType<typeof createUserStore>;
  beforeEach(() => { store = createUserStore(); });

  it('starts empty', () => expect(store.list()).toEqual([]));
  it('creates and retrieves a user with a trimmed name', () => {
    const user = store.create(' Ada ');
    expect(user).toEqual({ id: '1', name: 'Ada' });
    expect(store.get(user.id)).toEqual(user);
    expect(store.list()).toEqual([user]);
  });
  it.each([undefined, null, '', '  ', 42, {}])('rejects invalid name %j', (name) => {
    expect(() => store.create(name)).toThrow('Name must be a non-empty string');
    expect(store.list()).toEqual([]);
  });
  it('deletes users without reusing their identifiers', () => {
    const first = store.create('Ada');
    expect(store.delete(first.id)).toBe(true);
    expect(store.get(first.id)).toBeUndefined();
    expect(store.delete(first.id)).toBe(false);
    expect(store.create('Grace').id).not.toBe(first.id);
  });
  it('keeps store instances independent', () => {
    store.create('Ada');
    expect(createUserStore().list()).toEqual([]);
  });
});
