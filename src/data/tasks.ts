
import type { TaskStatus } from "../components/TaskCard";

export type Task = {
  id: string;
  title: string;
  location: string;
  status: TaskStatus;
};

export const initialTasks: Task[] = [
  {
    id: "shtepia-1",
    title: "Kontrolli i shtëpisë",
    location: "Mitrovicë, Kosovë",
    status: "pending",
  },
  {
    id: "toka-2",
    title: "Kontrolli i tokës",
    location: "Vushtrri, Kosovë",
    status: "pending",
  },
  {
    id: "oborri-3",
    title: "Mirëmbajtja e oborrit",
    location: "Pejë, Kosovë",
    status: "pending",
  },
  
{
  id: "banesa-4",
  title: "Kontrolli i banesës",
  location: "Prizren, Kosovë",
  status: "pending",
},
{
  id: "prona-5",
  title: "Kontrolli i pronës",
  location: "Gjakovë, Kosovë",
  status: "pending",
},
{
  id: "catia-6",
  title: "Inspektimi i çatisë",
  location: "Gjilan, Kosovë",
  status: "pending",
},

];

export function findTaskById(id: string) {
  return initialTasks.find((task) => task.id === id);
}
