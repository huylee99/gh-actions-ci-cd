export interface User {
  id: string;
  name: string;
}

export function createUserStore() {
  const users = new Map<string, User>();
  let nextId = 1;

  return {
    list: () => [...users.values()],
    get: (id: string) => users.get(id),
    create(name: unknown): User {
      if (typeof name !== 'string' || !name.trim()) {
        throw new TypeError('Name must be a non-empty string');
      }
      const user = { id: String(nextId++), name: name.trim() };
      users.set(user.id, user);
      return user;
    },
    delete: (id: string) => users.delete(id),
  };
}
