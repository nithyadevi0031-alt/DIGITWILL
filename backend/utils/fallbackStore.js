const users = new Map();
let nextId = 1;

export function createFallbackUser(payload) {
  const user = {
    id: String(nextId++),
    ...payload,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

export function findFallbackUserByEmail(email) {
  const normalized = email.toLowerCase().trim();
  for (const user of users.values()) {
    if (user.email === normalized) {
      return user;
    }
  }
  return null;
}

export function findFallbackUserById(id) {
  return users.get(String(id)) || null;
}

export function updateFallbackUser(id, updates) {
  const existing = users.get(String(id));
  if (!existing) {
    return null;
  }

  const updated = { ...existing, ...updates };
  users.set(String(id), updated);
  return updated;
}

export function deleteFallbackUser(id) {
  return users.delete(String(id));
}
