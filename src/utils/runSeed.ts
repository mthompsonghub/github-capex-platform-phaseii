import { seedCapExProjects } from './seedCapExData';

(async () => {
  const result = await seedCapExProjects();
  if (result.success) {
    console.log('Seeding complete!');
  } else {
    console.error('Seeding failed:', result.error);
  }
  process.exit(0);
})(); 