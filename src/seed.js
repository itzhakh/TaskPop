import { uid } from './utils/id.js';
import { nowISO } from './utils/time.js';

const t = () => nowISO();

function task({ title, description = '', assignee = '', status = 'todo', ac = [], comments = [] }) {
  const created = t();
  return {
    id: uid('t_'),
    title,
    description,
    assignee,
    acceptanceCriteria: ac.map(text => ({ id: uid('ac_'), text, done: false })),
    comments: comments.map(c => ({ id: uid('c_'), author: c.author || 'System', text: c.text || c, createdAt: t() })),
    status,
    createdAt: created,
    updatedAt: created,
  };
}

export const seedTasks = [
  task({ title: 'Set up project scaffold', assignee: 'Alex', status: 'done', ac: ['Create Vite app', 'Add basic components'], comments: ['Initial commit'] }),
  task({ title: 'Design board layout', assignee: 'Maya', status: 'inprogress', ac: ['Columns responsive', 'Card style'], description: 'Sketch responsive layout and spacing.' }),
  task({ title: 'Implement drag & drop', assignee: 'Sam', status: 'blocked', ac: ['Move between columns', 'Reorder within column'], comments: [{ author: 'Maya', text: 'Blocked by touch testing device' }] }),
  task({ title: 'Add localStorage persistence', assignee: 'Alex', status: 'todo', ac: ['Auto-save on change', 'Export/Import JSON'] }),
  task({ title: 'Task modal with AC & comments', assignee: 'Dana', status: 'todo', description: 'Include simple markdown preview for description.' }),
];

