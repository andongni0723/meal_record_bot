export type HourlyNotificationTask = {
  name: string;
  run: () => Promise<void>;
};

export async function runHourlyNotificationTasks(
  tasks: HourlyNotificationTask[],
  onError: (taskName: string, error: unknown) => void,
): Promise<void> {
  for (const task of tasks) {
    try {
      await task.run();
    } catch (error) {
      onError(task.name, error);
    }
  }
}
