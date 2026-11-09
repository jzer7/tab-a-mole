export interface LabeledTitle {
  title: string;
  topics: string[];
}

export const titleGroupingDataset: LabeledTitle[] = [
  { title: 'nginx and docker', topics: ['containers'] },
  {
    title: 'california golden gate bridge',
    topics: ['california', 'gates']
  },
  { title: 'electric gates', topics: ['gates'] },
  { title: 'california golden raisins', topics: ['california'] },
  { title: 'Bill Gates and his legacy', topics: ['gates'] },
  { title: 'famous golden california beaches', topics: ['california'] },
  { title: 'Docker containers explained', topics: ['containers'] },
  { title: 'The best beaches in California', topics: ['california'] },
  { title: 'Gates Foundation annual report', topics: ['gates'] },
  { title: 'Nginx reverse proxy configuration', topics: ['containers'] },
  { title: 'Golden retriever care guide', topics: ['pets'] },
  { title: 'California state parks guide', topics: ['california'] }
];
