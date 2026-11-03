/**
 * Concurrency guard for waybill allocation and reservation.
 * Serializes waybill selection and reservation in the local Node.js process.
 * 
 * Note on Multi-Instance Deployments:
 * An in-process Promise-based mutex guarantees single-process concurrency protection.
 * In a multi-node cluster or horizontal scaling setup with multiple Node.js instances,
 * an in-process lock cannot coordinate across distinct processes.
 * To scale horizontally across multiple instances in production, a shared synchronization
 * mechanism (such as PostgreSQL advisory locks / transactions with SELECT ... FOR UPDATE,
 * or Redis distributed locks) must be used.
 */

let lock: Promise<void> = Promise.resolve();

export async function withWaybillLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  const previousLock = lock;
  lock = nextLock;

  try {
    await previousLock;
    return await fn();
  } finally {
    release!();
  }
}
