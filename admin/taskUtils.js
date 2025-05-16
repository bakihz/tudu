import { addTask } from "./api.js";

export async function createNextRecurringTask(task) {
  if (!task.Interval || !task.Deadline) return;

  const nextDeadline = getNextDeadline(task.Deadline, task.Interval);

  const newTask = {
    ...task,
    Deadline: nextDeadline,
    Tick: false,
    TaskCreationDate: task.TaskCreationDate, // Copy the original creation date
  };
  delete newTask.TaskID;
  await addTask(newTask);
}

export function getNextDeadline(currentDeadline, interval) {
  if (!currentDeadline || !interval) return null;
  const deadline = new Date(currentDeadline);

  const amount = Math.floor(interval / 10);
  const type = interval % 10;

  switch (type) {
    case 1: // day
      deadline.setDate(deadline.getDate() + amount);
      break;
    case 3: // week
      deadline.setDate(deadline.getDate() + 7 * amount);
      break;
    case 4: // month
      deadline.setMonth(deadline.getMonth() + amount);
      break;
    case 5: // year
      deadline.setFullYear(deadline.getFullYear() + amount);
      break;
    case 6: // working days (custom logic: skip Sundays)
      let added = 0;
      while (added < amount) {
        deadline.setDate(deadline.getDate() + 1);
        if (deadline.getDay() !== 0) {
          // 0 = Sunday
          added++;
        }
      }
      break;
    default:
      return null;
  }
  return deadline;
}
