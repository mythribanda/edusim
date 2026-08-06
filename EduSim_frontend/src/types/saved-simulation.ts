export type SavedSimulation = {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  type: "dsl" | "html";
  simulation: any;
  favorite: boolean;
};
