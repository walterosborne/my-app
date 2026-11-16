import { useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';
import { errorToast } from './errorToast.js';
import { exportGate } from './exportTasks.js';

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 50));

export function useExportTask() {
  const isExporting = useSyncExternalStore(exportGate.subscribe, exportGate.isBusy);

  const runExport = (task, message = 'Preparing export…') => exportGate.run(async () => {
    const toastId = toast.loading(message);
    try {
      // Let the disabled controls and progress message paint before synchronous
      // spreadsheet work. The gate is already locked, even within the same tick.
      await yieldToBrowser();
      await task((progress) => toast.update(toastId, { render: progress }));
    } catch (error) {
      console.error('Export failed:', error);
      errorToast(`Export failed: ${error.message || 'Please try again.'}`);
    } finally {
      // Drain clicks queued during synchronous workbook generation while locked.
      await yieldToBrowser();
      toast.dismiss(toastId);
    }
  });

  return { isExporting, runExport };
}
