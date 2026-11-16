// One export per browser tab, including when a report is unmounted/navigation occurs.
export const createExportGate = () => {
  let busy = false;
  const listeners = new Set();
  const publish = () => listeners.forEach((listener) => listener());
  return {
    isBusy: () => busy,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async run(task) {
      if (busy) return;
      busy = true;
      publish();
      try {
        return await task();
      } finally {
        busy = false;
        publish();
      }
    }
  };
};

export const exportGate = createExportGate();

// Preserve order, stop scheduling on failure, and drain outstanding work before
// releasing the export lock. A failed attempt must not overlap the next retry.
export async function mapExportItems(items, mapper, { concurrency = 3, onProgress = () => {} } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('Invalid export concurrency.');
  const results = new Array(items.length);
  let next = 0;
  let completed = 0;
  let failure;
  let failed = false;
  const worker = async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await mapper(items[index], index);
        onProgress(++completed, items.length);
      } catch (error) {
        failed = true;
        failure ??= error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (failed) throw failure;
  return results;
}

export async function fetchExportArray(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load export data (HTTP ${response.status}). Please try again.`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('NGAT returned unexpected export data. Please try again.');
  return data;
}
